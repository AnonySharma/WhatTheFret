import React, { useRef } from 'react';
import { Compass, Paperclip, Puzzle, Radio, Target } from 'lucide-react';
import { SUGGESTED_THEORY_LABS, type LabId, type TheoryLabInfo } from '../../constants';
import { TransposerLab } from './TransposerLab';
import { CagedLab } from './CagedLab';
import { CapoLab } from './CapoLab';
import { DroneLab } from './DroneLab';
import { EarTrainerLab } from './EarTrainerLab';

export type { LabId };

/** Tab icons by lab id. The lab list itself (order, labels, copy) lives in SUGGESTED_THEORY_LABS. */
const LAB_ICONS: Record<LabId, React.ElementType> = {
  transposer: Compass,
  caged: Puzzle,
  capo: Paperclip,
  drone: Radio,
  ear: Target,
};

/** Labs visible in the current mode, in display order. Indian-only labs drop out unless `indian`. */
export function visibleLabs(indian: boolean): TheoryLabInfo[] {
  return SUGGESTED_THEORY_LABS.filter(l => indian || !l.indianOnly);
}

export const DEFAULT_LAB: LabId = SUGGESTED_THEORY_LABS[0].id;

export function isLabId(value: string | undefined): value is LabId {
  return SUGGESTED_THEORY_LABS.some(l => l.id === value);
}

interface LabsHubProps {
  lab: LabId;
  onLabChange: (lab: LabId) => void;
  notation: 'western' | 'indian';
}

const tabId = (id: LabId) => `lab-tab-${id}`;
const panelId = (id: LabId) => `lab-panel-${id}`;

export const LabsHub: React.FC<LabsHubProps> = ({ lab, onLabChange, notation }) => {
  const indian = notation === 'indian';
  const labs = visibleLabs(indian);
  const tabRefs = useRef<Partial<Record<LabId, HTMLButtonElement | null>>>({});

  // Arrow keys / Home / End move between tabs (roving tabindex, automatic activation).
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = labs.findIndex(l => l.id === lab);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % labs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + labs.length) % labs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = labs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const id = labs[next].id;
    onLabChange(id);
    tabRefs.current[id]?.focus();
  };

  return (
    <div className="space-y-4">
      <div
        className="flex gap-1 overflow-x-auto scrollbar-none p-1 rounded-2xl bg-ink-900 border border-ink-800"
        role="tablist"
        aria-label="Theory labs"
        onKeyDown={onKeyDown}
      >
        {labs.map(({ id, label }) => {
          const Icon = LAB_ICONS[id];
          const selected = lab === id;
          return (
            <button
              key={id}
              ref={el => {
                tabRefs.current[id] = el;
              }}
              id={tabId(id)}
              role="tab"
              aria-selected={selected}
              aria-controls={panelId(id)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onLabChange(id)}
              className={`flex items-center gap-1.5 px-3.5 h-10 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                selected ? 'bg-brand-600 text-white' : 'text-ink-300 hover:text-white hover:bg-ink-800'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={panelId(lab)} aria-labelledby={tabId(lab)} tabIndex={-1} className="outline-none">
        {lab === 'transposer' && <TransposerLab />}
        {lab === 'caged' && <CagedLab />}
        {lab === 'capo' && <CapoLab />}
        {lab === 'drone' && indian && <DroneLab notation={notation} />}
        {lab === 'ear' && <EarTrainerLab notation={notation} />}
      </div>
    </div>
  );
};
