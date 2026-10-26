/**
 * ============================================================================
 * INTUITIVE GUITAR STUDIO - CENTRAL CONSTANTS REPOSITORY (constants.tsx)
 * ============================================================================
 * All application constants, chord databases, Indian raagas, tunings, and
 * theoretical mappings are organized and exported from this single file.
 */

import { generateMovableChords } from './utils/chordShapes';

// ============================================================================
// SECTION 1: NOTE NAMES & CHROMATIC SCALE
// ============================================================================

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type NoteName = typeof NOTE_NAMES[number];

export const POPULAR_ROOTS: NoteName[] = ['C', 'G', 'D', 'A', 'E', 'F', 'B'];

export const ENHARMONIC_MAP: Record<string, NoteName> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
  'B#': 'C',
  'Cb': 'B',
  'E#': 'F',
  'Fb': 'E',
};

// ============================================================================
// SECTION 2: SCALE FORMULAS & STEPS
// ============================================================================

export const MAJOR_SCALE_STEPS = [2, 2, 1, 2, 2, 2, 1] as const;

export const NATURAL_MINOR_STEPS = [2, 1, 2, 2, 1, 2, 2] as const;

export const PENTATONIC_MAJOR_STEPS = [2, 2, 3, 2, 3] as const;

export const PENTATONIC_MINOR_STEPS = [3, 2, 2, 3, 2] as const;

export const BLUES_SCALE_STEPS = [3, 2, 1, 1, 3, 2] as const;

// ============================================================================
// SECTION 3: GUITAR ANATOMY & STANDARD TUNING
// ============================================================================

export interface GuitarStringDef {
  stringNumber: number; // 1 to 6 (1 = high E, 6 = low E)
  name: string;
  openNote: NoteName;
  openOctave: number;
  openFrequencyHz: number;
  tuningRuleFret: number | null;
  tuningMatchesNextStringNumber: number | null;
  ruleExplanation: string;
}

export const GUITAR_STRINGS: GuitarStringDef[] = [
  {
    stringNumber: 6,
    name: 'Low E',
    openNote: 'E',
    openOctave: 2,
    openFrequencyHz: 82.41,
    tuningRuleFret: 5,
    tuningMatchesNextStringNumber: 5,
    ruleExplanation: 'Walking up 5 frets (Perfect 4th) reaches note A, identical in pitch to the open A string directly below.',
  },
  {
    stringNumber: 5,
    name: 'A',
    openNote: 'A',
    openOctave: 2,
    openFrequencyHz: 110.00,
    tuningRuleFret: 5,
    tuningMatchesNextStringNumber: 4,
    ruleExplanation: '5th fret of the A string gives D, matching the open D string below it.',
  },
  {
    stringNumber: 4,
    name: 'D',
    openNote: 'D',
    openOctave: 3,
    openFrequencyHz: 146.83,
    tuningRuleFret: 5,
    tuningMatchesNextStringNumber: 3,
    ruleExplanation: '5th fret of the D string gives G, matching the open G string below it.',
  },
  {
    stringNumber: 3,
    name: 'G',
    openNote: 'G',
    openOctave: 3,
    openFrequencyHz: 196.00,
    tuningRuleFret: 4, // The ONE Exception!
    tuningMatchesNextStringNumber: 2,
    ruleExplanation: 'THE EXCEPTION: Tuned a Major 3rd (4 frets) closer so human fingers can reach barre chords comfortably. Press 4th fret of G!',
  },
  {
    stringNumber: 2,
    name: 'B',
    openNote: 'B',
    openOctave: 3,
    openFrequencyHz: 246.94,
    tuningRuleFret: 5,
    tuningMatchesNextStringNumber: 1,
    ruleExplanation: 'Returns to the standard 5-fret Perfect 4th rule. 5th fret of B matches open High E string.',
  },
  {
    stringNumber: 1,
    name: 'High E',
    openNote: 'E',
    openOctave: 4,
    openFrequencyHz: 329.63,
    tuningRuleFret: null,
    tuningMatchesNextStringNumber: null,
    ruleExplanation: 'Highest open string, standard E4.',
  },
];

export const STRING_GAUGES: Record<number, number> = {
  6: 3.5, // Low E (thick wound bronze)
  5: 2.8, // A
  4: 2.2, // D
  3: 1.8, // G
  2: 1.4, // B
  1: 1.1, // High E (thin steel)
};

export const FRET_MARKER_DOTS = [3, 5, 7, 9, 12, 15, 17, 19, 21];

// ============================================================================
// SECTION 4: COMPREHENSIVE CHORD DATABASE (FOR CHORD LIBRARY & VISUALIZER)
// ============================================================================

export interface ChordVoicing {
  id: string;
  name: string;
  root: NoteName;
  type: string; // 'Major', 'Minor', '7th', 'Maj7', 'm7', 'Sus4', 'Sus2', 'Dim', 'Aug', '5'
  family: 'Open' | 'Barre E-Shape' | 'Barre A-Shape' | '7th / Jazz' | 'Suspended' | 'Extended';
  frets: (number | -1)[]; // index 0 = String 6 (Low E) to 5 = String 1 (High E). -1 means muted 'X'
  fingers: (number | 0)[]; // 1=index, 2=middle, 3=ring, 4=pinky, 0=open/mute
  barreFret?: number;
  barreStrings?: [number, number]; // [from string, to string]
  description: string;
  category: 'open' | 'barre-e' | 'barre-a' | 'triad' | 'jazz';
  triadNotes: [NoteName, NoteName, NoteName];
  allNotes?: NoteName[];
  bassNote: NoteName;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  lowEMutedReason?: string;
}

