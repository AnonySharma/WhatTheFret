/**
 * Real-Time Microphone Pitch Detector
 * Uses normalized autocorrelation (ACF) with parabolic peak interpolation
 * to detect guitar frequencies (60 Hz to 1200 Hz).
 */

import { NOTE_NAMES, NoteName } from './guitarTheory';

export interface PitchDetectionResult {
  frequency: number; // in Hz
  note: NoteName;
  octave: number;
  cents: number; // deviation from exact frequency (-50 to +50)
  clarity: number; // 0.0 to 1.0 (signal confidence)
  inTune: boolean; // within +/- 5 cents
  tuningDirection: 'flat' | 'sharp' | 'in-tune';
  rmsVolume: number; // volume level
}

// Convert frequency to closest note name, octave, and cents offset
export function frequencyToNote(freq: number): {
  note: NoteName;
  octave: number;
  cents: number;
  exactFreq: number;
} {
  // A4 = 440 Hz (MIDI note 69)
  const midi = 69 + 12 * Math.log2(freq / 440);
  const roundedMidi = Math.round(midi);
  const cents = Math.round((midi - roundedMidi) * 100);

  const noteIdx = (roundedMidi - 12) % 12;
  const octave = Math.floor((roundedMidi - 12) / 12);
  const exactFreq = 440 * Math.pow(2, (roundedMidi - 69) / 12);

  const safeIdx = (noteIdx + 12) % 12;
  return {
    note: NOTE_NAMES[safeIdx],
    octave,
    cents,
    exactFreq,
  };
}

export type PitchListener = (res: PitchDetectionResult | null) => void;

/**
 * One shared microphone stream with any number of listeners. The stream opens with the
 * first listener and closes when the last one leaves, so the tuner screen, the top-bar
 * widget and the ear trainer can all use it without leaking streams.
 */
