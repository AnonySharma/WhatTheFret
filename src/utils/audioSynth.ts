/**
 * Web Audio Guitar Synthesizer
 * Uses physical-modeling-inspired additive synthesis with resonant body filtering,
 * pluck transient noise, and realistic string damping.
 */

class GuitarSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public isAudioMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Plucks a single guitar string at a specific frequency
   * @param freq Target frequency in Hz (e.g. 82.4 for Low E, 329.6 for High E)
   * @param duration Note duration in seconds
   * @param velocity Dynamics / loudness (0.1 to 1.0)
   */
  public pluck(freq: number, duration: number = 2.5, velocity: number = 0.8) {
    if (this.isMuted || freq <= 0) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    // Master string gain
    const stringGain = ctx.createGain();
    stringGain.gain.setValueAtTime(0.0001, now);
    stringGain.gain.linearRampToValueAtTime(velocity * 0.4, now + 0.008);
    // Exponential decay natural string damping
    stringGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Body resonance filter: warm acoustic guitar tone (low pass + subtle peaking)
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    // Higher strings have slightly brighter cutoff
    bodyFilter.frequency.setValueAtTime(Math.min(freq * 8, 4500), now);
    bodyFilter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.5, 300), now + duration * 0.8);
    bodyFilter.Q.setValueAtTime(1.8, now);

    // Warmth filter (simulates hollow wood guitar cavity ~180Hz)
    const cavityFilter = ctx.createBiquadFilter();
    cavityFilter.type = 'peaking';
    cavityFilter.frequency.setValueAtTime(180, now);
    cavityFilter.gain.setValueAtTime(3.5, now);
    cavityFilter.Q.setValueAtTime(1.2, now);

    stringGain.connect(bodyFilter);
    bodyFilter.connect(cavityFilter);
    cavityFilter.connect(ctx.destination);

    // Harmonic partials (Fundamental + 2nd, 3rd, 4th, 5th harmonics with guitar harmonic ratios)
    const harmonics = [
      { ratio: 1.0, gain: 1.0, type: 'triangle' as OscillatorType },
      { ratio: 2.0, gain: 0.55, type: 'sine' as OscillatorType },
      { ratio: 3.0, gain: 0.28, type: 'sine' as OscillatorType },
      { ratio: 4.0, gain: 0.16, type: 'sine' as OscillatorType },
      { ratio: 5.0, gain: 0.08, type: 'sine' as OscillatorType },
    ];

    harmonics.forEach(h => {
      const osc = ctx.createOscillator();
      osc.type = h.type;
      osc.frequency.setValueAtTime(freq * h.ratio, now);

      const hGain = ctx.createGain();
      hGain.gain.setValueAtTime(h.gain, now);
      // Higher harmonics decay faster than fundamental
      const decayTime = Math.max(0.3, duration / (h.ratio * 0.75));
      hGain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

      osc.connect(hGain);
      hGain.connect(stringGain);

      osc.start(now);
      osc.stop(now + duration);
    });

    // Plectrum transient click (pluck attack noise)
    try {
      const bufferSize = ctx.sampleRate * 0.02; // 20ms burst
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(Math.min(freq * 3, 2200), now);
      noiseFilter.Q.setValueAtTime(3, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(velocity * 0.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.04);
    } catch {
      // Audio buffer fallback safe
    }
  }

  /**
   * Strum a chord across multiple strings
   * @param freqs Array of frequencies in Hz from string 6 to string 1. Negative or 0 means muted/skipped string.
   * @param direction 'down' (low to high) or 'up' (high to low)
   * @param strumSpeedMs Delay between strings in ms (e.g. 25ms - 40ms)
   */
  public strum(freqs: number[], direction: 'down' | 'up' = 'down', strumSpeedMs: number = 30) {
    if (this.isMuted) return;
    const activeStrings = freqs
      .map((freq, idx) => ({ freq, idx }))
      .filter(item => item.freq > 0);

    const ordered = direction === 'down' ? activeStrings : [...activeStrings].reverse();

    ordered.forEach((item, step) => {
      window.setTimeout(() => {
        // Vary velocity slightly across the strum for realistic human touch
        const velocity = 0.7 + (step % 2) * 0.15;
        this.pluck(item.freq, 3.0, velocity);
      }, step * strumSpeedMs);
    });
  }

  /**
   * Play an interval or scale sequence note by note
   */
  public playSequence(freqs: number[], noteDurationMs: number = 400) {
    if (this.isMuted) return;
    freqs.forEach((freq, idx) => {
      window.setTimeout(() => {
        this.pluck(freq, (noteDurationMs / 1000) * 1.5, 0.85);
      }, idx * noteDurationMs);
    });
  }
}

export const guitarAudio = new GuitarSynthesizer();
