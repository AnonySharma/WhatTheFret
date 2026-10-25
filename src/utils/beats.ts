/**
 * Beat-note maths for the "tune by ear" lesson. When two nearly equal pitches sound together
 * their waves drift in and out of step, so the loudness swells and fades |f1 - f2| times a second.
 */

export type BeatDirection = 'flat' | 'sharp';

export function beatFrequency(f1: number, f2: number): number {
  return Math.abs(f1 - f2);
}

/** Signed distance from f1 to f2 in cents (100 cents = 1 fret). */
export function centsBetween(f1: number, f2: number): number {
  return 1200 * Math.log2(f2 / f1);
}

/** The pitch of a string that is `beatHz` away from `reference`, on the flat or sharp side. */
export function detunedFrequency(reference: number, beatHz: number, direction: BeatDirection): number {
  return direction === 'sharp' ? reference + beatHz : Math.max(1, reference - beatHz);
}

/** Relative loudness (0..1) of two equal tones `beatHz` apart, `t` seconds after they start in phase. */
export function beatEnvelope(t: number, beatHz: number): number {
  return Math.abs(Math.cos(Math.PI * beatHz * t));
}

export interface BeatCharacter {
  label: string;
  sounds: string;
  advice: string;
}

export function describeBeat(beatHz: number): BeatCharacter {
  if (beatHz < 0.05) {
    return {
      label: 'In tune',
      sounds: 'One steady, solid tone with no wobble at all. The two waves are locked together.',
      advice: 'Stop turning the peg. This is the target.',
    };
  }
  if (beatHz <= 0.8) {
    return {
      label: 'Almost there',
      sounds: 'A very slow throb, less than one swell per second, like a gentle breathing in the sound.',
      advice: 'Tiny nudges on the peg. Wait for the throb to disappear completely.',
    };
  }
  if (beatHz <= 3) {
    return {
      label: 'Close',
      sounds: 'A slow "wah... wah... wah" you can count. Both strings still sound like the same note.',
      advice: 'Turn the peg slowly. If the wobble slows down you are going the right way.',
    };
  }
  if (beatHz <= 7) {
    return {
      label: 'Off',
      sounds: 'A quick pulsing "wuh-wuh-wuh-wuh" that is hard to count. The note starts to sound sour.',
      advice: 'Keep turning in one direction. If the wobble speeds up, you went the wrong way.',
    };
  }
  if (beatHz <= 14) {
    return {
      label: 'Far off',
      sounds: 'A rough, buzzing flutter. The ear stops counting beats and hears roughness instead.',
      advice: 'Re-check you are on the right fret and string, then bring the peg closer by ear.',
    };
  }
  return {
    label: 'Way off',
    sounds: 'Two clearly different pitches that clash. No slow beating is left to guide you.',
    advice: 'Get close with the tuner or by matching the pitch first, then use beats to finish.',
  };
}
