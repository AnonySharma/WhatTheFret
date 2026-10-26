import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PitchDetector,
  frequencyToNote,
  noteFrequency,
  micErrorMessage,
  IN_TUNE_CENTS,
  type PitchDetectionResult,
} from '../src/utils/pitchDetector';

const SR = 44100;

function tone(freq: number, harmonics = [1, 0.6, 0.35, 0.2], noise = 0, SR = 44100): Float32Array<ArrayBuffer> {
  const buf = new Float32Array(new ArrayBuffer(2048 * 4));
  let seed = 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (let i = 0; i < buf.length; i++) {
    let v = 0;
    harmonics.forEach((a, h) => (v += a * Math.sin((2 * Math.PI * freq * (h + 1) * i) / SR)));
    buf[i] = 0.3 * v + noise * rnd();
  }
  return buf;
}

// autoCorrelate is private; the tests exercise it directly because the detection loop needs a microphone
const detect = (buf: Float32Array<ArrayBuffer>, sr = SR) =>
  (new PitchDetector() as unknown as {
    autoCorrelate(b: Float32Array<ArrayBuffer>, sr: number): { frequency: number; clarity: number } | null;
  }).autoCorrelate(buf, sr);

test('detects every open string within a few cents', () => {
  for (const f of [82.41, 110, 146.83, 196, 246.94, 329.63]) {
    const r = detect(tone(f));
    assert.ok(r, `no pitch for ${f}`);
    const cents = Math.abs(1200 * Math.log2(r.frequency / f));
    assert.ok(cents < 8, `${f} Hz read as ${r.frequency.toFixed(2)} (${cents.toFixed(1)} cents off)`);
  }
});

test('does not drop an octave when the signal is noisy', () => {
  for (const f of [110, 196, 329.63]) {
    const r = detect(tone(f, [1, 0.5, 0.3], 0.08));
    assert.ok(r, `no pitch for ${f}`);
    const cents = Math.abs(1200 * Math.log2(r.frequency / f));
    assert.ok(cents < 25, `${f} Hz read as ${r.frequency.toFixed(2)}`);
  }
});

test('silence has no pitch', () => {
  assert.equal(detect(new Float32Array(new ArrayBuffer(2048 * 4))), null);
});

test('frequencyToNote names the open strings', () => {
  assert.equal(frequencyToNote(82.41).note, 'E');
  assert.equal(frequencyToNote(110).note, 'A');
  assert.equal(frequencyToNote(329.63).octave, 4);
});

test('detects at 48 kHz as well as 44.1 kHz', () => {
  for (const sr of [44100, 48000]) {
    for (const f of [82.41, 110, 196, 329.63, 659.26]) {
      const r = detect(tone(f, [1, 0.6, 0.35, 0.2], 0, sr), sr);
      assert.ok(r, `no pitch for ${f} @ ${sr}`);
      const cents = Math.abs(1200 * Math.log2(r.frequency / f));
      assert.ok(cents < 8, `${f} Hz @ ${sr} read as ${r.frequency.toFixed(2)}`);
    }
  }
});

test('a strong 2nd harmonic does not read an octave high', () => {
  for (const sr of [44100, 48000]) {
    for (const f of [82.41, 110, 146.83]) {
      const r = detect(tone(f, [0.7, 1, 0.3], 0, sr), sr);
      assert.ok(r, `no pitch for ${f} @ ${sr}`);
      const cents = Math.abs(1200 * Math.log2(r.frequency / f));
      assert.ok(cents < 25, `${f} Hz @ ${sr} read as ${r.frequency.toFixed(2)}`);
    }
  }
});

test('detects Drop-C and other notes below 65 Hz', () => {
  for (const sr of [44100, 48000]) {
    for (const f of [65.41, 61.74, 58.27]) {
      const r = detect(tone(f, [1, 0.5, 0.3], 0, sr), sr);
      assert.ok(r, `no pitch for ${f} @ ${sr}`);
      const cents = Math.abs(1200 * Math.log2(r.frequency / f));
      assert.ok(cents < 12, `${f} Hz @ ${sr} read as ${r.frequency.toFixed(2)}`);
    }
  }
});

test('frequencyToNote rejects zero, negative and non-finite input', () => {
  for (const bad of [0, -110, NaN, Infinity]) {
    assert.throws(() => frequencyToNote(bad), RangeError);
  }
});

test('noteFrequency is C-based and round-trips through frequencyToNote', () => {
  assert.ok(Math.abs(noteFrequency('A', 4) - 440) < 1e-9);
  assert.ok(Math.abs(noteFrequency('A', 2) - 110) < 1e-9);
  assert.ok(Math.abs(noteFrequency('E', 2) - 82.41) < 0.01);
  // "Hear Target" regression: E used to play as C# (a minor third low)
  for (const n of ['E', 'A', 'D', 'G', 'B', 'C', 'F'] as const) {
    const r = frequencyToNote(noteFrequency(n, 3));
    assert.equal(r.note, n);
    assert.equal(r.octave, 3);
    assert.equal(r.cents, 0);
  }
});

test('micErrorMessage distinguishes denied from missing', () => {
  assert.notEqual(micErrorMessage('denied'), micErrorMessage('no-mic'));
  assert.match(micErrorMessage('denied'), /blocked/i);
  assert.match(micErrorMessage('no-mic'), /no microphone/i);
});