const CURATED_CHORDS: ChordVoicing[] = [
  // --- OPEN CHORDS ---
  {
    id: 'c-major-open',
    name: 'C Major',
    root: 'C',
    type: 'Major',
    family: 'Open',
    frets: [-1, 3, 2, 0, 1, 0],
    fingers: [0, 3, 2, 0, 1, 0],
    description: 'The classic open chord derived from Triad notes C, E, G.',
    category: 'open',
    triadNotes: ['C', 'E', 'G'],
    allNotes: ['C', 'E', 'G'],
    bassNote: 'C',
    difficulty: 'Beginner',
    lowEMutedReason: 'Low E is muted so C (5th string) acts as the bass anchor.',
  },
  {
    id: 'a-major-open',
    name: 'A Major',
    root: 'A',
    type: 'Major',
    family: 'Open',
    frets: [-1, 0, 2, 2, 2, 0],
    fingers: [0, 0, 1, 2, 3, 0],
    description: 'Three fingers clustered on the 2nd fret of strings 4, 3, and 2.',
    category: 'open',
    triadNotes: ['A', 'C#', 'E'],
    allNotes: ['A', 'C#', 'E'],
    bassNote: 'A',
    difficulty: 'Beginner',
  },
  {
    id: 'a-minor-open',
    name: 'A Minor',
    root: 'A',
    type: 'Minor',
    family: 'Open',
    frets: [-1, 0, 2, 2, 1, 0],
    fingers: [0, 0, 2, 3, 1, 0],
    description: 'Relative minor to C Major. Shares the exact same notes with A as root center.',
    category: 'open',
    triadNotes: ['A', 'C', 'E'],
    allNotes: ['A', 'C', 'E'],
    bassNote: 'A',
    difficulty: 'Beginner',
    lowEMutedReason: 'Low E muted so Open A serves as the grounded root bass note.',
  },
  {
    id: 'g-major-open',
    name: 'G Major',
    root: 'G',
    type: 'Major',
    family: 'Open',
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
    description: 'All 6 strings ring out, anchored by G on the 3rd fret of the Low E string.',
    category: 'open',
    triadNotes: ['G', 'B', 'D'],
    allNotes: ['G', 'B', 'D'],
    bassNote: 'G',
    difficulty: 'Beginner',
  },
  {
    id: 'e-major-open',
    name: 'E Major',
    root: 'E',
    type: 'Major',
    family: 'Open',
    frets: [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
    description: 'The foundation for all movable E-shape barre chords! Nut holds fret 0.',
    category: 'open',
    triadNotes: ['E', 'G#', 'B'],
    allNotes: ['E', 'G#', 'B'],
    bassNote: 'E',
    difficulty: 'Beginner',
  },
  {
    id: 'e-minor-open',
    name: 'E Minor',
    root: 'E',
    type: 'Minor',
    family: 'Open',
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
    description: 'Lifting the index finger lowers the 3rd (G# to G) by 1 fret for a melancholic triad.',
    category: 'open',
    triadNotes: ['E', 'G', 'B'],
    allNotes: ['E', 'G', 'B'],
    bassNote: 'E',
    difficulty: 'Beginner',
  },
  {
    id: 'd-major-open',
    name: 'D Major',
    root: 'D',
    type: 'Major',
    family: 'Open',
    frets: [-1, -1, 0, 2, 3, 2],
    fingers: [0, 0, 0, 1, 3, 2],
    description: 'Triad D, F#, A across strings 4 to 1. Open D is root bass.',
    category: 'open',
    triadNotes: ['D', 'F#', 'A'],
    allNotes: ['D', 'F#', 'A'],
    bassNote: 'D',
    difficulty: 'Beginner',
    lowEMutedReason: 'Strings 6 and 5 are muted because Open D string provides pure root bass.',
  },
  {
    id: 'd-minor-open',
    name: 'D Minor',
    root: 'D',
    type: 'Minor',
    family: 'Open',
    frets: [-1, -1, 0, 2, 3, 1],
    fingers: [0, 0, 0, 2, 3, 1],
    description: 'High note lowered from F# (2nd fret) to F (1st fret) gives the sad Minor 3rd.',
    category: 'open',
    triadNotes: ['D', 'F', 'A'],
    allNotes: ['D', 'F', 'A'],
    bassNote: 'D',
    difficulty: 'Beginner',
  },

  // --- 7TH CHORDS ---
  {
    id: 'c7-open',
    name: 'C Dominant 7th (C7)',
    root: 'C',
    type: '7th',
    family: '7th / Jazz',
    frets: [-1, 3, 2, 3, 1, 0],
    fingers: [0, 3, 2, 4, 1, 0],
    description: 'Adding the pinky on the 3rd fret of the G string adds the dominant 7th note (Bb / Komal Ni).',
    category: 'jazz',
    triadNotes: ['C', 'E', 'G'],
    allNotes: ['C', 'E', 'G', 'A#'],
    bassNote: 'C',
    difficulty: 'Intermediate',
  },
  {
    id: 'cmaj7-open',
    name: 'C Major 7th (Cmaj7)',
    root: 'C',
    type: 'Maj7',
    family: '7th / Jazz',
    frets: [-1, 3, 2, 0, 0, 0],
    fingers: [0, 3, 2, 0, 0, 0],
    description: 'Dreamy jazz chord created by lifting index finger to let the open B string ring out.',
    category: 'jazz',
    triadNotes: ['C', 'E', 'G'],
    allNotes: ['C', 'E', 'G', 'B'],
    bassNote: 'C',
    difficulty: 'Beginner',
  },
  {
    id: 'g7-open',
    name: 'G Dominant 7th (G7)',
    root: 'G',
    type: '7th',
    family: '7th / Jazz',
    frets: [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, 0, 0, 0, 1],
    description: 'The dominant V chord in the key of C that creates powerful yearning to resolve back home.',
    category: 'open',
    triadNotes: ['G', 'B', 'D'],
    allNotes: ['G', 'B', 'D', 'F'],
    bassNote: 'G',
    difficulty: 'Beginner',
  },
  {
    id: 'e7-open',
    name: 'E Dominant 7th (E7)',
    root: 'E',
    type: '7th',
    family: '7th / Jazz',
    frets: [0, 2, 0, 1, 0, 0],
    fingers: [0, 2, 0, 1, 0, 0],
    description: 'Blues staple with an open D string singing the dominant 7th.',
    category: 'jazz',
    triadNotes: ['E', 'G#', 'B'],
    allNotes: ['E', 'G#', 'B', 'D'],
    bassNote: 'E',
    difficulty: 'Beginner',
  },
  {
    id: 'am7-open',
    name: 'A Minor 7th (Am7)',
    root: 'A',
    type: 'm7',
    family: '7th / Jazz',
    frets: [-1, 0, 2, 0, 1, 0],
    fingers: [0, 0, 2, 0, 1, 0],
    description: 'Warm, soulful chord created by lifting the ring finger from standard Am.',
    category: 'jazz',
    triadNotes: ['A', 'C', 'E'],
    allNotes: ['A', 'C', 'E', 'G'],
    bassNote: 'A',
    difficulty: 'Beginner',
  },
  {
    id: 'dm7-open',
    name: 'D Minor 7th (Dm7)',
    root: 'D',
    type: 'm7',
    family: '7th / Jazz',
    frets: [-1, -1, 0, 2, 1, 1],
    fingers: [0, 0, 0, 2, 1, 1],
    description: 'Index finger flat across strings 1 and 2 at fret 1.',
    category: 'jazz',
    triadNotes: ['D', 'F', 'A'],
    allNotes: ['D', 'F', 'A', 'C'],
    bassNote: 'D',
    difficulty: 'Intermediate',
  },

  // --- SUSPENDED & EXTENDED CHORDS ---
  {
    id: 'dsus4-open',
    name: 'D Suspended 4th (Dsus4)',
    root: 'D',
    type: 'Sus4',
    family: 'Suspended',
    frets: [-1, -1, 0, 2, 3, 3],
    fingers: [0, 0, 0, 1, 2, 4],
    description: 'The 3rd (F#) is replaced with the 4th (G) on 1st string 3rd fret, creating pleasant suspension.',
    category: 'open',
    triadNotes: ['D', 'G', 'A'],
    allNotes: ['D', 'G', 'A'],
    bassNote: 'D',
    difficulty: 'Beginner',
  },
  {
    id: 'asus2-open',
    name: 'A Suspended 2nd (Asus2)',
    root: 'A',
    type: 'Sus2',
    family: 'Suspended',
    frets: [-1, 0, 2, 2, 0, 0],
    fingers: [0, 0, 1, 2, 0, 0],
    description: 'Lifting index finger brings open B (Major 2nd / Shuddha Re), creating an ethereal chime.',
    category: 'open',
    triadNotes: ['A', 'B', 'E'],
    allNotes: ['A', 'B', 'E'],
    bassNote: 'A',
    difficulty: 'Beginner',
  },
  {
    id: 'cadd9-open',
    name: 'C Add 9 (Cadd9)',
    root: 'C',
    type: 'Add9',
    family: 'Extended',
    frets: [-1, 3, 2, 0, 3, 0],
    fingers: [0, 2, 1, 0, 3, 0],
    description: 'Acoustic pop favorite that transitions seamlessly to and from G Major.',
    category: 'open',
    triadNotes: ['C', 'E', 'G'],
    allNotes: ['C', 'D', 'E', 'G'],
    bassNote: 'C',
    difficulty: 'Beginner',
  },
  {
    id: 'e5-power',
    name: 'E5 Power Chord',
    root: 'E',
    type: '5',
    family: 'Extended',
    frets: [0, 2, 2, -1, -1, -1],
    fingers: [0, 1, 2, 0, 0, 0],
    description: 'Heavy rock cornerstone. Only Root (E) and 5th (B)—no 3rd means neither major nor minor.',
    category: 'triad',
    triadNotes: ['E', 'B', 'E'],
    allNotes: ['E', 'B'],
    bassNote: 'E',
    difficulty: 'Beginner',
  },

  // --- BARRE CHORDS ---
  {
    id: 'f-major-barre',
    name: 'F Major (E-Shape Barre)',
    root: 'F',
    type: 'Major',
    family: 'Barre E-Shape',
    frets: [1, 3, 3, 2, 1, 1],
    barreFret: 1,
    barreStrings: [6, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    description: 'Open E shape slid up 1 fret! Index finger replaces the nut across fret 1.',
    category: 'barre-e',
    triadNotes: ['F', 'A', 'C'],
    allNotes: ['F', 'A', 'C'],
    bassNote: 'F',
    difficulty: 'Intermediate',
  },
  {
    id: 'f-sharp-minor-barre',
    name: 'F# Minor (E-Shape Barre)',
    root: 'F#',
    type: 'Minor',
    family: 'Barre E-Shape',
    frets: [2, 4, 4, 2, 2, 2],
    barreFret: 2,
    barreStrings: [6, 1],
    fingers: [1, 3, 4, 1, 1, 1],
    description: 'Open Em shape shifted to fret 2 with full 6-string barre.',
    category: 'barre-e',
    triadNotes: ['F#', 'A', 'C#'],
    allNotes: ['F#', 'A', 'C#'],
    bassNote: 'F#',
    difficulty: 'Intermediate',
  },
  {
    id: 'g-minor-barre',
    name: 'G Minor (E-Shape Barre)',
    root: 'G',
    type: 'Minor',
    family: 'Barre E-Shape',
    frets: [3, 5, 5, 3, 3, 3],
    barreFret: 3,
    barreStrings: [6, 1],
    fingers: [1, 3, 4, 1, 1, 1],
    description: 'The step-by-step example from PDF Page 7! Open Em shape slid up to 3rd fret anchor.',
    category: 'barre-e',
    triadNotes: ['G', 'A#', 'D'],
    allNotes: ['G', 'A#', 'D'],
    bassNote: 'G',
    difficulty: 'Intermediate',
  },
  {
    id: 'b-minor-barre',
    name: 'B Minor (A-Shape Barre)',
    root: 'B',
    type: 'Minor',
    family: 'Barre A-Shape',
    frets: [-1, 2, 4, 4, 3, 2],
    barreFret: 2,
    barreStrings: [5, 1],
    fingers: [0, 1, 3, 4, 2, 1],
    description: 'Open Am shape slid up 2 frets! Index finger barres across fret 2 from string 5 down.',
    category: 'barre-a',
    triadNotes: ['B', 'D', 'F#'],
    allNotes: ['B', 'D', 'F#'],
    bassNote: 'B',
    difficulty: 'Intermediate',
  },
  {
    id: 'c-sharp-minor-barre',
    name: 'C# Minor (A-Shape Barre)',
    root: 'C#',
    type: 'Minor',
    family: 'Barre A-Shape',
    frets: [-1, 4, 6, 6, 5, 4],
    barreFret: 4,
    barreStrings: [5, 1],
    fingers: [0, 1, 3, 4, 2, 1],
    description: 'Relative minor to E Major. Anchored on the 5th string at fret 4.',
    category: 'barre-a',
    triadNotes: ['C#', 'E', 'G#'],
    allNotes: ['C#', 'E', 'G#'],
    bassNote: 'C#',
    difficulty: 'Intermediate',
  },
  {
    id: 'b-diminished-triad',
    name: 'B Diminished (B°)',
    root: 'B',
    type: 'Dim',
    family: 'Extended',
    frets: [-1, 2, 3, 4, 3, -1],
    fingers: [0, 1, 2, 4, 3, 0],
    description: 'Degree vii° in C Major. Built of two stacked minor thirds (+3, +3). Tense and unresolved.',
    category: 'triad',
    triadNotes: ['B', 'D', 'F'],
    allNotes: ['B', 'D', 'F'],
    bassNote: 'B',
    difficulty: 'Intermediate',
  },

  // --- ADDITIONAL CHORDS TO COMPLETE 40+ CHORD LIBRARY ---
  {
    id: 'b-major-open',
    name: 'B Major (no barre)',
    root: 'B',
    type: 'Major',
    family: 'Open',
    frets: [-1, 2, 1, 4, 0, 2],
    fingers: [0, 2, 1, 4, 0, 3],
    description: 'A barre-free B major: the open B string rings while three fingers cover D#, B and F#. Mute the low E string.',
    category: 'open',
    triadNotes: ['B', 'D#', 'F#'],
    allNotes: ['B', 'D#', 'F#'],
    bassNote: 'B',
    difficulty: 'Intermediate',
    lowEMutedReason: 'Low E is muted so the 5th-string B is the bass note.',
  },
  {
    id: 'b-minor-open',
    name: 'B Minor (no barre)',
    root: 'B',
    type: 'Minor',
    family: 'Open',
    frets: [-1, 2, 0, 4, 3, 2],
    fingers: [0, 1, 0, 4, 3, 2],
    description: 'A barre-free B minor: the open D string supplies the minor 3rd. Mute the low E string.',
    category: 'open',
    triadNotes: ['B', 'D', 'F#'],
    allNotes: ['B', 'D', 'F#'],
    bassNote: 'B',
    difficulty: 'Intermediate',
    lowEMutedReason: 'Low E is muted so the 5th-string B is the bass note.',
  },
  {
    id: 'b7-open',
    name: 'B Dominant 7th (B7)',
    root: 'B',
    type: '7',
    family: '7th / Jazz',
    frets: [-1, 2, 1, 2, 0, 2],
    fingers: [0, 2, 1, 3, 0, 4],
    description: 'Essential acoustic blues & folk chord resolving into E Minor.',
    category: 'open',
    triadNotes: ['B', 'D#', 'F#'],
    allNotes: ['B', 'D#', 'F#', 'A'],
    bassNote: 'B',
    difficulty: 'Intermediate',
  },
  {
    id: 'dsus2-open',
    name: 'D Suspended 2nd (Dsus2)',
    root: 'D',
    type: 'Sus2',
    family: 'Suspended',
    frets: [-1, -1, 0, 2, 3, 0],
    fingers: [0, 0, 0, 1, 3, 0],
    description: 'Lifting finger 2 from High E gives open E (Major 2nd), producing an airy, resonant shimmer.',
    category: 'open',
    triadNotes: ['D', 'E', 'A'],
    allNotes: ['D', 'E', 'A'],
    bassNote: 'D',
    difficulty: 'Beginner',
  },
  {
    id: 'gsus4-open',
    name: 'G Suspended 4th (Gsus4)',
    root: 'G',
    type: 'Sus4',
    family: 'Suspended',
    frets: [3, 2, 0, 0, 1, 3],
    fingers: [3, 2, 0, 0, 1, 4],
    description: 'Replaces the 3rd (B) with Shuddha Ma (C) on 2nd string 1st fret.',
    category: 'open',
    triadNotes: ['G', 'C', 'D'],
    allNotes: ['G', 'C', 'D'],
    bassNote: 'G',
    difficulty: 'Beginner',
  },
  {
    id: 'esus4-open',
    name: 'E Suspended 4th (Esus4)',
    root: 'E',
    type: 'Sus4',
    family: 'Suspended',
    frets: [0, 2, 2, 2, 0, 0],
    fingers: [0, 2, 3, 4, 0, 0],
    description: 'Raises the 3rd (G#) to the 4th (A) on 3rd string 2nd fret.',
    category: 'open',
    triadNotes: ['E', 'A', 'B'],
    allNotes: ['E', 'A', 'B'],
    bassNote: 'E',
    difficulty: 'Beginner',
  },
  {
    id: 'fmaj7-open',
    name: 'F Major 7th (Fmaj7)',
    root: 'F',
    type: 'Maj7',
    family: '7th / Jazz',
    frets: [-1, -1, 3, 2, 1, 0],
    fingers: [0, 0, 3, 2, 1, 0],
    description: 'Dreamy bossa nova and folk voicing. Open High E rings out as Shuddha Ni (Major 7th).',
    category: 'open',
    triadNotes: ['F', 'A', 'C'],
    allNotes: ['F', 'A', 'C', 'E'],
    bassNote: 'F',
    difficulty: 'Beginner',
  },
  {
    id: 'dmaj7-open',
    name: 'D Major 7th (Dmaj7)',
    root: 'D',
    type: 'Maj7',
    family: '7th / Jazz',
    frets: [-1, -1, 0, 2, 2, 2],
    fingers: [0, 0, 0, 1, 2, 3],
    description: 'Strings 3, 2, 1 barred at fret 2 over open D root.',
    category: 'open',
    triadNotes: ['D', 'F#', 'A'],
    allNotes: ['D', 'F#', 'A', 'C#'],
    bassNote: 'D',
    difficulty: 'Beginner',
  },
  {
    id: 'aadd9-open',
    name: 'A Add 9 (Aadd9)',
    root: 'A',
    type: 'Add9',
    family: 'Extended',
    frets: [-1, 0, 2, 4, 2, 0],
    fingers: [0, 0, 1, 3, 1, 0],
    description: 'Warm modern acoustic voicing adding the 9th (B) on the 3rd string.',
    category: 'open',
    triadNotes: ['A', 'C#', 'E'],
    allNotes: ['A', 'B', 'C#', 'E'],
    bassNote: 'A',
    difficulty: 'Intermediate',
  },
  {
    id: 'caug-open',
    name: 'C Augmented (C+)',
    root: 'C',
    type: 'Aug',
    family: 'Extended',
    frets: [-1, 3, 2, 1, 1, 0],
    fingers: [0, 3, 2, 1, 1, 0],
    description: 'Built of two stacked major thirds (+4, +4). Mysterious dreamlike sound.',
    category: 'open',
    triadNotes: ['C', 'E', 'G#'],
    allNotes: ['C', 'E', 'G#'],
    bassNote: 'C',
    difficulty: 'Intermediate',
  },
  {
    id: 'a-major-barre-e',
    name: 'A Major (E-Shape Barre Fret 5)',
    root: 'A',
    type: 'Major',
    family: 'Barre E-Shape',
    frets: [5, 7, 7, 6, 5, 5],
    barreFret: 5,
    barreStrings: [6, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    description: 'Full 6-string barre on fret 5 anchored by A on the Low E string.',
    category: 'barre-e',
    triadNotes: ['A', 'C#', 'E'],
    allNotes: ['A', 'C#', 'E'],
    bassNote: 'A',
    difficulty: 'Intermediate',
  },
  {
    id: 'a-minor-barre-e',
    name: 'A Minor (E-Shape Barre Fret 5)',
    root: 'A',
    type: 'Minor',
    family: 'Barre E-Shape',
    frets: [5, 7, 7, 5, 5, 5],
    barreFret: 5,
    barreStrings: [6, 1],
    fingers: [1, 3, 4, 1, 1, 1],
    description: 'Sliding open Em shape to fret 5 gives a thunderous, rich A minor.',
    category: 'barre-e',
    triadNotes: ['A', 'C', 'E'],
    allNotes: ['A', 'C', 'E'],
    bassNote: 'A',
    difficulty: 'Intermediate',
  },
  {
    id: 'b-major-barre-e',
    name: 'B Major (E-Shape Barre Fret 7)',
    root: 'B',
    type: 'Major',
    family: 'Barre E-Shape',
    frets: [7, 9, 9, 8, 7, 7],
    barreFret: 7,
    barreStrings: [6, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    description: 'Sliding open E shape to fret 7 where B anchors on Low E string.',
    category: 'barre-e',
    triadNotes: ['B', 'D#', 'F#'],
    allNotes: ['B', 'D#', 'F#'],
    bassNote: 'B',
    difficulty: 'Intermediate',
  },
  {
    id: 'd-major-barre-a',
    name: 'D Major (A-Shape Barre Fret 5)',
    root: 'D',
    type: 'Major',
    family: 'Barre A-Shape',
    frets: [-1, 5, 7, 7, 7, 5],
    barreFret: 5,
    barreStrings: [5, 1],
    fingers: [0, 1, 2, 3, 4, 1],
    description: 'Open A shape slid up to fret 5 anchored by D on 5th string.',
    category: 'barre-a',
    triadNotes: ['D', 'F#', 'A'],
    allNotes: ['D', 'F#', 'A'],
    bassNote: 'D',
    difficulty: 'Intermediate',
  },
  {
    id: 'd-minor-barre-a',
    name: 'D Minor (A-Shape Barre Fret 5)',
    root: 'D',
    type: 'Minor',
    family: 'Barre A-Shape',
    frets: [-1, 5, 7, 7, 6, 5],
    barreFret: 5,
    barreStrings: [5, 1],
    fingers: [0, 1, 3, 4, 2, 1],
    description: 'Open Am shape slid up to fret 5 anchored by D on 5th string.',
    category: 'barre-a',
    triadNotes: ['D', 'F', 'A'],
    allNotes: ['D', 'F', 'A'],
    bassNote: 'D',
    difficulty: 'Intermediate',
  },
  {
    id: 'e-major-barre-a',
    name: 'E Major (A-Shape Barre Fret 7)',
    root: 'E',
    type: 'Major',
    family: 'Barre A-Shape',
    frets: [-1, 7, 9, 9, 9, 7],
    barreFret: 7,
    barreStrings: [5, 1],
    fingers: [0, 1, 2, 3, 4, 1],
    description: 'Open A shape slid up to fret 7 anchored by E on 5th string.',
    category: 'barre-a',
    triadNotes: ['E', 'G#', 'B'],
    allNotes: ['E', 'G#', 'B'],
    bassNote: 'E',
    difficulty: 'Intermediate',
  },
  {
    id: 'e-minor-barre-a',
    name: 'E Minor (A-Shape Barre Fret 7)',
    root: 'E',
    type: 'Minor',
    family: 'Barre A-Shape',
    frets: [-1, 7, 9, 9, 8, 7],
    barreFret: 7,
    barreStrings: [5, 1],
    fingers: [0, 1, 3, 4, 2, 1],
    description: 'Open Am shape slid up to fret 7 anchored by E on 5th string.',
    category: 'barre-a',
    triadNotes: ['E', 'G', 'B'],
    allNotes: ['E', 'G', 'B'],
    bassNote: 'E',
    difficulty: 'Intermediate',
  },
  {
    id: 'g7-barre-e',
    name: 'G Dominant 7th (Barre Fret 3)',
    root: 'G',
    type: '7',
    family: '7th / Jazz',
    frets: [3, 5, 3, 4, 3, 3],
    barreFret: 3,
    barreStrings: [6, 1],
    fingers: [1, 3, 1, 2, 1, 1],
    description: 'Open E7 shape slid to fret 3. Funk and blues standard.',
    category: 'barre-e',
    triadNotes: ['G', 'B', 'D'],
    allNotes: ['G', 'B', 'D', 'F'],
    bassNote: 'G',
    difficulty: 'Intermediate',
  },
  {
    id: 'c7-barre-a',
    name: 'C Dominant 7th (Barre Fret 3)',
    root: 'C',
    type: '7',
    family: '7th / Jazz',
    frets: [-1, 3, 5, 3, 5, 3],
    barreFret: 3,
    barreStrings: [5, 1],
    fingers: [0, 1, 3, 1, 4, 1],
    description: 'Open A7 shape slid to fret 3 on 5th string.',
    category: 'barre-a',
    triadNotes: ['C', 'E', 'G'],
    allNotes: ['C', 'E', 'G', 'A#'],
    bassNote: 'C',
    difficulty: 'Intermediate',
  },
  {
    id: 'a-power-chord',
    name: 'A5 Power Chord',
    root: 'A',
    type: '5',
    family: 'Extended',
    frets: [-1, 0, 2, 2, -1, -1],
    fingers: [0, 0, 1, 2, 0, 0],
    description: 'Classic hard-rock crunch chord. Pure root and 5th (A + E).',
    category: 'triad',
    triadNotes: ['A', 'E', 'A'],
    allNotes: ['A', 'E'],
    bassNote: 'A',
    difficulty: 'Beginner',
  },
  {
    id: 'd-power-chord',
    name: 'D5 Power Chord',
    root: 'D',
    type: '5',
    family: 'Extended',
    frets: [-1, -1, 0, 2, 3, -1],
    fingers: [0, 0, 0, 1, 2, 0],
    description: 'Standard rock foundation on strings 4, 3, 2.',
    category: 'triad',
    triadNotes: ['D', 'A', 'D'],
    allNotes: ['D', 'A'],
    bassNote: 'D',
    difficulty: 'Beginner',
  },
];

/** Hand-written voicings first, then the movable E/A-shape grips for every root (B major, Bb, F#7 ...). */
export const CHORD_DATABASE: ChordVoicing[] = [...CURATED_CHORDS, ...generateMovableChords(CURATED_CHORDS)];

// ============================================================================
// SECTION 5: INDIAN CLASSICAL SWARAS (SARGAM)
// ============================================================================

export interface IndianSwara {
  semitoneOffset: number; // 0 to 11 relative to Sa (Tonic)
  shortName: string; // Sa, re, Re, ga, Ga, ma, Ma, Pa, dha, Dha, ni, Ni
  fullName: string;
  type: 'Achala' | 'Komal' | 'Shuddha' | 'Teevra';
  variation: 'Fixed (Achala)' | 'Less / Lower (Komal)' | 'Pure / Natural (Shuddha)' | 'Extra / Higher (Teevra)';
  westernInterval: string;
  explanation: string;
}

export const INDIAN_SWARAS: IndianSwara[] = [
  {
    semitoneOffset: 0,
    shortName: 'Sa',
    fullName: 'Shadja',
    type: 'Achala',
    variation: 'Fixed (Achala)',
    westernInterval: 'Root / Tonic (1)',
    explanation: 'Achala (immovable). Foundational mother note. Never has a flat or sharp variant.',
  },
  {
    semitoneOffset: 1,
    shortName: 're',
    fullName: 'Komal Rishabh',
    type: 'Komal',
    variation: 'Less / Lower (Komal)',
    westernInterval: 'Minor 2nd (b2)',
    explanation: 'Komal means "soft / less" (-1 semitone below natural Re). Creates deep emotional tension.',
  },
  {
    semitoneOffset: 2,
    shortName: 'Re',
    fullName: 'Shuddha Rishabh',
    type: 'Shuddha',
    variation: 'Pure / Natural (Shuddha)',
    westernInterval: 'Major 2nd (2)',
    explanation: 'Shuddha means "pure / natural". Standard major 2nd jump (+2 semitones).',
  },
  {
    semitoneOffset: 3,
    shortName: 'ga',
    fullName: 'Komal Gandhar',
    type: 'Komal',
    variation: 'Less / Lower (Komal)',
    westernInterval: 'Minor 3rd (b3)',
    explanation: 'Komal Ga (-1 semitone). Dictates the melancholic minor sound in the Triad Code (+3 frets)!',
  },
  {
    semitoneOffset: 4,
    shortName: 'Ga',
    fullName: 'Shuddha Gandhar',
    type: 'Shuddha',
    variation: 'Pure / Natural (Shuddha)',
    westernInterval: 'Major 3rd (3)',
    explanation: 'Shuddha Ga (+4 semitones). Dictates bright, triumphant major triads in the Triad Code!',
  },
  {
    semitoneOffset: 5,
    shortName: 'ma',
    fullName: 'Shuddha Madhyam',
    type: 'Shuddha',
    variation: 'Pure / Natural (Shuddha)',
    westernInterval: 'Perfect 4th (4)',
    explanation: 'The natural 4th. Open strings walk up 5 frets to this exact interval.',
  },
  {
    semitoneOffset: 6,
    shortName: 'Ma',
    fullName: 'Teevra Madhyam',
    type: 'Teevra',
    variation: 'Extra / Higher (Teevra)',
    westernInterval: 'Augmented 4th / Tritone (#4)',
    explanation: 'THE ONE EXTRA SWARA! Madhyam never goes lower; instead it goes extra/higher (+1 semitone). Essential in Raag Yaman!',
  },
  {
    semitoneOffset: 7,
    shortName: 'Pa',
    fullName: 'Pancham',
    type: 'Achala',
    variation: 'Fixed (Achala)',
    westernInterval: 'Perfect 5th (5)',
    explanation: 'Achala (immovable). Never flat or sharp. The indestructible boundary wall for triads.',
  },
  {
    semitoneOffset: 8,
    shortName: 'dha',
    fullName: 'Komal Dhaivat',
    type: 'Komal',
    variation: 'Less / Lower (Komal)',
    westernInterval: 'Minor 6th (b6)',
    explanation: 'Komal Dha is lowered by 1 semitone (-1 fret). Expresses pathos and deep longing.',
  },
  {
    semitoneOffset: 9,
    shortName: 'Dha',
    fullName: 'Shuddha Dhaivat',
    type: 'Shuddha',
    variation: 'Pure / Natural (Shuddha)',
    westernInterval: 'Major 6th (6)',
    explanation: 'Shuddha Dha (+9 semitones). In C Major, this is A (the Relative Minor center!).',
  },
  {
    semitoneOffset: 10,
    shortName: 'ni',
    fullName: 'Komal Nishad',
    type: 'Komal',
    variation: 'Less / Lower (Komal)',
    westernInterval: 'Minor 7th (b7)',
    explanation: 'Komal Ni is lowered by 1 semitone. The signature dominant 7th flavor in rock and blues.',
  },
  {
    semitoneOffset: 11,
    shortName: 'Ni',
    fullName: 'Shuddha Nishad',
    type: 'Shuddha',
    variation: 'Pure / Natural (Shuddha)',
    westernInterval: 'Major 7th (7)',
    explanation: 'Shuddha Ni (+11 semitones). The leading tone just 1 semitone below the high Sa.',
  },
];

// ============================================================================
// SECTION 6: INDIAN THAATS (10 PARENT SCALES)
// ============================================================================

export interface IndianThaat {
  name: string;
  swaras: string[];
  westernEquivalent: string;
  mood: string;
  description: string;
}

export const INDIAN_THAATS: IndianThaat[] = [
  {
    name: 'Bilawal Thaat',
    swaras: ['Sa', 'Re', 'Ga', 'ma', 'Pa', 'Dha', 'Ni'],
    westernEquivalent: 'Major Scale (Ionian Mode)',
    mood: 'Bright, joyful, regal, peaceful',
    description: 'All 7 notes are Shuddha (Pure). Identical to the Western Major scale derived in Section 2!',
  },
  {
    name: 'Kalyan Thaat (Yaman)',
    swaras: ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'],
    westernEquivalent: 'Lydian Mode (#4)',
    mood: 'Devotional, majestic, uplifting',
    description: 'Features Teevra Ma (the extra/sharp 4th!). Demonstrates how Indian music elevates Madhyam instead of flattening it.',
  },
  {
    name: 'Kafi Thaat',
    swaras: ['Sa', 'Re', 'ga', 'ma', 'Pa', 'Dha', 'ni'],
    westernEquivalent: 'Dorian Mode (b3, b7)',
    mood: 'Romantic, passionate, folk energy',
    description: 'Features Komal Ga (less 3rd) and Komal Ni (less 7th). The backbone of semi-classical and blues rock guitar.',
  },
  {
    name: 'Bhairav Thaat',
    swaras: ['Sa', 're', 'Ga', 'ma', 'Pa', 'dha', 'Ni'],
    westernEquivalent: 'Double Harmonic Major (b2, b6)',
    mood: 'Solemn, meditative, morning dawn',
    description: 'Features Komal re (less 2nd) and Komal dha (less 6th) with natural Ga and Ni. Deeply evocative eastern sound.',
  },
  {
    name: 'Asavari Thaat',
    swaras: ['Sa', 'Re', 'ga', 'ma', 'Pa', 'dha', 'ni'],
    westernEquivalent: 'Natural Minor Scale (Aeolian Mode)',
    mood: 'Renunciation, somber, introspective',
    description: 'Features Komal ga, dha, ni. The exact twin to the Western Natural Minor scale from PDF Section 2!',
  },
  {
    name: 'Khamaj Thaat',
    swaras: ['Sa', 'Re', 'Ga', 'ma', 'Pa', 'Dha', 'ni'],
    westernEquivalent: 'Mixolydian Mode (Dominant 7th)',
    mood: 'Playful, thumri, sensuous',
    description: 'Natural Ga with Komal Ni. Foundation of rock & roll and dominant 7th guitar grooves.',
  },
  {
    name: 'Bhairavi Thaat',
    swaras: ['Sa', 're', 'ga', 'ma', 'Pa', 'dha', 'ni'],
    westernEquivalent: 'Phrygian Mode (b2, b3, b6, b7)',
    mood: 'Emotional, bittersweet, all-encompassing',
    description: 'All 4 movable swaras (re, ga, dha, ni) are Komal ("less"). Concludes classical music concerts.',
  },
  {
    name: 'Todi Thaat',
    swaras: ['Sa', 're', 'ga', 'Ma', 'Pa', 'dha', 'Ni'],
    westernEquivalent: 'Diminished / Minor Harmonic variant',
    mood: 'Pathos, deep yearning, solitude',
    description: 'Intense combination of Komal re, Komal ga, Teevra Ma (extra), and Komal dha.',
  },
  {
    name: 'Marwa Thaat',
    swaras: ['Sa', 're', 'Ga', 'Ma', 'Dha', 'Ni'],
    westernEquivalent: 'Hexatonic (No 5th / Pancham)',
    mood: 'Twilight, mystic tension, unrest',
    description: 'Omits Pa completely! Juxtaposes Komal re with Teevra Ma and Shuddha Dha.',
  },
  {
    name: 'Poorvi Thaat',
    swaras: ['Sa', 're', 'Ga', 'Ma', 'Pa', 'dha', 'Ni'],
    westernEquivalent: 'Double Harmonic with #4',
    mood: 'Twilight prayer, profound contemplation',
    description: 'Features Komal re, Shuddha Ga, Teevra Ma, and Komal dha. Played at sunset transition.',
  },
];

// ============================================================================
// SECTION 7: INDIAN CLASSICAL RAAGAS (COMPREHENSIVE RAAGA LIBRARY)
// ============================================================================

export interface IndianRaaga {
  id: string;
  name: string;
  thaat: string;
  timeOfDay: string; // Prahar
  mood: string; // Rasa
  vadi: string; // King note
  samvadi: string; // Queen note
  arohana: string[]; // Ascending swaras
  avarohana: string[]; // Descending swaras
  description: string;
  guitarFretsC: number[]; // Fret positions on a single string (Sa = C)
}

export const INDIAN_RAAGAS: IndianRaaga[] = [
  {
    id: 'raag-yaman',
    name: 'Raag Yaman (Kalyan)',
    thaat: 'Kalyan Thaat',
    timeOfDay: 'First quarter of night (6 PM – 9 PM)',
    mood: 'Shringara (Romantic), Devotion, Serenity',
    vadi: 'Ga (Shuddha Gandhar)',
    samvadi: 'Ni (Shuddha Nishad)',
    arohana: ['Ni', 'Re', 'Ga', 'Ma', 'Dha', 'Ni', "Sa'"],
    avarohana: ["Sa'", 'Ni', 'Dha', 'Pa', 'Ma', 'Ga', 'Re', 'Sa'],
    description: 'The monarch of evening raagas. Defined by its radiant Teevra Ma (+6 st) and the absence of Sa and Pa in ascent (Vakraphrasing Ni-Re-Ga).',
    guitarFretsC: [0, 2, 4, 6, 7, 9, 11, 12],
  },
  {
    id: 'raag-bhairav',
    name: 'Raag Bhairav',
    thaat: 'Bhairav Thaat',
    timeOfDay: 'Daybreak / Early Morning (4 AM – 7 AM)',
    mood: 'Shanta (Peace), Majesty, Devotion',
    vadi: 'dha (Komal Dhaivat)',
    samvadi: 're (Komal Rishabh)',
    arohana: ['Sa', 're', 'Ga', 'ma', 'Pa', 'dha', 'Ni', "Sa'"],
    avarohana: ["Sa'", 'Ni', 'dha', 'Pa', 'ma', 'Ga', 're', 'Sa'],
    description: 'Ancient morning raag with deep slow oscillations (andolan) on Komal re and Komal dha.',
    guitarFretsC: [0, 1, 4, 5, 7, 8, 11, 12],
  },
  {
    id: 'raag-bhoopali',
    name: 'Raag Bhoopali (Bhup)',
    thaat: 'Kalyan Thaat',
    timeOfDay: 'Early Night (7 PM – 10 PM)',
    mood: 'Bhakti (Devotion), Peace, Grace',
    vadi: 'Ga (Shuddha Gandhar)',
    samvadi: 'Dha (Shuddha Dhaivat)',
    arohana: ['Sa', 'Re', 'Ga', 'Pa', 'Dha', 'Sa\''],
    avarohana: ["Sa'", 'Dha', 'Pa', 'Ga', 'Re', 'Sa'],
    description: 'A 5-note pentatonic masterpiece (Audav). Omits ma and ni completely. Identical notes to the Western Major Pentatonic scale!',
    guitarFretsC: [0, 2, 4, 7, 9, 12],
  },
  {
    id: 'raag-bageshri',
    name: 'Raag Bageshri',
    thaat: 'Kafi Thaat',
    timeOfDay: 'Midnight (11 PM – 2 AM)',
    mood: 'Viraha (Lover in separation), Deep Emotion',
    vadi: 'ma (Shuddha Madhyam)',
    samvadi: 'Sa (Shadja)',
    arohana: ['Sa', 'ga', 'ma', 'Dha', 'ni', "Sa'"],
    avarohana: ["Sa'", 'ni', 'Dha', 'ma', 'ga', 'Re', 'Sa'],
    description: 'Poignant midnight melody where Pancham (Pa) is avoided in ascent, highlighting the soulful resonance of Shuddha Madhyam.',
    guitarFretsC: [0, 2, 3, 5, 7, 9, 10, 12],
  },
  {
    id: 'raag-darbari-kanada',
    name: 'Raag Darbari Kanada',
    thaat: 'Asavari Thaat',
    timeOfDay: 'Late Midnight (12 AM – 3 AM)',
    mood: 'Vira (Grandeur), Profound Sobriety',
    vadi: 're (Komal Rishabh)',
    samvadi: 'Pa (Pancham)',
    arohana: ['Sa', 'Re', 'ga', 'ma', 'Pa', 'dha', 'ni', "Sa'"],
    avarohana: ["Sa'", 'dha', 'ni', 'Pa', 'ma', 'ga', 'Re', 'Sa'],
    description: 'Composed by Miyan Tansen for Emperor Akbar. Famous for slow, regal gamaks and microtonal oscillations on ga and dha.',
    guitarFretsC: [0, 2, 3, 5, 7, 8, 10, 12],
  },
  {
    id: 'raag-desh',
    name: 'Raag Desh',
    thaat: 'Khamaj Thaat',
    timeOfDay: 'Second quarter of night / Monsoon',
    mood: 'Patriotism, Joy, Romance, Rain',
    vadi: 'Re (Shuddha Rishabh)',
    samvadi: 'Pa (Pancham)',
    arohana: ['Sa', 'Re', 'ma', 'Pa', 'Ni', "Sa'"],
    avarohana: ["Sa'", 'ni', 'Dha', 'Pa', 'ma', 'Ga', 'Re', 'Sa'],
    description: 'The soul of Indian folk and patriotic music (basis of Vande Mataram). Uses Shuddha Ni in ascent and Komal ni in descent.',
    guitarFretsC: [0, 2, 4, 5, 7, 9, 10, 11, 12],
  },
  {
    id: 'raag-malkauns',
    name: 'Raag Malkauns',
    thaat: 'Bhairavi Thaat',
    timeOfDay: 'Small hours of night (1 AM – 4 AM)',
    mood: 'Veera (Valor), Meditative Solitude',
    vadi: 'ma (Shuddha Madhyam)',
    samvadi: 'Sa (Shadja)',
    arohana: ['Sa', 'ga', 'ma', 'dha', 'ni', "Sa'"],
    avarohana: ["Sa'", 'ni', 'dha', 'ma', 'ga', 'Sa'],
    description: 'Ancient pentatonic raag created by Lord Shiva. Drops both Re and Pa. Intense, hypnotic, and profoundly meditative.',
    guitarFretsC: [0, 3, 5, 8, 10, 12],
  },
  {
    id: 'raag-bhimpalasi',
    name: 'Raag Bhimpalasi',
    thaat: 'Kafi Thaat',
    timeOfDay: 'Late Afternoon (3 PM – 6 PM)',
    mood: 'Shringara (Love), Longing',
    vadi: 'ma (Shuddha Madhyam)',
    samvadi: 'Sa (Shadja)',
    arohana: ['ni', 'Sa', 'ga', 'ma', 'Pa', 'ni', "Sa'"],
    avarohana: ["Sa'", 'ni', 'Dha', 'Pa', 'ma', 'ga', 'Re', 'Sa'],
    description: 'Late afternoon raag characterized by longing; leaves out Re and Dha in ascent and touches them gently in descent.',
    guitarFretsC: [0, 2, 3, 5, 7, 9, 10, 12],
  },
  {
    id: 'raag-ahir-bhairav',
    name: 'Raag Ahir Bhairav',
    thaat: 'Bhairav Thaat',
    timeOfDay: 'Early Morning (6 AM – 9 AM)',
    mood: 'Compassion, Spiritual Awakening',
    vadi: 'ma (Shuddha Madhyam)',
    samvadi: 'Sa (Shadja)',
    arohana: ['Sa', 're', 'Ga', 'ma', 'Pa', 'Dha', 'ni', "Sa'"],
    avarohana: ["Sa'", 'ni', 'Dha', 'Pa', 'ma', 'Ga', 're', 'Sa'],
    description: 'A blend of Bhairav (Komal re) and Kafi (Komal ni). Extremely popular on slide guitar and acoustic guitar.',
    guitarFretsC: [0, 1, 4, 5, 7, 9, 10, 12],
  },
  {
    id: 'raag-shivranjani',
    name: 'Raag Shivranjani',
    thaat: 'Kafi Thaat',
    timeOfDay: 'Late Evening / Night',
    mood: 'Karuna (Pathos), Haunting Melancholy',
    vadi: 'Pa (Pancham)',
    samvadi: 'Sa (Shadja)',
    arohana: ['Sa', 'Re', 'ga', 'Pa', 'Dha', "Sa'"],
    avarohana: ["Sa'", 'Dha', 'Pa', 'ga', 'Re', 'Sa'],
    description: 'Pentatonic scale with Komal ga. One of the most famous haunting raagas for acoustic guitar melodies.',
    guitarFretsC: [0, 2, 3, 7, 9, 12],
  },
];

// ============================================================================
// SECTION 8: DIATONIC HARMONY & POPULAR PROGRESSIONS
// ============================================================================

export const DIATONIC_NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'] as const;

export const DIATONIC_FUNCTIONS = [
  'Tonic (Home / Root foundation)',
  'Supertonic (Predominant tension)',
  'Mediant (Warm transition)',
  'Subdominant (Lifting departure)',
  'Dominant (Powerful resolution pull)',
  'Submediant (Relative Minor center)',
  'Leading Tone (Unstable tension yearning to resolve up)',
];

export interface ChordProgressionDef {
  name: string;
  indices: number[]; // 0-based diatonic index
  description: string;
}

export const POPULAR_PROGRESSIONS: ChordProgressionDef[] = [
  {
    name: 'Pop Anthem (I - V - vi - IV)',
    indices: [0, 4, 5, 3],
    description: 'The most popular 4-chord progression in modern music history.',
  },
  {
    name: 'Classic Rock / Folk (I - IV - V - I)',
    indices: [0, 3, 4, 0],
    description: 'The foundation of blues, rock, and acoustic songwriting.',
  },
  {
    name: 'Jazz Turnaround (ii - V - I)',
    indices: [1, 4, 0],
    description: 'The definitive jazz cadence bringing tension back to home tonic.',
  },
  {
    name: '50s Ballad / Doo-Wop (I - vi - IV - V)',
    indices: [0, 5, 1, 4],
    description: 'Nostalgic, romantic vintage progression.',
  },
];

// ============================================================================
// SECTION 9: GUIDED JOURNEY STAGES
// ============================================================================

export interface JourneyStageDef {
  title: string;
  subtitle: string;
  lessonIndex: number;
  badge: string;
  badgeIcon: string;
  challengeText: string;
}

export const JOURNEY_STAGES: JourneyStageDef[] = [
  {
    title: "Stage 1: The 12 Tones & Tuning by Ear",
    subtitle: "Understand semitones, Perfect 4ths, and the 4th-fret G exception.",
    lessonIndex: 0,
    badge: "Tuning Master",
    badgeIcon: "🎧",
    challengeText: "Tune Low E to Open A using the 5th fret unison rule.",
  },
  {
    title: "Stage 2: Deriving the Major Scale DNA",
    subtitle: "Whole and Half step jumps (+2, +2, +1, +2, +2, +2, +1) and Relative Minor (Root - 3 Frets).",
    lessonIndex: 1,
    badge: "Scale Architect",
    badgeIcon: "🧬",
    challengeText: "Derive C Major with zero sharps, then locate its twin A Minor.",
  },
  {
    title: "Stage 3: The +4 / +3 Triad Code",
    subtitle: "Stacking Thirds: Major (+4, +3) vs Minor (+3, +4).",
    lessonIndex: 2,
    badge: "Triad Decoder",
    badgeIcon: "💎",
    challengeText: "Construct both Major and Minor triads on root note C.",
  },
  {
    title: "Stage 4: Diatonic Harmony Machine",
    subtitle: "The 'Skip one, take one' method. Why ii is naturally minor.",
    lessonIndex: 3,
    badge: "Harmony Explorer",
    badgeIcon: "🎼",
    challengeText: "Play a classic I - IV - V - I chord progression.",
  },
  {
    title: "Stage 5: Fretboard Mapping & Bass Gravity",
    subtitle: "Mapping triad notes to 6 strings and why we mute the thickest string.",
    lessonIndex: 4,
    badge: "Fretboard Cartographer",
    badgeIcon: "🗺️",
    challengeText: "Test the Bass Gravity rule by comparing Muted Low E vs Open E.",
  },
  {
    title: "Stage 6: Barre Chords & Shifting the Nut",
    subtitle: "Sliding open E and A shapes; your index finger as the human nut.",
    lessonIndex: 5,
    badge: "Barre Champion",
    badgeIcon: "⚡",
    challengeText: "Slide the E-Major shape up 1 fret to play an F Major barre chord.",
  },
  {
    title: "Stage 7: Step-by-Step Chord Derivation",
    subtitle: "The 5-step intuitive thought process to rebuild any chord from scratch.",
    lessonIndex: 6,
    badge: "Guitar Maestro",
    badgeIcon: "👑",
    challengeText: "Derive G Minor step-by-step: Math ➔ Notes ➔ Anchor ➔ Shape.",
  },
];

// ============================================================================
// SECTION 10: THEORY MASTERY QUIZ QUESTIONS
// ============================================================================

export interface QuizQuestionDef {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestionDef[] = [
  {
    question: "What is the internal triad math formula for a Minor chord?",
    options: [
      "Root, +4 frets, +3 frets",
      "Root, +3 frets, +4 frets",
      "Root, +2 frets, +2 frets",
      "Root, +5 frets, +5 frets",
    ],
    correctIndex: 1,
    explanation: "A minor triad starts with a sad Minor 3rd (+3 semitones), followed by a Major 3rd (+4 semitones). Outer bounds = Perfect 5th (+7).",
  },
  {
    question: "To play a G Minor barre chord using the E-shape, where is your Root anchor on the Low E string?",
    options: [
      "1st fret",
      "3rd fret",
      "5th fret",
      "7th fret",
    ],
    correctIndex: 1,
    explanation: "Open Low E ➔ 1st fret F ➔ 2nd fret F# ➔ 3rd fret G! The anchor sits on the 3rd fret.",
  },
  {
    question: "What are the exact triad notes of C Major?",
    options: [
      "C, D, G",
      "C, E, G",
      "C, Eb, G",
      "C, F, A",
    ],
    correctIndex: 1,
    explanation: "C (+4 frets) ➔ E (+3 frets) ➔ G.",
  },
  {
    question: "Why do we lay our index finger flat across all strings when sliding an open shape up the neck?",
    options: [
      "To mute all strings completely",
      "To act as a movable, human 'nut' replacing the guitar headstock nut",
      "To make the guitar sound like a bass",
      "To avoid playing barre chords",
    ],
    correctIndex: 1,
    explanation: "The guitar nut holds the 0th fret. When sliding up, the index finger becomes the human nut so internal intervals shift together.",
  },
];

// ============================================================================
// SECTION 11: STORAGE KEYS & DEFAULT PREFERENCES
// ============================================================================

export const STORAGE_KEYS = {
  USER_PROGRESS: 'intuitive_guitar_studio_progress_v1',
  FAVORITE_CHORDS: 'whatthefret_favorite_chords_v1',
};

// ============================================================================
// SECTION 12: SUGGESTED FUTURE THEORY LABS & INTERACTIVE EXPLORATIONS
// ============================================================================

export interface FutureTheoryLab {
  title: string;
  tagline: string;
  icon: string;
  concept: string;
  howItWorks: string;
  benefit: string;
}

export const SUGGESTED_THEORY_LABS: FutureTheoryLab[] = [
  {
    title: 'Circle of Fifths & Modal Transposer',
    tagline: 'Visual harmonic clock & key modulation engine',
    icon: '🧭',
    concept: 'Clockwise steps move in Perfect 5ths (adding sharps), counter-clockwise in Perfect 4ths (adding flats).',
    howItWorks: 'An interactive rotating dial showing relative minors, accidentals, and chord borrow pathways in real time.',
    benefit: 'Enables rapid song transposition, understanding why sharps appear, and smooth key modulations.',
  },
  {
    title: 'The CAGED System 3D Fretboard Topology',
    tagline: 'Connect the 5 interlocking geometric shapes across the entire neck',
    icon: '🧩',
    concept: 'Any chord or pentatonic scale repeats across 5 interlocking puzzle shapes: C, A, G, E, and D.',
    howItWorks: 'Highlight any single chord across all 15 frets, revealing how the 5 shapes morph seamlessly into one another.',
    benefit: 'Unlocks the entire fretboard so you never get trapped in open position or single barre boxes.',
  },
  {
    title: 'Real-Time Tanpura Drone & Modal Jam Pad',
    tagline: 'Acoustic sympathetic resonance & ear training drone',
    icon: '🪕',
    concept: 'Practicing scales and raagas over a continuous Sa-Pa drone trains the ear to perceive true microtonal tension and resolution.',
    howItWorks: 'Synthesized classical Indian tanpura with adjustable tempo, pitch, and rhythmic tabla pulses.',
    benefit: 'Transforms rote scale memorization into deeply musical improvisation and pitch awareness.',
  },
  {
    title: 'Interval Ear Trainer & Blind Fret Guessing',
    tagline: 'Gamified ear training with immediate guitar feedback',
    icon: '🎯',
    concept: 'Hearing the emotional distance (Minor 2nd vs Perfect 4th vs Tritone) before touching the fretboard.',
    howItWorks: 'App plays a random mystery interval or chord and challenges the player to identify or replicate it on their real guitar.',
    benefit: 'Builds instinctual connection between the player’s ear and physical finger placement.',
  },
];

// ============================================================================
// SECTION 13: INTERACTIVE FRETBOARD QUIZ CONSTANTS
// ============================================================================

export interface QuizDurationOption {
  seconds: number;
  label: string;
  badge?: string;
}

export const QUIZ_DURATIONS: QuizDurationOption[] = [
  { seconds: 30, label: '30s Sprint', badge: 'Fast' },
  { seconds: 60, label: '60s Standard', badge: 'Recommended' },
  { seconds: 90, label: '90s Endurance', badge: 'Deep Practice' },
];

export type QuizPromptMode = 'single-string' | 'any-string' | 'root-notes-only';

export interface QuizModeOption {
  id: QuizPromptMode;
  title: string;
  description: string;
}

export const QUIZ_MODE_OPTIONS: QuizModeOption[] = [
  {
    id: 'single-string',
    title: 'Specific String & Note',
    description: 'Prompts note on a chosen string (e.g. "Find G on String 3")',
  },
  {
    id: 'any-string',
    title: 'Anywhere on Frets 0-12',
    description: 'Find target note on any string as quickly as possible',
  },
  {
    id: 'root-notes-only',
    title: 'Natural Notes (A-G)',
    description: 'Master the 7 natural notes without accidentals',
  },
];

export interface QuizRank {
  minScore: number;
  minAccuracy: number;
  maxAvgReactionMs: number;
  title: string;
  badge: string;
  color: string;
  description: string;
}

export const QUIZ_RANKS: QuizRank[] = [
  {
    minScore: 1800,
    minAccuracy: 90,
    maxAvgReactionMs: 1600,
    title: 'Fretboard Virtuoso',
    badge: '🏆 Virtuoso',
    color: 'from-brand-400 to-brand-600',
    description: 'Instinctual fretboard mastery! You locate notes as fast as a professional guitarist.',
  },
  {
    minScore: 1200,
    minAccuracy: 80,
    maxAvgReactionMs: 2500,
    title: 'Fretboard Maestro',
    badge: '⚡ Maestro',
    color: 'from-gold-400 to-gold-600',
    description: 'Rapid recognition across the neck with sharp accuracy.',
  },
  {
    minScore: 600,
    minAccuracy: 65,
    maxAvgReactionMs: 3500,
    title: 'Fretboard Explorer',
    badge: '🎸 Explorer',
    color: 'from-violet-400 to-violet-600',
    description: 'Solid foundation. Keep training reaction speed on lower frets.',
  },
  {
    minScore: 0,
    minAccuracy: 0,
    maxAvgReactionMs: 99999,
    title: 'Fretboard Apprentice',
    badge: '🌱 Apprentice',
    color: 'from-ink-400 to-ink-600',
    description: 'Great start! Memorize open strings and 5th fret reference markers to climb higher.',
  },
];

export const QUIZ_STORAGE_KEY = 'intuitive_guitar_studio_fretboard_quiz_highscore_v1';

// ============================================================================
// SECTION 14: METRONOME & RHYTHM PRESETS
// ============================================================================

export interface TimeSignatureDef {
  beats: number;
  unit: number;
  label: string;
  description: string;
  accents: number[]; // 0-indexed beats with accents
}

export const METRONOME_TIME_SIGNATURES: TimeSignatureDef[] = [
  { beats: 2, unit: 4, label: '2/4', description: 'March / Polka', accents: [0] },
  { beats: 3, unit: 4, label: '3/4', description: 'Waltz / Ballad', accents: [0] },
  { beats: 4, unit: 4, label: '4/4', description: 'Common Time (Rock, Pop, Blues)', accents: [0, 2] },
  { beats: 5, unit: 4, label: '5/4', description: 'Take Five / Odd Meter', accents: [0, 3] },
  { beats: 6, unit: 8, label: '6/8', description: 'Compound Duple (Blues Shuffles)', accents: [0, 3] },
  { beats: 7, unit: 8, label: '7/8', description: 'Progressive / Balkan Folk', accents: [0, 3, 5] },
];

export interface TempoMarking {
  minBpm: number;
  maxBpm: number;
  name: string;
  italian: string;
}

export const TEMPO_MARKINGS: TempoMarking[] = [
  { minBpm: 30, maxBpm: 55, name: 'Very Slow & Broad', italian: 'Largo' },
  { minBpm: 56, maxBpm: 66, name: 'Slow & Stately', italian: 'Adagio' },
  { minBpm: 67, maxBpm: 108, name: 'Walking Pace', italian: 'Andante' },
  { minBpm: 109, maxBpm: 120, name: 'Moderately', italian: 'Moderato' },
  { minBpm: 121, maxBpm: 156, name: 'Fast & Bright', italian: 'Allegro' },
  { minBpm: 157, maxBpm: 180, name: 'Lively & Fast', italian: 'Vivace' },
  { minBpm: 181, maxBpm: 260, name: 'Very Quick', italian: 'Presto' },
];

export const METRONOME_CONFIG = {
  MIN_BPM: 30,
  MAX_BPM: 260,
  DEFAULT_BPM: 100,
  CLICK_HIGH_FREQ: 1600, // Downbeat click (Hz)
  CLICK_LOW_FREQ: 1000,  // Regular beat click (Hz)
  CLICK_SUB_FREQ: 1250,  // Secondary accent (Hz)
};

// ============================================================================
// SECTION 15: CIRCLE OF FIFTHS HARMONIC ENGINE
// ============================================================================

export interface CircleKeySegment {
  index: number; // 0 to 11 (0 = C, 1 = G, etc.)
  majorKey: NoteName;
  minorKey: NoteName;
  majorDisplay: string;
  minorDisplay: string;
  accidentals: string;
  accidentalCount: number; // >0 for sharps, <0 for flats, 0 for natural
  accidentalsList: string[];
  thaat: string;
  thaatExplanation: string;
  angleDeg: number; // Angle on clock: 0deg = top (C), 30deg = G, etc.
}

export const CIRCLE_OF_FIFTHS_DATA: CircleKeySegment[] = [
  {
    index: 0,
    majorKey: 'C',
    minorKey: 'A',
    majorDisplay: 'C',
    minorDisplay: 'Am',
    accidentals: 'No sharps or flats',
    accidentalCount: 0,
    accidentalsList: [],
    thaat: 'Bilawal Thaat',
    thaatExplanation: 'Pure natural scale (All Shuddha Swaras). The baseline of Western major and Indian classical Bilawal.',
    angleDeg: 0,
  },
  {
    index: 1,
    majorKey: 'G',
    minorKey: 'E',
    majorDisplay: 'G',
    minorDisplay: 'Em',
    accidentals: '1 Sharp (F#)',
    accidentalCount: 1,
    accidentalsList: ['F#'],
    thaat: 'Kalyan Thaat',
    thaatExplanation: 'Introduces Teevra Ma (F#). Moving 1 fifth clockwise raises the 4th degree by one semitone.',
    angleDeg: 30,
  },
  {
    index: 2,
    majorKey: 'D',
    minorKey: 'B',
    majorDisplay: 'D',
    minorDisplay: 'Bm',
    accidentals: '2 Sharps (F#, C#)',
    accidentalCount: 2,
    accidentalsList: ['F#', 'C#'],
    thaat: 'Kalyan variant',
    thaatExplanation: 'Adds C# (leading tone to D). Guitar favorite due to open D and G strings resonating.',
    angleDeg: 60,
  },
  {
    index: 3,
    majorKey: 'A',
    minorKey: 'F#',
    majorDisplay: 'A',
    minorDisplay: 'F#m',
    accidentals: '3 Sharps (F#, C#, G#)',
    accidentalCount: 3,
    accidentalsList: ['F#', 'C#', 'G#'],
    thaat: 'Marwa / Kalyan crossover',
    thaatExplanation: 'Bright, energetic key. All open bass strings (E, A, D) harmonize with relative minor F#m.',
    angleDeg: 90,
  },
  {
    index: 4,
    majorKey: 'E',
    minorKey: 'C#',
    majorDisplay: 'E',
    minorDisplay: 'C#m',
    accidentals: '4 Sharps (F#, C#, G#, D#)',
    accidentalCount: 4,
    accidentalsList: ['F#', 'C#', 'G#', 'D#'],
    thaat: 'Purvi variant',
    thaatExplanation: 'The native guitar key! Lowest string is E2, providing the richest acoustic fundamental frequencies.',
    angleDeg: 120,
  },
  {
    index: 5,
    majorKey: 'B',
    minorKey: 'G#',
    majorDisplay: 'B',
    minorDisplay: 'G#m',
    accidentals: '5 Sharps (F#, C#, G#, D#, A#)',
    accidentalCount: 5,
    accidentalsList: ['F#', 'C#', 'G#', 'D#', 'A#'],
    thaat: 'Bhairav / Marwa resonance',
    thaatExplanation: 'Enharmonic to Cb Major. Unlocks intricate barre positions on fret 2 and 7.',
    angleDeg: 150,
  },
  {
    index: 6,
    majorKey: 'F#',
    minorKey: 'D#',
    majorDisplay: 'F# / Gb',
    minorDisplay: 'D#m / Ebm',
    accidentals: '6 Sharps or 6 Flats',
    accidentalCount: 6,
    accidentalsList: ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'],
    thaat: 'Todi / Purvi center',
    thaatExplanation: 'The exact opposite pole (Tritone distance - 6 semitones) from C Major!',
    angleDeg: 180,
  },
  {
    index: 7,
    majorKey: 'C#',
    minorKey: 'A#',
    majorDisplay: 'Db / C#',
    minorDisplay: 'Bbm / A#m',
    accidentals: '5 Flats (Bb, Eb, Ab, Db, Gb)',
    accidentalCount: -5,
    accidentalsList: ['Bb', 'Eb', 'Ab', 'Db', 'Gb'],
    thaat: 'Bhairav Thaat',
    thaatExplanation: 'Features Komal re (Db) and Komal dha (Ab). Deep, meditative Indian morning raagas reside here.',
    angleDeg: 210,
  },
  {
    index: 8,
    majorKey: 'G#',
    minorKey: 'F',
    majorDisplay: 'Ab',
    minorDisplay: 'Fm',
    accidentals: '4 Flats (Bb, Eb, Ab, Db)',
    accidentalCount: -4,
    accidentalsList: ['Bb', 'Eb', 'Ab', 'Db'],
    thaat: 'Bhairavi variant',
    thaatExplanation: 'Warm, soulful harmonic balance. Relative minor Fm is the classic guitar jazz ballad key.',
    angleDeg: 240,
  },
  {
    index: 9,
    majorKey: 'D#',
    minorKey: 'C',
    majorDisplay: 'Eb',
    minorDisplay: 'Cm',
    accidentals: '3 Flats (Bb, Eb, Ab)',
    accidentalCount: -3,
    accidentalsList: ['Bb', 'Eb', 'Ab'],
    thaat: 'Asavari Thaat',
    thaatExplanation: 'Natural minor twin (Komal ga, dha, ni). Standard tuning of brass instruments and blues shuffles.',
    angleDeg: 270,
  },
  {
    index: 10,
    majorKey: 'A#',
    minorKey: 'G',
    majorDisplay: 'Bb',
    minorDisplay: 'Gm',
    accidentals: '2 Flats (Bb, Eb)',
    accidentalCount: -2,
    accidentalsList: ['Bb', 'Eb'],
    thaat: 'Kafi Thaat',
    thaatExplanation: 'Dorian mode atmosphere with Komal ga and ni. The foundation of rock and funk grooves.',
    angleDeg: 300,
  },
  {
    index: 11,
    majorKey: 'F',
    minorKey: 'D',
    majorDisplay: 'F',
    minorDisplay: 'Dm',
    accidentals: '1 Flat (Bb)',
    accidentalCount: -1,
    accidentalsList: ['Bb'],
    thaat: 'Khamaj Thaat',
    thaatExplanation: 'Subdominant (IV) of C Major. Moving 1 fourth counter-clockwise introduces Komal Ni (Bb).',
    angleDeg: 330,
  },
];


