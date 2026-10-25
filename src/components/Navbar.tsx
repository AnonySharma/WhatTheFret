import React from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Music,
  BookOpen,
  Sparkles,
  Sliders,
  Globe,
  Award,
  Layers,
  Compass,
} from 'lucide-react';
import { TopMetronomeTunerWidget } from './TopMetronomeTunerWidget';

export type ActiveTab = 'modules' | 'chord-library' | 'fretboard' | 'circle-of-fifths' | 'tuner' | 'journey' | 'swaras' | 'pdf';

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
    <header className="bg-stone-950/90 backdrop-blur-xl border-b border-stone-800/80 text-stone-100 sticky top-0 z-50 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand Title - Fixed, non-wrapping with shrink-0 */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer group shrink-0"
            onClick={() => setActiveTab('modules')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 flex items-center justify-center shadow-md shadow-amber-950/50 border border-amber-400/30 group-hover:scale-105 transition-transform shrink-0">
              <span className="text-lg">🎸</span>
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-100 via-amber-200 to-amber-500 bg-clip-text text-transparent">
                  Intuitive Guitar Studio
                </span>
                <span className="hidden sm:inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-medium hidden sm:block">Acoustic Physics & Sargam</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs - Compact, elegant pill group */}
          <nav className="hidden xl:flex items-center space-x-1 bg-stone-900/90 p-1 rounded-2xl border border-stone-800/90 shadow-inner" aria-label="Main Navigation">
            <button
              onClick={() => setActiveTab('modules')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'modules'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lessons</span>
            </button>

            <button
              onClick={() => setActiveTab('chord-library')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'chord-library'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Chord Library</span>
            </button>

            <button
              onClick={() => setActiveTab('fretboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'fretboard'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Fretboard</span>
            </button>

            <button
              onClick={() => setActiveTab('circle-of-fifths')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'circle-of-fifths'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Circle of 5ths</span>
            </button>

            <button
              onClick={() => setActiveTab('tuner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'tuner'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Tuner</span>
            </button>

            <button
              onClick={() => setActiveTab('swaras')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'swaras'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Raagas & Swaras</span>
            </button>

            <button
              onClick={() => setActiveTab('journey')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'journey'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Journey</span>
              <span className="ml-1 px-1.5 py-0.2 text-[9px] rounded-full bg-amber-500/20 text-amber-300 font-black">
                {progressPercentage}%
              </span>
            </button>

            <button
              onClick={() => setActiveTab('pdf')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'pdf'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>PDF Notes</span>
            </button>
          </nav>

          {/* Right Controls: Top Metronome & Tuner Hub, Notation Toggle, Mute */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Metronome & Tuner Top Popover Hub (Hoverable Tooltip Thingy) */}
            <TopMetronomeTunerWidget
              isMicActive={isMicActive}
              onToggleMic={onToggleMic}
            />

            {/* Quick Notation Switcher */}
            <button
              onClick={() => onToggleNotation(notesNotation === 'western' ? 'indian' : 'western')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/40 text-xs font-semibold text-stone-200 transition-all shadow-sm"
              title="Toggle between Western (C D E) and Indian Sargam (Sa Re Ga Ma)"
            >
              <span className="text-[10px] text-amber-400 font-bold uppercase hidden sm:inline">Notation:</span>
              <span className="font-extrabold text-amber-300 text-[11px]">
                {notesNotation === 'western' ? 'Western' : 'Sargam'}
              </span>
            </button>

            {/* Quick Progress Badge */}
            <div
              onClick={() => setActiveTab('journey')}
              className="cursor-pointer hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm hover:border-amber-500/60 transition-colors"
              title="Click to view full Guided Journey progress"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">{completedCount}/7 Done</span>
            </div>

            {/* Audio Mute */}
            <button
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              className={`p-2 rounded-xl border transition-all ${
                isMuted
                  ? 'bg-red-950/70 border-red-800/50 text-red-400'
                  : 'bg-stone-900 border-stone-800 text-amber-400 hover:bg-stone-800 hover:border-stone-700'
              }`}
              title={isMuted ? 'Unmute sound' : 'Mute sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Medium/Mobile Navigation bar: Scrollable horizontal tabs */}
        <div className="flex xl:hidden overflow-x-auto py-2 gap-1.5 border-t border-stone-800/80 scrollbar-none items-center">
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeTab === 'modules' ? 'bg-amber-600 text-white border-amber-500' : 'bg-stone-900/60 text-stone-300 border-stone-800'
            }`}
          >
            Lessons
          </button>
          <button
            onClick={() => setActiveTab('chord-library')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeTab === 'chord-library' ? 'bg-amber-600 text-white border-amber-500' : 'bg-stone-900/60 text-stone-300 border-stone-800'
            }`}
          >
            Chord Library
          </button>
          <button
            onClick={() => setActiveTab('fretboard')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeTab === 'fretboard' ? 'bg-amber-600 text-white border-amber-500' : 'bg-stone-900/60 text-stone-300 border-stone-800'
            }`}
          >
            Fretboard
          </button>
          <button
            onClick={() => setActiveTab('circle-of-fifths')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeTab === 'circle-of-fifths' ? 'bg-amber-600 text-white border-amber-500' : 'bg-stone-900/60 text-stone-300 border-stone-800'
            }`}
          >
            Circle of 5ths
          </button>
          <button
            onClick={() => setActiveTab('tuner')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeTab === 'tuner' ? 'bg-amber-600 text-white border-amber-500' : 'bg-stone-900/60 text-stone-300 border-stone-800'
            }`}
          >
            Tuner
          </button>
          <button
            onClick={() => setActiveTab('swaras')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeTab === 'swaras' ? 'bg-amber-600 text-white border-amber-500' : 'bg-stone-900/60 text-stone-300 border-stone-800'
            }`}
          >
            Raagas & Swaras
          </button>
          <button
            onClick={() => setActiveTab('journey')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeTab === 'journey' ? 'bg-amber-600 text-white border-amber-500' : 'bg-stone-900/60 text-stone-300 border-stone-800'
            }`}
          >
            Journey ({progressPercentage}%)
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeTab === 'pdf' ? 'bg-amber-600 text-white border-amber-500' : 'bg-stone-900/60 text-stone-300 border-stone-800'
            }`}
          >
            PDF Notes
          </button>
        </div>
      </div>
    </header>
  );
};
