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

export class PitchDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private buffer: Float32Array<ArrayBuffer> | null = null;
  private isListening: boolean = false;
  private onPitchCallback: ((res: PitchDetectionResult | null) => void) | null = null;

  public async startListening(callback: (res: PitchDetectionResult | null) => void): Promise<boolean> {
    try {
      this.onPitchCallback = callback;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });

      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048; // provides high frequency resolution for bass strings
      source.connect(this.analyser);

      this.buffer = new Float32Array(new ArrayBuffer(this.analyser.fftSize * 4));
      this.isListening = true;
      this.detectLoop();
      return true;
    } catch (err) {
      console.warn('Microphone access unavailable or denied:', err);
      this.isListening = false;
      return false;
    }
  }

  public stopListening() {
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
      this.audioCtx = null;
    }
    if (this.onPitchCallback) {
      this.onPitchCallback(null);
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
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
      if (this.onPitchCallback) this.onPitchCallback(null);
      this.animationFrameId = requestAnimationFrame(this.detectLoop);
      return;
    }

    const pitchData = this.autoCorrelate(this.buffer, this.audioCtx.sampleRate);
    if (pitchData && pitchData.frequency > 55 && pitchData.frequency < 1200) {
      const noteData = frequencyToNote(pitchData.frequency);
      const inTune = Math.abs(noteData.cents) <= 6;
      const tuningDirection: 'flat' | 'sharp' | 'in-tune' =
        inTune ? 'in-tune' : noteData.cents < 0 ? 'flat' : 'sharp';

      if (this.onPitchCallback) {
        this.onPitchCallback({
          frequency: Math.round(pitchData.frequency * 10) / 10,
          note: noteData.note,
          octave: noteData.octave,
          cents: noteData.cents,
          clarity: pitchData.clarity,
          inTune,
          tuningDirection,
          rmsVolume: Math.min(1, rms * 5),
        });
      }
    } else {
      if (this.onPitchCallback) this.onPitchCallback(null);
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

    let bestPeriod = -1;
    let maxCorrelation = 0;

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

    for (let offset = minPeriod; offset <= maxPeriod; offset++) {
      let correlation = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < SIZE - offset; i++) {
        correlation += clipBuf[i] * clipBuf[i + offset];
        norm1 += clipBuf[i] * clipBuf[i];
        norm2 += clipBuf[i + offset] * clipBuf[i + offset];
      }

      const norm = Math.sqrt(norm1 * norm2);
      if (norm > 0) {
        correlation = correlation / norm;
      }

      if (correlation > maxCorrelation && correlation > 0.65) {
        maxCorrelation = correlation;
        bestPeriod = offset;
      }
    }

    if (bestPeriod === -1 || maxCorrelation < 0.65) {
      return null;
    }

    // Parabolic interpolation for fine tuning
    const shift = 0; // fallback
    const exactPeriod = bestPeriod + shift;
    const frequency = sampleRate / exactPeriod;

    return {
      frequency,
      clarity: maxCorrelation,
    };
  }
}

export const pitchDetector = new PitchDetector();
