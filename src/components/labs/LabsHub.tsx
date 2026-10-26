import React from 'react';
import { Compass, Puzzle, Radio, Target } from 'lucide-react';
import { TransposerLab } from './TransposerLab';
import { CagedLab } from './CagedLab';
import { DroneLab } from './DroneLab';
import { EarTrainerLab } from './EarTrainerLab';

export type LabId = 'transposer' | 'caged' | 'drone' | 'ear';

export const LAB_TABS: { id: LabId; label: string; icon: React.ElementType; indianOnly?: boolean }[] = [
  { id: 'transposer', label: 'Transposer', icon: Compass },
  { id: 'caged', label: 'CAGED', icon: Puzzle },
  { id: 'drone', label: 'Tanpura & Jam', icon: Radio, indianOnly: true },
  { id: 'ear', label: 'Ear Trainer', icon: Target },
];

interface LabsHubProps {
  lab: LabId;
  onLabChange: (lab: LabId) => void;
  notation: 'western' | 'indian';
}

export const LabsHub: React.FC<LabsHubProps> = ({ lab, onLabChange, notation }) => (
  <div className="space-y-4">
    <div className="flex gap-1 overflow-x-auto scrollbar-none p-1 rounded-2xl bg-ink-900 border border-ink-800" role="tablist">
      {LAB_TABS.filter(t => notation === 'indian' || !t.indianOnly).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={lab === id}
          onClick={() => onLabChange(id)}
          className={`flex items-center gap-1.5 px-3.5 h-10 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
            lab === id ? 'bg-brand-600 text-white' : 'text-ink-300 hover:text-white hover:bg-ink-800'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
    {lab === 'transposer' && <TransposerLab />}
    {lab === 'caged' && <CagedLab />}
    {lab === 'drone' && notation === 'indian' && <DroneLab notation={notation} />}
    {lab === 'ear' && <EarTrainerLab notation={notation} />}
  </div>
);
