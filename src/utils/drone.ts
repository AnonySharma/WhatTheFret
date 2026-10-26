/**
 * Synthesised tanpura drone and a simple tabla-style pulse for the Drone & Jam lab.
 * Both engines use a look-ahead scheduler on the shared AudioContext clock, so timing
 * does not depend on setTimeout jitter.
 */

import { METRONOME_CONFIG } from '../constants';
import { guitarAudio } from './audioSynth';
import type { TaalDef } from './labs';

export type TanpuraTuning = 'Pa' | 'Ma' | 'Ni';

const TUNING_RATIO: Record<TanpuraTuning, number> = {
  Pa: 3 / 2, // Perfect 5th
  Ma: 4 / 3, // Perfect 4th
  Ni: 15 / 8, // Shuddha Ni, used for Pa-less raagas
};

const LOOKAHEAD_MS = 40;
const SCHEDULE_AHEAD_S = 0.15;

/** Clamp to the same range as the main metronome; also rescues NaN / 0 / negative input. */
function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return METRONOME_CONFIG.DEFAULT_BPM;
  return Math.min(METRONOME_CONFIG.MAX_BPM, Math.max(METRONOME_CONFIG.MIN_BPM, bpm));
}

export class TanpuraEngine {
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private master: GainNode | null = null;
  private saHz = 130.81;
  private tuning: TanpuraTuning = 'Pa';
  private cycleSeconds = 6.0;
  private volume = 0.6;

  public get isRunning(): boolean {
    return this.timer !== null;
  }

  public start(saHz: number, tuning: TanpuraTuning = 'Pa') {
    if (this.timer !== null) return;
    this.saHz = saHz;
    this.tuning = tuning;
    const ctx = guitarAudio.getContext();
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(ctx.destination);
    this.nextTime = ctx.currentTime + 0.05;
    this.step = 0;
    this.timer = window.setInterval(() => this.schedule(), LOOKAHEAD_MS);
  }

  public stop() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.master) {
      const m = this.master;
      const ctx = guitarAudio.getContext();
      m.gain.cancelScheduledValues(ctx.currentTime);
      m.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      window.setTimeout(() => m.disconnect(), 1200);
      this.master = null;
    }
  }

  public setSa(saHz: number) {
    this.saHz = saHz;
  }

  public setTuning(tuning: TanpuraTuning) {
    this.tuning = tuning;
  }

  /** Seconds for one full Pa-Sa-Sa-So round. Slower = more meditative. */
  public setCycleSeconds(seconds: number) {
    this.cycleSeconds = Math.min(12, Math.max(3, seconds));
  }

  public setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.master) this.master.gain.setTargetAtTime(this.volume, guitarAudio.getContext().currentTime, 0.05);
  }

  private schedule() {
    if (!this.master) return;
    const ctx = guitarAudio.getContext();
    if (this.nextTime < ctx.currentTime) {
      // the tab was throttled and we fell behind: skip the missed plucks instead of dumping them at once
      const missed = Math.ceil((ctx.currentTime - this.nextTime) / (this.cycleSeconds / 4));
      this.step += missed;
      this.nextTime = ctx.currentTime + 0.05;
    }
    while (this.nextTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      if (!guitarAudio.isAudioMuted()) this.pluck(this.nextTime, this.step % 4);
      this.step += 1;
      // four plucks per cycle; the last one comes slightly early, like a real tanpura's loop
      this.nextTime += this.cycleSeconds / 4;
    }
  }

  private pluck(when: number, which: number) {
    if (!this.master) return;
    const ctx = guitarAudio.getContext();
    const freq = [
      (this.saHz * TUNING_RATIO[this.tuning]) / 2, // Pa (or Ma) in the lower octave
      this.saHz, // Sa
      this.saHz, // Sa
      this.saHz / 2, // So (lower Sa)
    ][which];
    const dur = this.cycleSeconds * 0.95;

    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, when);
    out.gain.linearRampToValueAtTime(0.28, when + 0.012);
    out.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    // "jawari": a bright, buzzy bridge sound that sweeps from rich to mellow while the string rings
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 2.2;
    filter.frequency.setValueAtTime(Math.min(freq * 14, 7000), when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 2.5, 400), when + dur * 0.8);
    filter.connect(out);
    out.connect(this.master);

    // slightly detuned saw pair + a quiet octave gives the shimmering, sympathetic character
    const partials: { ratio: number; gain: number; detune: number }[] = [
      { ratio: 1, gain: 0.55, detune: -3 },
      { ratio: 1, gain: 0.45, detune: 3 },
      { ratio: 2, gain: 0.18, detune: 0 },
    ];
    partials.forEach(p => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * p.ratio, when);
      osc.detune.setValueAtTime(p.detune, when);
      const g = ctx.createGain();
      g.gain.value = p.gain;
      osc.connect(g);
      g.connect(filter);
      osc.start(when);
      osc.stop(when + dur + 0.1);
    });
  }
}

