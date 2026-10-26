/**
 * Pure logic behind the advanced theory labs (transposer, CAGED, drone/jam pad, ear trainer).
 * Kept free of React / Web Audio so it can be unit-tested.
 */

import { CHORD_DATABASE, INDIAN_SWARAS, NOTE_NAMES, type NoteName } from '../constants';
import { calculateBarreChord, deriveDiatonicHarmony, deriveTriad, getFretNote } from './guitarTheory';

const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
const LETTER_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export type SimpleChordType = 'Major' | 'Minor' | 'Diminished';

const idx = (n: string) => NOTE_NAMES.indexOf(n as NoteName);
const mod12 = (n: number) => ((n % 12) + 12) % 12;

export function spellNote(index: number, useFlats: boolean): string {
  const i = mod12(index);
  return useFlats ? FLAT_NAMES[i] : NOTE_NAMES[i];
}

/** Major keys conventionally written with flats. */
export function keyUsesFlats(key: NoteName): boolean {
  return ['F', 'A#', 'D#', 'G#', 'C#'].includes(key);
}

export function semitonesBetween(from: NoteName, to: NoteName): number {
  return mod12(idx(to) - idx(from));
}

// ---------------------------------------------------------------------------
// Lab 1: transposer
// ---------------------------------------------------------------------------