// ---- microphone lifecycle, with a fake AudioContext and getUserMedia ----

interface FakeTrack { stopped: boolean; stop(): void }
const makeStream = () => {
  const track: FakeTrack = { stopped: false, stop() { this.stopped = true; } };
  return { track, stream: { getTracks: () => [track] } as unknown as MediaStream };
};

// guitarAudio caches the first AudioContext it creates, so every test shares one fake and swaps its signal
const silence = () => new Float32Array(new ArrayBuffer(2048 * 4));
const ctx = {
  state: 'running',
  sampleRate: SR,
  closed: 0,
  signal: silence as (n: number) => Float32Array<ArrayBuffer>,
  resume: async () => {},
  close: async () => { ctx.closed++; },
  createMediaStreamSource: () => ({ connect() {}, disconnect() {} }),
  createAnalyser: () => ({
    fftSize: 2048,
    connect() {},
    disconnect() {},
    getFloatTimeDomainData(b: Float32Array) { b.set(ctx.signal(b.length)); },
  }),
};

function installFakes(signal: (n: number) => Float32Array<ArrayBuffer> = silence) {
  ctx.closed = 0;
  ctx.signal = signal;
  class FakeAudioContext { constructor() { return ctx as unknown as FakeAudioContext; } }
  const g = globalThis as Record<string, unknown>;
  g.window = { AudioContext: FakeAudioContext };
  g.requestAnimationFrame = () => 1;
  g.cancelAnimationFrame = () => {};
  const gum: { resolve: (s: MediaStream) => void; reject: (e: unknown) => void }[] = [];
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      mediaDevices: {
        getUserMedia: () => new Promise<MediaStream>((resolve, reject) => gum.push({ resolve, reject })),
      },
    },
  });
  return { gum };
};

const internals = (d: PitchDetector) => d as unknown as { listeners: Set<unknown> };

test('stop -> start while the mic prompt is pending opens a fresh stream', async () => {
  const { gum } = installFakes();
  const d = new PitchDetector();
  const l1 = () => {};
  const l2 = () => {};
  const p1 = d.startListening(l1);
  d.stopListening(l1);
  const p2 = d.startListening(l2);
  assert.equal(gum.length, 2, 'second start must ask for its own stream');

  const first = makeStream();
  const second = makeStream();
  gum[0].resolve(first.stream);
  gum[1].resolve(second.stream);

  assert.equal(await p1, false);
  assert.equal(await p2, true);
  assert.equal(d.getIsListening(), true);
  assert.equal(first.track.stopped, true, 'stale stream is released');
  assert.equal(second.track.stopped, false, 'live stream stays open');
  assert.equal(internals(d).listeners.size, 1);
  d.stopListening();
});

test('stop while pending releases the stream when it finally arrives', async () => {
  const { gum } = installFakes();
  const d = new PitchDetector();
  const l = () => {};
  const p = d.startListening(l);
  d.stopListening(l);
  const s = makeStream();
  gum[0].resolve(s.stream);
  assert.equal(await p, false);
  assert.equal(s.track.stopped, true);
  assert.equal(d.getIsListening(), false);
});

test('a denied microphone resolves false, reports why and removes the listener', async () => {
  const { gum } = installFakes();
  const warn = console.warn;
  console.warn = () => {};
  try {
    const d = new PitchDetector();
    const p = d.startListening(() => {});
    gum[0].reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' }));
    assert.equal(await p, false);
    assert.equal(d.getLastError(), 'denied');
    assert.equal(internals(d).listeners.size, 0);
    assert.equal(d.claimFailure(), true);
    assert.equal(d.claimFailure(), false, 'only one UI resets the shared toggle');

    const p2 = d.startListening(() => {});
    gum[1].reject(Object.assign(new Error('none'), { name: 'NotFoundError' }));
    assert.equal(await p2, false);
    assert.equal(d.getLastError(), 'no-mic');
    assert.equal(d.claimFailure(), true);
  } finally {
    console.warn = warn;
  }
});

test('stopping the detector never closes the shared AudioContext', async () => {
  const { gum } = installFakes();
  const d = new PitchDetector();
  const l = () => {};
  const p = d.startListening(l);
  gum[0].resolve(makeStream().stream);
  assert.equal(await p, true);
  d.stopListening(l);
  assert.equal(ctx.closed, 0);
  assert.equal(d.getIsListening(), false);
});

test('inTune agrees with IN_TUNE_CENTS', async () => {
  assert.equal(IN_TUNE_CENTS, 5);
  for (const f of [110, 110 * 2 ** (4 / 1200), 110 * 2 ** (20 / 1200), 110 * 2 ** (-20 / 1200)]) {
    const { gum } = installFakes(() => tone(f));
    const d = new PitchDetector();
    const results: PitchDetectionResult[] = [];
    const p = d.startListening(r => { if (r) results.push(r); });
    gum[0].resolve(makeStream().stream);
    await p;
    d.stopListening();
    assert.ok(results.length > 0, `no result for ${f}`);
    const r = results[0];
    assert.equal(r.inTune, Math.abs(r.cents) <= IN_TUNE_CENTS);
    assert.equal(r.tuningDirection, r.inTune ? 'in-tune' : r.cents < 0 ? 'flat' : 'sharp');
  }
});
