import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NOTE_NAMES, INDIAN_RAAGAS, type NoteName } from '../src/constants';
import { getFretNote } from '../src/utils/guitarTheory';
import {
  CAGED_SHAPES,
  TAALS,
  borrowedChords,
  cagedPositions,
  capoOptions,
  getChordFrequencies,
  intervalSecondMidi,
  isBlindFretCorrect,
  majorTriadNotes,
  makeBlindFretQuestion,
  makeIntervalQuestion,
  padOffsets,
  pivotChords,
  sequenceOffsets,
  symbolToChord,
  transposeChordSymbol,
  transposeProgression,
  transposeProgressionDetailed,
  triadUsesFlats,
  vibhagStarts,
} from '../src/utils/labs';

test('transposing keeps chord quality and picks flat/sharp spelling', () => {
  assert.deepEqual(transposeProgression('C G Am F', 2), ['D', 'A', 'Bm', 'G']);
  assert.deepEqual(transposeProgression('C G Am F', 5, true), ['F', 'C', 'Dm', 'Bb']);
  assert.equal(transposeChordSymbol('Am7', 3), 'Cm7');
  assert.equal(transposeChordSymbol('C/E', 2), 'D/F#');
  assert.equal(transposeChordSymbol('Bb', 2), 'C');
  assert.equal(transposeChordSymbol('N.C.', 2), 'N.C.');
});

test('capo options: D major via C shapes needs capo 2', () => {
  const opts = capoOptions('D');
  assert.deepEqual(opts.find(o => o.shapeKey === 'C'), { shapeKey: 'C', capo: 2 });
  assert.deepEqual(opts.find(o => o.shapeKey === 'D'), { shapeKey: 'D', capo: 0 });
  assert.ok(opts.every(o => o.capo <= 7));
});

test('borrowed chords from parallel minor in C', () => {
  const b = borrowedChords('C');
  const names = Object.fromEntries(b.map(x => [x.numeral, x.display]));
  assert.equal(names['iv'], 'Fm');
  assert.equal(names['♭III'], 'Eb');
  assert.equal(names['♭VI'], 'Ab');
  assert.equal(names['♭VII'], 'Bb');
});

test('pivot chords between C and G major', () => {
  const p = pivotChords('C', 'G').map(x => `${x.root}${x.type}`);
  assert.deepEqual(p.sort(), ['AMinor', 'CMajor', 'EMinor', 'GMajor']);
});

test('symbolToChord understands basic qualities', () => {
  assert.deepEqual(symbolToChord('Am7'), { root: 'A', type: 'Minor' });
  assert.deepEqual(symbolToChord('Bbmaj7'), { root: 'A#', type: 'Major' });
  assert.deepEqual(symbolToChord('F#dim'), { root: 'F#', type: 'Diminished' });
  assert.equal(symbolToChord('N.C.'), null);
});

test('every chord quality has a playable voicing in every key', () => {
  for (const root of NOTE_NAMES) {
    for (const type of ['Major', 'Minor', 'Diminished'] as const) {
      const f = getChordFrequencies(root, type);
      assert.ok(f.some(x => x > 0), `${root} ${type}`);
    }
  }
});

test('CAGED: every shape in every key contains only root / 3rd / 5th', () => {
  for (const root of NOTE_NAMES) {
    const triad = majorTriadNotes(root);
    const positions = cagedPositions(root);
    assert.ok(positions.length >= 5, `${root} has all five shapes`);
    assert.deepEqual(new Set(positions.map(p => p.shapeId)).size, 5);
    for (const p of positions) {
      p.frets.forEach((fret, i) => {
        if (fret < 0) return;
        assert.ok(fret <= 15);
        const note = getFretNote(6 - i, fret).note;
        assert.ok(triad.includes(note), `${root} ${p.shapeId} string ${6 - i} fret ${fret} = ${note}`);
      });
    }
  }
});

