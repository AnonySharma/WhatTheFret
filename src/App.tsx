/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useState, useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { Navbar, isActiveTab, type ActiveTab } from './components/Navbar';
import { PanelFallback } from './components/PanelFallback';
import { DEFAULT_LAB, isLabId, visibleLabs } from './components/labs/labRoutes';
import type { LabId } from './constants';

import { guitarAudio } from './utils/audioSynth';
import { pitchDetector, type PitchListener } from './utils/pitchDetector';
import {
  loadUserProgress,
  saveUserProgress,
  toggleLessonCompletion,
  calculateProgressStats,
  UserProgressState,
} from './utils/progressStore';
import { type TheoryLabInfo } from './constants';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Lightbulb, X } from 'lucide-react';
import { celebrate } from './utils/celebrate';
import { ModuleEarTuning } from './components/modules/ModuleEarTuning';

// The first lesson is the default screen, so it ships in the main bundle; everything else loads on demand.

const ChordLibrary = lazy(() => import('./components/ChordLibrary').then(m => ({ default: m.ChordLibrary })));
const InteractiveFretboard = lazy(() =>
  import('./components/InteractiveFretboard').then(m => ({ default: m.InteractiveFretboard })),
);
const RealTimeTuner = lazy(() => import('./components/RealTimeTuner').then(m => ({ default: m.RealTimeTuner })));
const GuidedJourney = lazy(() => import('./components/GuidedJourney').then(m => ({ default: m.GuidedJourney })));
const PDFCompanionView = lazy(() =>
  import('./components/PDFCompanionView').then(m => ({ default: m.PDFCompanionView })),
);
const IndianSwarasExplorer = lazy(() =>
  import('./components/IndianSwarasExplorer').then(m => ({ default: m.IndianSwarasExplorer })),
);
const CircleOfFifths = lazy(() => import('./components/CircleOfFifths').then(m => ({ default: m.CircleOfFifths })));
const LabsHub = lazy(() => import('./components/labs/LabsHub').then(m => ({ default: m.LabsHub })));

// 7 Interactive Modules from PDF
const ModuleMajorScale = lazy(() =>
  import('./components/modules/ModuleMajorScale').then(m => ({ default: m.ModuleMajorScale })),
);
const ModuleTriadCode = lazy(() =>
  import('./components/modules/ModuleTriadCode').then(m => ({ default: m.ModuleTriadCode })),
);
const ModuleDiatonicHarmony = lazy(() =>
  import('./components/modules/ModuleDiatonicHarmony').then(m => ({ default: m.ModuleDiatonicHarmony })),
);
const ModuleFretboardMapping = lazy(() =>
  import('./components/modules/ModuleFretboardMapping').then(m => ({ default: m.ModuleFretboardMapping })),
);
const ModuleBarreChords = lazy(() =>
  import('./components/modules/ModuleBarreChords').then(m => ({ default: m.ModuleBarreChords })),
);
const ModuleChordDerivation = lazy(() =>
  import('./components/modules/ModuleChordDerivation').then(m => ({ default: m.ModuleChordDerivation })),
);

/** The lessons, in order. The count, stepper, titles and progress totals all derive from this one list. */
const LESSONS: { title: string; render: (indian: boolean) => ReactNode }[] = [
  { title: '1. Ear Tuning & 12 Tones', render: () => <ModuleEarTuning /> },
  { title: '2. Major Scale & Minor', render: indian => <ModuleMajorScale indian={indian} /> },
  { title: '3. +4 / +3 Triad Code', render: indian => <ModuleTriadCode indian={indian} /> },
  { title: '4. Diatonic Harmony', render: () => <ModuleDiatonicHarmony /> },
  { title: '5. Fretboard & Bass Gravity', render: () => <ModuleFretboardMapping /> },
  { title: '6. Barre Chords (Shift Nut)', render: () => <ModuleBarreChords /> },
  { title: '7. Chord Derivation Wizard', render: indian => <ModuleChordDerivation indian={indian} /> },
];

type Route = { tab: ActiveTab; lab: LabId };

