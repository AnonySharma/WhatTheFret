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
  /** Semitones above the root for the chord tones: triad first, then any extra (7th). */
  triad: [number, number, number];
  seventh?: number;
  barre: boolean;
}

const SHAPES: Record<Shape, ShapeSpec[]> = {
  E: [
    { type: 'Major', label: 'Major', offsets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1], triad: [0, 4, 7], barre: true },
    { type: 'Minor', label: 'Minor', offsets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1], triad: [0, 3, 7], barre: true },
    { type: '7', label: 'Dominant 7th', offsets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1], triad: [0, 4, 7], seventh: 10, barre: true },
    { type: 'm7', label: 'Minor 7th', offsets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1], triad: [0, 3, 7], seventh: 10, barre: true },
    { type: '5', label: 'Power Chord', offsets: [0, 2, 2, null, null, null], fingers: [1, 3, 4, 0, 0, 0], triad: [0, 7, 0], barre: false },
  ],
  A: [
    { type: 'Major', label: 'Major', offsets: [null, 0, 2, 2, 2, 0], fingers: [0, 1, 2, 3, 4, 1], triad: [0, 4, 7], barre: true },
    { type: 'Minor', label: 'Minor', offsets: [null, 0, 2, 2, 1, 0], fingers: [0, 1, 3, 4, 2, 1], triad: [0, 3, 7], barre: true },
    { type: '7', label: 'Dominant 7th', offsets: [null, 0, 2, 0, 2, 0], fingers: [0, 1, 3, 1, 4, 1], triad: [0, 4, 7], seventh: 10, barre: true },
    { type: 'm7', label: 'Minor 7th', offsets: [null, 0, 2, 0, 1, 0], fingers: [0, 1, 3, 1, 2, 1], triad: [0, 3, 7], seventh: 10, barre: true },
    { type: 'Maj7', label: 'Major 7th', offsets: [null, 0, 2, 1, 2, 0], fingers: [0, 1, 3, 2, 4, 1], triad: [0, 4, 7], seventh: 11, barre: true },
    { type: 'Sus4', label: 'Suspended 4th', offsets: [null, 0, 2, 2, 3, 0], fingers: [0, 1, 2, 3, 4, 1], triad: [0, 5, 7], barre: true },
    { type: 'Sus2', label: 'Suspended 2nd', offsets: [null, 0, 2, 2, 0, 0], fingers: [0, 1, 3, 4, 1, 1], triad: [0, 2, 7], barre: true },
    { type: 'Dim', label: 'Diminished', offsets: [null, 0, 1, 2, 1, null], fingers: [0, 1, 2, 4, 3, 0], triad: [0, 3, 6], barre: false },
  ],
};

const OPEN_ROOT: Record<Shape, NoteName> = { E: 'E', A: 'A' };
/** Highest barre fret generated; anything above is just the same chord an octave up. */
const MAX_BARRE_FRET = 9;

/** The database uses both '7' and '7th' for dominant sevenths. */
const normaliseType = (type: string) => (type === '7th' ? '7' : type);

function familyOf(shape: Shape): ChordVoicing['family'] {
  return shape === 'E' ? 'Barre E-Shape' : 'Barre A-Shape';
}

function typeFamily(type: string, shape: Shape): ChordVoicing['family'] {
  if (type === 'Sus4' || type === 'Sus2') return 'Suspended';
  if (type === '7' || type === 'm7' || type === 'Maj7') return '7th / Jazz';
  if (type === 'Dim' || type === '5') return 'Extended';
  return familyOf(shape);
}

/**
 * Builds the movable voicings that are not already hand-written in `curated`
 * (same root + type + fret pattern counts as already covered).
 */
export function generateMovableChords(curated: ChordVoicing[]): ChordVoicing[] {
  const covered = new Set(curated.map(c => `${c.root}|${normaliseType(c.type)}|${c.frets.join(',')}`));
  const out: ChordVoicing[] = [];

  (['E', 'A'] as Shape[]).forEach(shape => {
    const openIdx = NOTES.indexOf(OPEN_ROOT[shape]);
    NOTES.forEach((root, rootIdx) => {
      const fret = (rootIdx - openIdx + 12) % 12;
      if (fret < 1 || fret > MAX_BARRE_FRET) return;

      SHAPES[shape].forEach(spec => {
        const family = typeFamily(spec.type, shape);
        const frets = spec.offsets.map(o => (o === null ? -1 : fret + o));
        if (covered.has(`${root}|${spec.type}|${frets.join(',')}`)) return;

        const notes = spec.triad.map(i => NOTES[(rootIdx + i) % 12]) as [NoteName, NoteName, NoteName];
        const all = [...new Set([...notes, ...(spec.seventh !== undefined ? [NOTES[(rootIdx + spec.seventh) % 12]] : [])])];
        const rootString = shape === 'E' ? '6th' : '5th';
        const label = ROOT_LABEL[root] ?? root;

        out.push({
          id: `gen-${shape.toLowerCase()}-${root.replace('#', 's').toLowerCase()}-${spec.type.toLowerCase()}`,
          name: `${label} ${spec.label} (${shape}-Shape Barre)`,
          root,
          type: spec.type,
          family,
          frets,
          fingers: spec.fingers,
          barreFret: spec.barre ? fret : undefined,
          barreStrings: spec.barre ? [shape === 'E' ? 6 : 5, 1] : undefined,
          description: `Movable ${shape}-shape grip at fret ${fret}: the root ${root} sits on the ${rootString} string.${
            spec.barre ? ' Lay your index finger across the barre.' : ''
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
