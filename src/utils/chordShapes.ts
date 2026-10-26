/**
 * Movable barre shapes. The hand-written CHORD_DATABASE only covers the popular voicings, so this
 * fills the gaps: every root gets an E-shape (root on the 6th string) and A-shape (root on the 5th
 * string) version of the common chord types. Pure arithmetic, no runtime imports from constants
 * (constants.tsx calls this while it is still being evaluated).
 */

import type { ChordVoicing, NoteName } from '../constants';

const NOTES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Sharp roots are shown with their flat twin so "Bb major" is easy to spot. */
const ROOT_LABEL: Partial<Record<NoteName, string>> = {
  'C#': 'C#/Db',
  'D#': 'D#/Eb',
  'F#': 'F#/Gb',
  'G#': 'G#/Ab',
  'A#': 'A#/Bb',
};

type Shape = 'E' | 'A';

interface ShapeSpec {
  type: string;
  label: string;
  /** Fret offsets from the barre fret, string 6 -> 1; null = muted. */
  offsets: (number | null)[];
  fingers: number[];
  /** Semitones above the root for the chord tones: the triad (or closest equivalent), then extras (6th, 7th, 9th). */
  triad: [number, number, number];
  extras?: number[];
  /** Index-finger barre across the shape; false for shapes without one (power chord, mini-barre grips). */
  barre: boolean;
  /** Last string the barre covers (default 1); shorter when the top strings are muted. */
  barreTo?: number;
}

const SHAPES: Record<Shape, ShapeSpec[]> = {
  E: [
    { type: 'Major', label: 'Major', offsets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1], triad: [0, 4, 7], barre: true },
    { type: 'Minor', label: 'Minor', offsets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1], triad: [0, 3, 7], barre: true },
    { type: '7', label: 'Dominant 7th', offsets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1], triad: [0, 4, 7], extras: [10], barre: true },
    { type: 'm7', label: 'Minor 7th', offsets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1], triad: [0, 3, 7], extras: [10], barre: true },
    { type: 'Maj7', label: 'Major 7th', offsets: [0, 2, 1, 1, 0, 0], fingers: [1, 3, 2, 2, 1, 1], triad: [0, 4, 7], extras: [11], barre: true },
    { type: 'Sus4', label: 'Suspended 4th', offsets: [0, 2, 2, 2, 0, 0], fingers: [1, 2, 3, 4, 1, 1], triad: [0, 5, 7], barre: true },
    { type: 'Aug', label: 'Augmented', offsets: [0, 3, 2, 1, 1, 0], fingers: [1, 4, 3, 2, 2, 1], triad: [0, 4, 8], barre: true },
    { type: '5', label: 'Power Chord', offsets: [0, 2, 2, null, null, null], fingers: [1, 3, 4, 0, 0, 0], triad: [0, 7, 0], barre: false },
    { type: '6', label: 'Major 6th', offsets: [0, 2, 2, 1, 2, 0], fingers: [1, 3, 3, 2, 4, 1], triad: [0, 4, 7], extras: [9], barre: true },
    { type: 'm6', label: 'Minor 6th', offsets: [0, 2, 2, 0, 2, 0], fingers: [1, 3, 3, 1, 4, 1], triad: [0, 3, 7], extras: [9], barre: true },
    { type: '9', label: 'Dominant 9th', offsets: [0, 2, 0, 1, 0, 2], fingers: [1, 3, 1, 2, 1, 4], triad: [0, 4, 7], extras: [10, 14], barre: true, barreTo: 2 },
    { type: 'Dim7', label: 'Diminished 7th', offsets: [0, 1, 2, 0, 2, 0], fingers: [1, 2, 3, 1, 4, 1], triad: [0, 3, 6], extras: [9], barre: true },
    { type: 'm7b5', label: 'Half-Diminished (m7b5)', offsets: [0, 1, 0, 0, null, null], fingers: [1, 2, 1, 1, 0, 0], triad: [0, 3, 6], extras: [10], barre: true, barreTo: 3 },
    { type: '7sus4', label: 'Dominant 7th Suspended 4th', offsets: [0, 2, 0, 2, 0, 0], fingers: [1, 3, 1, 4, 1, 1], triad: [0, 5, 7], extras: [10], barre: true },
  ],
  A: [
    { type: 'Major', label: 'Major', offsets: [null, 0, 2, 2, 2, 0], fingers: [0, 1, 2, 3, 4, 1], triad: [0, 4, 7], barre: true },
    { type: 'Minor', label: 'Minor', offsets: [null, 0, 2, 2, 1, 0], fingers: [0, 1, 3, 4, 2, 1], triad: [0, 3, 7], barre: true },
    { type: '7', label: 'Dominant 7th', offsets: [null, 0, 2, 0, 2, 0], fingers: [0, 1, 3, 1, 4, 1], triad: [0, 4, 7], extras: [10], barre: true },
    { type: 'm7', label: 'Minor 7th', offsets: [null, 0, 2, 0, 1, 0], fingers: [0, 1, 3, 1, 2, 1], triad: [0, 3, 7], extras: [10], barre: true },
    { type: 'Maj7', label: 'Major 7th', offsets: [null, 0, 2, 1, 2, 0], fingers: [0, 1, 3, 2, 4, 1], triad: [0, 4, 7], extras: [11], barre: true },
    { type: 'Sus4', label: 'Suspended 4th', offsets: [null, 0, 2, 2, 3, 0], fingers: [0, 1, 2, 3, 4, 1], triad: [0, 5, 7], barre: true },
    { type: 'Sus2', label: 'Suspended 2nd', offsets: [null, 0, 2, 2, 0, 0], fingers: [0, 1, 3, 4, 1, 1], triad: [0, 2, 7], barre: true },
    { type: 'Add9', label: 'Add 9', offsets: [null, 0, 2, 4, 2, 0], fingers: [0, 1, 2, 4, 3, 1], triad: [0, 4, 7], extras: [14], barre: true },
    { type: 'Dim', label: 'Diminished', offsets: [null, 0, 1, 2, 1, null], fingers: [0, 1, 2, 4, 3, 0], triad: [0, 3, 6], barre: false },
    { type: '6', label: 'Major 6th', offsets: [null, 0, 2, 2, 2, 2], fingers: [0, 1, 3, 3, 3, 3], triad: [0, 4, 7], extras: [9], barre: false },
    { type: 'm6', label: 'Minor 6th', offsets: [null, 0, 2, 2, 1, 2], fingers: [0, 1, 3, 3, 2, 4], triad: [0, 3, 7], extras: [9], barre: false },
    { type: 'Dim7', label: 'Diminished 7th', offsets: [null, 0, 1, 2, 1, 2], fingers: [0, 1, 2, 4, 3, 4], triad: [0, 3, 6], extras: [9], barre: false },
    { type: 'm7b5', label: 'Half-Diminished (m7b5)', offsets: [null, 0, 1, 0, 1, null], fingers: [0, 1, 2, 1, 3, 0], triad: [0, 3, 6], extras: [10], barre: true, barreTo: 3 },
    { type: '7sus4', label: 'Dominant 7th Suspended 4th', offsets: [null, 0, 2, 0, 3, 0], fingers: [0, 1, 3, 1, 4, 1], triad: [0, 5, 7], extras: [10], barre: true },
  ],
};