export class PitchDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private buffer: Float32Array<ArrayBuffer> | null = null;
  private isListening: boolean = false;
  private listeners = new Set<PitchListener>();
  private startPromise: Promise<boolean> | null = null;
  /** Bumped on every teardown so a start that is still awaiting the mic can notice it was cancelled. */
  private session = 0;

  public startListening(callback: PitchListener): Promise<boolean> {
    this.listeners.add(callback);
    if (this.isListening) return Promise.resolve(true);
    if (!this.startPromise) {
      this.startPromise = this.openStream().finally(() => {
        this.startPromise = null;
      });
    }
    return this.startPromise;
  }

  private async openStream(): Promise<boolean> {
    const session = ++this.session;
    let ctx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });

      // Everyone stopped listening while the permission prompt was open.
      if (this.session !== session || this.listeners.size === 0) {
        stream.getTracks().forEach(track => track.stop());
        ctx.close().catch(() => {});
        return false;
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048; // provides high frequency resolution for bass strings
      source.connect(analyser);

      this.audioCtx = ctx;
      this.mediaStream = stream;
      this.analyser = analyser;
      this.buffer = new Float32Array(new ArrayBuffer(analyser.fftSize * 4));
      this.isListening = true;
      this.detectLoop();
      return true;
    } catch (err) {
      console.warn('Microphone access unavailable or denied:', err);
      stream?.getTracks().forEach(track => track.stop());
      ctx?.close().catch(() => {});
      this.listeners.clear();
      this.isListening = false;
      return false;
    }
  }

  /** Removes one listener (the mic closes when none are left); with no argument, removes all of them. */
  public stopListening(callback?: PitchListener) {
    if (callback) {
      this.listeners.delete(callback);
      callback(null);
      if (this.listeners.size > 0) return;
    } else {
      const all = [...this.listeners];
      this.listeners.clear();
      all.forEach(cb => cb(null));
    }

    this.session++;
    this.isListening = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
    }
    this.audioCtx = null;
    this.analyser = null;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  private emit(res: PitchDetectionResult | null) {
    this.listeners.forEach(cb => cb(res));
  }

  private detectLoop = () => {
    if (!this.isListening || !this.analyser || !this.buffer || !this.audioCtx) return;

    this.analyser.getFloatTimeDomainData(this.buffer);

    // Calculate RMS volume
    let sumSquares = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      sumSquares += this.buffer[i] * this.buffer[i];
    }
    const rms = Math.sqrt(sumSquares / this.buffer.length);

    // Gate out background silence / floor noise
    if (rms < 0.015) {
      this.emit(null);
      this.animationFrameId = requestAnimationFrame(this.detectLoop);
      return;
    }

    const pitchData = this.autoCorrelate(this.buffer, this.audioCtx.sampleRate);
    if (pitchData && pitchData.frequency > 55 && pitchData.frequency < 1200) {
      const noteData = frequencyToNote(pitchData.frequency);
      const inTune = Math.abs(noteData.cents) <= 6;
      const tuningDirection: 'flat' | 'sharp' | 'in-tune' =
        inTune ? 'in-tune' : noteData.cents < 0 ? 'flat' : 'sharp';

      this.emit({
        frequency: Math.round(pitchData.frequency * 10) / 10,
        note: noteData.note,
        octave: noteData.octave,
        cents: noteData.cents,
        clarity: pitchData.clarity,
        inTune,
        tuningDirection,
        rmsVolume: Math.min(1, rms * 5),
      });
    } else {
      this.emit(null);
    }

    this.animationFrameId = requestAnimationFrame(this.detectLoop);
  };

  /**
   * Normalized Autocorrelation with parabolic peak interpolation
   */
  private autoCorrelate(buf: Float32Array<ArrayBuffer>, sampleRate: number): { frequency: number; clarity: number } | null {
    const SIZE = buf.length;
    // For guitar: E2 ~ 82Hz -> period ~ sampleRate/82; max period ~ sampleRate/60
    const minPeriod = Math.floor(sampleRate / 1200);
    const maxPeriod = Math.floor(sampleRate / 65);

    const corr = new Float32Array(maxPeriod + 2);
    // Center clipping to suppress overtones
    const clipBuf = new Float32Array(SIZE);
    let maxAmp = 0;
    for (let i = 0; i < SIZE; i++) {
      if (Math.abs(buf[i]) > maxAmp) maxAmp = Math.abs(buf[i]);
    }
    const clipLevel = maxAmp * 0.3;
    for (let i = 0; i < SIZE; i++) {
      if (buf[i] > clipLevel) clipBuf[i] = buf[i] - clipLevel;
      else if (buf[i] < -clipLevel) clipBuf[i] = buf[i] + clipLevel;
      else clipBuf[i] = 0;
    }

    for (let offset = minPeriod; offset <= maxPeriod + 1; offset++) {
      let correlation = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < SIZE - offset; i++) {
        correlation += clipBuf[i] * clipBuf[i + offset];
        norm1 += clipBuf[i] * clipBuf[i];
        norm2 += clipBuf[i + offset] * clipBuf[i + offset];
      }

      const norm = Math.sqrt(norm1 * norm2);
      corr[offset] = norm > 0 ? correlation / norm : 0;
    }

    let best = -1;
    let maxCorrelation = 0;
    for (let offset = minPeriod; offset <= maxPeriod; offset++) {
      if (corr[offset] > maxCorrelation) {
        maxCorrelation = corr[offset];
        best = offset;
      }
    }
    if (best === -1 || maxCorrelation < 0.65) {
      return null;
    }

    // A note's period repeats at 2x, 3x...; prefer the shortest lag that is nearly as strong as the
    // best one, otherwise a noisy frame can read an octave (or more) too low.
    let bestPeriod = best;
    for (let offset = minPeriod + 1; offset < best; offset++) {
      const isPeak = corr[offset] >= corr[offset - 1] && corr[offset] >= corr[offset + 1];
      if (isPeak && corr[offset] >= maxCorrelation * 0.93 && corr[offset] > 0.65) {
        bestPeriod = offset;
        break;
      }
    }

    // Parabolic interpolation around the peak gives sub-sample precision (matters for cents)
    let exactPeriod = bestPeriod;
    if (bestPeriod > minPeriod && bestPeriod <= maxPeriod) {
      const y0 = corr[bestPeriod - 1];
      const y1 = corr[bestPeriod];
      const y2 = corr[bestPeriod + 1];
      const denom = y0 - 2 * y1 + y2;
      if (denom < 0) exactPeriod = bestPeriod + (0.5 * (y0 - y2)) / denom;
    }
    const frequency = sampleRate / exactPeriod;

    return {
      frequency,
      clarity: corr[bestPeriod],
    };
  }
}

export const pitchDetector = new PitchDetector();
