import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Play,
  Volume2,
  Sparkles,
  Award,
  RefreshCw,
  Sliders,
  HelpCircle,
  RotateCcw,
  Music,
} from 'lucide-react';
import {
  deriveTriad,
  NoteName,
  NOTE_NAMES,
  calculateBarreChord,
  getFretNote,
  getSwaraForNote,
  shiftSemitones,
  getSemitoneDistance,
} from '../../utils/guitarTheory';
import { guitarAudio } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';

export const ModuleChordDerivation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wizard' | 'quiz'>('wizard');
  const [targetChordRoot, setTargetChordRoot] = useState<NoteName>('G');
  const [targetFlavor, setTargetFlavor] = useState<'Major' | 'Minor'>('Minor');
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [hoveredWalkFret, setHoveredWalkFret] = useState<number | null>(null);
  const [isBarreEngaged, setIsBarreEngaged] = useState<boolean>(true);

  // Quiz state
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizQuestionIndex, setQuizQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);

  const triad = deriveTriad(targetChordRoot, targetFlavor);
  const barreVoicing = calculateBarreChord(targetChordRoot, targetFlavor === 'Minor' ? 'E-Minor' : 'E-Major');

  // Low E anchor fret calculation (distance from E to target root)
  const anchorFret = getSemitoneDistance('E', targetChordRoot);

  const playDerivedChord = () => {
    const freqs: number[] = [];
    [6, 5, 4, 3, 2, 1].forEach((sNum, idx) => {
      const f = barreVoicing.frets[idx];
      if (f >= 0) {
        freqs.push(getFretNote(sNum, f).frequency);
      } else {
        freqs.push(-1);
      }
    });
    guitarAudio.strum(freqs, 'down', 30);
  };

  const playSingleString = (stringNumber: number, fret: number) => {
    if (fret === -1) return;
    const { frequency } = getFretNote(stringNumber, fret);
    guitarAudio.pluck(frequency, 2.0, 0.85);
  };

  const playLowEFret = (fret: number) => {
    const { frequency } = getFretNote(6, fret);
    guitarAudio.pluck(frequency, 2.0, 0.9);
  };

  const quizQuestions = [
    {
      question: "What is the internal triad math formula for a Minor chord?",
      options: [
        "Root, +4 frets, +3 frets",
        "Root, +3 frets, +4 frets",
        "Root, +2 frets, +2 frets",
        "Root, +5 frets, +5 frets",
      ],
      correctIndex: 1,
      explanation: "A minor triad starts with a sad Minor 3rd (+3 semitones), followed by a Major 3rd (+4 semitones). Outer bounds = Perfect 5th (+7).",
    },
    {
      question: "To play a G Minor barre chord using the E-shape, where is your Root anchor on the Low E string?",
      options: [
        "1st fret",
        "3rd fret",
        "5th fret",
        "7th fret",
      ],
      correctIndex: 1,
      explanation: "Open Low E ➔ 1st fret F ➔ 2nd fret F# ➔ 3rd fret G! The anchor sits on the 3rd fret.",
    },
    {
      question: "What are the exact triad notes of C Major?",
      options: [
        "C, D, G",
        "C, E, G",
        "C, Eb, G",
        "C, F, A",
      ],
      correctIndex: 1,
      explanation: "C (+4 frets) ➔ E (+3 frets) ➔ G.",
    },
    {
      question: "Why do we lay our index finger flat across all strings when sliding an open shape up the neck?",
      options: [
        "To mute all strings completely",
        "To act as a movable, human 'nut' replacing the guitar headstock nut",
        "To make the guitar sound like a bass",
        "To avoid playing barre chords",
      ],
      correctIndex: 1,
      explanation: "The guitar nut holds the 0th fret. When sliding up, the index finger becomes the human nut so internal intervals shift together.",
    },
  ];

  const handleQuizAnswer = (optionIdx: number) => {
    if (isAnswered) return;
    setSelectedOption(optionIdx);
    setIsAnswered(true);

    if (optionIdx === quizQuestions[quizQuestionIndex].correctIndex) {
      setQuizScore(prev => prev + 1);
      confetti({ particleCount: 35, spread: 60 });
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setQuizQuestionIndex(prev => (prev + 1) % quizQuestions.length);
  };

  const stepsMeta = [
    { step: 1, title: 'Identify Request', subtitle: `Root ${targetChordRoot}` },
    { step: 2, title: 'Triad Code Math', subtitle: targetFlavor === 'Minor' ? '+3, +4' : '+4, +3' },
    { step: 3, title: 'Triad Notes', subtitle: `[${triad.notes.join(', ')}]` },
    { step: 4, title: 'Find Anchor Fret', subtitle: `Fret ${anchorFret} on Low E` },
    { step: 5, title: 'Graft Barre Shape', subtitle: `Movable ${targetFlavor === 'Minor' ? 'Em' : 'E'} Shape` },
  ];

  return (
    <div className="space-y-6">
      {/* Sleek Acoustic Studio Console Header (Unified, Non-Boxy) */}
      <div className="bg-gradient-to-b from-ink-900/95 via-ink-900/80 to-ink-950/90 border border-ink-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 backdrop-blur-xl relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-800/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-brand-500/15 text-brand-300 font-mono text-[11px] font-bold border border-brand-500/30">
                Section 7
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-ink-100 tracking-tight">
                Interactive Visual Chord Derivation Wizard
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-ink-400 max-w-3xl leading-relaxed">
              Never memorize arbitrary finger patterns again! By combining <strong className="text-brand-300">Triad Math (+4 / +3)</strong> with <strong className="text-violet-300">Nut Sliding Logic</strong>, you can construct any chord anywhere on the neck from physical first principles.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-ink-950/80 p-1 rounded-xl border border-ink-800 self-start sm:self-center shrink-0">
            <button
              onClick={() => setActiveTab('wizard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'wizard'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              5-Step Workshop
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'quiz'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              Theory Quiz ({quizScore}/{quizQuestions.length})
            </button>
          </div>
        </div>

        {/* Integrated Chord Selection Deck */}
        {activeTab === 'wizard' && (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-4">
              {/* Root Note Picker with Pearloid Inlay Styling */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-brand-400">
                  Root:
                </span>
                <div className="flex items-center gap-1.5">
                  {(['G', 'F', 'A', 'B', 'C', 'D', 'E', 'F#'] as NoteName[]).map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        setTargetChordRoot(r);
                        guitarAudio.pluck(getFretNote(6, getSemitoneDistance('E', r)).frequency, 1.5, 0.8);
                      }}
                      className={`w-8 h-8 rounded-full font-black text-xs transition-all active:scale-95 ${
                        targetChordRoot === r
                          ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-ink-950 shadow-[0_0_12px_rgba(245,158,11,0.6)] ring-2 ring-brand-300 scale-105'
                          : 'bg-ink-950 text-ink-300 border border-ink-800 hover:border-brand-500/40 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flavor Selector Switch */}
              <div className="flex items-center bg-ink-950 p-1 rounded-xl border border-ink-800 text-xs">
                <button
                  onClick={() => setTargetFlavor('Minor')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    targetFlavor === 'Minor'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-ink-400 hover:text-ink-200'
                  }`}
                >
                  Minor (PDF G-Minor Example)
                </button>
                <button
                  onClick={() => setTargetFlavor('Major')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    targetFlavor === 'Major'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-ink-400 hover:text-ink-200'
                  }`}
                >
                  Major
                </button>
              </div>
            </div>

            {/* Quick Strum Audio Button */}
            <button
              onClick={playDerivedChord}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white text-xs font-bold shadow-md active:scale-95 transition-all ml-auto"
            >
              <Volume2 className="w-4 h-4" />
              <span>Strum {targetChordRoot} {targetFlavor} Chord</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'wizard' ? (
        <div className="space-y-6">

          {/* VISUAL 5-STEP INTERACTIVE PROGRESS STEPPER */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {stepsMeta.map(meta => {
              const isCurrent = wizardStep === meta.step;
              const isPast = wizardStep > meta.step;

              return (
                <button
                  key={meta.step}
                  onClick={() => setWizardStep(meta.step)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-brand-600/20 border-brand-500 ring-2 ring-brand-500/40 shadow-lg'
                      : isPast
                      ? 'bg-ink-950/80 border-gold-500/30 text-ink-300'
                      : 'bg-ink-950/50 border-ink-800 text-ink-500 hover:border-ink-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isCurrent ? 'bg-brand-500 text-ink-950' : isPast ? 'bg-gold-950 text-gold-400' : 'bg-ink-900 text-ink-400'
                    }`}>
                      Step {meta.step}
                    </span>
                    {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-gold-400" />}
                  </div>
                  <div className="font-extrabold text-xs text-ink-100 mt-1.5">
                    {meta.title}
                  </div>
                  <div className="text-[10px] font-mono text-brand-400/90 truncate mt-0.5">
                    {meta.subtitle}
                  </div>
                </button>
              );
            })}
          </div>

          {/* STEP 1 VISUAL: Identify the Request */}
          {wizardStep === 1 && (
            <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-400 uppercase">Step 1 of 5</span>
                  <h3 className="text-lg font-extrabold text-ink-100">
                    Step 1: Identify The Musical Target
                  </h3>
                </div>
                <button
                  onClick={() => setWizardStep(2)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md"
                >
                  <span>Next: Apply Triad Math</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-ink-300 leading-relaxed max-w-2xl">
                When requested to play a chord (e.g. <strong className="text-brand-300">{targetChordRoot} {targetFlavor}</strong>), immediately isolate the two core parameters: the <strong className="text-ink-100">Root note</strong> and the <strong className="text-ink-100">Harmonic Flavor</strong>.
              </p>

              {/* Visual Target Identity Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-ink-950 border border-ink-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-ink-400 block">Root Foundation</span>
                    <span className="text-2xl font-black text-brand-400">{targetChordRoot}</span>
                    <span className="text-xs text-ink-400 block mt-0.5">Acts as the tonic center / Sa</span>
                  </div>
                  <button
                    onClick={() => guitarAudio.pluck(getFretNote(6, anchorFret).frequency, 2.0, 0.9)}
                    className="p-3 rounded-xl bg-ink-900 border border-ink-800 text-ink-300 hover:text-brand-300"
                    title="Pluck Root Note"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-ink-950 border border-ink-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-ink-400 block">Chord Mood Flavor</span>
                    <span className="text-2xl font-black text-ink-100">{targetFlavor}</span>
                    <span className="text-xs text-ink-400 block mt-0.5">{triad.moodDescription}</span>
                  </div>
                  <span className={`text-2xl ${targetFlavor === 'Minor' ? 'opacity-80' : ''}`}>
                    {targetFlavor === 'Minor' ? '🌙' : '☀️'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 VISUAL: Apply the Internal Math (+4/+3 or +3/+4) */}
          {wizardStep === 2 && (
            <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-400 uppercase">Step 2 of 5</span>
                  <h3 className="text-lg font-extrabold text-ink-100">
                    Step 2: Apply The Genetic Triad Math
                  </h3>
                </div>
                <button
                  onClick={() => setWizardStep(3)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md"
                >
                  <span>Next: Calculate Notes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-ink-300 leading-relaxed max-w-2xl">
                Recall the genetic code from Section 2: Every triad is built by stacking two 3rd intervals. The order of +3 and +4 decides whether it sounds joyful or melancholic!
              </p>

              {/* Visual Interval Arc Jump Diagram */}
              <div className="bg-ink-950 border border-ink-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-ink-400">
                    Triad Jump Formula for {targetFlavor}:
                  </span>
                  <span className="text-xs font-mono font-bold text-gold-400">
                    Root ➔ +{triad.firstJump} frets ➔ +{triad.secondJump} frets
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-4 rounded-xl bg-ink-900 border border-ink-800">
                    <span className="text-[10px] uppercase font-bold text-ink-400 block">Starting Note</span>
                    <span className="text-xl font-black text-brand-400 block my-1">{targetChordRoot}</span>
                    <span className="text-[10px] text-ink-400 font-mono">0 Frets (Ground)</span>
                  </div>

                  <div className="p-4 rounded-xl bg-ink-900 border border-ink-800 relative">
                    <div className="text-[10px] uppercase font-bold text-ink-400 block">First Jump</div>
                    <span className="text-xl font-black text-gold-400 block my-1">+{triad.firstJump} Frets</span>
                    <span className="text-[10px] text-ink-300 block">{triad.firstIntervalName}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-ink-900 border border-ink-800">
                    <div className="text-[10px] uppercase font-bold text-ink-400 block">Second Jump</div>
                    <span className="text-xl font-black text-violet-400 block my-1">+{triad.secondJump} Frets</span>
                    <span className="text-[10px] text-ink-300 block">{triad.secondIntervalName}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-ink-900/60 border border-ink-800/80 text-xs text-ink-400 flex items-center justify-between">
                  <span>Total Distance to boundary 5th: <strong>+7 frets (Perfect 5th)</strong></span>
                  <button
                    onClick={() => {
                      // Pluck root, 3rd, 5th in sequence
                      const baseFreq = getFretNote(6, anchorFret).frequency;
                      const thirdFreq = baseFreq * Math.pow(2, triad.firstJump / 12);
                      const fifthFreq = baseFreq * Math.pow(2, 7 / 12);
                      guitarAudio.pluck(baseFreq, 1.5, 0.85);
                      setTimeout(() => guitarAudio.pluck(thirdFreq, 1.5, 0.85), 250);
                      setTimeout(() => guitarAudio.pluck(fifthFreq, 1.5, 0.85), 500);
                    }}
                    className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 font-bold"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play Formula Jumps</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 VISUAL: Calculate the Notes */}
          {wizardStep === 3 && (
            <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-400 uppercase">Step 3 of 5</span>
                  <h3 className="text-lg font-extrabold text-ink-100">
                    Step 3: Calculate The Triad Notes
                  </h3>
                </div>
                <button
                  onClick={() => setWizardStep(4)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md"
                >
                  <span>Next: Find Low E Anchor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-ink-300 leading-relaxed max-w-2xl">
                Walking the chromatic scale up from <strong className="text-ink-100">{targetChordRoot}</strong> reveals the exact 3 pitches that make up the <strong className="text-brand-300">{targetChordRoot} {targetFlavor}</strong> triad:
              </p>

              {/* 3 Interactive Triad Note Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Note 1: Root */}
                <div className="p-4 rounded-xl bg-ink-950 border border-ink-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-brand-400">1. Root (Sa)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-900 text-ink-400 font-mono">0 st</span>
                  </div>
                  <div className="text-center py-2">
                    <span className="text-3xl font-black text-brand-400">{triad.root}</span>
                    <span className="text-xs text-ink-400 block mt-1">Grounding Foundation</span>
                  </div>
                  <button
                    onClick={() => guitarAudio.pluck(getFretNote(6, anchorFret).frequency, 2.0, 0.9)}
                    className="w-full py-2 rounded-lg bg-ink-900 hover:bg-ink-800 text-ink-200 text-xs font-bold border border-ink-800 flex items-center justify-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-brand-400" />
                    <span>Pluck {triad.root}</span>
                  </button>
                </div>

                {/* Note 2: Third */}
                <div className="p-4 rounded-xl bg-ink-950 border border-ink-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-gold-400">
                      2. {targetFlavor === 'Minor' ? 'Minor 3rd (komal ga)' : 'Major 3rd (Ga)'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-900 text-ink-400 font-mono">
                      +{triad.firstJump} st
                    </span>
                  </div>
                  <div className="text-center py-2">
                    <span className="text-3xl font-black text-gold-400">{triad.thirdNote}</span>
                    <span className="text-xs text-ink-400 block mt-1">Dictates {targetFlavor} Mood</span>
                  </div>
                  <button
                    onClick={() => {
                      const rootFreq = getFretNote(6, anchorFret).frequency;
                      guitarAudio.pluck(rootFreq * Math.pow(2, triad.firstJump / 12), 2.0, 0.9);
                    }}
                    className="w-full py-2 rounded-lg bg-ink-900 hover:bg-ink-800 text-ink-200 text-xs font-bold border border-ink-800 flex items-center justify-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-gold-400" />
                    <span>Pluck {triad.thirdNote}</span>
                  </button>
                </div>

                {/* Note 3: Fifth */}
                <div className="p-4 rounded-xl bg-ink-950 border border-ink-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-violet-400">3. Perfect 5th (Pa)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-900 text-ink-400 font-mono">+7 st</span>
                  </div>
                  <div className="text-center py-2">
                    <span className="text-3xl font-black text-violet-400">{triad.fifthNote}</span>
                    <span className="text-xs text-ink-400 block mt-1">Solid Boundary Wall</span>
                  </div>
                  <button
                    onClick={() => {
                      const rootFreq = getFretNote(6, anchorFret).frequency;
                      guitarAudio.pluck(rootFreq * Math.pow(2, 7 / 12), 2.0, 0.9);
                    }}
                    className="w-full py-2 rounded-lg bg-ink-900 hover:bg-ink-800 text-ink-200 text-xs font-bold border border-ink-800 flex items-center justify-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                    <span>Pluck {triad.fifthNote}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 VISUAL: Find Anchor on Low E string */}
          {wizardStep === 4 && (
            <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-400 uppercase">Step 4 of 5</span>
                  <h3 className="text-lg font-extrabold text-ink-100">
                    Step 4: Walk Up Low E To Find Root Anchor
                  </h3>
                </div>
                <button
                  onClick={() => setWizardStep(5)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md"
                >
                  <span>Next: Graft Barre Shape</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-ink-300 leading-relaxed max-w-2xl">
                Open string 6 is <strong className="text-ink-100">Low E (Fret 0)</strong>. Walk up the string fret-by-fret until you locate <strong className="text-brand-300">{targetChordRoot}</strong>. In our PDF example, walking up to Fret 3 lands on <strong className="text-brand-300">G</strong>!
              </p>

              {/* Virtual Low E String Fret Walker */}
              <div className="bg-ink-950 border border-ink-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-ink-400">
                    Low E String (String 6) Fret Strip:
                  </span>
                  <span className="text-xs font-mono text-brand-400 font-bold">
                    Target Anchor: Fret {anchorFret} ({targetChordRoot})
                  </span>
                </div>

                <div className="grid grid-cols-7 sm:grid-cols-13 gap-1 pt-1">
                  {Array.from({ length: 13 }, (_, f) => {
                    const noteData = getFretNote(6, f);
                    const isAnchor = f === anchorFret;
                    const isPast = f < anchorFret;

                    return (
                      <button
                        key={f}
                        onClick={() => playLowEFret(f)}
                        onMouseEnter={() => setHoveredWalkFret(f)}
                        onMouseLeave={() => setHoveredWalkFret(null)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-between transition-all active:scale-95 ${
                          isAnchor
                            ? 'bg-brand-600 text-white border-brand-400 shadow-lg ring-2 ring-brand-400/50 scale-105 z-10'
                            : isPast
                            ? 'bg-ink-900/80 text-ink-300 border-ink-800 hover:border-brand-500/40'
                            : 'bg-ink-950 text-ink-500 border-ink-850 hover:text-ink-300'
                        }`}
                      >
                        <span className="text-[10px] font-mono opacity-70">
                          {f === 0 ? 'Open' : `F${f}`}
                        </span>
                        <span className="text-base font-black my-1">
                          {noteData.note}
                        </span>
                        {isAnchor && (
                          <span className="text-[8px] font-extrabold uppercase px-1 rounded bg-brand-950 text-brand-200">
                            ANCHOR
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-ink-400 pt-2 border-t border-ink-800/80">
                  <span>Walking: <strong>Open E ➔ Fret 1 (F) ➔ Fret 2 (F#) ➔ Fret {anchorFret} ({targetChordRoot})</strong></span>
                  <span className="text-brand-400 font-mono">Distance = {anchorFret} semitones</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 VISUAL: Graft Barre Shape onto Anchor */}
          {wizardStep === 5 && (
            <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-400 uppercase">Step 5 of 5</span>
                  <h3 className="text-lg font-extrabold text-ink-100">
                    Step 5: Graft Open Shape Onto Anchor Fret
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsBarreEngaged(prev => !prev)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isBarreEngaged
                        ? 'bg-violet-950/80 border-violet-500/50 text-violet-300'
                        : 'bg-ink-950 text-ink-400 border-ink-800'
                    }`}
                  >
                    {isBarreEngaged ? 'Barre Finger ON (Fret ' + anchorFret + ')' : 'Barre OFF (Listen to dissonance)'}
                  </button>
                  <button
                    onClick={playDerivedChord}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white text-xs font-bold shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Strum Full Chord</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-ink-300 leading-relaxed max-w-2xl">
                Lay your <strong className="text-violet-300">index finger flat across Fret {anchorFret}</strong>. It replaces the guitar nut! Behind it, your other fingers form the standard <strong className="text-ink-100">{targetFlavor === 'Minor' ? 'Em' : 'E'} shape</strong>.
              </p>

              {/* Visual Neck Fret Diagram for the Barre Chord */}
              <div className="bg-ink-950 border border-ink-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase text-ink-400">
                    Complete Derived Voicing: {barreVoicing.name}
                  </span>
                  <span className="font-mono text-violet-400 font-bold">
                    Index Barre @ Fret {anchorFret}
                  </span>
                </div>

                {/* 6 strings horizontal neck representation */}
                <div className="grid grid-cols-6 gap-2 text-center">
                  {[0, 1, 2, 3, 4, 5].map(sIdx => {
                    const stringNumber = 6 - sIdx;
                    const fret = barreVoicing.frets[sIdx];
                    const finger = barreVoicing.fingers ? barreVoicing.fingers[sIdx] : 0;
                    const noteData = getFretNote(stringNumber, fret);
                    const isRoot = noteData.note === targetChordRoot;

                    return (
                      <div
                        key={sIdx}
                        onClick={() => playSingleString(stringNumber, fret)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-102 ${
                          isRoot
                            ? 'bg-brand-600/20 border-brand-500 shadow-md'
                            : finger === 1
                            ? 'bg-violet-950/40 border-violet-800/60'
                            : 'bg-ink-900 border-ink-800'
                        }`}
                      >
                        <span className="text-[10px] text-ink-400 font-mono block">
                          Str {stringNumber}
                        </span>
                        <span className="text-xl font-black text-ink-100 block my-1">
                          {noteData.note}
                        </span>
                        <span className="text-[10px] font-mono text-brand-400 block">
                          Fret {fret}
                        </span>
                        <span className="text-[9px] text-ink-400 mt-1 block">
                          {finger === 1 ? 'Barre 1' : `Finger ${finger}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Unified Visual Derivation Blueprint Summary Card */}
          <div className="bg-gradient-to-r from-ink-900/90 via-ink-900 to-brand-950/20 border border-ink-800/80 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                Unified Derivation Logic
              </span>
              <div className="text-sm text-ink-200">
                Target: <strong className="text-white">{targetChordRoot} {targetFlavor}</strong> ➔
                Triad: <strong className="text-brand-300">[{triad.notes.join(', ')}]</strong> ➔
                Low E Anchor: <strong className="text-gold-300">Fret {anchorFret}</strong> ➔
                Shape: <strong className="text-violet-300">{targetFlavor === 'Minor' ? 'Em' : 'E'} Barre</strong>
              </div>
            </div>

            <button
              onClick={() => {
                confetti({ particleCount: 50, spread: 70 });
                playDerivedChord();
              }}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all shrink-0"
            >
              Test & Celebrate Mastery! 🎉
            </button>
          </div>
        </div>
      ) : (
        /* QUIZ TAB */
        <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-ink-800">
            <div>
              <span className="text-xs font-mono text-brand-400 font-bold uppercase">
                Mastery Question {quizQuestionIndex + 1} of {quizQuestions.length}
              </span>
              <h3 className="text-lg font-bold text-ink-100 mt-1">
                {quizQuestions[quizQuestionIndex].question}
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-bold border border-brand-500/30">
              Score: {quizScore} / {quizQuestions.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quizQuestions[quizQuestionIndex].options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === quizQuestions[quizQuestionIndex].correctIndex;

              let btnStyle = 'bg-ink-950 border-ink-800 hover:border-ink-700 text-ink-200';
              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-gold-950/80 border-gold-500 text-gold-200 ring-2 ring-gold-500/40';
                } else if (isSelected) {
                  btnStyle = 'bg-red-950/80 border-red-500 text-red-200';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleQuizAnswer(idx)}
                  className={`p-4 rounded-xl border text-left font-semibold text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
                >
                  <span>{option}</span>
                  {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-gold-400" />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="p-4 rounded-xl bg-ink-950 border border-ink-800 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-400">
                Acoustic Logic Explanation:
              </span>
              <p className="text-xs text-ink-300 leading-relaxed">
                {quizQuestions[quizQuestionIndex].explanation}
              </p>
              <button
                onClick={handleNextQuestion}
                className="mt-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Next Question
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
