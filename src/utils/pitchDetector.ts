/**
 * Real-Time Microphone Pitch Detector
 * Uses normalized autocorrelation (ACF) with parabolic peak interpolation
 * to detect guitar frequencies (55 Hz to 1200 Hz, which covers Drop-C and below).
 */

import { NOTE_NAMES, NoteName } from './guitarTheory';
import { guitarAudio } from './audioSynth';

/** Lowest / highest pitch the detector will report. */
export const MIN_DETECT_HZ = 55;
export const MAX_DETECT_HZ = 1200;
/** A note counts as in tune when it is within this many cents (inclusive) of the exact pitch. */
export const IN_TUNE_CENTS = 5;

export interface PitchDetectionResult {
  frequency: number; // in Hz
  note: NoteName;
  octave: number;
  cents: number; // deviation from exact frequency (-50 to +50)
  clarity: number; // 0.0 to 1.0 (signal confidence)
  inTune: boolean; // within +/- IN_TUNE_CENTS
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
  if (!Number.isFinite(freq) || freq <= 0) {
    throw new RangeError(`frequencyToNote needs a positive, finite frequency (got ${freq})`);
  }
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

/** Frequency in Hz of a note in a given octave (A4 = 440 Hz, C4 = middle C); the inverse of frequencyToNote. */
export function noteFrequency(note: NoteName, octave: number): number {
  const midi = 12 * (octave + 1) + NOTE_NAMES.indexOf(note);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Why the microphone could not be opened. */
export type MicErrorKind = 'denied' | 'no-mic' | 'unavailable';

function classifyMicError(err: unknown): MicErrorKind {
  const name = (err as { name?: string } | null)?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return 'denied';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') return 'no-mic';
  return 'unavailable';
}

/** Short, friendly text for the inline "mic did not start" message. */
export function micErrorMessage(kind: MicErrorKind | null): string {
  if (kind === 'denied') return 'Microphone access was blocked. Allow it in your browser settings and try again.';
  if (kind === 'no-mic') return 'No microphone found. Plug one in and try again.';
  return "Couldn't start the microphone. Try again in a moment.";
}

export type PitchListener = (res: PitchDetectionResult | null) => void;

/**
 * One shared microphone stream with any number of listeners. The stream opens with the
 * first listener and closes when the last one leaves, so the tuner screen, the top-bar
 * widget and the ear trainer can all use it without leaking streams.
 */
export class PitchDetector {
  /** The app-wide AudioContext; the detector only attaches nodes to it and never closes it. */
  private audioCtx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private buffer: Float32Array<ArrayBuffer> | null = null;
  // Work buffers for autoCorrelate, allocated once instead of on every animation frame
  private corr: Float32Array<ArrayBuffer> | null = null;
  private clipBuf: Float32Array<ArrayBuffer> | null = null;
  private isListening: boolean = false;
  private listeners = new Set<PitchListener>();
  private startPromise: Promise<boolean> | null = null;
  private lastError: MicErrorKind | null = null;
  private failureClaimed = false;
  /** Bumped on every teardown so a start that is still awaiting the mic can notice it was cancelled. */
  private session = 0;

  public startListening(callback: PitchListener): Promise<boolean> {
    this.listeners.add(callback);
    if (this.isListening) return Promise.resolve(true);
    if (!this.startPromise) {
      const promise: Promise<boolean> = this.openStream().finally(() => {
        // A newer start may already have replaced this promise; only clear our own.
        if (this.startPromise === promise) this.startPromise = null;
      });
      this.startPromise = promise;
    }
    return this.startPromise;
  }

  /** Why the last start failed (null after a successful start). */
  public getLastError(): MicErrorKind | null {
    return this.lastError;
  }

  /**
   * True for exactly one caller per failed start. Several UIs can await the same failed start;
   * the one that claims it resets the shared mic toggle so it is not flipped twice.
   */
  public claimFailure(): boolean {
    if (this.lastError === null || this.failureClaimed) return false;
    this.failureClaimed = true;
    return true;
  }

  private async openStream(): Promise<boolean> {
    const session = ++this.session;
    this.lastError = null;
    this.failureClaimed = false;
    let stream: MediaStream | null = null;
    try {
      const ctx = guitarAudio.getContext();

      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });

      // Everyone stopped listening (or a newer start took over) while the permission prompt was open.
      if (this.session !== session || this.listeners.size === 0) {
        stream.getTracks().forEach(track => track.stop());
        return false;
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048; // provides high frequency resolution for bass strings
      source.connect(analyser);

      this.audioCtx = ctx;
      this.source = source;
      this.mediaStream = stream;
      this.analyser = analyser;
      this.buffer = new Float32Array(new ArrayBuffer(analyser.fftSize * 4));
      this.isListening = true;
      this.detectLoop();
      return true;
    } catch (err) {
      console.warn('Microphone access unavailable or denied:', err);
      stream?.getTracks().forEach(track => track.stop());
      // A superseded start failing must not wipe the listeners of the start that replaced it.
      if (this.session === session) {
        this.lastError = classifyMicError(err);
        this.listeners.clear();
        this.isListening = false;
      }
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
    // Drop the pending start so a start right after this opens a fresh stream.
    this.startPromise = null;
    this.isListening = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    // The AudioContext is shared with the synths, so only detach our own nodes.
    this.source?.disconnect();
    this.analyser?.disconnect();
    this.source = null;
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
    if (pitchData && pitchData.frequency >= MIN_DETECT_HZ && pitchData.frequency <= MAX_DETECT_HZ) {
      const noteData = frequencyToNote(pitchData.frequency);
      const inTune = Math.abs(noteData.cents) <= IN_TUNE_CENTS;
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
    // For guitar: E2 ~ 82Hz -> period ~ sampleRate/82; the lag range spans MAX_DETECT_HZ down to MIN_DETECT_HZ
    const minPeriod = Math.floor(sampleRate / MAX_DETECT_HZ);
    const maxPeriod = Math.floor(sampleRate / MIN_DETECT_HZ);

    if (!this.corr || this.corr.length < maxPeriod + 2) this.corr = new Float32Array(new ArrayBuffer((maxPeriod + 2) * 4));
    if (!this.clipBuf || this.clipBuf.length !== SIZE) this.clipBuf = new Float32Array(new ArrayBuffer(SIZE * 4));
    const corr = this.corr;
    const clipBuf = this.clipBuf;
    // Center clipping to suppress overtones
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
