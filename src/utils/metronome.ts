/**
 * High-Precision Web Audio Metronome Engine
 * Uses the Web Audio API lookahead scheduler algorithm for microsecond timing precision
 * without setInterval drift or audio stutter.
 */

import {
  METRONOME_CONFIG,
  METRONOME_TIME_SIGNATURES,
  type TimeSignatureDef,
  type TempoMarking,
  TEMPO_MARKINGS,
} from '../constants';
import { guitarAudio } from './audioSynth';

export type BeatCallback = (beatIndex: number, totalBeats: number, isDownbeat: boolean, isAccent: boolean) => void;

class MetronomeEngine {
  private audioCtx: AudioContext | null = null;
  private isRunning: boolean = false;
  private bpm: number = METRONOME_CONFIG.DEFAULT_BPM;
  private timeSignature: TimeSignatureDef = METRONOME_TIME_SIGNATURES[2]; // 4/4 default
  private volume: number = 0.8;
  private muted: boolean = false;

  // Lookahead scheduler parameters
  private readonly lookaheadMs: number = 25.0; // How frequently to call scheduling (ms)
  private readonly scheduleAheadTime: number = 0.1; // How far ahead to schedule audio (seconds)
  private currentBeatIndex: number = 0;
  private nextBeatTime: number = 0.0;
  private timerId: number | null = null;
  // Pending per-beat UI flashes, so stop() can cancel them
  private uiTimerIds: Set<number> = new Set();
  /** A beat later than this (seconds) after a stalled tab is skipped instead of played in a burst. */
  private readonly maxLateTime: number = 0.05;

  // Registered listeners for UI updates
  private beatCallbacks: Set<BeatCallback> = new Set();
  private stateChangeCallbacks: Set<(running: boolean) => void> = new Set();
  private changeListeners: Set<() => void> = new Set();

  constructor() {
    // The shared AudioContext is only touched on user interaction (start)
  }

