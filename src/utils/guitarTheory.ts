/**
 * Pure Music Theory and Guitar Fretboard Mechanics
 * Based on Intuitive Guitar Theory principles.
 */

import {
  NOTE_NAMES,
  NoteName,
  ENHARMONIC_MAP,
  MAJOR_SCALE_STEPS,
  GUITAR_STRINGS,
  CHORD_DATABASE,
  INDIAN_SWARAS,
  INDIAN_THAATS,
  INDIAN_RAAGAS,
  QUIZ_RANKS,
  type GuitarStringDef,
  type ChordVoicing,
  type IndianSwara,
  type IndianThaat,
  type IndianRaaga,
  type QuizRank,
  type QuizPromptMode,
} from '../constants';

export {
  NOTE_NAMES,
  type NoteName,
  ENHARMONIC_MAP,
  MAJOR_SCALE_STEPS,
  GUITAR_STRINGS,
  CHORD_DATABASE,
  INDIAN_SWARAS,
  INDIAN_THAATS,
  INDIAN_RAAGAS,
  type GuitarStringDef,
  type ChordVoicing,
  type IndianSwara,
  type IndianThaat,
  type IndianRaaga,
 };

export function normalizeNote(note: string): NoteName {
  const clean = note.trim();
  if (ENHARMONIC_MAP[clean]) return ENHARMONIC_MAP[clean];
  const idx = NOTE_NAMES.indexOf(clean as NoteName);
  if (idx !== -1) return clean as NoteName;
  const stripped = clean.replace(/[0-9]/g, '');
  if (ENHARMONIC_MAP[stripped]) return ENHARMONIC_MAP[stripped];
  return (NOTE_NAMES.find(n => n.toLowerCase() === stripped.toLowerCase()) || 'C') as NoteName;
}

export function getNoteIndex(note: string): number {
  const norm = normalizeNote(note);
  return NOTE_NAMES.indexOf(norm);
}

export function shiftSemitones(note: string, semitones: number): NoteName {
  const idx = getNoteIndex(note);
  const nextIdx = (idx + semitones + 1200) % 12;
  return NOTE_NAMES[nextIdx];
}

export function getSemitoneDistance(fromNote: string, toNote: string): number {
  const idx1 = getNoteIndex(fromNote);
  const idx2 = getNoteIndex(toNote);
  return (idx2 - idx1 + 12) % 12;
}

export interface ScaleDerivationStep {
  stepIndex: number;
  fromNote: NoteName;
  toNote: NoteName;
  semitones: number;
  stepName: 'Whole' | 'Half';
}

export function deriveMajorScale(rootNote: string): {
  root: NoteName;
  notes: NoteName[];
  steps: ScaleDerivationStep[];
  relativeMinor: NoteName;
} {
  const root = normalizeNote(rootNote);
  const notes: NoteName[] = [root];
  const steps: ScaleDerivationStep[] = [];

  let current = root;
  for (let i = 0; i < MAJOR_SCALE_STEPS.length; i++) {
    const semitones = MAJOR_SCALE_STEPS[i];
    const nextNote = shiftSemitones(current, semitones);
    steps.push({
      stepIndex: i + 1,
      fromNote: current,
      toNote: nextNote,
      semitones,
      stepName: semitones === 2 ? 'Whole' : 'Half',
    });
    if (i < MAJOR_SCALE_STEPS.length - 1) {
      notes.push(nextNote);
    }
    current = nextNote;
  }

  // Relative Minor = Root - 3 frets (3 semitones down)
  const relativeMinor = shiftSemitones(root, -3);

  return { root, notes, steps, relativeMinor };
}

// 2. The Triad Code (+4 / +3)
export interface TriadInfo {
  root: NoteName;
  type: 'Major' | 'Minor' | 'Diminished' | 'Augmented';
  thirdNote: NoteName;
  fifthNote: NoteName;
  notes: [NoteName, NoteName, NoteName];
  firstJump: number; // +4 or +3
  secondJump: number; // +3 or +4
  firstIntervalName: string;
  secondIntervalName: string;
  moodDescription: string;
}

