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

const NOTE_LIST = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OPEN_STRINGS = [4, 9, 2, 7, 11, 4];
const sound = (frets: number[]) => frets.map((f, i) => (f < 0 ? null : NOTE_LIST[(OPEN_STRINGS[i] + f) % 12]));

test('every root has every generated movable chord type', () => {
  const types = ['Major', 'Minor', '7', 'm7', 'Maj7', 'Sus4', 'Sus2', 'Add9', 'Aug', 'Dim', '5', '6', 'm6', '9', 'Dim7', 'm7b5', '7sus4'];
  for (const type of types) {
    for (const root of NOTE_LIST) {
      const ok = CHORD_DATABASE.some(c => c.root === root && (c.type === type || (type === '7' && c.type === '7th')));
      assert.ok(ok, `${root} ${type}`);
    }
  }
});

test('lower positions rank first and no grip goes past fret 15', () => {
  for (const c of CHORD_DATABASE) assert.ok(Math.max(...c.frets) <= 15, c.id);
  const gens = CHORD_DATABASE.filter(c => c.id.startsWith('gen-e-') && c.type === 'Major');
  assert.ok(gens.length > 0);
});

test('every chord (curated too) sounds exactly the notes it claims, with the right bass and root', () => {
  for (const c of CHORD_DATABASE) {
    const sounded = sound(c.frets);
    const set = new Set(sounded.filter(Boolean));
    assert.deepEqual([...set].sort(), [...(c.allNotes ?? c.triadNotes)].sort(), `${c.id} (${c.frets.join(',')})`);
    assert.ok(set.has(c.root), `${c.id} root not sounded`);
    assert.equal(sounded.find(Boolean), c.bassNote, `${c.id} bass note`);
  }
});

test('fingers match the frets and no finger sits on two frets', () => {
  for (const c of CHORD_DATABASE) {
    const byFinger = new Map<number, Set<number>>();
    c.frets.forEach((f, i) => {
      const g = c.fingers[i];
      if (f > 0) assert.ok(g > 0, `${c.id} string ${6 - i} fretted without a finger`);
      else assert.equal(g, 0, `${c.id} string ${6 - i} open/muted but has finger ${g}`);
      if (f > 0) byFinger.set(g, (byFinger.get(g) ?? new Set()).add(f));
    });
    byFinger.forEach((frets, g) => assert.equal(frets.size, 1, `${c.id} finger ${g} on frets ${[...frets]}`));
    if (c.barreFret) {
      assert.ok(c.frets.includes(c.barreFret), `${c.id} barre fret unused`);
      assert.ok(c.frets.every(f => f <= 0 || f >= c.barreFret!), `${c.id} fretted below the barre`);
    }
  }
});

test('open voicings fixed in review: C7, Gsus4, B major', () => {
  const byId = (id: string) => CHORD_DATABASE.find(c => c.id === id)!;
  assert.deepEqual(byId('c7-open').allNotes, ['C', 'E', 'A#']);
  const gsus4 = byId('gsus4-open');
  assert.deepEqual([...new Set(sound(gsus4.frets).filter(Boolean))].sort(), ['C', 'D', 'G']);
  assert.ok(!byId('b-major-open').description.includes('three fingers'));
});

test('no duplicate root/type/fret combinations', () => {
  const keys = CHORD_DATABASE.map(c => `${c.root}|${c.type === '7th' ? '7' : c.type}|${c.frets.join(',')}`);
  assert.equal(new Set(keys).size, keys.length);
});
