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

test('description thresholds are inclusive at the upper edge of each band', () => {
  assert.equal(describeBeat(0.049).label, 'In tune');
  assert.equal(describeBeat(0.05).label, 'Almost there');
  assert.equal(describeBeat(0.8).label, 'Almost there');
  assert.equal(describeBeat(0.81).label, 'Close');
  assert.equal(describeBeat(3).label, 'Close');
  assert.equal(describeBeat(7).label, 'Off');
  assert.equal(describeBeat(14).label, 'Far off');
  assert.equal(describeBeat(14.1).label, 'Way off');
});

test('beat maths: the 5th-fret rule leaves a perfectly matched pair at zero beats', () => {
  // low E (82.41 Hz) at the 5th fret is the open A string (110 Hz) in equal temperament
  const fretted = 82.4069 * Math.pow(2, 5 / 12);
  assert.ok(beatFrequency(fretted, 110) < 0.01);
  // ...but the G string's 4th fret against open B is the major-third exception
  const gAt4 = 196 * Math.pow(2, 4 / 12);
  assert.ok(beatFrequency(gAt4, 246.94) < 0.01);
  // five frets on G would be 1 semitone sharp of B: a loud, rough beat (~14 Hz)
  assert.ok(beatFrequency(196 * Math.pow(2, 5 / 12), 246.94) > 10);
});
