import { test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

interface FakeGain {
  gain: { value: number; targets: number[] };
  connections: unknown[];
}

let currentTime = 0;
let oscillators = 0;
const gains: FakeGain[] = [];

const destination = { name: 'destination' };

class FakeAudioContext {
  state = 'running';
  sampleRate = 8000;
  destination = destination;
  get currentTime() {
    return currentTime;
  }
  resume() {
    return Promise.resolve();
  }
  createGain() {
    const node: FakeGain & Record<string, unknown> = {
      gain: {
        value: 1,
        targets: [],
        setValueAtTime() {},
        linearRampToValueAtTime() {},
        exponentialRampToValueAtTime() {},
        cancelScheduledValues() {},
        setTargetAtTime(v: number) {
          this.targets.push(v);
        },
      } as FakeGain['gain'],
      connections: [],
      connect(target: unknown) {
        this.connections.push(target);
      },
      disconnect() {},
    };
    gains.push(node);
    return node;
  }
  createOscillator() {
    oscillators += 1;
    const p = () => ({ setValueAtTime() {}, setTargetAtTime() {}, value: 0 });
    return { type: '', frequency: p(), connect() {}, start() {}, stop() {} };
  }
}

(globalThis as unknown as { window: unknown }).window = {
  AudioContext: FakeAudioContext,
  setTimeout: (fn: () => void, ms: number) => globalThis.setTimeout(fn, ms),
};

const { guitarAudio } = await import('../src/utils/audioSynth');

beforeEach(() => {
  guitarAudio.setMuted(false);
  oscillators = 0;
  mock.timers.enable({ apis: ['setTimeout'] });
});

afterEach(() => mock.timers.reset());

const bus = () => gains.find(g => g.connections.includes(destination));

test('holdTones started while muted is inert and creates no oscillators', () => {
  guitarAudio.setMuted(true);
  const before = oscillators;
  const tones = guitarAudio.holdTones([110, 112]);
  assert.equal(oscillators, before);
  assert.doesNotThrow(() => {
    tones.setFrequencies([110, 111]);
    tones.stop();
  });
});

test('muting while tones ring ramps the output bus to silence, unmuting restores it', () => {
  const tones = guitarAudio.holdTones([110, 112]);
  assert.equal(oscillators, 4); // fundamental + 2nd harmonic per tone
  const b = bus();
  assert.ok(b, 'held tones are routed through a master bus');
  assert.equal(b.gain.value, 1);

  guitarAudio.setMuted(true);
  assert.equal(b.gain.targets.at(-1), 0);
  guitarAudio.setMuted(false);
  assert.equal(b.gain.targets.at(-1), 1);

  tones.stop();
  mock.timers.tick(1000);
});

test('tones started after a mute begin on a silent bus only if still muted', () => {
  const tones = guitarAudio.holdTones([220]);
  guitarAudio.setMuted(true);
  const b = bus()!;
  assert.equal(b.gain.targets.at(-1), 0);
  // a second set of tones while muted never starts
  const before = oscillators;
  guitarAudio.holdTones([330]);
  assert.equal(oscillators, before);
  tones.stop();
  mock.timers.tick(1000);
});