/** Simple per-beat accents: sam (loudest) / vibhag start / normal / khali (soft, airy). */
export type BeatAccent = 'sam' | 'tali' | 'normal' | 'khali';

export function beatAccents(taal: TaalDef, starts: number[]): BeatAccent[] {
  const out: BeatAccent[] = [];
  for (let b = 1; b <= taal.beats; b++) {
    if (b === 1) out.push('sam');
    else if (taal.khali.includes(b)) out.push('khali');
    else if (starts.includes(b)) out.push('tali');
    else out.push('normal');
  }
  return out;
}

export class RhythmEngine {
  private timer: number | null = null;
  private nextTime = 0;
  private beatIndex = 0;
  private master: GainNode | null = null;
  private accents: BeatAccent[] = [];
  private bpm = 80;
  private volume = 0.7;
  private onBeat: ((beat: number) => void) | null = null;
  private pendingUi: number[] = [];

  public get isRunning(): boolean {
    return this.timer !== null;
  }

  public start(accents: BeatAccent[], bpm: number, onBeat?: (beat: number) => void) {
    if (this.timer !== null) return;
    this.accents = accents;
    this.bpm = clampBpm(bpm);
    this.onBeat = onBeat ?? null;
    const ctx = guitarAudio.getContext();
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(ctx.destination);
    this.nextTime = ctx.currentTime + 0.08;
    this.beatIndex = 0;
    this.timer = window.setInterval(() => this.schedule(), LOOKAHEAD_MS);
  }

  public stop() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.pendingUi.forEach(id => window.clearTimeout(id));
    this.pendingUi = [];
    this.master?.disconnect();
    this.master = null;
    this.onBeat = null;
  }

  public setBpm(bpm: number) {
    this.bpm = clampBpm(bpm);
  }

  public setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.master) this.master.gain.setTargetAtTime(this.volume, guitarAudio.getContext().currentTime, 0.05);
  }

  /** Swap the taal on the fly; the cycle restarts at sam on the next beat. */
  public setAccents(accents: BeatAccent[]) {
    this.accents = accents;
    this.beatIndex = 0;
  }

  private schedule() {
    if (!this.master) return;
    if (this.accents.length === 0) return;
    const ctx = guitarAudio.getContext();
    if (this.nextTime < ctx.currentTime) {
      // throttled tab: drop the missed beats (keeping the cycle position) rather than playing them all at once
      const period = 60 / this.bpm;
      this.beatIndex += Math.ceil((ctx.currentTime - this.nextTime) / period);
      this.nextTime = ctx.currentTime + 0.05;
    }
    while (this.nextTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const beat = this.beatIndex % this.accents.length;
      if (!guitarAudio.isAudioMuted()) this.hit(this.nextTime, this.accents[beat]);
      const delayMs = Math.max(0, (this.nextTime - ctx.currentTime) * 1000);
      const id = window.setTimeout(() => {
        this.pendingUi = this.pendingUi.filter(x => x !== id);
        this.onBeat?.(beat + 1);
      }, delayMs);
      this.pendingUi.push(id);
      this.beatIndex += 1;
      this.nextTime += 60 / this.bpm;
    }
  }

  private hit(when: number, accent: BeatAccent) {
    if (!this.master) return;
    const ctx = guitarAudio.getContext();
    const out = ctx.createGain();
    out.connect(this.master);

    if (accent === 'khali') {
      // open, ringing "tin/na": airy noise tick, no bass
      this.noise(when, 0.06, 3200, 0.22, out);
      out.gain.setValueAtTime(1, when);
      return;
    }

    // bayan (bass drum): sine with a quick pitch drop; sam is deeper and louder
    const base = accent === 'sam' ? 70 : accent === 'tali' ? 85 : 95;
    const level = accent === 'sam' ? 0.9 : accent === 'tali' ? 0.7 : 0.45;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base * 2.2, when);
    osc.frequency.exponentialRampToValueAtTime(base, when + 0.07);
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + (accent === 'sam' ? 0.45 : 0.28));
    osc.connect(g);
    g.connect(out);
    osc.start(when);
    osc.stop(when + 0.5);

    // dayan (treble drum): short bright tick on every non-khali beat
    this.noise(when, 0.04, 2400, accent === 'sam' ? 0.3 : 0.2, out);
  }

  private noise(when: number, length: number, freq: number, level: number, dest: AudioNode) {
    const ctx = guitarAudio.getContext();
    const size = Math.max(1, Math.floor(ctx.sampleRate * length));
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (size * 0.3));
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.value = level;
    src.connect(bp);
    bp.connect(g);
    g.connect(dest);
    src.start(when);
    src.stop(when + length + 0.02);
  }
}
