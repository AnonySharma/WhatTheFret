import React from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  BookOpen,
  Sparkles,
  Sliders,
  Globe,
  Award,
  Layers,
  Compass,
  Mic,
  FlaskConical,
} from 'lucide-react';
import { TopMetronomeTunerWidget } from './TopMetronomeTunerWidget';

export type ActiveTab = 'modules' | 'chord-library' | 'fretboard' | 'circle-of-fifths' | 'tuner' | 'journey' | 'swaras' | 'pdf' | 'labs';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isMicActive: boolean;
  onToggleMic: () => void;
  progressPercentage: number;
  completedCount: number;
  notesNotation: 'western' | 'indian';
  onToggleNotation: (mode: 'western' | 'indian') => void;
}

const TABS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
  { id: 'modules', label: 'Lessons', icon: BookOpen },
  { id: 'chord-library', label: 'Chord Library', icon: Layers },
  { id: 'fretboard', label: 'Fretboard', icon: Sliders },
  { id: 'circle-of-fifths', label: 'Circle of 5ths', icon: Compass },
  { id: 'tuner', label: 'Tuner', icon: Mic },
  { id: 'labs', label: 'Theory Labs', icon: FlaskConical },
  { id: 'swaras', label: 'Raagas & Swaras', icon: Globe },
  { id: 'journey', label: 'Journey', icon: Sparkles },
  { id: 'pdf', label: 'PDF Notes', icon: Music },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isMuted,
  onToggleMute,
  isMicActive,
  onToggleMic,
  progressPercentage,
  completedCount,
  notesNotation,
  onToggleNotation,
}) => {
  return (
    <header className="bg-ink-950/85 backdrop-blur-xl border-b border-ink-800/80 text-ink-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top row: brand + quick controls */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          <button
            type="button"
            className="flex items-center gap-2.5 group min-w-0"
            onClick={() => setActiveTab('modules')}
            aria-label="Go to lessons"
          >
            <img
              src={`${import.meta.env.BASE_URL}favicon.svg`}
              alt=""
              className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl shadow-md shadow-black/40 group-hover:scale-105 transition-transform"
            />
            <div className="min-w-0 text-left">
              <div className="font-black text-sm sm:text-lg tracking-tight leading-tight truncate bg-gradient-to-r from-brand-100 via-brand-200 to-brand-500 bg-clip-text text-transparent">
                WhatTheFret
              </div>
              <p className="text-[10px] text-ink-400 font-medium leading-tight hidden sm:block truncate">
                The math of the fretboard, finally clicking
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <TopMetronomeTunerWidget
              isMicActive={isMicActive}
              onToggleMic={onToggleMic}
              onOpenFull={() => setActiveTab('tuner')}
            />

            <button
              onClick={() => onToggleNotation(notesNotation === 'western' ? 'indian' : 'western')}
              className="flex items-center gap-1.5 px-2.5 h-9 rounded-xl bg-ink-900 border border-ink-800 hover:border-brand-500/40 text-xs font-semibold text-ink-200 transition-all"
              title="Toggle between Western (C D E) and Indian Sargam (Sa Re Ga Ma)"
            >
              <span className="text-[10px] text-brand-400 font-bold uppercase hidden lg:inline">Notation:</span>
              <span className="font-extrabold text-brand-300 text-[11px]">
                {notesNotation === 'western' ? 'ABC' : 'Sa Re'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('journey')}
              className="hidden md:flex items-center gap-1.5 px-2.5 h-9 rounded-xl bg-ink-900 border border-brand-500/30 text-brand-300 text-xs font-bold hover:border-brand-500/60 transition-colors"
              title="View Guided Journey progress"
            >
              <Award className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-[11px]">{completedCount}/7</span>
            </button>

            <button
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${
                isMuted
                  ? 'bg-red-950/70 border-red-800/50 text-red-400'
                  : 'bg-ink-900 border-ink-800 text-brand-400 hover:bg-ink-800 hover:border-ink-700'
              }`}
              title={isMuted ? 'Unmute sound' : 'Mute sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab row: scrolls sideways inside itself, never the page */}
        <nav
          aria-label="Main Navigation"
          className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-2 -mx-3 px-3 sm:mx-0 sm:px-0"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                  active
                    ? 'bg-brand-500/15 text-brand-300 ring-1 ring-inset ring-brand-500/40'
                    : 'text-ink-400 hover:text-ink-100 hover:bg-ink-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-brand-400' : ''}`} />
                <span>{label}</span>
                {id === 'journey' && (
                  <span className="ml-0.5 px-1.5 text-[10px] rounded-full bg-brand-500/20 text-brand-300 font-black">
                    {progressPercentage}%
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
