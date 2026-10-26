import { test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { metronome, getTempoMarking } from '../src/utils/metronome';
import { METRONOME_TIME_SIGNATURES } from '../src/constants';

// guitarAudio caches the first AudioContext it creates, so one fake is shared and reset per test
const ctx = {
  state: 'running',
  currentTime: 0,
  outputLatency: 0,
  baseLatency: 0,
  sampleRate: 44100,
  resume: async () => {},
};
class FakeAudioContext {
  constructor() {
    return ctx as unknown as FakeAudioContext;
  }
}
const g = globalThis as Record<string, unknown>;
g.window = {
  AudioContext: FakeAudioContext,
  setTimeout: (...a: Parameters<typeof setTimeout>) => globalThis.setTimeout(...a),
  clearTimeout: (id: Parameters<typeof clearTimeout>[0]) => globalThis.clearTimeout(id),
};

const beats: number[] = [];
metronome.onBeat(i => beats.push(i));
metronome.setMuted(true); // no audio nodes needed; scheduling and UI timing are what is under test

beforeEach(() => {
  mock.timers.enable({ apis: ['setTimeout'] });
  ctx.currentTime = 0;
  ctx.outputLatency = 0;
  ctx.baseLatency = 0;
  beats.length = 0;
  metronome.setBpm(100);
  metronome.setTimeSignature(METRONOME_TIME_SIGNATURES[2]); // 4/4
});

afterEach(() => {
  metronome.stop();
  mock.timers.reset();
});

test('getTempoMarking has no gaps between ranges', () => {
  assert.equal(getTempoMarking(55).italian, 'Largo');
  assert.equal(getTempoMarking(55.5).italian, 'Largo');
  assert.equal(getTempoMarking(56).italian, 'Adagio');
  assert.equal(getTempoMarking(66.5).italian, 'Adagio');
  assert.equal(getTempoMarking(108.5).italian, 'Andante');
  assert.equal(getTempoMarking(120.5).italian, 'Moderato');
  assert.equal(getTempoMarking(260).italian, 'Presto');
  assert.equal(getTempoMarking(10).italian, 'Largo');
  assert.equal(getTempoMarking(999).italian, 'Presto');
});

test('subscribe fires on bpm, time signature, start and stop, and can unsubscribe', () => {
  let calls = 0;
  const off = metronome.subscribe(() => calls++);
  metronome.setBpm(120);
  assert.equal(calls, 1);
  metronome.setBpm(120);
  assert.equal(calls, 1, 'unchanged value is not a change');
  metronome.setTimeSignature(METRONOME_TIME_SIGNATURES[0]);
  assert.equal(calls, 2);
  metronome.start();
  assert.equal(calls, 3);
  metronome.stop();
  assert.equal(calls, 4);
  off();
  metronome.setBpm(130);
  assert.equal(calls, 4);
});

test('a stalled scheduler skips missed beats instead of bursting them', () => {
  metronome.start();
  mock.timers.tick(30);
  mock.timers.tick(60); // beat 0 at 0.05 is audible by now
  assert.deepEqual(beats, [0]);

  // backgrounded tab: the audio clock ran on for 10 s while no timer fired
  ctx.currentTime = 10;
  mock.timers.tick(30);
  mock.timers.tick(500);
  assert.deepEqual(beats, [0], 'no burst of catch-up beats');

  // beats stay on the original grid: beat n sits at 0.05 + n * 0.6 s, index n % 4
  ctx.currentTime = 10.2; // next grid beat is #17 at 10.25 -> index 1
  mock.timers.tick(30);
  mock.timers.tick(100);
  assert.deepEqual(beats, [0, 1]);
});

test('stop clears pending beat flashes so a quick restart shows no stale beat', () => {
  metronome.start();
  mock.timers.tick(1); // schedules beat 0 (UI flash 50 ms away)
  metronome.stop();
  metronome.start();
  mock.timers.tick(1);
  mock.timers.tick(100);
  assert.deepEqual(beats, [0], 'only the new run flashes');
});

test('the beat flash waits for the output latency', () => {
  ctx.outputLatency = 0.1;
  ctx.baseLatency = 0.01;
  metronome.start();
  mock.timers.tick(1);
  mock.timers.tick(100); // 0.05 s ahead alone would have flashed by now
  assert.deepEqual(beats, []);
  mock.timers.tick(70);
  assert.deepEqual(beats, [0]);
});