export function deriveTriad(rootNote: string, type: 'Major' | 'Minor' | 'Diminished' | 'Augmented' = 'Major'): TriadInfo {
  const root = normalizeNote(rootNote);
  let firstJump = 4;
  let secondJump = 3;
  let firstIntervalName = 'Major 3rd (+4 frets)';
  let secondIntervalName = 'Minor 3rd (+3 frets)';
  let mood = 'Bright, grounded, and joyous';

  if (type === 'Minor') {
    firstJump = 3;
    secondJump = 4;
    firstIntervalName = 'Minor 3rd (+3 frets)';
    secondIntervalName = 'Major 3rd (+4 frets)';
    mood = 'Dark, thoughtful, and melancholic';
  } else if (type === 'Diminished') {
    firstJump = 3;
    secondJump = 3;
    firstIntervalName = 'Minor 3rd (+3 frets)';
    secondIntervalName = 'Minor 3rd (+3 frets)';
    mood = 'Tense, unresolved, suspended';
  } else if (type === 'Augmented') {
    firstJump = 4;
    secondJump = 4;
    firstIntervalName = 'Major 3rd (+4 frets)';
    secondIntervalName = 'Major 3rd (+4 frets)';
    mood = 'Dreamy, ethereal, space-like';
  }

  const thirdNote = shiftSemitones(root, firstJump);
  const fifthNote = shiftSemitones(thirdNote, secondJump);

  return {
    root,
    type,
    thirdNote,
    fifthNote,
    notes: [root, thirdNote, fifthNote],
    firstJump,
    secondJump,
    firstIntervalName,
    secondIntervalName,
    moodDescription: mood,
  };
}

// 3. Diatonic Harmony ("Skip one, take one")
export interface DiatonicChord {
  degreeNumeral: string;
  degreeNumber: number;
  rootNote: NoteName;
  chordType: 'Major' | 'Minor' | 'Diminished';
  notes: [NoteName, NoteName, NoteName];
  firstJump: number;
  secondJump: number;
  formula: string; // "+4, +3" or "+3, +4"
  function: string;
}

export function deriveDiatonicHarmony(scaleRoot: string): DiatonicChord[] {
  const scale = deriveMajorScale(scaleRoot);
  const notes = scale.notes;
  const numerals = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
  const functions = [
    'Tonic (Home / Root foundation)',
    'Supertonic (Predominant tension)',
    'Mediant (Warm transition)',
    'Subdominant (Lifting departure)',
    'Dominant (Powerful resolution pull)',
    'Submediant (Relative Minor center)',
    'Leading Tone (Unstable tension yearning to resolve up)',
  ];

  const chords: DiatonicChord[] = [];

  for (let i = 0; i < 7; i++) {
    const root = notes[i];
    const third = notes[(i + 2) % 7];
    const fifth = notes[(i + 4) % 7];

    const d1 = getSemitoneDistance(root, third);
    const d2 = getSemitoneDistance(third, fifth);

    let chordType: 'Major' | 'Minor' | 'Diminished' = 'Major';
    if (d1 === 4 && d2 === 3) chordType = 'Major';
    else if (d1 === 3 && d2 === 4) chordType = 'Minor';
    else if (d1 === 3 && d2 === 3) chordType = 'Diminished';

    chords.push({
      degreeNumeral: numerals[i],
      degreeNumber: i + 1,
      rootNote: root,
      chordType,
      notes: [root, third, fifth],
      firstJump: d1,
      secondJump: d2,
      formula: `+${d1}, +${d2}`,
      function: functions[i],
    });
  }

  return chords;
}

// 4. Standard Tuning & The 5th Fret Rule (Constants imported from constants.tsx)

// Fretboard note matrix calculation
export function getFretNote(stringNumber: number, fret: number): {
  note: NoteName;
  octave: number;
  frequency: number;
} {
  const strDef = GUITAR_STRINGS.find(s => s.stringNumber === stringNumber) || GUITAR_STRINGS[0];
  const noteIdx = getNoteIndex(strDef.openNote);
  const totalSemitones = (strDef.openOctave * 12) + noteIdx + fret;
  const currentNote = NOTE_NAMES[totalSemitones % 12];
  const currentOctave = Math.floor(totalSemitones / 12);
  // Frequency = f0 * 2^(semitones / 12)
  const frequency = strDef.openFrequencyHz * Math.pow(2, fret / 12);

  return {
    note: currentNote,
    octave: currentOctave,
    frequency,
  };
}

