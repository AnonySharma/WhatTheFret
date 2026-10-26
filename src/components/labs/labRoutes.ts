import { SUGGESTED_THEORY_LABS, type LabId, type TheoryLabInfo } from '../../constants';

/** Labs visible in the current mode, in display order. Indian-only labs drop out unless `indian`. */
export function visibleLabs(indian: boolean): TheoryLabInfo[] {
  return SUGGESTED_THEORY_LABS.filter(l => indian || !l.indianOnly);
}

export const DEFAULT_LAB: LabId = SUGGESTED_THEORY_LABS[0].id;

export function isLabId(value: string | undefined): value is LabId {
  return SUGGESTED_THEORY_LABS.some(l => l.id === value);
}
