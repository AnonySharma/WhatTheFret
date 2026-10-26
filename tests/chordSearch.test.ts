import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHORD_DATABASE } from '../src/constants';
import { parseChordSymbol, searchChords } from '../src/utils/chordSearch';

const ids = (q: string) => searchChords(CHORD_DATABASE, q).map(c => c.id);

test('"Am" returns the plain A Minor chord first', () => {
  assert.equal(ids('Am')[0], 'a-minor-open');
  assert.ok(ids('Am').includes('a-minor-barre-e'));
  assert.ok(!ids('Am').includes('am7-open'));
});

test('"a minor", "Amin" and "A-" are equivalent to "Am"', () => {
  for (const q of ['a minor', 'Amin', 'A-', 'am', ' A m ']) assert.deepEqual(ids(q), ids('Am'), q);
});

test('Am7 / G7 / Dsus4 resolve to their own types', () => {
  assert.equal(ids('Am7')[0], 'am7-open');
  assert.ok(searchChords(CHORD_DATABASE, 'Am7').every(c => c.root === 'A' && c.type === 'm7'));
  assert.ok(searchChords(CHORD_DATABASE, 'G7').every(c => c.root === 'G' && c.type.includes('7')));
  assert.ok(ids('G7').length >= 2);
  assert.equal(ids('G7')[0], 'g7-open');
  assert.equal(ids('Dsus4')[0], 'dsus4-open');
  assert.ok(searchChords(CHORD_DATABASE, 'Dsus4').every(c => c.root === 'D' && c.type === 'Sus4'));
});

test('bare root lists that root only, Major before Minor', () => {
  const list = searchChords(CHORD_DATABASE, 'A');
  assert.ok(list.length > 3);
  assert.ok(list.every(c => c.root === 'A'));
  assert.equal(list[0].type, 'Major');
});

test('flats and sharps are enharmonic aware', () => {
  assert.deepEqual(parseChordSymbol('Bb'), { root: 'A#', types: [] });
  assert.equal(ids('F#m')[0], 'f-sharp-minor-barre');
  assert.equal(ids('Gbm')[0], 'f-sharp-minor-barre');
  assert.equal(parseChordSymbol('bm')?.root, 'B');
});

test('free text still works and unknown text returns nothing', () => {
  const power = searchChords(CHORD_DATABASE, 'power');
  assert.ok(power.length > 0 && power.every(c => c.type === '5'));
  assert.ok(ids('barre').length > 0);
  assert.deepEqual(ids('zzz'), []);
});

test('Δ / △ / maj9 resolve to Maj7 (suffix is looked up before lowercasing)', () => {
  for (const q of ['CΔ', 'CΔ7', 'C△', 'C△7', 'Cmaj9', 'Cmaj7']) {
    assert.deepEqual(parseChordSymbol(q), { root: 'C', types: ['Maj7'] }, q);
    const list = searchChords(CHORD_DATABASE, q);
    assert.ok(list.length > 0 && list.every(c => c.root === 'C' && c.type === 'Maj7'), q);
  }
});

test('extended and altered suffixes map to their own types', () => {
  const cases: Record<string, string> = {
    'Cdim7': 'Dim7', 'C°7': 'Dim7', 'Cø': 'm7b5', 'Cø7': 'm7b5', 'Cm7b5': 'm7b5', 'Cm7♭5': 'm7b5',
    'Cmin7b5': 'm7b5', 'Cm7(b5)': 'm7b5', 'C6': '6', 'Cm6': 'm6', 'C9': '9', 'C7sus4': '7sus4',
    'Cadd9': 'Add9', 'Caug': 'Aug', 'C+': 'Aug', 'Cdim': 'Dim', 'C°': 'Dim',
  };
  for (const [q, type] of Object.entries(cases)) {
    assert.deepEqual(parseChordSymbol(q)?.types, [type], q);
    const list = searchChords(CHORD_DATABASE, q);
    assert.ok(list.length > 0 && list.every(c => c.root === 'C' && c.type === type), q);
  }
  assert.ok(searchChords(CHORD_DATABASE, 'E7th').length > 0);
  assert.ok(searchChords(CHORD_DATABASE, 'E7th').every(c => c.root === 'E' && c.type.includes('7')));
  assert.ok(searchChords(CHORD_DATABASE, 'E7th').some(c => c.id === 'e7-open'));
});