// 5. Chord Voicings & Barre Chords (Imported from constants.tsx)

// Helper to calculate movable barre chord dynamically for any root and shape
export function calculateBarreChord(
  root: NoteName,
  shape: 'E-Major' | 'E-Minor' | 'A-Major' | 'A-Minor'
): ChordVoicing {
  if (shape === 'E-Major' || shape === 'E-Minor') {
    // Root is on 6th string (Low E)
    // E is fret 0, F is fret 1, F# 2, G 3, etc.
    const fretOffset = getSemitoneDistance('E', root);
    const isMinor = shape === 'E-Minor';
    const triad = deriveTriad(root, isMinor ? 'Minor' : 'Major');

    const frets: (number | -1)[] = isMinor
      ? [fretOffset, fretOffset + 2, fretOffset + 2, fretOffset, fretOffset, fretOffset]
      : [fretOffset, fretOffset + 2, fretOffset + 2, fretOffset + 1, fretOffset, fretOffset];

    const fingers: (number | 0)[] = isMinor
      ? [1, 3, 4, 1, 1, 1]
      : [1, 3, 4, 2, 1, 1];

    return {
      id: `barre-e-${root}-${isMinor ? 'min' : 'maj'}`,
      name: `${root} ${isMinor ? 'Minor' : 'Major'}`,
      root,
      type: isMinor ? 'Minor' : 'Major',
      family: 'Barre E-Shape',
      difficulty: 'Intermediate',
      frets,
      fingers,
      barreFret: fretOffset,
      barreStrings: [6, 1],
      description: `Sliding the open ${isMinor ? 'Em' : 'E'} shape up to fret ${fretOffset} (${root} on 6th string). Index finger acts as the movable nut!`,
      category: 'barre-e',
      triadNotes: triad.notes,
      bassNote: root,
    };
  } else {
    // Root is on 5th string (A string)
    // A is fret 0, Bb is fret 1, B is fret 2, C is fret 3, etc.
    const fretOffset = getSemitoneDistance('A', root);
    const isMinor = shape === 'A-Minor';
    const triad = deriveTriad(root, isMinor ? 'Minor' : 'Major');

    const frets: (number | -1)[] = isMinor
      ? [-1, fretOffset, fretOffset + 2, fretOffset + 2, fretOffset + 1, fretOffset]
      : [-1, fretOffset, fretOffset + 2, fretOffset + 2, fretOffset + 2, fretOffset];

    const fingers: (number | 0)[] = isMinor
      ? [0, 1, 3, 4, 2, 1]
      : [0, 1, 2, 3, 4, 1];

    return {
      id: `barre-a-${root}-${isMinor ? 'min' : 'maj'}`,
      name: `${root} ${isMinor ? 'Minor' : 'Major'}`,
      root,
      type: isMinor ? 'Minor' : 'Major',
      family: 'Barre A-Shape',
      difficulty: 'Intermediate',
      frets,
      fingers,
      barreFret: fretOffset,
      barreStrings: [5, 1],
      description: `Sliding the open ${isMinor ? 'Am' : 'A'} shape up to fret ${fretOffset} (${root} on 5th string).`,
      category: 'barre-a',
      triadNotes: triad.notes,
      bassNote: root,
      lowEMutedReason: 'Low E is muted so the 5th string note provides the root harmonic bass.',
    };
  }
}

// ==========================================
// 6. Indian Classical Swara (Sargam) System
// ==========================================

// 6. Indian Classical Swara (Sargam) System (Constants imported from constants.tsx)

export function getSwaraForNote(note: string, rootSa: string = 'C'): IndianSwara {
  const distance = getSemitoneDistance(rootSa, note);
  return INDIAN_SWARAS[distance];
}

export function formatNoteDisplay(note: string, rootSa: string = 'C', notationMode: 'western' | 'indian'): string {
  if (notationMode === 'indian') {
    const swara = getSwaraForNote(note, rootSa);
    return `${swara.shortName} (${note})`;
  }
  return note;
}

// ==========================================
// 7. Interactive Fretboard Quiz Engine
// ==========================================

export interface FretTargetPosition {
  stringNumber: number;
  fret: number;
}

export interface QuizQuestion {
  id: string;
  targetNote: NoteName;
  targetString?: number; // 1 to 6
  targetStringName?: string;
  promptText: string;
  subPromptText: string;
  validPositions: FretTargetPosition[];
}