const ROOT_RE = /^([A-Ga-g])([#b♯♭]?)$/;

function transposeRoot(root: string, semitones: number, useFlats: boolean): string | null {
  const m = ROOT_RE.exec(root);
  if (!m) return null;
  const acc = m[2] === '#' || m[2] === '♯' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0;
  return spellNote(LETTER_INDEX[m[1].toUpperCase()] + acc + semitones, useFlats);
}

/** What may follow a chord root: quality words, extensions, alterations and brackets ("m7b5", "sus4", "add9", "(#11)"). */
const SUFFIX_RE = /^(?:maj|min|dim|aug|sus|add|alt|no|[mM+\-°ø△Δ#b♯♭()\d,.])*$/i;

/** Chord symbol with the root (and any slash basses) moved by `semitones`, or null when it is not a chord. */
function transposeChordStrict(symbol: string, semitones: number, useFlats: boolean): string | null {
  const [main, ...basses] = symbol.split('/');
  const m = /^([A-Ga-g][#b♯♭]?)(.*)$/.exec(main);
  if (!m || !SUFFIX_RE.test(m[2])) return null;
  const root = transposeRoot(m[1], semitones, useFlats);
  if (!root) return null;
  let out = root + m[2];
  for (const bass of basses) {
    const moved = transposeRoot(bass, semitones, useFlats);
    if (moved !== null) out += `/${moved}`;
    else if (/^\d+$/.test(bass)) out += `/${bass}`; // "C6/9" is not a slash chord
    else return null;
  }
  return out;
}

/** "Am7" +2 -> "Bm7"; "C/E" +2 -> "D/F#"; "am", "bb7", "C/G/B" are read too. Unknown tokens ("N.C.") come back unchanged. */
export function transposeChordSymbol(symbol: string, semitones: number, useFlats = false): string {
  return transposeChordStrict(symbol, semitones, useFlats) ?? symbol;
}

export function parseProgression(text: string): string[] {
  return text.split(/[\s,|]+/).filter(Boolean);
}

export function transposeProgression(text: string, semitones: number, useFlats = false): string[] {
  return parseProgression(text).map(s => transposeChordSymbol(s, semitones, useFlats));
}

export interface TransposedToken {
  input: string;
  /** Transposed symbol; equals `input` when the token is not a chord */
  output: string;
  /** false when the token could not be read as a chord ("no chord" markers count as readable) */
  ok: boolean;
}

/** "N.C." / "NC" (no chord) and "%" (repeat) are valid in a chart and pass through untouched. */
const PASSTHROUGH_RE = /^(?:n\.?c\.?|%)$/i;

/** Like transposeProgression, but reports which tokens could not be read so the UI can flag them. */
export function transposeProgressionDetailed(
  text: string,
  semitones: number,
  useFlats = false
): { tokens: TransposedToken[]; unparsed: string[] } {
  const tokens = parseProgression(text).map((input): TransposedToken => {
    if (PASSTHROUGH_RE.test(input)) return { input, output: input, ok: true };
    const out = transposeChordStrict(input, semitones, useFlats);
    return out === null ? { input, output: input, ok: false } : { input, output: out, ok: true };
  });
  return { tokens, unparsed: tokens.filter(t => !t.ok).map(t => t.input) };
}

/**
 * Whether a triad's notes are conventionally written with flats: G minor is G-Bb-D, not G-A#-D.
 * Minor follows its relative major's key signature, diminished its "vii° of" major key (C dim = C-Eb-Gb),
 * augmented always uses the raised 5th (C aug = C-E-G#).
 */
export function triadUsesFlats(root: NoteName, type: SimpleChordType | 'Augmented'): boolean {
  if (type === 'Augmented') return false;
  const shift = type === 'Minor' ? 3 : type === 'Diminished' ? 1 : 0;
  return keyUsesFlats(NOTE_NAMES[mod12(idx(root) + shift)]);
}

export interface CapoOption {
  shapeKey: NoteName;
  capo: number;
}

/** Easy open-chord key + capo fret combos that sound in `target`. */
export function capoOptions(target: NoteName, maxCapo = 7): CapoOption[] {
  const shapes: NoteName[] = ['C', 'G', 'D', 'A', 'E'];
  return shapes
    .map(shapeKey => ({ shapeKey, capo: semitonesBetween(shapeKey, target) }))
    .filter(o => o.capo <= maxCapo)
    .sort((a, b) => a.capo - b.capo);
}

export interface BorrowedChord {
  numeral: string;
  root: NoteName;
  display: string;
  type: SimpleChordType;
  note: string;
}

/** Modal interchange: chords borrowed from the parallel natural minor of `key`. */
export function borrowedChords(key: NoteName): BorrowedChord[] {
  const k = idx(key);
  const keyFlats = keyUsesFlats(key);
  // i / iv / v share their letters with the major key, so they follow the key's own spelling (F# major: F#m, Bm, C#m);
  // only the lowered degrees (♭III, ♭VI, ♭VII) are written with flats.
  const defs: { numeral: string; offset: number; type: SimpleChordType; note: string; flat: boolean }[] = [
    { numeral: 'i', offset: 0, type: 'Minor', note: 'Tonic turned dark', flat: keyFlats },
    { numeral: '♭III', offset: 3, type: 'Major', note: 'Relative major of the parallel minor', flat: true },
    { numeral: 'iv', offset: 5, type: 'Minor', note: 'The classic "minor four" ache', flat: keyFlats },
    { numeral: 'v', offset: 7, type: 'Minor', note: 'Softer, modal dominant', flat: keyFlats },
    { numeral: '♭VI', offset: 8, type: 'Major', note: 'Wide, cinematic lift', flat: true },
    { numeral: '♭VII', offset: 10, type: 'Major', note: 'Mixolydian / rock flavour', flat: true },
  ];
  return defs.map(d => ({
    numeral: d.numeral,
    root: NOTE_NAMES[mod12(k + d.offset)],
    display: spellNote(k + d.offset, d.flat) + (d.type === 'Minor' ? 'm' : ''),
    type: d.type,
    note: d.note,
  }));
}

export interface PivotChord {
  root: NoteName;
  type: SimpleChordType;
  numeralInA: string;
  numeralInB: string;
}

/** Chords that live diatonically in both keys: the smooth way to modulate. */
export function pivotChords(keyA: NoteName, keyB: NoteName): PivotChord[] {
  const a = deriveDiatonicHarmony(keyA);
  const b = deriveDiatonicHarmony(keyB);
  const out: PivotChord[] = [];
  a.forEach(ca => {
    const cb = b.find(x => x.rootNote === ca.rootNote && x.chordType === ca.chordType);
    if (cb) out.push({ root: ca.rootNote, type: ca.chordType, numeralInA: ca.degreeNumeral, numeralInB: cb.degreeNumeral });
  });
  return out;
}

/** Chord symbol -> simple triad quality the synth can voice. */
export function symbolToChord(symbol: string): { root: NoteName; type: SimpleChordType } | null {
  const m = /^([A-Ga-g])([#b♯♭]?)(.*?)(?:\/.*)?$/.exec(symbol);
  if (!m) return null;
  const acc = m[2] === '#' || m[2] === '♯' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0;
  const root = NOTE_NAMES[mod12(LETTER_INDEX[m[1].toUpperCase()] + acc)];
  const rest = m[3];
  const lower = rest.toLowerCase();
  let type: SimpleChordType = 'Major';
  if (lower.startsWith('dim') || rest.startsWith('°')) type = 'Diminished';
  else if ((rest.startsWith('m') && !lower.startsWith('maj')) || lower.startsWith('min') || rest.startsWith('-')) type = 'Minor';
  return { root, type };
}

/** Frequencies low-E to high-E (-1 = muted) for a strum of `root` + `type`. */
export function getChordFrequencies(root: NoteName, type: SimpleChordType): number[] {
  const t = type === 'Diminished' ? 'Dim' : type;
  const voicing =
    CHORD_DATABASE.find(c => c.root === root && c.type === t && c.category === 'open') ??
    CHORD_DATABASE.find(c => c.root === root && c.type === t);
  let frets = voicing?.frets;
  if (!frets && type !== 'Diminished') {
    frets = calculateBarreChord(root, type === 'Minor' ? 'E-Minor' : 'E-Major').frets;
  }
  if (frets) {
    const f = frets;
    return [6, 5, 4, 3, 2, 1].map((s, i) => (f[i] >= 0 ? getFretNote(s, f[i]).frequency : -1));
  }
  const tri = deriveTriad(root, type);
  return tri.notes.map(n => saFrequency(n as NoteName));
}

// ---------------------------------------------------------------------------
// Lab 2: CAGED
// ---------------------------------------------------------------------------

export type CagedId = 'C' | 'A' | 'G' | 'E' | 'D';

export interface CagedShape {
  id: CagedId;
  root: NoteName;
  /** Open-position major chord, index 0 = low E ... 5 = high E, -1 = muted */
  frets: number[];
}

export const CAGED_SHAPES: CagedShape[] = [
  { id: 'C', root: 'C', frets: [-1, 3, 2, 0, 1, 0] },
  { id: 'A', root: 'A', frets: [-1, 0, 2, 2, 2, 0] },
  { id: 'G', root: 'G', frets: [3, 2, 0, 0, 0, 3] },
  { id: 'E', root: 'E', frets: [0, 2, 2, 1, 0, 0] },
  { id: 'D', root: 'D', frets: [-1, -1, 0, 2, 3, 2] },
];

export interface CagedPosition {
  shapeId: CagedId;
  offset: number;
  frets: number[];
  /** lowest / highest fret used by the shape (excluding muted) */
  minFret: number;
  maxFret: number;
}

export const CAGED_MAX_FRET = 15;

/** Every placement of every CAGED shape for a major chord rooted on `target`, within the first 15 frets. */
export function cagedPositions(target: NoteName): CagedPosition[] {
  const out: CagedPosition[] = [];
  CAGED_SHAPES.forEach(shape => {
    const base = semitonesBetween(shape.root, target);
    [base, base + 12].forEach(offset => {
      const frets = shape.frets.map(f => (f < 0 ? -1 : f + offset));
      const played = frets.filter(f => f >= 0);
      const maxFret = Math.max(...played);
      if (maxFret > CAGED_MAX_FRET) return;
      out.push({ shapeId: shape.id, offset, frets, minFret: Math.min(...played), maxFret });
    });
  });
  return out.sort((a, b) => a.minFret - b.minFret || a.maxFret - b.maxFret);
}

/** Notes (root, third, fifth) of the major triad for a root. */
export function majorTriadNotes(root: NoteName): [NoteName, NoteName, NoteName] {
  const i = idx(root);
  return [NOTE_NAMES[i], NOTE_NAMES[mod12(i + 4)], NOTE_NAMES[mod12(i + 7)]];
}

// ---------------------------------------------------------------------------
// Lab 3: tanpura / jam pad
// ---------------------------------------------------------------------------

const SWARA_OFFSETS: Record<string, number> = Object.fromEntries(
  INDIAN_SWARAS.map(s => [s.shortName, s.semitoneOffset])
);

/** "Sa" -> 0, "Ga" -> 4, "Sa'" -> 12. Unknown names return null. */
export function swaraOffset(name: string): number | null {
  if (name === "Sa'") return 12;
  return name in SWARA_OFFSETS ? SWARA_OFFSETS[name] : null;
}

/**
 * Turns an arohana / avarohana note list into absolute semitone offsets from Sa,
 * making the line monotonic (ascending: each note above the previous one,
 * descending: each below) and starting a rising line in the lower octave when needed
 * (e.g. Yaman's "Ni Re Ga ...").
 */
export function sequenceOffsets(names: string[], direction: 'asc' | 'desc'): number[] {
  const raw = names.map(swaraOffset).filter((n): n is number => n !== null);
  const out: number[] = [];
  raw.forEach((v, i) => {
    let value = v;
    if (i === 0) {
      if (direction === 'asc' && raw.length > 1 && v > raw[1] && v !== 12) value = v - 12;
    } else if (direction === 'asc') {
      while (value <= out[i - 1]) value += 12;
    } else {
      while (value >= out[i - 1]) value -= 12;
    }
    out.push(value);
  });
  return out;
}

/** Unique pad offsets (0-11) used by a raaga. */
export function padOffsets(arohana: string[], avarohana: string[]): number[] {
  const set = new Set<number>();
  [...arohana, ...avarohana].forEach(n => {
    const o = swaraOffset(n);
    if (o !== null) set.add(o === 12 ? 0 : o);
  });
  return [...set].sort((a, b) => a - b);
}

export const SA_BASE_HZ = 130.81; // C3

export function saFrequency(sa: NoteName): number {
  return SA_BASE_HZ * Math.pow(2, idx(sa) / 12);
}

export interface TaalDef {
  id: string;
  name: string;
  beats: number;
  /** vibhag (section) lengths */
  grouping: number[];
  /** beats (1-based) that are khali (the "empty"/wave beat) */
  khali: number[];
}

export const TAALS: TaalDef[] = [
  { id: 'keherwa', name: 'Keherwa', beats: 8, grouping: [4, 4], khali: [5] },
  { id: 'dadra', name: 'Dadra', beats: 6, grouping: [3, 3], khali: [4] },
  { id: 'rupak', name: 'Rupak', beats: 7, grouping: [3, 2, 2], khali: [1] },
  { id: 'jhaptal', name: 'Jhaptal', beats: 10, grouping: [2, 3, 2, 3], khali: [6] },
  { id: 'teental', name: 'Teental', beats: 16, grouping: [4, 4, 4, 4], khali: [9] },
];

/** 1-based beat positions where a new vibhag starts. */
export function vibhagStarts(taal: TaalDef): number[] {
  const starts: number[] = [];
  let pos = 1;
  taal.grouping.forEach(g => {
    starts.push(pos);
    pos += g;
  });
  return starts;
}

// ---------------------------------------------------------------------------
// Lab 4: ear trainer
// ---------------------------------------------------------------------------

export interface IntervalDef {
  semitones: number;
  short: string;
  name: string;
  character: string;
  swara: string;
}

const INTERVAL_META: { short: string; name: string; character: string }[] = [
  { short: 'P1', name: 'Unison', character: 'Same note, perfectly fused' },
  { short: 'm2', name: 'Minor 2nd', character: 'Tense, grinding, one fret apart' },
  { short: 'M2', name: 'Major 2nd', character: 'Open, stepwise, a whole tone' },
  { short: 'm3', name: 'Minor 3rd', character: 'Dark, sad: the heart of minor chords' },
  { short: 'M3', name: 'Major 3rd', character: 'Bright, happy: the heart of major chords' },
  { short: 'P4', name: 'Perfect 4th', character: 'Stable but suspended, hollow' },
  { short: 'TT', name: 'Tritone', character: 'Unstable, ominous, begs to resolve' },
  { short: 'P5', name: 'Perfect 5th', character: 'Strong, open, power-chord sound' },
  { short: 'm6', name: 'Minor 6th', character: 'Bittersweet, yearning' },
  { short: 'M6', name: 'Major 6th', character: 'Warm, hopeful' },
  { short: 'm7', name: 'Minor 7th', character: 'Bluesy, unresolved' },
  { short: 'M7', name: 'Major 7th', character: 'Dreamy, a half step from home' },
  { short: 'P8', name: 'Octave', character: 'The same note, higher' },
];

export const INTERVALS: IntervalDef[] = INTERVAL_META.map((m, semitones) => ({
  semitones,
  ...m,
  swara: semitones === 12 ? "Sa'" : INDIAN_SWARAS[semitones].shortName,
}));

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export interface IntervalQuestion {
  rootMidi: number;
  semitones: number;
  direction: 'up' | 'down';
}

export function makeIntervalQuestion(
  allowed: number[],
  direction: 'up' | 'down' | 'mixed' = 'up',
  rng: () => number = Math.random
): IntervalQuestion {
  const pool = allowed.length ? allowed : [7];
  const semitones = pool[Math.floor(rng() * pool.length)];
  const dir = direction === 'mixed' ? (rng() < 0.5 ? 'up' : 'down') : direction;
  // Root between C3 (48) and E4 (64): comfortable guitar range; keep the pair inside E2..E6
  const rootMidi = 48 + Math.floor(rng() * 17) + (dir === 'down' ? 12 : 0);
  return { rootMidi, semitones, direction: dir };
}

export function intervalSecondMidi(q: IntervalQuestion): number {
  return q.direction === 'up' ? q.rootMidi + q.semitones : q.rootMidi - q.semitones;
}

export interface BlindFretQuestion {
  stringNumber: number;
  fret: number;
  note: NoteName;
  frequency: number;
}

export function makeBlindFretQuestion(maxFret = 12, rng: () => number = Math.random): BlindFretQuestion {
  const stringNumber = 1 + Math.floor(rng() * 6);
  const fret = Math.floor(rng() * (maxFret + 1));
  const { note, frequency } = getFretNote(stringNumber, fret);
  return { stringNumber, fret, note, frequency };
}

/** The same pitch class can sit on fret 0 and 12; any fret producing the same note is right. */
export function isBlindFretCorrect(q: BlindFretQuestion, guessedFret: number): boolean {
  return getFretNote(q.stringNumber, guessedFret).note === q.note;
}
