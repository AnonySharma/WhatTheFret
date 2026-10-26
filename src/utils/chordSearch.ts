import type { ChordVoicing } from '../constants';

export interface ParsedChordSymbol {
  root: string; // sharp spelling, e.g. 'A#'
  /** Canonical chord types this symbol stands for; empty = bare root ("A", "F#") */
  types: string[];
  /** Slash-chord bass note in sharp spelling ("C/G" -> 'G'); only present for slash chords */
  bass?: string;
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

/**
 * Suffix (no spaces) -> chord types used in CHORD_DATABASE. Looked up as typed first (so 'Δ' works,
 * since lowercasing turns it into 'δ'), then lowercased.
 */
const SUFFIX_TYPES: Record<string, string[]> = {
  '': [],
  maj: ['Major'],
  major: ['Major'],
  m: ['Minor'],
  min: ['Minor'],
  minor: ['Minor'],
  '-': ['Minor'],
  '7': ['7th', '7'],
  '7th': ['7th', '7'],
  dom7: ['7th', '7'],
  dominant7: ['7th', '7'],
  m7: ['m7'],
  min7: ['m7'],
  minor7: ['m7'],
  '-7': ['m7'],
  maj7: ['Maj7'],
  major7: ['Maj7'],
  maj9: ['Maj7'], // no dedicated Maj9 voicings: the Maj7 shapes are the closest match
  '△': ['Maj7'],
  '△7': ['Maj7'],
  'Δ': ['Maj7'],
  'Δ7': ['Maj7'],
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
  dim7: ['Dim7'],
  '°7': ['Dim7'],
  m7b5: ['m7b5'],
  min7b5: ['m7b5'],
  'ø': ['m7b5'],
  'ø7': ['m7b5'],
  '6': ['6'],
  m6: ['m6'],
  min6: ['m6'],
  '9': ['9'],
  dom9: ['9'],
  '7sus4': ['7sus4'],
  '7sus': ['7sus4'],
  '5': ['5'],
  power: ['5'],
};

const hasOwn = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/** Normalises a note name ("Bb", "f♯", "e") to the sharp spelling used by the database, or null. */
function parseNoteName(text: string): string | null {
  const m = /^([A-Ga-g])([#♯b♭]?)$/.exec(text);
  if (!m) return null;
  const letter = m[1].toUpperCase();
  const accidental = m[2].replace('♯', '#').replace('♭', 'b');
  let root = letter + accidental;
  if (accidental === 'b') root = FLAT_TO_SHARP[root] ?? root;
  return SHARP_EQUIVALENT[root] ?? root;
}

/**
 * Parses a chord symbol such as "Am", "a minor", "F#m7", "Bbmaj7", "Dsus4", "G", "CΔ", "Am/E".
 * Returns null when the text is not a recognisable chord symbol (so callers can
 * fall back to free-text search, e.g. "barre", "power", "sus").
 */
export function parseChordSymbol(input: string): ParsedChordSymbol | null {
  const text = input.replace(/\s+/g, '');
  const m = /^([A-Ga-g])([#♯b♭]?)(.*)$/.exec(text);
  if (!m) return null;

  // "Bb" is B-flat, but "bm"/"bdim" are B minor / B diminished (no accidental char there).
  const root = parseNoteName(m[1] + m[2]);
  if (!root) return null;
  // Unicode accidentals and parentheses inside the suffix: "m7♭5", "m7(b5)"
  let rest = m[3].replace(/♭/g, 'b').replace(/♯/g, '#').replace(/[()]/g, '');

  // Slash chord: "C/G", "Am/E", "D/F#". A missing bass ("C/") is ignored, a bad one is not a chord.
  let bass: string | undefined;
  const slash = rest.indexOf('/');
  if (slash >= 0) {
    const bassText = rest.slice(slash + 1);
    rest = rest.slice(0, slash);
    if (bassText) {
      const parsedBass = parseNoteName(bassText);
      if (!parsedBass) return null;
      bass = parsedBass;
    }
  }

  // Case matters only for M (major) vs m (minor)
  let types: string[] | undefined;
  if (rest === 'M') types = ['Major'];
  else if (rest === 'M7') types = ['Maj7'];
  else if (hasOwn(SUFFIX_TYPES, rest)) types = SUFFIX_TYPES[rest];
  else if (hasOwn(SUFFIX_TYPES, rest.toLowerCase())) types = SUFFIX_TYPES[rest.toLowerCase()];

  if (!types) return null;
  // "C/G" is a C chord over G, so an empty suffix means plain major rather than "every C chord"
  if (bass && types.length === 0) types = ['Major'];
  return bass ? { root, types, bass } : { root, types };
}

/** Highest fret used: open-position chords (0-4) sort ahead of movable shapes up the neck. */
const position = (c: ChordVoicing) => Math.max(0, ...c.frets);

const CATEGORY_RANK: Record<string, number> = { open: 0, 'barre-e': 1, 'barre-a': 1, triad: 2, jazz: 3 };

/**
 * Filters and ranks chords for a search query.
 * - Chord symbols ("Am", "A minor", "F#m7") match by root + type (enharmonic-aware).
 * - A bare root ("A") lists every chord on that root, Major then Minor first.
 * - Slash chords ("C/G") list that chord's voicings with the ones whose bass note is G first.
 * - Anything else falls back to a substring match on name and type; if that finds nothing but the
 *   text starts with a note name ("Cm9", "Gadd4"), that root's chords are listed instead.
 */
export function searchChords(chords: ChordVoicing[], query: string): ChordVoicing[] {
  const q = query.trim();
  if (!q) return chords;

  const rank = (list: ChordVoicing[], parsed: ParsedChordSymbol) => {
    const typeRank = (c: ChordVoicing) =>
      parsed.types.length > 0 ? 0 : c.type === 'Major' ? 0 : c.type === 'Minor' ? 1 : 2;
    const bassRank = (c: ChordVoicing) => (parsed.bass && c.bassNote !== parsed.bass ? 1 : 0);
    return [...list].sort(
      (a, b) =>
        bassRank(a) - bassRank(b) ||
        typeRank(a) - typeRank(b) ||
        position(a) - position(b) ||
        (CATEGORY_RANK[a.category] ?? 9) - (CATEGORY_RANK[b.category] ?? 9)
    );
  };

  const parsed = parseChordSymbol(q);
  if (parsed) {
    const matches = chords.filter(
      c => c.root === parsed.root && (parsed.types.length === 0 || parsed.types.includes(c.type))
    );
    if (matches.length > 0) return rank(matches, parsed);
    // Recognised chord but nothing of that type in this list: show the root's chords instead
    const sameRoot = chords.filter(c => c.root === parsed.root);
    if (sameRoot.length > 0) return rank(sameRoot, { root: parsed.root, types: [] });
  }

  const lower = q.toLowerCase();
  const text = chords.filter(c => c.name.toLowerCase().includes(lower) || c.type.toLowerCase().includes(lower));
  if (text.length > 0 || parsed) return text;

  // Starts with a note name but the rest is not a known suffix: fall back to that root's chords
  const m = /^([A-Ga-g][#♯b♭]?)/.exec(q.replace(/\s+/g, ''));
  const root = m && parseNoteName(m[1]);
  if (!root) return text;
  return rank(chords.filter(c => c.root === root), { root, types: [] });
}
