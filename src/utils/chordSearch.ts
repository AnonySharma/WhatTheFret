import type { ChordVoicing } from '../constants';

export interface ParsedChordSymbol {
  root: string; // sharp spelling, e.g. 'A#'
  /** Canonical chord types this symbol stands for; empty = bare root ("A", "F#") */
  types: string[];
}

const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
  Fb: 'E',
};

const SHARP_EQUIVALENT: Record<string, string> = { 'E#': 'F', 'B#': 'C' };

/** Suffix (lowercased, no spaces) -> chord types used in CHORD_DATABASE. */
const SUFFIX_TYPES: Record<string, string[]> = {
  '': [],
  maj: ['Major'],
  major: ['Major'],
  m: ['Minor'],
  min: ['Minor'],
  minor: ['Minor'],
  '-': ['Minor'],
  '7': ['7th', '7'],
  dom7: ['7th', '7'],
  dominant7: ['7th', '7'],
  m7: ['m7'],
  min7: ['m7'],
  minor7: ['m7'],
  '-7': ['m7'],
  maj7: ['Maj7'],
  major7: ['Maj7'],
  '△7': ['Maj7'],
  'Δ': ['Maj7'],
  sus: ['Sus4'],
  sus4: ['Sus4'],
  sus2: ['Sus2'],
  add9: ['Add9'],
  aug: ['Aug'],
  augmented: ['Aug'],
  '+': ['Aug'],
  dim: ['Dim'],
  diminished: ['Dim'],
  '°': ['Dim'],
  '5': ['5'],
  power: ['5'],
};

/**
 * Parses a chord symbol such as "Am", "a minor", "F#m7", "Bbmaj7", "Dsus4", "G".
 * Returns null when the text is not a recognisable chord symbol (so callers can
 * fall back to free-text search, e.g. "barre", "power", "sus").
 */
export function parseChordSymbol(input: string): ParsedChordSymbol | null {
  const text = input.replace(/\s+/g, '');
  const m = /^([A-Ga-g])([#♯b♭]?)(.*)$/.exec(text);
  if (!m) return null;

  const letter = m[1].toUpperCase();
  let accidental = m[2].replace('♯', '#').replace('♭', 'b');
  let rest = m[3];

  // "Bb" is B-flat, but "bm"/"bdim" are B minor / B diminished (no accidental char there).
  let root = letter + accidental;
  if (accidental === 'b') root = FLAT_TO_SHARP[letter + 'b'] ?? root;
  if (SHARP_EQUIVALENT[root]) root = SHARP_EQUIVALENT[root];

  // Case matters only for M (major) vs m (minor)
  let types: string[] | undefined;
  if (rest === 'M') types = ['Major'];
  else if (rest === 'M7') types = ['Maj7'];
  else types = SUFFIX_TYPES[rest.toLowerCase()];

  if (!types) return null;
  return { root, types };
}

/** Highest fret used: open-position chords (0-4) sort ahead of movable shapes up the neck. */
const position = (c: ChordVoicing) => Math.max(0, ...c.frets);

const CATEGORY_RANK: Record<string, number> = { open: 0, 'barre-e': 1, 'barre-a': 1, triad: 2, jazz: 3 };

/**
 * Filters and ranks chords for a search query.
 * - Chord symbols ("Am", "A minor", "F#m7") match by root + type (enharmonic-aware).
 * - A bare root ("A") lists every chord on that root, Major then Minor first.
 * - Anything else falls back to a substring match on name and type.
 */
export function searchChords(chords: ChordVoicing[], query: string): ChordVoicing[] {
  const q = query.trim();
  if (!q) return chords;

  const parsed = parseChordSymbol(q);
  if (parsed) {
    const matches = chords.filter(
      c => c.root === parsed.root && (parsed.types.length === 0 || parsed.types.includes(c.type))
    );
    if (matches.length > 0 || parsed.types.length > 0) {
      const typeRank = (c: ChordVoicing) =>
        parsed.types.length > 0 ? 0 : c.type === 'Major' ? 0 : c.type === 'Minor' ? 1 : 2;
      return [...matches].sort(
        (a, b) =>
          typeRank(a) - typeRank(b) ||
          position(a) - position(b) ||
          (CATEGORY_RANK[a.category] ?? 9) - (CATEGORY_RANK[b.category] ?? 9)
      );
    }
  }

  const lower = q.toLowerCase();
  return chords.filter(c => c.name.toLowerCase().includes(lower) || c.type.toLowerCase().includes(lower));
}
