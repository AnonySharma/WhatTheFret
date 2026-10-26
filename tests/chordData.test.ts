import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHORD_DATABASE } from '../src/constants';
import { searchChords } from '../src/utils/chordSearch';

test('every root has major and minor chords (B major, Bb, F# ...)', () => {
  for (const q of ['B', 'Bb', 'C#', 'Eb', 'F#', 'Ab']) {
    const list = searchChords(CHORD_DATABASE, q);
    assert.ok(list.some(c => c.type === 'Major'), `${q} major`);
    assert.ok(list.some(c => c.type === 'Minor'), `${q} minor`);
  }
  assert.ok(searchChords(CHORD_DATABASE, 'B7').length >= 2);
  assert.ok(searchChords(CHORD_DATABASE, 'F#m').length >= 2);
});

test('generated chords are playable and consistent', () => {
  for (const c of CHORD_DATABASE) {
    assert.equal(c.frets.length, 6, c.id);
    assert.equal(c.fingers.length, 6, c.id);
    assert.ok(c.frets.every(f => f >= -1 && f <= 15), c.id);
    const fretted = c.frets.filter(f => f > 0);
    if (fretted.length) assert.ok(Math.max(...fretted) - Math.min(...fretted) <= 4, `${c.id} spans too many frets`);
  }
});

test('generated grips sound exactly the notes they claim', () => {
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const OPEN = [4, 9, 2, 7, 11, 4]; // E A D G B E, string 6 -> 1
  for (const c of CHORD_DATABASE.filter(x => x.id.startsWith('gen-'))) {
    const sounded = new Set(c.frets.map((f, i) => (f < 0 ? null : NOTES[(OPEN[i] + f) % 12])).filter(Boolean));
    const claimed = new Set(c.allNotes ?? c.triadNotes);
    assert.deepEqual([...sounded].sort(), [...claimed].sort(), `${c.id} (${c.frets.join(',')})`);
  }
});