test('CAGED: open C shape is the C chord at offset 0 and the shapes are ordered up the neck', () => {
  const pos = cagedPositions('C');
  const c = pos.find(p => p.shapeId === 'C' && p.offset === 0)!;
  assert.deepEqual(c.frets, CAGED_SHAPES[0].frets);
  const firstOfEach = ['C', 'A', 'G', 'E', 'D'].map(id => pos.find(p => p.shapeId === id)!.minFret);
  assert.deepEqual([...firstOfEach].sort((a, b) => a - b), firstOfEach);
});

test('sequenceOffsets builds monotonic lines, starting low for Yaman', () => {
  const yaman = INDIAN_RAAGAS.find(r => r.id === 'raag-yaman')!;
  const asc = sequenceOffsets(yaman.arohana, 'asc');
  assert.equal(asc[0], -1); // lower-octave Ni
  assert.ok(asc.every((v, i) => i === 0 || v > asc[i - 1]));
  assert.equal(asc[asc.length - 1], 12); // Sa' is the octave
});

test('sequenceOffsets: descending line ends on Sa', () => {
  const yaman = INDIAN_RAAGAS.find(r => r.id === 'raag-yaman')!;
  const desc = sequenceOffsets(yaman.avarohana, 'desc');
  assert.equal(desc[0], 12);
  assert.ok(desc.every((v, i) => i === 0 || v < desc[i - 1]));
  assert.equal(desc[desc.length - 1], 0);
});

test('padOffsets includes Sa and is sorted', () => {
  const bhoopali = INDIAN_RAAGAS.find(r => r.id === 'raag-bhoopali')!;
  assert.deepEqual(padOffsets(bhoopali.arohana, bhoopali.avarohana), [0, 2, 4, 7, 9]);
});

test('taal structure facts', () => {
  for (const t of TAALS) assert.equal(t.grouping.reduce((a, b) => a + b, 0), t.beats, t.name);
  const by = Object.fromEntries(TAALS.map(t => [t.id, t]));
  assert.deepEqual(vibhagStarts(by.rupak), [1, 4, 6]);
  assert.deepEqual(vibhagStarts(by.teental), [1, 5, 9, 13]);
  assert.equal(by.keherwa.beats, 8);
  assert.equal(by.dadra.beats, 6);
  assert.equal(by.jhaptal.beats, 10);
});

test('interval questions stay in range and are deterministic with a seeded rng', () => {
  let seed = 7;
  const rng = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 200; i++) {
    const q = makeIntervalQuestion([3, 4, 7], 'mixed', rng);
    assert.ok([3, 4, 7].includes(q.semitones));
    const second = intervalSecondMidi(q);
    assert.ok(Math.min(q.rootMidi, second) >= 40 && Math.max(q.rootMidi, second) <= 84);
    assert.equal(Math.abs(second - q.rootMidi), q.semitones);
  }
  assert.equal(makeIntervalQuestion([], 'up', () => 0).semitones, 7);
});

test('blind fret: any fret with the same pitch class is correct', () => {
  for (let i = 0; i < 100; i++) {
    const q = makeBlindFretQuestion(12);
    assert.ok(q.fret >= 0 && q.fret <= 12);
    assert.ok(isBlindFretCorrect(q, q.fret));
    assert.ok(isBlindFretCorrect(q, q.fret === 0 ? 12 : q.fret === 12 ? 0 : q.fret));
    assert.ok(!isBlindFretCorrect(q, (q.fret + 1) % 12));
  }
  const note: NoteName = 'E';
  assert.equal(getFretNote(1, 0).note, note);
});

