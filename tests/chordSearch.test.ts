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

test('chord ids are unique', () => {
  const all = CHORD_DATABASE.map(c => c.id);
  assert.equal(new Set(all).size, all.length);
});