  private initAudio() {
    // One AudioContext for the whole app (shared with the synths and the pitch detector)
    this.audioCtx = guitarAudio.getContext();
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getBpm(): number {
    return this.bpm;
  }

  public getTimeSignature(): TimeSignatureDef {
    return this.timeSignature;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsMuted(): boolean {
    return this.muted;
  }

  public setVolume(val: number) {
    const next = Math.max(0, Math.min(1, val));
    if (next === this.volume) return;
    this.volume = next;
    this.emitChange();
  }

  public setMuted(mute: boolean) {
    if (mute === this.muted) return;
    this.muted = mute;
    this.emitChange();
  }

  public setBpm(newBpm: number) {
    if (!Number.isFinite(newBpm)) return;
    const next = Math.max(METRONOME_CONFIG.MIN_BPM, Math.min(METRONOME_CONFIG.MAX_BPM, Math.round(newBpm)));
    if (next === this.bpm) return;
    this.bpm = next;
    this.emitChange();
  }

  public setTimeSignature(ts: TimeSignatureDef) {
    this.timeSignature = ts;
    this.currentBeatIndex = 0;
    this.emitChange();
  }

  /**
   * Subscribes to any change of bpm, time signature, volume, mute or running state, so every UI
   * can read the same values (works with React's useSyncExternalStore). Returns the unsubscribe function.
   */
  public subscribe(listener: () => void): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  private emitChange() {
    [...this.changeListeners].forEach(cb => {
      try {
        cb();
      } catch {
        // Ignore listener error
      }
    });
  }

  public onBeat(cb: BeatCallback) {
    this.beatCallbacks.add(cb);
    return () => this.beatCallbacks.delete(cb);
  }

  public onStateChange(cb: (running: boolean) => void) {
    this.stateChangeCallbacks.add(cb);
    return () => this.stateChangeCallbacks.delete(cb);
  }

  private notifyStateChange() {
    this.stateChangeCallbacks.forEach(cb => {
      try {
        cb(this.isRunning);
      } catch {
        // Ignore listener error
      }
    });
    this.emitChange();
  }

  public start() {
    if (this.isRunning) return;
    this.initAudio();
    if (!this.audioCtx) return;

    this.isRunning = true;
    this.currentBeatIndex = 0;
    this.nextBeatTime = this.audioCtx.currentTime + 0.05;

    this.notifyStateChange();
    this.scheduleLoop();
  }

  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    // Pending beat flashes would otherwise show stale beats after a quick stop -> start
    this.uiTimerIds.forEach(id => window.clearTimeout(id));
    this.uiTimerIds.clear();
    this.currentBeatIndex = 0;
    this.notifyStateChange();
  }

  public toggle(): boolean {
    if (this.isRunning) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  /**
   * The scheduler loop checks if next beat needs to be scheduled within the lookahead window
   */
  private scheduleLoop = () => {
    if (!this.isRunning || !this.audioCtx) return;

    // A throttled / backgrounded tab can stall this loop for a long time. Skip the beats that were
    // missed (keeping the beat index in phase) instead of scheduling them all at once.
    const now = this.audioCtx.currentTime;
    if (this.nextBeatTime < now - this.maxLateTime) {
      const secondsPerBeat = this.getSecondsPerBeat();
      const missed = Math.ceil((now - this.nextBeatTime) / secondsPerBeat);
      this.currentBeatIndex = (this.currentBeatIndex + missed) % this.timeSignature.beats;
      this.nextBeatTime += missed * secondsPerBeat;
    }

    while (this.nextBeatTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
      this.scheduleClick(this.currentBeatIndex, this.nextBeatTime);
      this.advanceBeat();
    }

    this.timerId = window.setTimeout(this.scheduleLoop, this.lookaheadMs);
  };

  /**
   * Calculates next beat audio time based on BPM and time signature unit
   */
  private getSecondsPerBeat(): number {
    // 60 / bpm gives seconds per quarter note
    // If unit is 8 (e.g. 6/8, 7/8), an eighth note is half a quarter note
    const secondsPerQuarter = 60.0 / this.bpm;
    return (4.0 / this.timeSignature.unit) * secondsPerQuarter;
  }

  private advanceBeat() {
    this.nextBeatTime += this.getSecondsPerBeat();
    this.currentBeatIndex = (this.currentBeatIndex + 1) % this.timeSignature.beats;
  }

  /**
   * Plays a crisp, percussive woodblock click tone at the exact Web Audio time
   */
  private scheduleClick(beatIndex: number, time: number) {
    if (!this.audioCtx) return;

    const isDownbeat = beatIndex === 0;
    const isAccent = this.timeSignature.accents.includes(beatIndex);

    // Schedule visual callback timed to when audio will actually be heard (output latency included)
    const latency = (this.audioCtx.outputLatency || 0) + (this.audioCtx.baseLatency || 0);
    const delayMs = Math.max(0, (time - this.audioCtx.currentTime + latency) * 1000);
    const uiTimerId = window.setTimeout(() => {
      this.uiTimerIds.delete(uiTimerId);
      if (!this.isRunning) return;
      this.beatCallbacks.forEach(cb => {
        try {
          cb(beatIndex, this.timeSignature.beats, isDownbeat, isAccent);
        } catch {
          // ignore
        }
      });
    }, delayMs);
    this.uiTimerIds.add(uiTimerId);

    // If muted, we still keep visual timing running without audio
    if (this.muted) return;

    try {
      const nowTime = time;
      const isDown = isDownbeat;

      // 1. High-frequency transient mechanical "tick" (simulates wooden hammer / escapement click)
      const noiseBuffer = this.audioCtx.createBuffer(1, Math.floor(this.audioCtx.sampleRate * 0.006), this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        // High-frequency burst decaying instantly
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseBuffer.length * 0.35));
      }

      const noiseNode = this.audioCtx.createBufferSource();
      noiseNode.buffer = noiseBuffer;

      const noiseFilter = this.audioCtx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(isDown ? 3200 : 2600, nowTime);

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(this.volume * (isDown ? 0.75 : 0.5), nowTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, nowTime + 0.005);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.audioCtx.destination);
      noiseNode.start(nowTime);

      // 2. Resonant Woodblock Tone (Acoustic body resonance)
      // Downbeat: crisp high-tuned block (1760 Hz / A6)
      // Accent: 1200 Hz
      // Regular beat: 880 Hz (A5)
      const baseFreq = isDown ? 1760 : isAccent ? 1200 : 880;
      const decayDuration = isDown ? 0.045 : isAccent ? 0.035 : 0.025;
      const bodyVol = this.volume * (isDown ? 0.9 : isAccent ? 0.7 : 0.55);

      const bodyOsc = this.audioCtx.createOscillator();
      const bodyGain = this.audioCtx.createGain();
      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(baseFreq, nowTime);
      // Subtle fast pitch settle characteristic of struck wood
      bodyOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, nowTime + decayDuration);