/**
 * Returns all fret positions (0 to maxFret) where a target note occurs across guitar strings
 */
export function getFretCoordinatesForNote(
  note: NoteName,
  maxFret: number = 12,
  filterString?: number
): FretTargetPosition[] {
  const normTarget = normalizeNote(note);
  const results: FretTargetPosition[] = [];

  const stringsToSearch = filterString
    ? GUITAR_STRINGS.filter(s => s.stringNumber === filterString)
    : GUITAR_STRINGS;

  stringsToSearch.forEach(str => {
    for (let fret = 0; fret <= maxFret; fret++) {
      const noteAtFret = getFretNote(str.stringNumber, fret);
      if (noteAtFret.note === normTarget) {
        results.push({ stringNumber: str.stringNumber, fret });
      }
    }
  });

  return results;
}

/**
 * Generates an intuitive, gamified quiz question
 */
export function generateQuizQuestion(
  mode: QuizPromptMode = 'single-string',
  previousNote?: NoteName,
  maxFret: number = 12
): QuizQuestion {
  const naturalNotes: NoteName[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const pool = mode === 'root-notes-only' ? naturalNotes : NOTE_NAMES;

  // Filter previous note so user doesn't get the same prompt twice in a row
  const candidates = pool.filter(n => n !== previousNote);
  const targetNote = candidates[Math.floor(Math.random() * candidates.length)];

  if (mode === 'any-string') {
    const validPositions = getFretCoordinatesForNote(targetNote, maxFret);
    return {
      id: `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      targetNote,
      promptText: `Find NOTE "${targetNote}" anywhere on the neck!`,
      subPromptText: `Frets 0 to ${maxFret} • Click any valid position`,
      validPositions,
    };
  }

  // Single-string or root-notes-only
  // Pick a random string that actually contains this note within maxFret
  const allPositions = getFretCoordinatesForNote(targetNote, maxFret);
  const pickedPosition = allPositions[Math.floor(Math.random() * allPositions.length)] || {
    stringNumber: 6,
    fret: 0,
  };

  const stringDef = GUITAR_STRINGS.find(s => s.stringNumber === pickedPosition.stringNumber);
  const stringName = stringDef ? `${stringDef.name} (Str ${pickedPosition.stringNumber})` : `String ${pickedPosition.stringNumber}`;

  // If the note occurs at fret 0 AND fret 12, both are valid!
  const validPositions = allPositions.filter(p => p.stringNumber === pickedPosition.stringNumber);

  return {
    id: `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    targetNote,
    targetString: pickedPosition.stringNumber,
    targetStringName: stringName,
    promptText: `Find NOTE "${targetNote}" on ${stringName}`,
    subPromptText: `Look between fret 0 (Nut) and fret ${maxFret}`,
    validPositions,
  };
}

/**
 * Calculates score earned for an answer based on reaction time and streak
 */
export function calculateQuizScore(
  isCorrect: boolean,
  reactionTimeMs: number,
  currentStreak: number
): { points: number; bonus: number; multiplier: number } {
  if (!isCorrect) {
    return { points: 0, bonus: 0, multiplier: 1.0 };
  }

  const basePoints = 100;
  let bonus = 20;

  if (reactionTimeMs < 1000) {
    bonus = 150;
  } else if (reactionTimeMs < 1800) {
    bonus = 100;
  } else if (reactionTimeMs < 3000) {
    bonus = 50;
  }

  let multiplier = 1.0;
  if (currentStreak >= 10) {
    multiplier = 2.0;
  } else if (currentStreak >= 6) {
    multiplier = 1.5;
  } else if (currentStreak >= 3) {
    multiplier = 1.25;
  }

  const points = Math.round((basePoints + bonus) * multiplier);
  return { points, bonus, multiplier };
}

/**
 * Calculates performance rank based on total score, accuracy, and reaction speed
 */
export function calculateQuizRank(score: number, accuracy: number, avgReactionMs: number): QuizRank {
  for (const rank of QUIZ_RANKS) {
    if (score >= rank.minScore && accuracy >= rank.minAccuracy && avgReactionMs <= rank.maxAvgReactionMs) {
      return rank;
    }
  }
  return QUIZ_RANKS[QUIZ_RANKS.length - 1];
}