const OPEN_ROOT: Record<Shape, NoteName> = { E: 'E', A: 'A' };
/**
 * Highest barre fret generated (11 = every root has a grip; 12 would just repeat fret 0 an octave up).
 * Widest offset is +4, so no grip goes past fret 15.
 */
const MAX_BARRE_FRET = 11;

/** The database uses both '7' and '7th' for dominant sevenths. */
const normaliseType = (type: string) => (type === '7th' ? '7' : type);

function familyOf(shape: Shape): ChordVoicing['family'] {
  return shape === 'E' ? 'Barre E-Shape' : 'Barre A-Shape';
}

function typeFamily(type: string, shape: Shape): ChordVoicing['family'] {
  if (type === 'Sus4' || type === 'Sus2' || type === '7sus4') return 'Suspended';
  if (['7', 'm7', 'Maj7', 'Dim7', 'm7b5'].includes(type)) return '7th / Jazz';
  if (['Dim', 'Aug', 'Add9', '5', '6', 'm6', '9'].includes(type)) return 'Extended';
  return familyOf(shape);
}

/**
 * Builds the movable voicings that are not already hand-written in `curated`
 * (same root + type + fret pattern counts as already covered).
 */
export function generateMovableChords(curated: ChordVoicing[]): ChordVoicing[] {
  const covered = new Set(curated.map(c => `${c.root}|${normaliseType(c.type)}|${c.frets.join(',')}`));
  const hasType = new Set(curated.map(c => `${c.root}|${normaliseType(c.type)}`));
  const out: ChordVoicing[] = [];

  (['E', 'A'] as Shape[]).forEach(shape => {
    const openIdx = NOTES.indexOf(OPEN_ROOT[shape]);
    NOTES.forEach((root, rootIdx) => {
      const fret = (rootIdx - openIdx + 12) % 12;
      if (fret > MAX_BARRE_FRET) return;

      SHAPES[shape].forEach(spec => {
        // fret 0 = the root is the open string (E-shape on E, A-shape on A): only fill types that have no hand-written grip
        if (fret === 0 && hasType.has(`${root}|${spec.type}`)) return;
        const family = typeFamily(spec.type, shape);
        const frets = spec.offsets.map(o => (o === null ? -1 : fret + o));
        if (covered.has(`${root}|${spec.type}|${frets.join(',')}`)) return;
        const open = fret === 0;
        const fingers = open ? spec.fingers.map((f, i) => (frets[i] === 0 ? 0 : f)) : spec.fingers;
        const barre = spec.barre && !open;

        const notes = spec.triad.map(i => NOTES[(rootIdx + i) % 12]) as [NoteName, NoteName, NoteName];
        const all = [...new Set([...notes, ...(spec.extras ?? []).map(i => NOTES[(rootIdx + i) % 12])])];
        const rootString = shape === 'E' ? '6th' : '5th';
        const label = ROOT_LABEL[root] ?? root;

        out.push({
          id: `gen-${shape.toLowerCase()}-${root.replace('#', 's').toLowerCase()}-${spec.type.toLowerCase()}`,
          name: `${label} ${spec.label} (${shape}-Shape ${open ? 'Open' : 'Barre'})`,
          root,
          type: spec.type,
          family,
          frets,
          fingers,
          barreFret: barre ? fret : undefined,
          barreStrings: barre ? [shape === 'E' ? 6 : 5, spec.barreTo ?? 1] : undefined,
          description: open
            ? `${shape}-shape grip in open position: the open ${rootString}-string root ${root} is the bass note.`
            : `Movable ${shape}-shape grip at fret ${fret}: the root ${root} sits on the ${rootString} string.${
                barre ? ' Lay your index finger across the barre.' : ''
              }`,
          category: shape === 'E' ? 'barre-e' : 'barre-a',
          triadNotes: notes,
          allNotes: all,
          bassNote: root,
          difficulty: 'Intermediate',
          lowEMutedReason: shape === 'A' ? 'Low E is muted so the 5th-string root is the bass note.' : undefined,
        });
      });
    });
  });

  return out;
}