      bodyGain.gain.setValueAtTime(0.0001, nowTime);
      bodyGain.gain.linearRampToValueAtTime(bodyVol, nowTime + 0.001);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, nowTime + decayDuration);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(this.audioCtx.destination);
      bodyOsc.start(nowTime);
      bodyOsc.stop(nowTime + decayDuration + 0.01);

      // 3. Low Mechanical Desk Knock (gives weight and physical presence to the beat)
      const knockOsc = this.audioCtx.createOscillator();
      const knockGain = this.audioCtx.createGain();
      knockOsc.type = 'triangle';
      knockOsc.frequency.setValueAtTime(isDown ? 220 : 160, nowTime);
      knockOsc.frequency.exponentialRampToValueAtTime(60, nowTime + 0.015);

      knockGain.gain.setValueAtTime(0.0001, nowTime);
      knockGain.gain.linearRampToValueAtTime(this.volume * (isDown ? 0.6 : 0.35), nowTime + 0.001);
      knockGain.gain.exponentialRampToValueAtTime(0.0001, nowTime + 0.018);

      knockOsc.connect(knockGain);
      knockGain.connect(this.audioCtx.destination);
      knockOsc.start(nowTime);
      knockOsc.stop(nowTime + 0.02);
    } catch {
      // Audio node scheduling fallback
    }
  }
}

export const metronome = new MetronomeEngine();

/**
 * Calculates current Italian & descriptive tempo marking for a given BPM
 */
export function getTempoMarking(bpm: number): TempoMarking {
  // The integer ranges leave gaps (55.5 sits between Largo and Adagio), so a marking runs until the next one starts.
  if (!(bpm >= TEMPO_MARKINGS[0].minBpm)) return TEMPO_MARKINGS[0];
  for (let i = 0; i < TEMPO_MARKINGS.length - 1; i++) {
    if (bpm < TEMPO_MARKINGS[i + 1].minBpm) return TEMPO_MARKINGS[i];
  }
  return TEMPO_MARKINGS[TEMPO_MARKINGS.length - 1];
}

/**
 * Tap tempo helper: records taps, filters out stale taps (>2.5s), and calculates smoothed average BPM
 */
export class TapTempoCalculator {
  private taps: number[] = [];
  private readonly maxIntervalMs: number = 2500; // Reset if gap exceeds 2.5s

  public recordTap(): number | null {
    const now = performance.now();
    if (this.taps.length > 0) {
      const last = this.taps[this.taps.length - 1];
      if (now - last > this.maxIntervalMs) {
        this.taps = []; // Reset on pause
      }
    }

    this.taps.push(now);
    // Keep max 5 recent taps
    if (this.taps.length > 5) {
      this.taps.shift();
    }

    if (this.taps.length < 2) {
      return null;
    }

    // Calculate average delta
    let totalDelta = 0;
    for (let i = 1; i < this.taps.length; i++) {
      totalDelta += this.taps[i] - this.taps[i - 1];
    }
    const avgDeltaMs = totalDelta / (this.taps.length - 1);
    if (avgDeltaMs <= 0) return null;

    const calculatedBpm = Math.round(60000 / avgDeltaMs);
    return Math.max(METRONOME_CONFIG.MIN_BPM, Math.min(METRONOME_CONFIG.MAX_BPM, calculatedBpm));
  }

  public reset() {
    this.taps = [];
  }
}
