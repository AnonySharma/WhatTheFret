/**
 * Pure logic behind the Capo lab: what a capo does to open strings and chord shapes, and
 * which capo fret turns a hard progression into easy open shapes. No React / Web Audio.
 */

import { CHORD_DATABASE, GUITAR_STRINGS, NOTE_NAMES } from '../constants';
import { spellNote, transposeChordSymbol } from './labs';

const LETTER_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** Capo frets offered in the UI (0 = no capo). */
export const MAX_CAPO_FRET = 9;
/** Frets that are comfortable in practice; the ranking only considers these. */
export const PRACTICAL_CAPO_FRET = 7;

// ---------------------------------------------------------------------------
// Chord symbol parsing
// ---------------------------------------------------------------------------

export type CapoQuality = 'maj' | 'm' | '7' | 'm7' | 'maj7' | 'sus2' | 'sus4' | 'add9' | '5' | 'dim' | 'aug';

const QUALITY_ALIASES: Record<string, CapoQuality> = {
  '': 'maj',
  maj: 'maj',
  M: 'maj',
  m: 'm',
  min: 'm',
  '-': 'm',
  '7': '7',
  dom7: '7',
  m7: 'm7',
  min7: 'm7',
  '-7': 'm7',
  maj7: 'maj7',
  M7: 'maj7',
  '△7': 'maj7',
  sus2: 'sus2',
  sus4: 'sus4',
  sus: 'sus4',
  add9: 'add9',
  '5': '5',
  dim: 'dim',
  '°': 'dim',
  aug: 'aug',
  '+': 'aug',
};

const QUALITY_SUFFIX: Record<CapoQuality, string> = {
  maj: '',
  m: 'm',
  '7': '7',
  m7: 'm7',
  maj7: 'maj7',
  sus2: 'sus2',
  sus4: 'sus4',
  add9: 'add9',
  '5': '5',
  dim: 'dim',
  aug: 'aug',
};

/** Quality name as stored in CHORD_DATABASE. */
const DB_TYPE: Record<CapoQuality, string> = {
  maj: 'Major',
  m: 'Minor',
  '7': '7th',
  m7: 'm7',
  maj7: 'Maj7',
  sus2: 'Sus2',
  sus4: 'Sus4',
  add9: 'Add9',
  '5': '5',
  dim: 'Dim',
  aug: 'Aug',
};

export interface ParsedSymbol {
  /** Pitch class of the root, 0 = C. */
  root: number;
  quality: CapoQuality;
}

