import { test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { METRONOME_CONFIG } from '../src/constants';

// ---- minimal Web Audio fakes -------------------------------------------------

const param = () => ({
  value: 0,
  setValueAtTime() {},
  linearRampToValueAtTime() {},
  exponentialRampToValueAtTime() {},
  cancelScheduledValues() {},
  setTargetAtTime() {},
});

const counts = { oscillators: 0 };
let currentTime = 0;

class FakeAudioContext {
  state = 'running';
  sampleRate = 8000;
  destination = {};
  get currentTime() {
    return currentTime;
  }
  resume() {
    return Promise.resolve();
  }
  createGain() {
    return { gain: param(), connect() {}, disconnect() {} };
  }
  createOscillator() {
    counts.oscillators += 1;
    return { type: '', frequency: param(), detune: param(), connect() {}, start() {}, stop() {} };
  }
  createBiquadFilter() {
    return { type: '', frequency: param(), Q: param(), connect() {} };
  }
  createBuffer(_c: number, size: number) {
    return { getChannelData: () => new Float32Array(size) };
  }
  createBufferSource() {
    return { buffer: null, connect() {}, start() {}, stop() {} };
  }
}

// the engines reach timers through `window`; route them to the (mockable) globals at call time
(globalThis as unknown as { window: unknown }).window = {
  AudioContext: FakeAudioContext,
  setInterval: (fn: () => void, ms: number) => globalThis.setInterval(fn, ms),
  clearInterval: (id: number) => globalThis.clearInterval(id),
  setTimeout: (fn: () => void, ms: number) => globalThis.setTimeout(fn, ms),
  clearTimeout: (id: number) => globalThis.clearTimeout(id),
};

const { RhythmEngine, TanpuraEngine, beatAccents } = await import('../src/utils/drone');
const { TAALS, vibhagStarts } = await import('../src/utils/labs');

const keherwa = TAALS.find(t => t.id === 'keherwa')!;
const accents = beatAccents(keherwa, vibhagStarts(keherwa));
const bpmOf = (e: unknown) => (e as { bpm: number }).bpm;

beforeEach(() => {
  currentTime = 0;
  counts.oscillators = 0;
  mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
});
afterEach(() => mock.timers.reset());

test('beatAccents marks sam, tali, khali and normal beats of Teental', () => {
  const t = TAALS.find(x => x.id === 'teental')!;
  const a = beatAccents(t, vibhagStarts(t));
  assert.equal(a.length, 16);
  assert.equal(a[0], 'sam');
  assert.equal(a[8], 'khali'); // beat 9
  assert.equal(a[4], 'tali'); // beat 5
  assert.equal(a[1], 'normal');
});

test('RhythmEngine.start clamps hostile tempos instead of hanging or going silent', () => {
  const e = new RhythmEngine();
  for (const [input, expected] of [
    [0, METRONOME_CONFIG.MIN_BPM],
    [-50, METRONOME_CONFIG.MIN_BPM],
    [1e9, METRONOME_CONFIG.MAX_BPM],
    [Number.NaN, METRONOME_CONFIG.DEFAULT_BPM],
    [Number.POSITIVE_INFINITY, METRONOME_CONFIG.DEFAULT_BPM],
    [90, 90],
  ] as [number, number][]) {
    e.start(accents, input);
    assert.equal(bpmOf(e), expected, `start(${input})`);
    e.stop();
  }
  e.setBpm(1000);
  assert.equal(bpmOf(e), METRONOME_CONFIG.MAX_BPM);
  e.setBpm(-1);
  assert.equal(bpmOf(e), METRONOME_CONFIG.MIN_BPM);
});

test('RhythmEngine with a negative start tempo terminates and schedules sane beats', () => {
  const e = new RhythmEngine();
  const beats: number[] = [];
  e.start(accents, -120, b => beats.push(b));
  mock.timers.tick(40); // would loop forever before the clamp
  currentTime = 1;
  mock.timers.tick(40);
  mock.timers.tick(5000);
  e.stop();
  assert.ok(beats.length >= 1 && beats.length <= 4, `beats fired: ${beats.length}`);
  assert.ok(beats.every(b => b >= 1 && b <= 8));
});

test('RhythmEngine drops missed beats after a throttled tab instead of dumping them', () => {
  const e = new RhythmEngine();
  const beats: number[] = [];
  e.start(accents, 120, b => beats.push(b));
  mock.timers.tick(40);
  const before = counts.oscillators;
  currentTime = 120; // two minutes of throttling
  mock.timers.tick(40);
  const after = counts.oscillators - before;
  mock.timers.tick(1000);
  e.stop();
  assert.ok(after <= 2, `scheduled ${after} hits at once after the stall`);
  assert.ok(beats.length <= 4, `ui callbacks: ${beats.length}`);
  assert.ok(beats.every(b => b >= 1 && b <= 8));
});

test('RhythmEngine stop clears pending UI timers', () => {
  const e = new RhythmEngine();
  const beats: number[] = [];
  e.start(accents, 60, b => beats.push(b));
  mock.timers.tick(40);
  e.stop();
  mock.timers.tick(10000);
  assert.equal(beats.length, 0);
  assert.equal(e.isRunning, false);
});

test('TanpuraEngine skips missed plucks after a stall', () => {
  const e = new TanpuraEngine();
  e.start(130.81, 'Pa');
  mock.timers.tick(40);
  const before = counts.oscillators;
  currentTime = 300;
  mock.timers.tick(40);
  const plucks = (counts.oscillators - before) / 3; // three oscillators per pluck
  assert.ok(plucks <= 2, `plucks scheduled at once: ${plucks}`);
  e.stop();
  assert.equal(e.isRunning, false);
});