test('transposer reads lower-case roots and keeps every slash bass', () => {
  assert.equal(transposeChordSymbol('am', 2), 'Bm');
  assert.equal(transposeChordSymbol('bb7', 2), 'C7');
  assert.equal(transposeChordSymbol('f#m7b5', 1), 'Gm7b5');
  assert.equal(transposeChordSymbol('C/G/B', 2), 'D/A/C#');
  assert.equal(transposeChordSymbol('Cmaj7#11', 2), 'Dmaj7#11');
  assert.equal(transposeChordSymbol('C6/9', 2), 'D6/9');
  assert.equal(transposeChordSymbol('Dsus4', 2), 'Esus4');
  assert.equal(transposeChordSymbol('E♭', 2), 'F');
});

test('transposeProgressionDetailed reports tokens it cannot read', () => {
  const r = transposeProgressionDetailed('C Am xyz N.C. | H7 G/Q', 2);
  assert.deepEqual(r.unparsed, ['xyz', 'H7', 'G/Q']);
  assert.deepEqual(
    r.tokens.map(t => t.output),
    ['D', 'Bm', 'xyz', 'N.C.', 'H7', 'G/Q']
  );
  assert.equal(transposeProgressionDetailed('', 3).tokens.length, 0);
  // the plain variant keeps its old behaviour
  assert.deepEqual(transposeProgression('C xyz', 2), ['D', 'xyz']);
});

test('borrowed chords follow the key spelling for i / iv / v and use flats only for flat degrees', () => {
  const fs = Object.fromEntries(borrowedChords('F#').map(x => [x.numeral, x.display]));
  assert.equal(fs['i'], 'F#m');
  assert.equal(fs['iv'], 'Bm');
  assert.equal(fs['v'], 'C#m');
  assert.equal(fs['♭III'], 'A');
  assert.equal(fs['♭VI'], 'D');
  assert.equal(fs['♭VII'], 'E');
  const f = Object.fromEntries(borrowedChords('F').map(x => [x.numeral, x.display]));
  assert.equal(f['i'], 'Fm');
  assert.equal(f['♭III'], 'Ab');
  assert.equal(f['♭VII'], 'Eb');
  const g = Object.fromEntries(borrowedChords('G').map(x => [x.numeral, x.display]));
  assert.equal(g['i'], 'Gm');
  assert.equal(g['♭III'], 'Bb');
  assert.equal(g['♭VI'], 'Eb');
  // the roots stay the sharp-named NoteName values the synth uses
  assert.ok(borrowedChords('C').every(x => NOTE_NAMES.includes(x.root)));
});

test('sequenceOffsets: Bhimpalasi starts on the lower-octave ni and is monotonic both ways', () => {
  const r = INDIAN_RAAGAS.find(x => x.id === 'raag-bhimpalasi')!;
  assert.deepEqual(sequenceOffsets(r.arohana, 'asc'), [-2, 0, 3, 5, 7, 10, 12]);
  assert.deepEqual(sequenceOffsets(r.avarohana, 'desc'), [12, 10, 9, 7, 5, 3, 2, 0]);
});

test('triad spelling: minor and diminished chords follow their parent key', () => {
  assert.equal(triadUsesFlats('G', 'Minor'), true); // G-Bb-D
  assert.equal(triadUsesFlats('A', 'Minor'), false); // A-C-E
  assert.equal(triadUsesFlats('F', 'Major'), true);
  assert.equal(triadUsesFlats('D', 'Minor'), true); // D-F-A, Bb key
  assert.equal(triadUsesFlats('C', 'Augmented'), false);
});

test('TAALS match the classical structures', () => {
  const by = Object.fromEntries(TAALS.map(t => [t.id, t]));
  assert.deepEqual(by.keherwa.grouping, [4, 4]);
  assert.deepEqual(by.dadra.grouping, [3, 3]);
  assert.deepEqual(by.rupak.grouping, [3, 2, 2]);
  assert.deepEqual(by.jhaptal.grouping, [2, 3, 2, 3]);
  assert.deepEqual(by.teental.grouping, [4, 4, 4, 4]);
  assert.deepEqual(by.jhaptal.khali, [6]);
  assert.deepEqual(by.teental.khali, [9]);
});