/** "Bbm7" -> { root: 10, quality: 'm7' }. Slash bass notes are ignored. Anything unknown returns null. */
export function parseSymbol(symbol: string): ParsedSymbol | null {
  const m = /^([A-G])([#b♯♭]?)([^/]*)(?:\/[A-G][#b♯♭]?)?$/.exec(symbol.trim());
  if (!m) return null;
  const quality = QUALITY_ALIASES[m[3]];
  if (!quality) return null;
  const acc = m[2] === '#' || m[2] === '♯' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0;
  return { root: mod12(LETTER_INDEX[m[1]] + acc), quality };
}

const FLAT_MAJOR_ROOTS = new Set([5, 10, 3, 8, 1]); // F Bb Eb Ab Db
const FLAT_MINOR_ROOTS = new Set([2, 7, 0, 5, 10, 3]); // Dm Gm Cm Fm Bbm Ebm

/** Whether a chord is conventionally written with flats (F, Bb, Eb, Ab, Db, Dm, Gm, Cm, Fm...). */
export function chordPrefersFlats(root: number, quality: CapoQuality = 'maj'): boolean {
  const minorish = quality === 'm' || quality === 'm7' || quality === 'dim';
  return (minorish ? FLAT_MINOR_ROOTS : FLAT_MAJOR_ROOTS).has(mod12(root));
}

// ---------------------------------------------------------------------------
// Capo maths
// ---------------------------------------------------------------------------

/** Root name that sounds when `shapeRoot` is fingered with the capo on `capoFret`. Null if unparsable. */
export function soundingRoot(shapeRoot: string, capoFret: number, preferFlats?: boolean): string | null {
  const p = parseSymbol(shapeRoot);
  if (!p) return null;
  const root = mod12(p.root + capoFret);
  return spellNote(root, preferFlats ?? chordPrefersFlats(root, p.quality));
}

/**
 * The chord you hear when you finger `shapeSymbol` with the capo on `capoFret`.
 * Spelling follows the sounding key unless `preferFlats` is given. Unparsable symbols come back unchanged.
 */
export function soundingChord(shapeSymbol: string, capoFret: number, preferFlats?: boolean): string {
  const p = parseSymbol(shapeSymbol);
  if (!p) return shapeSymbol;
  if (mod12(capoFret) === 0 && preferFlats === undefined) return shapeSymbol;
  const flats = preferFlats ?? chordPrefersFlats(p.root + capoFret, p.quality);
  return transposeChordSymbol(shapeSymbol, capoFret, flats);
}

/** The shape you must finger to sound `targetSymbol` with the capo on `capoFret`. Unparsable symbols come back unchanged. */
export function shapeForTarget(targetSymbol: string, capoFret: number, preferFlats?: boolean): string {
  const p = parseSymbol(targetSymbol);
  if (!p) return targetSymbol;
  if (mod12(capoFret) === 0 && preferFlats === undefined) return targetSymbol;
  const flats = preferFlats ?? chordPrefersFlats(p.root - capoFret, p.quality);
  return transposeChordSymbol(targetSymbol, -capoFret, flats);
}

/** Names of the six open strings (low E first) once the capo is on `capoFret`. */
export function openStringNames(capoFret: number, preferFlats = false): string[] {
  return GUITAR_STRINGS.map(s => spellNote(NOTE_NAMES.indexOf(s.openNote) + capoFret, preferFlats));
}

/**
 * Frequencies (low E first, -1 = muted) when `frets` (relative to the capo; 0 = open string) are
 * played with the capo on `capoFret`. Each capo fret raises every string by one semitone.
 */
export function capoFrequencies(frets: number[], capoFret: number): number[] {
  return GUITAR_STRINGS.map((s, i) => {
    const f = frets[i];
    if (f === undefined || f < 0) return -1;
    return s.openFrequencyHz * Math.pow(2, (f + capoFret) / 12);
  });
}

// ---------------------------------------------------------------------------
// Open shapes
// ---------------------------------------------------------------------------

/** Easy open shapes (root name + quality), the ones worth hunting for with a capo. */
const EASY_OPEN = new Set([
  'C', 'A', 'G', 'E', 'D',
  'Am', 'Em', 'Dm',
  'A7', 'B7', 'C7', 'D7', 'E7', 'G7',
  'Am7', 'Em7', 'Dm7',
  'Cmaj7', 'Dmaj7', 'Amaj7', 'Fmaj7',
  'Asus2', 'Dsus2', 'Asus4', 'Dsus4', 'Esus4', 'Gsus4',
  'Cadd9',
]);

/** Is this chord an easy open shape (slash bass ignored)? Unparsable symbols are not. */
export function isEasyOpenShape(symbol: string): boolean {
  const p = parseSymbol(symbol);
  return p !== null && EASY_OPEN.has(NOTE_NAMES[p.root] + QUALITY_SUFFIX[p.quality]);
}

/** Open voicings the chord database only has as barre shapes. Index 0 = low E, -1 = muted. */
const EXTRA_OPEN_VOICINGS: Record<string, number[]> = {
  A7: [-1, 0, 2, 0, 2, 0],
  D7: [-1, -1, 0, 2, 1, 2],
  Em7: [0, 2, 0, 0, 0, 0],
  Amaj7: [-1, 0, 2, 1, 2, 0],
  Asus4: [-1, 0, 2, 2, 3, 0],
};

/** Fingering (low E first, -1 = muted) for a chord shape: open voicing first, then the lowest-position one. Null if none. */
export function shapeVoicing(shapeSymbol: string): number[] | null {
  const p = parseSymbol(shapeSymbol);
  if (!p) return null;
  const extra = EXTRA_OPEN_VOICINGS[NOTE_NAMES[p.root] + QUALITY_SUFFIX[p.quality]];
  if (extra) return [...extra];
  const matches = CHORD_DATABASE.filter(c => c.root === NOTE_NAMES[p.root] && c.type === DB_TYPE[p.quality]);
  if (!matches.length) return null;
  const best =
    matches.find(c => c.category === 'open') ??
    [...matches].sort((a, b) => Math.max(...a.frets) - Math.max(...b.frets))[0];
  return [...best.frets];
}

/** Frequencies of a strum of `shapeSymbol` with the capo on `capoFret` (muted strings stay -1). Null without a voicing. */
export function shapeFrequencies(shapeSymbol: string, capoFret: number): number[] | null {
  const frets = shapeVoicing(shapeSymbol);
  return frets ? capoFrequencies(frets, capoFret) : null;
}

// ---------------------------------------------------------------------------
// Ranking: which capo fret makes a progression easy?
// ---------------------------------------------------------------------------

export interface CapoRanking {
  fret: number;
  /** Shapes to finger for each chord of the progression, same order. */
  shapes: string[];
  /** How many chords become easy open shapes. */
  score: number;
  total: number;
}

/**
 * Capo frets 0..maxFret ranked by how many chords of `progression` turn into easy open shapes
 * (ties: lower fret first). Unparsable chords never score. An empty progression returns [].
 */
export function rankCapoOptions(progression: string[], maxFret = PRACTICAL_CAPO_FRET): CapoRanking[] {
  const chords = progression.filter(s => s.trim().length > 0);
  if (!chords.length) return [];
  const out: CapoRanking[] = [];
  for (let fret = 0; fret <= maxFret; fret++) {
    const shapes = chords.map(c => shapeForTarget(c, fret));
    out.push({ fret, shapes, score: shapes.filter(isEasyOpenShape).length, total: chords.length });
  }
  return out.sort((a, b) => b.score - a.score || a.fret - b.fret);
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export interface CapoQuizQuestion {
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
}

/** Small deterministic PRNG so a seed always gives the same question. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const QUIZ_SHAPES = ['C', 'G', 'D', 'A', 'E', 'Am', 'Em', 'Dm'];

function shuffled<T>(items: T[], rng: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** One multiple-choice question; the same `seed` always gives the same question. */
export function quizQuestion(seed: number = Math.floor(Math.random() * 2 ** 32)): CapoQuizQuestion {
  const rng = mulberry32(seed);
  const pick = (xs: string[]) => xs[Math.floor(rng() * xs.length)];
  const shape = pick(QUIZ_SHAPES);
  const capo = 1 + Math.floor(rng() * 7); // 1..7
  const kind = Math.floor(rng() * 3);

  const finish = (answer: string, distractors: string[], prompt: string, explanation: string): CapoQuizQuestion => {
    const wrong = [...new Set(distractors)].filter(d => d !== answer);
    const options = shuffled([answer, ...wrong.slice(0, 3)], rng);
    return { prompt, options, answer, explanation };
  };

  if (kind === 0) {
    // shape + capo -> sounding chord
    const answer = soundingChord(shape, capo);
    const distractors = [
      shape, // forgot the capo
      soundingChord(shape, capo + 1),
      soundingChord(shape, capo - 1 < 0 ? capo + 2 : capo - 1),
      soundingChord(shape, capo + 2),
      soundingChord(shape, capo + 3),
    ];
    return finish(
      answer,
      distractors,
      `You play a ${shape} shape with the capo on fret ${capo}. What chord is sounding?`,
      `Each capo fret adds a semitone, so ${shape} + ${capo} = ${answer}.`
    );
  }

  if (kind === 1) {
    // want target, capo given -> which shape
    const target = soundingChord(shape, capo);
    const distractors = [target, ...shuffled(QUIZ_SHAPES.filter(s => s !== shape), rng)];
    return finish(
      shape,
      distractors,
      `The song is in ${target} and your capo is on fret ${capo}. Which shape do you finger?`,
      `Go down ${capo} semitone${capo === 1 ? '' : 's'} from ${target} and you land on ${shape}.`
    );
  }

  // shape + wanted sound -> which capo fret
  const target = soundingChord(shape, capo);
  const answer = `Capo ${capo}`;
  const distractors = [capo - 1, capo + 1, capo - 2, capo + 2, capo + 3]
    .filter(f => f >= 0 && f <= MAX_CAPO_FRET)
    .map(f => (f === 0 ? 'No capo' : `Capo ${f}`));
  return finish(
    answer,
    distractors,
    `You want to hear ${target} while fingering a ${shape} shape. Where does the capo go?`,
    `${shape} needs to rise ${capo} semitone${capo === 1 ? '' : 's'} to reach ${target}, so the capo goes on fret ${capo}.`
  );
}