/** `#labs/ear` or `#chord-library` -> route; anything unknown falls back to the lessons / first lab. */
function parseHash(hash: string): Route {
  const [tab, lab] = hash.replace(/^#/, '').split('/');
  return {
    tab: isActiveTab(tab) ? tab : 'modules',
    lab: isLabId(lab) ? lab : DEFAULT_LAB,
  };
}

const routeHash = (tab: ActiveTab, lab: LabId) => (tab === 'labs' ? `#labs/${lab}` : `#${tab}`);

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface LabsModalProps {
  labs: TheoryLabInfo[];
  onClose: () => void;
  onOpenLab: (id: LabId) => void;
}

/** Accessible dialog: Escape / backdrop close, focus moves in and is restored, Tab is trapped, page scroll is locked. */
function LabsModal({ labs, onClose, onOpenLab }: LabsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      trigger?.focus?.();
    };
  }, []);

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md"
      onKeyDown={onKeyDown}
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="labs-modal-title"
        className="bg-ink-900 border border-ink-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-ink-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" aria-hidden>💡</span>
            <div>
              <h3 id="labs-modal-title" className="text-lg font-black text-ink-100">
                Advanced Theory Labs
              </h3>
              <p className="text-xs text-ink-400">Pick a lab to open it</p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl bg-ink-950 text-ink-400 hover:text-white border border-ink-800"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {labs.map(lab => (
            <div
              key={lab.id}
              className="p-4 rounded-2xl bg-ink-950 border border-ink-800 flex flex-col justify-between space-y-3 hover:border-brand-500/40 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl" aria-hidden>{lab.icon}</span>
                  <h4 className="font-extrabold text-ink-100 text-sm">{lab.title}</h4>
                </div>
                <span className="text-[11px] text-brand-400 font-semibold block mt-1">{lab.tagline}</span>
                <p className="text-xs text-ink-400 mt-2 leading-relaxed">{lab.concept}</p>
              </div>

              <div className="pt-2 border-t border-ink-800/70 text-[11px] text-ink-300 space-y-1">
                <div>
                  <strong className="text-gold-400">Interactive: </strong>
                  {lab.howItWorks}
                </div>
                <div>
                  <strong className="text-brand-400">Mastery Gain: </strong>
                  {lab.benefit}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenLab(lab.id)}
                aria-label={`Open lab: ${lab.title}`}
                className="w-full h-9 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors"
              >
                Open this lab
              </button>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-ink-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => parseHash(window.location.hash).tab);
  const [activeLab, setActiveLabState] = useState<LabId>(() => parseHash(window.location.hash).lab);
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [showSuggestedLabsModal, setShowSuggestedLabsModal] = useState<boolean>(false);

  // Keep the URL hash and the screen in sync both ways (shared links, back / forward).
  const setRoute = (tab: ActiveTab, lab: LabId = activeLab) => {
    setActiveTabState(tab);
    setActiveLabState(lab);
    const hash = routeHash(tab, lab);
    if (window.location.hash !== hash) window.location.hash = hash;
  };
  const setActiveTab = (tab: ActiveTab) => setRoute(tab);
  const setActiveLab = (lab: LabId) => setRoute('labs', lab);
  const openLab = (lab: LabId) => {
    setRoute('labs', lab);
    setShowSuggestedLabsModal(false);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const onHashChange = () => {
      const route = parseHash(window.location.hash);
      setActiveTabState(route.tab);
      // Only `#labs/<id>` names a lab; other hashes must not reset the remembered one.
      if (route.tab === 'labs') setActiveLabState(route.lab);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

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

  // The mic stays open while this listener is registered; the tuner views add their own on top of it.
  // Using the start result (not just flipping state) means a denied or missing mic never sticks "on".
  const micHold = useRef<PitchListener>(() => {});
  const micPending = useRef(false);
  const toggleMic = async () => {
    if (micPending.current) return; // a permission prompt is still open
    setMicError(null);
    if (isMicActive) {
      pitchDetector.stopListening(micHold.current);
      setIsMicActive(false);
      return;
    }
    micPending.current = true;
    const ok = await pitchDetector.startListening(micHold.current);
    micPending.current = false;
    if (ok) {
      setIsMicActive(true);
    } else {
      setIsMicActive(false);
      setMicError('Microphone unavailable. Allow mic access in your browser and try again.');
    }
  };

  const handleToggleNotation = (mode: 'western' | 'indian') => {
    const updated = saveUserProgress({ notesNotation: mode });
    setProgress(updated);
  };

  const indian = progress.notesNotation === 'indian';

  // Indian-only screens disappear with the toggle, so never leave the user stranded on one.
  useEffect(() => {
    if (indian) return;
    if (activeTab === 'swaras') setRoute('modules');
    else if (!visibleLabs(false).some(l => l.id === activeLab)) {
      if (activeTab === 'labs') setRoute('labs', DEFAULT_LAB);
      else setActiveLabState(DEFAULT_LAB);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indian, activeTab, activeLab]);

  const handleToggleCurrentLesson = () => {
    const updated = toggleLessonCompletion(activeModuleIndex);
    setProgress(updated);

    if (updated.completedLessons.includes(activeModuleIndex)) {
      celebrate({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#f59e0b', '#f97316', '#8b5cf6', '#f87171'],
      });
    }
  };

  const totalLessons = LESSONS.length;
  const stats = calculateProgressStats(progress.completedLessons, totalLessons);
  const labs = visibleLabs(indian);
  const isCurrentLessonDone = progress.completedLessons.includes(activeModuleIndex);

  return (
    <div className="min-h-screen bg-[#0c0a09] text-ink-100 flex flex-col font-sans selection:bg-brand-500 selection:text-ink-950 relative">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-brand-600/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-gold-600/5 rounded-full blur-[140px]" />
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
        totalLessons={totalLessons}
        micError={micError}
        onDismissMicError={() => setMicError(null)}
        notesNotation={progress.notesNotation}
        onToggleNotation={handleToggleNotation}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        <Suspense fallback={<PanelFallback />}>
        {/* TAB 1: 7 THEORY LESSONS FROM PDF */}
        {activeTab === 'modules' && (
          <div className="space-y-6">
            {/* Unified Acoustic Studio Lesson Navigator */}
            <div className="relative rounded-2xl bg-gradient-to-b from-ink-900/95 via-ink-900/70 to-ink-950/90 border border-ink-800/80 shadow-2xl overflow-hidden backdrop-blur-xl">
              {/* Top Golden Brass Line */}
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />

              <div className="p-4 sm:p-5 space-y-4">
                {/* Upper Row: Lesson Title, Breadcrumb, and Completion Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-md bg-brand-500/15 text-brand-300 font-mono text-[11px] font-bold border border-brand-500/30">
                      LESSON {String(activeModuleIndex + 1).padStart(2, '0')}
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-ink-100 tracking-tight">
                      {LESSONS[activeModuleIndex].title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-400 font-medium hidden sm:inline">
                      Overall Mastery: <strong className="text-brand-300 font-bold">{stats.percentage}%</strong> ({stats.count}/{totalLessons} Done)
                    </span>

                    <button
                      onClick={handleToggleCurrentLesson}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 border ${
                        isCurrentLessonDone
                          ? 'bg-gold-950/80 border-gold-500/60 text-gold-300 hover:bg-gold-900/60'
                          : 'bg-ink-950 border-ink-700 hover:border-brand-500/50 text-ink-300 hover:text-white'
                      }`}
                    >
                      {isCurrentLessonDone ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-gold-400" />
                          <span>Completed! (+100 Pts)</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 text-ink-500" />
                          <span>Mark as Completed</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Lower Row: Stepper Ribbon with clear numbers */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 flex-1">
                    {LESSONS.map(({ title }, idx) => {
                      const isDone = progress.completedLessons.includes(idx);
                      const isSelected = activeModuleIndex === idx;

                      return (
                        <button
                          key={idx}
                          onClick={() => setActiveModuleIndex(idx)}
                          className={`relative px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap ${
                            isSelected
                              ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/30 ring-1 ring-brand-400/50'
                              : isDone
                              ? 'bg-ink-950/70 text-gold-300 border border-gold-500/20 hover:bg-ink-850'
                              : 'bg-ink-950/40 text-ink-400 border border-ink-800/60 hover:text-ink-200 hover:bg-ink-850/60'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              isSelected
                                ? 'bg-ink-950 text-brand-300'
                                : isDone
                                ? 'bg-gold-500/20 text-gold-400'
                                : 'bg-ink-800 text-ink-500'
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
                      className="p-2 rounded-xl bg-ink-950/80 text-ink-400 hover:text-white border border-ink-800 hover:border-ink-700 disabled:opacity-25 disabled:pointer-events-none transition-colors"
                      title="Previous Lesson"
                      aria-label="Previous lesson"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={activeModuleIndex === totalLessons - 1}
                      onClick={() => setActiveModuleIndex(prev => Math.min(totalLessons - 1, prev + 1))}
                      className="p-2 rounded-xl bg-ink-950/80 text-ink-400 hover:text-white border border-ink-800 hover:border-ink-700 disabled:opacity-25 disabled:pointer-events-none transition-colors"
                      title="Next Lesson"
                      aria-label="Next lesson"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Lesson View */}
            <Suspense fallback={<PanelFallback />}>{LESSONS[activeModuleIndex].render(indian)}</Suspense>

            {/* Lesson Navigation Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-ink-800/80">
              <button
                disabled={activeModuleIndex === 0}
                onClick={() => setActiveModuleIndex(prev => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl bg-ink-900 border border-ink-800 hover:bg-ink-800 text-ink-300 font-bold text-xs flex items-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Lesson</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleCurrentLesson}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isCurrentLessonDone
                      ? 'bg-gold-950/60 border-gold-500/50 text-gold-300'
                      : 'bg-brand-600/20 border-brand-500/40 text-brand-300 hover:bg-brand-600/30'
                  }`}
                >
                  {isCurrentLessonDone ? '✓ Finished' : 'Mark Complete'}
                </button>
              </div>

              <button
                disabled={activeModuleIndex === totalLessons - 1}
                onClick={() => setActiveModuleIndex(prev => Math.min(totalLessons - 1, prev + 1))}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-30 disabled:pointer-events-none shadow-md"
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
            <CircleOfFifths notesNotation={progress.notesNotation} />
          </div>
        )}

        {/* TAB: ADVANCED THEORY LABS */}
        {activeTab === 'labs' && (
          <LabsHub lab={activeLab} onLabChange={setActiveLab} notation={progress.notesNotation} />
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
        {activeTab === 'swaras' && indian && (
          <div className="space-y-6">
            <IndianSwarasExplorer />
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
        </Suspense>
      </main>

      {/* Suggested Theory Labs Bar */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <div className="bg-gradient-to-r from-ink-900/90 via-ink-900 to-brand-950/30 border border-ink-800/90 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-lg border border-brand-500/20 shrink-0">
              💡
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-ink-100 flex items-center gap-2">
                <span>Advanced Theory Labs</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold">
                  {labs.length} LABS
                </span>
              </h3>
              <p className="text-xs text-ink-400 mt-0.5">
                {indian
                  ? 'Key transposer, CAGED system, capo, tanpura and tabla jam pad, and interval ear training.'
                  : 'Key transposer, CAGED system, capo and interval ear training.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSuggestedLabsModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink-900 hover:bg-ink-800 text-brand-300 border border-brand-500/30 hover:border-brand-500/60 text-xs font-bold transition-all shrink-0"
          >
            <Lightbulb className="w-3.5 h-3.5 text-brand-400" />
            <span>Explore the Labs</span>
          </button>
        </div>
      </section>

      {/* Modern, Classy Footer */}
      <footer className="border-t border-ink-800/80 bg-ink-950/90 backdrop-blur-md py-6 text-xs text-ink-500 mt-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-ink-300">WhatTheFret</span>
            <span>•</span>
            <span>{indian ? 'Western Physics & Indian Sargam Mechanics' : 'The math of the fretboard'}</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setActiveTab('chord-library')}
              className="text-ink-400 hover:text-brand-400 transition-colors"
            >
              Chord Library
            </button>
            {indian && (
              <button
                onClick={() => setActiveTab('swaras')}
                className="text-ink-400 hover:text-brand-400 transition-colors"
              >
                Indian Raagas & Swaras
              </button>
            )}
            <button
              onClick={() => setActiveTab('journey')}
              className="text-ink-400 hover:text-brand-400 transition-colors font-bold text-brand-400/90"
            >
              Mastery: {stats.percentage}%
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className="text-ink-400 hover:text-brand-400 transition-colors"
            >
              PDF Notes
            </button>
          </div>
        </div>
      </footer>

      {/* Suggested Theory Labs Interactive Modal */}
      {showSuggestedLabsModal && (
        <LabsModal labs={labs} onClose={() => setShowSuggestedLabsModal(false)} onOpenLab={openLab} />
      )}
    </div>
  );
}
