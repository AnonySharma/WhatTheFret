import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NOTE_NAMES } from '../src/constants';
import {
  capoFrequencies,
  chordPrefersFlats,
  isEasyOpenShape,
  openStringNames,
  parseSymbol,
  quizQuestion,
  rankCapoOptions,
  shapeForTarget,
  shapeFrequencies,
  shapeVoicing,
  soundingChord,
  soundingRoot,
} from '../src/utils/capo';

const pc = (symbol: string) => parseSymbol(symbol)!.root;

test('capo 0 is the identity', () => {
  for (const s of ['C', 'F#', 'Bbm7', 'Am', 'Dsus4']) {
    assert.equal(soundingChord(s, 0), s);
    assert.equal(shapeForTarget(s, 0), s);
  }
});

test('shape <-> sounding round-trips for all 12 roots and capo 0-11 (wraps)', () => {
  for (const root of NOTE_NAMES) {
    for (const quality of ['', 'm', '7']) {
      for (let capo = 0; capo <= 11; capo++) {
        const shape = root + quality;
        const sounding = soundingChord(shape, capo);
        assert.equal(pc(sounding), (pc(shape) + capo) % 12, `${shape} + ${capo} = ${sounding}`);
        const back = shapeForTarget(sounding, capo);
        assert.equal(pc(back), pc(shape), `${sounding} - ${capo} = ${back}`);
        assert.equal(parseSymbol(back)!.quality, parseSymbol(shape)!.quality);
      }
    }
  }
});

test('known shape + capo results', () => {
  assert.equal(soundingChord('G', 2), 'A');
  assert.equal(soundingChord('C', 3), 'Eb');
  assert.equal(soundingChord('Am', 2), 'Bm');
  assert.equal(soundingChord('E', 1), 'F');
  assert.equal(soundingChord('D', 11), 'Db');
  assert.equal(soundingChord('D', 4), 'F#');
  assert.equal(soundingChord('A', 3), 'C');
  assert.equal(soundingRoot('G', 2), 'A');
  assert.equal(soundingRoot('C', 5), 'F');
});

test('spelling uses flats for flat keys and sharps otherwise', () => {
  assert.equal(soundingChord('G', 3), 'Bb');
  assert.equal(soundingChord('C', 8), 'Ab');
  assert.equal(soundingChord('D', 4), 'F#');
  assert.equal(soundingChord('E', 2), 'F#');
  assert.equal(soundingChord('Am', 1), 'Bbm');
  assert.equal(soundingChord('Em', 3), 'Gm');
  assert.equal(soundingChord('Dm', 2), 'Em');
  assert.equal(soundingChord('Em', 2), 'F#m');
  // explicit override wins
  assert.equal(soundingChord('G', 3, false), 'A#');
  assert.equal(soundingChord('C', 1, true), 'Db');
  assert.equal(chordPrefersFlats(10), true);
  assert.equal(chordPrefersFlats(7, 'm'), true);
  assert.equal(chordPrefersFlats(7), false);
});

test('openStringNames', () => {
  assert.deepEqual(openStringNames(0), ['E', 'A', 'D', 'G', 'B', 'E']);
  assert.deepEqual(openStringNames(2), ['F#', 'B', 'E', 'A', 'C#', 'F#']);
  assert.deepEqual(openStringNames(3, true), ['G', 'C', 'F', 'Bb', 'D', 'G']);
  assert.deepEqual(openStringNames(12), openStringNames(0));
});

test('capoFrequencies: semitone per fret, octave at 12, muted stay -1', () => {
  const open = capoFrequencies([0, 0, 0, 0, 0, 0], 0);
  const at12 = capoFrequencies([0, 0, 0, 0, 0, 0], 12);
  open.forEach((f, i) => assert.ok(Math.abs(at12[i] / f - 2) < 1e-9));
  const at1 = capoFrequencies([0, 0, 0, 0, 0, 0], 1);
  at1.forEach((f, i) => assert.ok(Math.abs(f / open[i] - Math.pow(2, 1 / 12)) < 1e-9));
  assert.equal(capoFrequencies([-1, 3, 2, 0, 1, 0], 2)[0], -1);
  assert.equal(capoFrequencies([-1, 3, 2, 0, 1, 0], 2).filter(f => f > 0).length, 5);
  assert.ok(Math.abs(capoFrequencies([0, 0, 0, 0, 0, 0], 0)[0] - 82.41) < 0.01);
});

