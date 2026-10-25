import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beatEnvelope, beatFrequency, centsBetween, describeBeat, detunedFrequency } from '../src/utils/beats';

test('beat rate is the difference between the two frequencies', () => {
  assert.equal(beatFrequency(110, 112), 2);
  assert.equal(beatFrequency(112, 110), 2);
  assert.equal(beatFrequency(220, 220), 0);
});

test('detuned frequency goes to the requested side', () => {
  assert.equal(detunedFrequency(110, 3, 'sharp'), 113);
  assert.equal(detunedFrequency(110, 3, 'flat'), 107);
  assert.ok(detunedFrequency(1, 5, 'flat') >= 1);
});

test('a one-hertz error on the open A string is about 16 cents', () => {
  assert.ok(Math.abs(centsBetween(110, 111) - 15.66) < 0.05);
  assert.ok(centsBetween(110, 109) < 0);
});

test('envelope swells once per beat period and vanishes halfway between', () => {
  assert.ok(Math.abs(beatEnvelope(0, 2) - 1) < 1e-9);
  assert.ok(beatEnvelope(0.25, 2) < 1e-9); // 1 / (2 * 2 Hz)
  assert.ok(Math.abs(beatEnvelope(0.5, 2) - 1) < 1e-9); // full period
  assert.equal(beatEnvelope(3.7, 0), 1);
});

test('beat descriptions get rougher as the difference grows', () => {
  const labels = [0, 0.5, 2, 5, 10, 20].map(h => describeBeat(h).label);
  assert.deepEqual(labels, ['In tune', 'Almost there', 'Close', 'Off', 'Far off', 'Way off']);
});
