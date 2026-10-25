/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ChordLibrary } from './components/ChordLibrary';
import { InteractiveFretboard } from './components/InteractiveFretboard';
import { RealTimeTuner } from './components/RealTimeTuner';
import { GuidedJourney } from './components/GuidedJourney';
import { PDFCompanionView } from './components/PDFCompanionView';
import { IndianSwarasExplorer } from './components/IndianSwarasExplorer';
import { CircleOfFifths } from './components/CircleOfFifths';

// 7 Interactive Modules from PDF
import { ModuleEarTuning } from './components/modules/ModuleEarTuning';
import { ModuleMajorScale } from './components/modules/ModuleMajorScale';
import { ModuleTriadCode } from './components/modules/ModuleTriadCode';
import { ModuleDiatonicHarmony } from './components/modules/ModuleDiatonicHarmony';
import { ModuleFretboardMapping } from './components/modules/ModuleFretboardMapping';
import { ModuleBarreChords } from './components/modules/ModuleBarreChords';
import { ModuleChordDerivation } from './components/modules/ModuleChordDerivation';

import { guitarAudio } from './utils/audioSynth';
import {
  loadUserProgress,
  saveUserProgress,
  toggleLessonCompletion,
  calculateProgressStats,
  UserProgressState,
} from './utils/progressStore';
import { SUGGESTED_THEORY_LABS, FutureTheoryLab } from './constants';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Sparkles,
  Award,
  Layers,
  Lightbulb,
  X,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('modules');
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [showSuggestedLabsModal, setShowSuggestedLabsModal] = useState<boolean>(false);

  // User progress from localStorage
  const [progress, setProgress] = useState<UserProgressState>(() => loadUserProgress());

  // Listen to cross-component progress updates
  useEffect(() => {
    const handleUpdate = () => {
      setProgress(loadUserProgress());
    };
    window.addEventListener('guitar_progress_updated', handleUpdate);
    return () => window.removeEventListener('guitar_progress_updated', handleUpdate);
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    guitarAudio.setMuted(next);
  };

  const toggleMic = () => {
    const next = !isMicActive;
    setIsMicActive(next);
  };

  const handleToggleNotation = (mode: 'western' | 'indian') => {
    const updated = saveUserProgress({ notesNotation: mode });
    setProgress(updated);
  };

  const handleToggleCurrentLesson = () => {
    const updated = toggleLessonCompletion(activeModuleIndex);
    setProgress(updated);

    if (updated.completedLessons.includes(activeModuleIndex)) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
      });
    }
  };

  const moduleTitles = [
    "1. Ear Tuning & 12 Tones",
    "2. Major Scale & Minor",
    "3. +4 / +3 Triad Code",
    "4. Diatonic Harmony",
    "5. Fretboard & Bass Gravity",
    "6. Barre Chords (Shift Nut)",
    "7. Chord Derivation Wizard",
  ];

  const stats = calculateProgressStats(progress.completedLessons, 7);
  const isCurrentLessonDone = progress.completedLessons.includes(activeModuleIndex);

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950 relative">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-amber-600/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        isMicActive={isMicActive}
        onToggleMic={toggleMic}
        progressPercentage={stats.percentage}
        completedCount={stats.count}
        notesNotation={progress.notesNotation}
        onToggleNotation={handleToggleNotation}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        {/* TAB 1: 7 THEORY LESSONS FROM PDF */}
        {activeTab === 'modules' && (
          <div className="space-y-6">
            {/* Unified Acoustic Studio Lesson Navigator */}
            <div className="relative rounded-2xl bg-gradient-to-b from-stone-900/95 via-stone-900/70 to-stone-950/90 border border-stone-800/80 shadow-2xl overflow-hidden backdrop-blur-xl">
              {/* Top Golden Brass Line */}
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

              <div className="p-4 sm:p-5 space-y-4">
                {/* Upper Row: Lesson Title, Breadcrumb, and Completion Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 font-mono text-[11px] font-bold border border-amber-500/30">
                      LESSON 0{activeModuleIndex + 1}
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-stone-100 tracking-tight">
                      {moduleTitles[activeModuleIndex]}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-400 font-medium hidden sm:inline">
                      Overall Mastery: <strong className="text-amber-300 font-bold">{stats.percentage}%</strong> ({stats.count}/7 Done)
                    </span>

                    <button
                      onClick={handleToggleCurrentLesson}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 border ${
                        isCurrentLessonDone
                          ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/60'
                          : 'bg-stone-950 border-stone-700 hover:border-amber-500/50 text-stone-300 hover:text-white'
                      }`}
                    >
                      {isCurrentLessonDone ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Completed! (+100 Pts)</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 text-stone-500" />
                          <span>Mark as Completed</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Lower Row: Stepper Ribbon with clear numbers */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 flex-1">
                    {moduleTitles.map((title, idx) => {
                      const isDone = progress.completedLessons.includes(idx);
                      const isSelected = activeModuleIndex === idx;

                      return (
                        <button
                          key={idx}
                          onClick={() => setActiveModuleIndex(idx)}
                          className={`relative px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap ${
                            isSelected
                              ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30 ring-1 ring-amber-400/50'
                              : isDone
                              ? 'bg-stone-950/70 text-emerald-300 border border-emerald-500/20 hover:bg-stone-850'
                              : 'bg-stone-950/40 text-stone-400 border border-stone-800/60 hover:text-stone-200 hover:bg-stone-850/60'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              isSelected
                                ? 'bg-stone-950 text-amber-300'
                                : isDone
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-stone-800 text-stone-500'
                            }`}
                          >
                            {isDone ? '✓' : idx + 1}
                          </span>
                          <span>{title.split('. ')[1] || title}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Prev / Next Controls */}
                  <div className="flex items-center gap-1 shrink-0 pl-2">
                    <button
                      disabled={activeModuleIndex === 0}
                      onClick={() => setActiveModuleIndex(prev => Math.max(0, prev - 1))}
                      className="p-2 rounded-xl bg-stone-950/80 text-stone-400 hover:text-white border border-stone-800 hover:border-stone-700 disabled:opacity-25 disabled:pointer-events-none transition-colors"
                      title="Previous Lesson"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={activeModuleIndex === moduleTitles.length - 1}
                      onClick={() => setActiveModuleIndex(prev => Math.min(moduleTitles.length - 1, prev + 1))}
                      className="p-2 rounded-xl bg-stone-950/80 text-stone-400 hover:text-white border border-stone-800 hover:border-stone-700 disabled:opacity-25 disabled:pointer-events-none transition-colors"
                      title="Next Lesson"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Lesson View */}
            {activeModuleIndex === 0 && <ModuleEarTuning />}
            {activeModuleIndex === 1 && <ModuleMajorScale />}
            {activeModuleIndex === 2 && <ModuleTriadCode />}
            {activeModuleIndex === 3 && <ModuleDiatonicHarmony />}
            {activeModuleIndex === 4 && <ModuleFretboardMapping />}
            {activeModuleIndex === 5 && <ModuleBarreChords />}
            {activeModuleIndex === 6 && <ModuleChordDerivation />}

            {/* Lesson Navigation Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-800/80">
              <button
                disabled={activeModuleIndex === 0}
                onClick={() => setActiveModuleIndex(prev => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 font-bold text-xs flex items-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Lesson</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleCurrentLesson}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isCurrentLessonDone
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : 'bg-amber-600/20 border-amber-500/40 text-amber-300 hover:bg-amber-600/30'
                  }`}
                >
                  {isCurrentLessonDone ? '✓ Finished' : 'Mark Complete'}
                </button>
              </div>

              <button
                disabled={activeModuleIndex === moduleTitles.length - 1}
                onClick={() => setActiveModuleIndex(prev => Math.min(moduleTitles.length - 1, prev + 1))}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-30 disabled:pointer-events-none shadow-md"
              >
                <span>Next Lesson</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CHORD LIBRARY (NEW TAB!) */}
        {activeTab === 'chord-library' && (
          <div className="space-y-6">
            <ChordLibrary notesNotation={progress.notesNotation} />
          </div>
        )}

        {/* TAB 3: INTERACTIVE FRETBOARD & CHORD EXPLORER */}
        {activeTab === 'fretboard' && (
          <div className="space-y-6">
            <InteractiveFretboard notesNotation={progress.notesNotation} />
          </div>
        )}

        {/* TAB: CIRCLE OF FIFTHS VISUALIZER */}
        {activeTab === 'circle-of-fifths' && (
          <div className="space-y-6">
            <CircleOfFifths
              notesNotation={progress.notesNotation}
              onToggleNotation={handleToggleNotation}
            />
          </div>
        )}

        {/* TAB 4: REAL-TIME TUNER & PITCH FEEDBACK */}
        {activeTab === 'tuner' && (
          <div className="space-y-6">
            <RealTimeTuner isMicActive={isMicActive} onToggleMic={toggleMic} />
          </div>
        )}

        {/* TAB 5: GUIDED JOURNEY WITH PROGRESS TRACKING */}
        {activeTab === 'journey' && (
          <div className="space-y-6">
            <GuidedJourney
              onSelectLesson={(lessonIdx) => {
                setActiveModuleIndex(lessonIdx);
                setActiveTab('modules');
              }}
            />
          </div>
        )}

        {/* TAB 6: INDIAN RAAGAS & SWARAS EXPLORER */}
        {activeTab === 'swaras' && (
          <div className="space-y-6">
            <IndianSwarasExplorer
              notesNotation={progress.notesNotation}
              onToggleNotation={handleToggleNotation}
            />
          </div>
        )}

        {/* TAB 7: PDF COMPANION */}
        {activeTab === 'pdf' && (
          <div className="space-y-6">
            <PDFCompanionView
              onSelectModule={(lessonIdx) => {
                setActiveModuleIndex(lessonIdx);
                setActiveTab('modules');
              }}
            />
          </div>
        )}
      </main>

      {/* Suggested Theory Labs Bar */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <div className="bg-gradient-to-r from-stone-900/90 via-stone-900 to-amber-950/30 border border-stone-800/90 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-500/20 shrink-0">
              💡
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-100 flex items-center gap-2">
                <span>Suggested Advanced Theory Labs</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  EXPANSION
                </span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Circle of Fifths, 3D CAGED system topology, Tanpura modal jam rooms, and interval training.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSuggestedLabsModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 text-xs font-bold transition-all shrink-0"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Explore Suggested Labs ({SUGGESTED_THEORY_LABS.length})</span>
          </button>
        </div>
      </section>

      {/* Modern, Classy Footer */}
      <footer className="border-t border-stone-800/80 bg-stone-950/90 backdrop-blur-md py-6 text-xs text-stone-500 mt-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-stone-300">Intuitive Guitar Studio</span>
            <span>•</span>
            <span>Western Physics & Indian Sargam Mechanics</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setActiveTab('chord-library')}
              className="text-stone-400 hover:text-amber-400 transition-colors"
            >
              Chord Library
            </button>
            <button
              onClick={() => setActiveTab('swaras')}
              className="text-stone-400 hover:text-amber-400 transition-colors"
            >
              Indian Raagas & Swaras
            </button>
            <button
              onClick={() => setActiveTab('journey')}
              className="text-stone-400 hover:text-amber-400 transition-colors font-bold text-amber-400/90"
            >
              Mastery: {stats.percentage}%
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className="text-stone-400 hover:text-amber-400 transition-colors"
            >
              PDF Notes
            </button>
          </div>
        </div>
      </footer>

      {/* Suggested Theory Labs Interactive Modal */}
      {showSuggestedLabsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">💡</span>
                <div>
                  <h3 className="text-lg font-black text-stone-100">
                    Suggested Interactive Theory Labs & Features
                  </h3>
                  <p className="text-xs text-stone-400">
                    Recommendations to push your intuitive guitar learning journey even further
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSuggestedLabsModal(false)}
                className="p-2 rounded-xl bg-stone-950 text-stone-400 hover:text-white border border-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUGGESTED_THEORY_LABS.map((lab: FutureTheoryLab, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{lab.icon}</span>
                      <h4 className="font-extrabold text-stone-100 text-sm">{lab.title}</h4>
                    </div>
                    <span className="text-[11px] text-amber-400 font-semibold block mt-1">
                      {lab.tagline}
                    </span>
                    <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                      {lab.concept}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-800/70 text-[11px] text-stone-300 space-y-1">
                    <div>
                      <strong className="text-emerald-400">Interactive: </strong>
                      {lab.howItWorks}
                    </div>
                    <div>
                      <strong className="text-amber-400">Mastery Gain: </strong>
                      {lab.benefit}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-end">
              <button
                onClick={() => setShowSuggestedLabsModal(false)}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Got It, Back to Studio!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
