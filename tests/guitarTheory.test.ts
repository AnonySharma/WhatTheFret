import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveMajorScale,
  deriveTriad,
  deriveDiatonicHarmony,
  GUITAR_STRINGS,
  getFretNote,
  calculateBarreChord,
  shiftSemitones,
} from '../src/utils/guitarTheory';

test('1. Ear Tuning: 5th fret rule holds for standard strings and 4th fret holds for G string', () => {
  // String 6 (Low E) 5th fret must be 'A'
  const e5th = getFretNote(6, 5);
  assert.equal(e5th.note, 'A');

  // String 5 (A) 5th fret must be 'D'
  const a5th = getFretNote(5, 5);
  assert.equal(a5th.note, 'D');

  // String 4 (D) 5th fret must be 'G'
  const d5th = getFretNote(4, 5);
  assert.equal(d5th.note, 'G');

  // String 3 (G) 4th fret must be 'B' (The One Exception!)
  const g4th = getFretNote(3, 4);
  assert.equal(g4th.note, 'B');

  // String 2 (B) 5th fret must be 'E'
  const b5th = getFretNote(2, 5);
  assert.equal(b5th.note, 'E');

  // Check GUITAR_STRINGS array exception flag
  const gStringDef = GUITAR_STRINGS.find(s => s.name === 'G');
  assert.equal(gStringDef?.tuningRuleFret, 4);
});

