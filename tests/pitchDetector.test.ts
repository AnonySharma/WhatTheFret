import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PitchDetector, frequencyToNote } from '../src/utils/pitchDetector';

const SR = 44100;

function tone(freq: number, harmonics = [1, 0.6, 0.35, 0.2], noise = 0): Float32Array<ArrayBuffer> {
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
const detect = (buf: Float32Array<ArrayBuffer>) =>
  (new PitchDetector() as unknown as {
    autoCorrelate(b: Float32Array<ArrayBuffer>, sr: number): { frequency: number; clarity: number } | null;
  }).autoCorrelate(buf, SR);

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