test('slash chords rank voicings with the requested bass first', () => {
  assert.deepEqual(parseChordSymbol('C/G'), { root: 'C', types: ['Major'], bass: 'G' });
  assert.deepEqual(parseChordSymbol('Am/E'), { root: 'A', types: ['Minor'], bass: 'E' });
  assert.deepEqual(parseChordSymbol('D/F#'), { root: 'D', types: ['Major'], bass: 'F#' });
  assert.deepEqual(parseChordSymbol('D/Gb'), { root: 'D', types: ['Major'], bass: 'F#' });
  for (const [q, root, type, bass] of [['C/G', 'C', 'Major', 'G'], ['Am/E', 'A', 'Minor', 'E'], ['D/F#', 'D', 'Major', 'F#']]) {
    const list = searchChords(CHORD_DATABASE, q);
    assert.ok(list.length > 0, q);
    assert.ok(list.every(c => c.root === root && c.type === type), q);
    const plain = CHORD_DATABASE.filter(c => c.root === root && c.type === type);
    assert.deepEqual([...list.map(c => c.id)].sort(), plain.map(c => c.id).sort(), q);
    // once a non-matching bass appears, no matching one may follow
    const flags = list.map(c => c.bassNote === bass);
    assert.ok(flags.every((f, i) => !f || flags.slice(0, i).every(Boolean)), `${q} bass-first ordering`);
  }
  // No voicing has a G bass in the list: still return the plain chord, never nothing
  const noMatch = searchChords(CHORD_DATABASE.filter(c => c.id === 'c-major-open'), 'C/G');
  assert.deepEqual(noMatch.map(c => c.id), ['c-major-open']);
  assert.ok(searchChords(CHORD_DATABASE, 'C/').length > 0);
  assert.deepEqual(ids('C/'), ids('C')); // trailing slash with no bass behaves like the bare root
});

test('unknown suffix on a valid root falls back to that root', () => {
  const list = searchChords(CHORD_DATABASE, 'Cm13');
  assert.ok(list.length > 0 && list.every(c => c.root === 'C'));
  assert.ok(searchChords(CHORD_DATABASE, 'F#xyz').every(c => c.root === 'F#'));
  assert.ok(searchChords(CHORD_DATABASE, 'Gadd4').length > 0);
  assert.deepEqual(ids('zzz'), []);
});

test('Bb vs bm vs b stay distinct, and odd input never throws', () => {
  assert.deepEqual(parseChordSymbol('Bb'), { root: 'A#', types: [] });
  assert.deepEqual(parseChordSymbol('bb'), { root: 'A#', types: [] });
  assert.deepEqual(parseChordSymbol('bbm'), { root: 'A#', types: ['Minor'] });
  assert.deepEqual(parseChordSymbol('bm'), { root: 'B', types: ['Minor'] });
  assert.deepEqual(parseChordSymbol('b'), { root: 'B', types: [] });
  assert.deepEqual(parseChordSymbol('B♭'), { root: 'A#', types: [] });
  assert.deepEqual(parseChordSymbol('F♯m'), { root: 'F#', types: ['Minor'] });
  assert.deepEqual(parseChordSymbol('B♭maj7'), { root: 'A#', types: ['Maj7'] });
  assert.equal(parseChordSymbol(''), null);
  assert.equal(parseChordSymbol('   '), null);
  assert.equal(parseChordSymbol('♭♯'), null);
  assert.equal(parseChordSymbol('constructor'), null);
  assert.equal(searchChords(CHORD_DATABASE, '   ').length, CHORD_DATABASE.length);
  for (const q of ['', ' ', '♭', '♯', 'B♭', 'F♯m7', '/', 'C/Q', '🎸', 'Δ', '__proto__', 'toString']) {
    assert.doesNotThrow(() => searchChords(CHORD_DATABASE, q), q);
  }
  assert.ok(ids('bb').every(id => CHORD_DATABASE.find(c => c.id === id)!.root === 'A#'));
  assert.ok(ids('bm').every(id => CHORD_DATABASE.find(c => c.id === id)!.root === 'B'));
});

test('chord ids are unique', () => {
  const all = CHORD_DATABASE.map(c => c.id);
  assert.equal(new Set(all).size, all.length);
});
