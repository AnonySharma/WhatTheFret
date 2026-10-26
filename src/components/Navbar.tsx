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

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isMicActive: boolean;
  onToggleMic: () => void;
  progressPercentage: number;
  completedCount: number;
  totalLessons: number;
  /** Short message when the microphone could not be opened; shown under the top row. */
  micError?: string | null;
  onDismissMicError?: () => void;
  notesNotation: 'western' | 'indian';
  onToggleNotation: (mode: 'western' | 'indian') => void;
}

const TAB_DEFS = [
  { id: 'modules', label: 'Lessons', icon: BookOpen },
  { id: 'chord-library', label: 'Chord Library', icon: Layers },
  { id: 'fretboard', label: 'Fretboard', icon: Sliders },
  { id: 'circle-of-fifths', label: 'Circle of 5ths', icon: Compass },
  { id: 'tuner', label: 'Tuner', icon: Mic },
  { id: 'labs', label: 'Theory Labs', icon: FlaskConical },
  { id: 'swaras', label: 'Raagas & Swaras', icon: Globe, indianOnly: true },
  { id: 'journey', label: 'Journey', icon: Sparkles },
  { id: 'pdf', label: 'PDF Notes', icon: Music },
] as const;

export type ActiveTab = (typeof TAB_DEFS)[number]['id'];

/** The single list of screens: drives the nav bar, the ActiveTab type and the `#hash` route allow-list. */
export const TABS: readonly { id: ActiveTab; label: string; icon: React.ElementType; indianOnly?: boolean }[] = TAB_DEFS;

export function isActiveTab(value: string | undefined): value is ActiveTab {
  return TABS.some(t => t.id === value);
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isMuted,
  onToggleMute,
  isMicActive,
  onToggleMic,
  progressPercentage,
  completedCount,
  totalLessons,
  micError,
  onDismissMicError,
  notesNotation,
  onToggleNotation,
}) => {
  const indian = notesNotation === 'indian';
  const tabs = TABS.filter(t => indian || !t.indianOnly);
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
              type="button"
              role="switch"
              aria-checked={indian}
              aria-label="Indian music mode"
              onClick={() => onToggleNotation(indian ? 'western' : 'indian')}
              className={`flex items-center gap-2 px-2.5 h-9 rounded-xl border text-xs font-bold transition-all ${
                indian
                  ? 'bg-brand-950/60 border-brand-500/50 text-brand-300'
                  : 'bg-ink-900 border-ink-800 text-ink-300 hover:border-brand-500/40'
              }`}
              title="Indian music mode: shows Sargam (Sa Re Ga), Raagas, the Tanpura lab and other Indian classical content"
            >
              <span className="text-[11px]">{indian ? 'Sa Re' : 'Indian'}</span>
              <span className={`relative w-7 h-4 rounded-full transition-colors ${indian ? 'bg-brand-500' : 'bg-ink-700'}`}>
                <span
                  className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                    indian ? 'translate-x-3' : ''
                  }`}
                />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('journey')}
              className="hidden md:flex items-center gap-1.5 px-2.5 h-9 rounded-xl bg-ink-900 border border-brand-500/30 text-brand-300 text-xs font-bold hover:border-brand-500/60 transition-colors"
              title="View Guided Journey progress"
              aria-label={`Guided journey: ${completedCount} of ${totalLessons} lessons completed`}
            >
              <Award className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-[11px]">{completedCount}/{totalLessons}</span>
            </button>

            <button
              type="button"
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

        {micError && (
          <div
            role="alert"
            className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-red-800/50 bg-red-950/50 px-3 py-1.5 text-xs text-red-300"
          >
            <span>{micError}</span>
            <button
              type="button"
              onClick={onDismissMicError}
              aria-label="Dismiss microphone message"
              className="shrink-0 rounded-md px-1.5 font-bold text-red-200 hover:bg-red-900/50"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab row: scrolls sideways inside itself, never the page */}
        <nav
          aria-label="Main Navigation"
          className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-2 -mx-3 px-3 sm:mx-0 sm:px-0"
        >
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
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