test('shape voicings and strum frequencies', () => {
  assert.deepEqual(shapeVoicing('G'), [3, 2, 0, 0, 0, 3]);
  assert.deepEqual(shapeVoicing('Am'), [-1, 0, 2, 2, 1, 0]);
  assert.equal(shapeVoicing('N.C.'), null);
  const f0 = shapeFrequencies('C', 0)!;
  const f2 = shapeFrequencies('C', 2)!;
  assert.equal(f2[0], -1);
  f2.forEach((f, i) => f > 0 && assert.ok(Math.abs(f / f0[i] - Math.pow(2, 2 / 12)) < 1e-9));
  assert.equal(shapeFrequencies('xyz', 2), null);
});

test('easy open shape detection', () => {
  for (const s of ['C', 'A', 'G', 'E', 'D', 'Am', 'Em', 'Dm', 'G7', 'E7', 'Am7']) assert.ok(isEasyOpenShape(s), s);
  for (const s of ['Bb', 'F', 'Gm', 'Eb', 'F#m', 'Bm', 'junk', '']) assert.ok(!isEasyOpenShape(s), s);
});

test('Bb Gm Eb F -> capo 3 with G Em C D ranks first', () => {
  const ranked = rankCapoOptions(['Bb', 'Gm', 'Eb', 'F']);
  assert.equal(ranked[0].fret, 3);
  assert.deepEqual(ranked[0].shapes, ['G', 'Em', 'C', 'D']);
  assert.equal(ranked[0].score, 4);
  // no capo is offered as an option and scores worse
  const none = ranked.find(r => r.fret === 0)!;
  assert.ok(none.score < ranked[0].score);
  assert.equal(ranked.length, 8);
});

test('ties go to the lower fret; C G Am F: capo 5 (G D Em C) beats no capo', () => {
  const ranked = rankCapoOptions(['C', 'G', 'Am', 'F']);
  const top = ranked.filter(r => r.score === ranked[0].score);
  assert.deepEqual(
    top.map(r => r.fret),
    [...top.map(r => r.fret)].sort((a, b) => a - b)
  );
  assert.equal(ranked[0].fret, 5);
  assert.deepEqual(ranked[0].shapes, ['G', 'D', 'Em', 'C']);
  assert.equal(ranked.find(r => r.fret === 0)!.score, 3);
  // already-easy progression: a tie at the top still resolves to the lowest fret
  const easy = rankCapoOptions(['G', 'Em']);
  assert.equal(easy[0].fret, 0);
});

test('empty and junk progressions do not throw', () => {
  assert.deepEqual(rankCapoOptions([]), []);
  assert.deepEqual(rankCapoOptions(['', '  ']), []);
  const junk = rankCapoOptions(['???', 'N.C.', 'H7']);
  assert.ok(junk.every(r => r.score === 0));
  assert.equal(junk[0].fret, 0);
  assert.equal(soundingChord('N.C.', 3), 'N.C.');
  assert.equal(shapeForTarget('???', 3), '???');
  assert.equal(soundingRoot('zzz', 2), null);
  assert.equal(parseSymbol('Hm'), null);
  assert.equal(parseSymbol('Cwhatever'), null);
  assert.deepEqual(openStringNames(-1).length, 6);
});

test('quizQuestion is deterministic per seed and always self-consistent', () => {
  assert.deepEqual(quizQuestion(7), quizQuestion(7));
  for (let seed = 0; seed < 200; seed++) {
    const q = quizQuestion(seed);
    assert.ok(q.options.includes(q.answer), `seed ${seed}: answer in options`);
    assert.equal(new Set(q.options).size, q.options.length, `seed ${seed}: unique options`);
    assert.ok(q.options.length >= 3, `seed ${seed}: enough options`);
    assert.ok(q.prompt.length > 0 && q.explanation.length > 0);
  }
  // the example in the lab copy
  const gShape = soundingChord('G', 2);
  assert.equal(gShape, 'A');
});