test('2. Deriving Major Scale & Relative Minor (Root - 3 Frets)', () => {
  // C Major: C D E F G A B
  const cMajor = deriveMajorScale('C');
  assert.deepEqual(cMajor.notes, ['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  // Relative minor of C Major is A (Root - 3 semitones)
  assert.equal(cMajor.relativeMinor, 'A');

  // E Major: E, F#, G#, A, B, C#, D#
  const eMajor = deriveMajorScale('E');
  assert.deepEqual(eMajor.notes, ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#']);
  // Relative minor of E is C#
  assert.equal(eMajor.relativeMinor, 'C#');
});

test('3. The +4 / +3 Triad Code', () => {
  // C Major triad: C (+4) -> E (+3) -> G
  const cMajTriad = deriveTriad('C', 'Major');
  assert.deepEqual(cMajTriad.notes, ['C', 'E', 'G']);
  assert.equal(cMajTriad.firstJump, 4);
  assert.equal(cMajTriad.secondJump, 3);

  // A Minor triad: A (+3) -> C (+4) -> E
  const aMinTriad = deriveTriad('A', 'Minor');
  assert.deepEqual(aMinTriad.notes, ['A', 'C', 'E']);
  assert.equal(aMinTriad.firstJump, 3);
  assert.equal(aMinTriad.secondJump, 4);

  // G Minor triad (from PDF page 7): G (+3) -> A# (Bb) (+4) -> D
  const gMinTriad = deriveTriad('G', 'Minor');
  assert.deepEqual(gMinTriad.notes, ['G', 'A#', 'D']);
});

test('4. Deriving Diatonic Harmony Intuitively (Skip one, take one)', () => {
  const cDiatonic = deriveDiatonicHarmony('C');
  assert.equal(cDiatonic.length, 7);

  // I = C Major
  assert.equal(cDiatonic[0].degreeNumeral, 'I');
  assert.equal(cDiatonic[0].chordType, 'Major');
  assert.deepEqual(cDiatonic[0].notes, ['C', 'E', 'G']);

  // ii = D Minor (tested explicitly on PDF page 4!)
  assert.equal(cDiatonic[1].degreeNumeral, 'ii');
  assert.equal(cDiatonic[1].chordType, 'Minor');
  assert.deepEqual(cDiatonic[1].notes, ['D', 'F', 'A']);
  assert.equal(cDiatonic[1].firstJump, 3);
  assert.equal(cDiatonic[1].secondJump, 4);

  // IV = F Major, V = G Major, vi = A Minor, vii° = B Diminished
  assert.equal(cDiatonic[3].chordType, 'Major');
  assert.equal(cDiatonic[4].chordType, 'Major');
  assert.equal(cDiatonic[5].chordType, 'Minor');
  assert.equal(cDiatonic[6].chordType, 'Diminished');
});

test('5. Barre Chords: Sliding the Nut and geometric mapping', () => {
  // F Major (E-shape shifted up 1 fret)
  const fBarre = calculateBarreChord('F', 'E-Major');
  assert.equal(fBarre.barreFret, 1);
  assert.deepEqual(fBarre.frets, [1, 3, 3, 2, 1, 1]);

  // G Minor (E-Minor shape shifted up 3 frets, Page 7 of PDF)
  const gMinBarre = calculateBarreChord('G', 'E-Minor');
  assert.equal(gMinBarre.barreFret, 3);
  assert.deepEqual(gMinBarre.frets, [3, 5, 5, 3, 3, 3]);
  assert.deepEqual(gMinBarre.triadNotes, ['G', 'A#', 'D']);
});

test('6. Pitch detection frequencyToNote maps guitar standard strings accurately', async () => {
  const { frequencyToNote } = await import('../src/utils/pitchDetector');
  
  const lowE = frequencyToNote(82.41);
  assert.equal(lowE.note, 'E');
  assert.equal(lowE.octave, 2);

  const aStr = frequencyToNote(110.0);
  assert.equal(aStr.note, 'A');
  assert.equal(aStr.octave, 2);

  const highE = frequencyToNote(329.63);
  assert.equal(highE.note, 'E');
  assert.equal(highE.octave, 4);

  const a440 = frequencyToNote(440.0);
  assert.equal(a440.note, 'A');
  assert.equal(a440.octave, 4);
  assert.equal(a440.cents, 0);
});

test('7. Indian Swaras (Sargam): Achala, Komal (Less) and Teevra (Extra)', async () => {
  const { getSwaraForNote, INDIAN_SWARAS } = await import('../src/utils/guitarTheory');

  // Key of C (Sa = C)
  const sa = getSwaraForNote('C', 'C');
  assert.equal(sa.shortName, 'Sa');
  assert.equal(sa.type, 'Achala');

  // Komal Re (C# / Db) = Less / Lower
  const komalRe = getSwaraForNote('C#', 'C');
  assert.equal(komalRe.shortName, 're');
  assert.equal(komalRe.type, 'Komal');

  // Shuddha Ga (E) = Major 3rd
  const shuddhaGa = getSwaraForNote('E', 'C');
  assert.equal(shuddhaGa.shortName, 'Ga');
  assert.equal(shuddhaGa.type, 'Shuddha');

  // Komal Ga (D# / Eb) = Minor 3rd (Less)
  const komalGa = getSwaraForNote('D#', 'C');
  assert.equal(komalGa.shortName, 'ga');
  assert.equal(komalGa.type, 'Komal');

  // Teevra Ma (F#) = Extra / Higher
  const teevraMa = getSwaraForNote('F#', 'C');
  assert.equal(teevraMa.shortName, 'Ma');
  assert.equal(teevraMa.type, 'Teevra');

  // Pa (G) = Achala (Fixed 5th)
  const pa = getSwaraForNote('G', 'C');
  assert.equal(pa.shortName, 'Pa');
  assert.equal(pa.type, 'Achala');
});

test('8. Progress tracking statistics calculation', async () => {
  const { calculateProgressStats } = await import('../src/utils/progressStore');

  const empty = calculateProgressStats([]);
  assert.equal(empty.percentage, 0);

  const partial = calculateProgressStats([0, 1, 2]); // 3 of 7
  assert.equal(partial.count, 3);
  assert.equal(partial.percentage, 43);
  assert.equal(partial.levelTitle, 'Triad & Scale Decoder');

  const all = calculateProgressStats([0, 1, 2, 3, 4, 5, 6]);
  assert.equal(all.percentage, 100);
  assert.equal(all.levelTitle, 'Certified Guitar Maestro');
});

test('9. Central constants: CHORD_DATABASE integrity check', async () => {
  const { CHORD_DATABASE } = await import('../src/constants');

  assert.ok(CHORD_DATABASE.length >= 40, `Expected at least 40 chords, found ${CHORD_DATABASE.length}`);

  CHORD_DATABASE.forEach(chord => {
    assert.ok(chord.id, 'Chord must have id');
    assert.ok(chord.name, 'Chord must have name');
    assert.equal(chord.frets.length, 6, `${chord.name} must have 6 string fret values`);
    assert.ok(chord.triadNotes.length >= 3, `${chord.name} must specify at least 3 triad/extended notes`);
    assert.ok(chord.bassNote, `${chord.name} must specify bass note`);
  });
});

test('10. Central constants: INDIAN_RAAGAS and THAATS integrity check', async () => {
  const { INDIAN_RAAGAS, INDIAN_THAATS } = await import('../src/constants');

  assert.ok(INDIAN_RAAGAS.length >= 10, `Expected at least 10 raagas, found ${INDIAN_RAAGAS.length}`);
  assert.ok(INDIAN_THAATS.length >= 10, `Expected 10 parent thaats, found ${INDIAN_THAATS.length}`);

  // Yaman has Teevra Ma (#4)
  const yaman = INDIAN_RAAGAS.find(r => r.name.includes('Yaman'))!;
  assert.ok(yaman, 'Raag Yaman must be present');
  assert.ok(yaman.arohana.includes('Ma'), 'Raag Yaman must contain Teevra Ma');

  // Bhairav has Komal re and Komal dha
  const bhairav = INDIAN_RAAGAS.find(r => r.name.includes('Bhairav'))!;
  assert.ok(bhairav, 'Raag Bhairav must be present');
  assert.ok(bhairav.arohana.includes('re'), 'Raag Bhairav must contain Komal re');
  assert.ok(bhairav.arohana.includes('dha'), 'Raag Bhairav must contain Komal dha');
});

test('11. Interactive Fretboard Quiz: Question Generation and Valid Coordinates', async () => {
  const {
    generateQuizQuestion,
    getFretCoordinatesForNote,
  } = await import('../src/utils/guitarTheory');

  // Any C note within frets 0-12
  const cPositions = getFretCoordinatesForNote('C', 12);
  assert.ok(cPositions.length >= 5, `C should appear on multiple strings in frets 0-12, found ${cPositions.length}`);
  // Check String 5 (A string) 3rd fret is C
  const onStr5 = cPositions.find(p => p.stringNumber === 5 && p.fret === 3);
  assert.ok(onStr5, 'String 5 fret 3 must be note C');

  // Generate question for single-string mode
  const qSingle = generateQuizQuestion('single-string', undefined, 12);
  assert.ok(qSingle.id);
  assert.ok(qSingle.targetNote);
  assert.ok(qSingle.targetString && qSingle.targetString >= 1 && qSingle.targetString <= 6);
  assert.ok(qSingle.validPositions.length >= 1);

  // Generate question for natural notes mode
  const qNatural = generateQuizQuestion('root-notes-only', undefined, 12);
  assert.ok(['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(qNatural.targetNote));
});

test('12. Interactive Fretboard Quiz: Scoring Formula, Speed Bonuses & Streaks', async () => {
  const { calculateQuizScore } = await import('../src/utils/guitarTheory');

  // Incorrect answer yields 0 points
  const incorrect = calculateQuizScore(false, 800, 5);
  assert.equal(incorrect.points, 0);

  // Super fast response (< 1000ms) with high streak (10+)
  const fastStreak = calculateQuizScore(true, 750, 10);
  // Base 100 + bonus 150 = 250 * 2.0x = 500
  assert.equal(fastStreak.bonus, 150);
  assert.equal(fastStreak.multiplier, 2.0);
  assert.equal(fastStreak.points, 500);

  // Moderate response (1500ms) with medium streak (4)
  const moderate = calculateQuizScore(true, 1500, 4);
  // Base 100 + bonus 100 = 200 * 1.25x = 250
  assert.equal(moderate.bonus, 100);
  assert.equal(moderate.multiplier, 1.25);
  assert.equal(moderate.points, 250);
});

test('13. Interactive Fretboard Quiz: Performance Ranking Thresholds', async () => {
  const { calculateQuizRank } = await import('../src/utils/guitarTheory');

  // Virtuoso criteria: score >= 1800, acc >= 90%, speed <= 1600ms
  const rankVirtuoso = calculateQuizRank(2200, 95, 1200);
  assert.equal(rankVirtuoso.title, 'Fretboard Virtuoso');

  // Maestro criteria: score >= 1200, acc >= 80%, speed <= 2500ms
  const rankMaestro = calculateQuizRank(1300, 85, 2100);
  assert.equal(rankMaestro.title, 'Fretboard Maestro');

  // Apprentice fallback
  const rankApprentice = calculateQuizRank(200, 50, 4500);
  assert.equal(rankApprentice.title, 'Fretboard Apprentice');
});

test('14. Metronome: Time Signatures, Tempo Markings and Tap Tempo Calculator', async () => {
  const { getTempoMarking, TapTempoCalculator } = await import('../src/utils/metronome');
  const { METRONOME_TIME_SIGNATURES } = await import('../src/constants');

  // Verify time signatures
  assert.ok(METRONOME_TIME_SIGNATURES.length >= 6);
  const commonTime = METRONOME_TIME_SIGNATURES.find(t => t.label === '4/4');
  assert.ok(commonTime);
  assert.equal(commonTime?.beats, 4);
  assert.deepEqual(commonTime?.accents, [0, 2]);

  // Verify tempo markings
  const largo = getTempoMarking(45);
  assert.equal(largo.italian, 'Largo');

  const allegro = getTempoMarking(130);
  assert.equal(allegro.italian, 'Allegro');

  const presto = getTempoMarking(200);
  assert.equal(presto.italian, 'Presto');

  // Tap tempo calculator
  const tapCalc = new TapTempoCalculator();
  // Simulate 120 BPM taps (every 500ms)
  let result = tapCalc.recordTap();
  assert.equal(result, null); // Needs at least 2 taps

  // Advance performance.now mock by checking reset method
  tapCalc.reset();
  assert.equal(tapCalc.recordTap(), null);
});

test('15. Circle of Fifths: 12 Key Segments, Relative Minors & Sargam Harmonies', async () => {
  const { CIRCLE_OF_FIFTHS_DATA } = await import('../src/constants');
  const { deriveDiatonicHarmony } = await import('../src/utils/guitarTheory');

  // Verify all 12 keys are present
  assert.equal(CIRCLE_OF_FIFTHS_DATA.length, 12, 'Circle of Fifths must have 12 key positions');

  // Top position (0 deg) must be C Major with relative A Minor
  const cSegment = CIRCLE_OF_FIFTHS_DATA[0];
  assert.equal(cSegment.majorKey, 'C');
  assert.equal(cSegment.minorKey, 'A');
  assert.equal(cSegment.accidentalCount, 0);

  // 1 step clockwise (30 deg) must be G Major (1 Sharp F#) with relative E Minor
  const gSegment = CIRCLE_OF_FIFTHS_DATA[1];
  assert.equal(gSegment.majorKey, 'G');
  assert.equal(gSegment.minorKey, 'E');
  assert.equal(gSegment.accidentalCount, 1);
  assert.deepEqual(gSegment.accidentalsList, ['F#']);

  // 1 step counter-clockwise (330 deg / index 11) must be F Major (1 Flat Bb) with relative D Minor
  const fSegment = CIRCLE_OF_FIFTHS_DATA[11];
  assert.equal(fSegment.majorKey, 'F');
  assert.equal(fSegment.minorKey, 'D');
  assert.equal(fSegment.accidentalCount, -1);

  // Check Diatonic chords for G Major derived via guitarTheory
  const gDiatonic = deriveDiatonicHarmony('G');
  assert.equal(gDiatonic.length, 7);
  assert.equal(gDiatonic[0].rootNote, 'G'); // I
  assert.equal(gDiatonic[3].rootNote, 'C'); // IV
  assert.equal(gDiatonic[4].rootNote, 'D'); // V
  assert.equal(gDiatonic[5].rootNote, 'E'); // vi (relative minor)
});
