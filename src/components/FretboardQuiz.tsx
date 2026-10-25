import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  Trophy,
  Zap,
  Timer,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ArrowRight,
  Flame,
  Volume2,
  Settings,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  GUITAR_STRINGS,
  getFretNote,
  NoteName,
  getSwaraForNote,
  formatNoteDisplay,
} from '../utils/guitarTheory';
import {
  generateQuizQuestion,
  calculateQuizScore,
  calculateQuizRank,
  type QuizQuestion,
} from '../utils/guitarTheory';
import {
  QUIZ_DURATIONS,
  QUIZ_MODE_OPTIONS,
  QUIZ_RANKS,
  QUIZ_STORAGE_KEY,
  type QuizPromptMode,
  type QuizRank,
} from '../constants';
import { guitarAudio } from '../utils/audioSynth';

interface FretboardQuizProps {
  notesNotation?: 'western' | 'indian';
  rootSa?: NoteName;
  onExit?: () => void;
}

interface HighScoreRecord {
  score: number;
  rankTitle: string;
  accuracy: number;
  avgReactionMs: number;
  bestStreak: number;
  date: string;
}

export const FretboardQuiz: React.FC<FretboardQuizProps> = ({
  notesNotation = 'western',
  rootSa = 'C',
  onExit,
}) => {
  // Game states: 'idle' | 'playing' | 'ended'
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');

  // Quiz Configurations
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [selectedMode, setSelectedMode] = useState<QuizPromptMode>('single-string');

  // Active game session
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [hits, setHits] = useState<number>(0);
  const [misses, setMisses] = useState<number>(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentReactionMs, setCurrentReactionMs] = useState<number>(0);

  // Visual feedback states
  const [lastFeedback, setLastFeedback] = useState<{
    type: 'hit' | 'miss';
    stringNumber: number;
    fret: number;
    earnedPoints?: number;
    noteName: string;
  } | null>(null);

  // High score from localStorage
  const [highScore, setHighScore] = useState<HighScoreRecord | null>(() => {
    try {
      const stored = localStorage.getItem(QUIZ_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const questionStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<number | null>(null);
  const reactionTimerRef = useRef<number | null>(null);

  // String thicknesses
  const stringGauges: Record<number, number> = {
    6: 3.5, // Low E
    5: 2.8, // A
    4: 2.2, // D
    3: 1.8, // G
    2: 1.4, // B
    1: 1.1, // High E
  };

  const fretDots = [3, 5, 7, 9, 12];

  // Spawn a new question
  const spawnNextQuestion = useCallback((mode: QuizPromptMode, prevNote?: NoteName) => {
    const nextQ = generateQuizQuestion(mode, prevNote, 12);
    setCurrentQuestion(nextQ);
    questionStartTimeRef.current = performance.now();
    setCurrentReactionMs(0);
  }, []);

  // Start the quiz
  const handleStartQuiz = () => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setHits(0);
    setMisses(0);
    setReactionTimes([]);
    setLastFeedback(null);
    setTimeLeft(selectedDuration);
    setGameState('playing');

    spawnNextQuestion(selectedMode);
  };

  // Main countdown timer
  useEffect(() => {
    if (gameState === 'playing') {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleEndQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Live reaction counter tick (updates every 50ms)
      reactionTimerRef.current = window.setInterval(() => {
        if (questionStartTimeRef.current > 0) {
          setCurrentReactionMs(Math.round(performance.now() - questionStartTimeRef.current));
        }
      }, 50);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (reactionTimerRef.current) clearInterval(reactionTimerRef.current);
    };
  }, [gameState]);

  // End quiz and calculate final performance
  const handleEndQuiz = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (reactionTimerRef.current) clearInterval(reactionTimerRef.current);
    setGameState('ended');

    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  // Handle fret click during quiz
  const handleFretClick = (stringNumber: number, fret: number) => {
    if (gameState !== 'playing' || !currentQuestion) return;

    const reactionTime = Math.round(performance.now() - questionStartTimeRef.current);
    const clickedNoteData = getFretNote(stringNumber, fret);

    // Check if clicked position is in validPositions
    const isCorrect = currentQuestion.validPositions.some(
      pos => pos.stringNumber === stringNumber && pos.fret === fret
    );

    if (isCorrect) {
      // Audio feedback: play correct plucked note
      guitarAudio.pluck(clickedNoteData.frequency, 1.5, 0.85);

      const nextStreak = streak + 1;
      const { points } = calculateQuizScore(true, reactionTime, streak);

      setScore(prev => prev + points);
      setStreak(nextStreak);
      setBestStreak(prev => Math.max(prev, nextStreak));
      setHits(prev => prev + 1);
      setReactionTimes(prev => [...prev, reactionTime]);

      setLastFeedback({
        type: 'hit',
        stringNumber,
        fret,
        earnedPoints: points,
        noteName: clickedNoteData.note,
      });

      // Quick mini confetti on streak milestones
      if (nextStreak === 5 || nextStreak === 10 || nextStreak === 15) {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.7 },
        });
      }

      // Next question immediately
      setTimeout(() => {
        setLastFeedback(null);
        spawnNextQuestion(selectedMode, currentQuestion.targetNote);
      }, 350);
    } else {
      // Audio feedback: soft buzzer / low thud
      guitarAudio.pluck(82.4, 0.2, 0.3); // Low thud

      setStreak(0);
      setMisses(prev => prev + 1);

      setLastFeedback({
        type: 'miss',
        stringNumber,
        fret,
        noteName: clickedNoteData.note,
      });

      // Briefly show mistake then clear
      setTimeout(() => {
        setLastFeedback(null);
      }, 700);
    }
  };

  // Compute final stats
  const totalAttempts = hits + misses;
  const accuracy = totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 0;
  const avgReactionMs =
    reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 3000;
  const rank: QuizRank = calculateQuizRank(score, accuracy, avgReactionMs);

  // Update high score if beaten
  useEffect(() => {
    if (gameState === 'ended' && score > 0) {
      if (!highScore || score > highScore.score) {
        const record: HighScoreRecord = {
          score,
          rankTitle: rank.title,
          accuracy,
          avgReactionMs,
          bestStreak,
          date: new Date().toLocaleDateString(),
        };
        setHighScore(record);
        try {
          localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(record));
        } catch {
          // ignore
        }
      }
    }
  }, [gameState]);

  return (
    <div className="bg-ink-900 border border-ink-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
      {/* Quiz Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Zap className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-ink-100">Interactive Fretboard Speed Quiz</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30">
              Gamified Training
            </span>
          </div>
          <p className="text-xs text-ink-400 mt-1">
            Build instant muscle memory by racing the clock to find target notes across all 6 strings.
          </p>
        </div>

        {/* High Score Pill */}
        {highScore && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-950/40 border border-brand-500/30 text-xs">
            <Trophy className="w-4 h-4 text-brand-400" />
            <div className="text-left">
              <span className="text-[10px] text-brand-400/80 uppercase font-bold block">Best Record</span>
              <span className="font-extrabold text-brand-300">
                {highScore.score} pts • {highScore.rankTitle}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* STATE 1: IDLE / CONFIGURATION SCREEN */}
      {gameState === 'idle' && (
        <div className="space-y-6 py-2">
          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Time Duration Selector */}
            <div className="bg-ink-950/70 border border-ink-800 rounded-xl p-4 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-400 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-brand-400" />
                Select Quiz Duration:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {QUIZ_DURATIONS.map(d => (
                  <button
                    key={d.seconds}
                    onClick={() => setSelectedDuration(d.seconds)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedDuration === d.seconds
                        ? 'bg-brand-600/20 border-brand-500 text-brand-300 shadow-md ring-1 ring-brand-500'
                        : 'bg-ink-900 border-ink-800 text-ink-300 hover:bg-ink-800'
                    }`}
                  >
                    <div className="text-base font-extrabold">{d.seconds}s</div>
                    <div className="text-[10px] text-ink-400 mt-0.5">{d.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quiz Mode Scope */}
            <div className="bg-ink-950/70 border border-ink-800 rounded-xl p-4 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-400 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-brand-400" />
                Select Note Scope:
              </span>
              <div className="space-y-2">
                {QUIZ_MODE_OPTIONS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMode(m.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      selectedMode === m.id
                        ? 'bg-brand-600/20 border-brand-500 text-brand-300 ring-1 ring-brand-500'
                        : 'bg-ink-900 border-ink-800 text-ink-300 hover:bg-ink-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{m.title}</div>
                      <div className="text-[10px] text-ink-400">{m.description}</div>
                    </div>
                    {selectedMode === m.id && <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ranks Teaser Card */}
          <div className="bg-ink-950/40 border border-ink-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-ink-300">
              <Award className="w-4 h-4 text-brand-400" />
              <span>
                Earn ranks from <strong className="text-ink-300">Apprentice</strong> to{' '}
                <strong className="text-brand-300">Fretboard Virtuoso</strong> by answering with sub-2s reaction speeds!
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {QUIZ_RANKS.map(r => (
                <span
                  key={r.title}
                  className="px-2 py-0.5 rounded-md bg-ink-800 text-[10px] font-semibold text-ink-300 border border-ink-700"
                >
                  {r.badge}
                </span>
              ))}
            </div>
          </div>

          {/* Big Start Button */}
          <div className="flex items-center justify-center pt-2">
            <button
              onClick={handleStartQuiz}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 hover:from-brand-400 hover:to-brand-600 text-white font-extrabold text-base shadow-xl hover:shadow-brand-500/20 transition-all active:scale-95 flex items-center gap-2.5"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Speed Quiz ({selectedDuration}s)</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: ACTIVE PLAYING SCREEN */}
      {gameState === 'playing' && currentQuestion && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          {/* Live Top HUD: Countdown Timer, Streak Combo, Score, and Reaction Monitor */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Time Left */}
            <div className="bg-ink-950 border border-ink-800 rounded-xl p-3 flex flex-col items-center justify-center">
              <span className="text-[10px] text-ink-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-brand-400" /> Time Left
              </span>
              <span
                className={`text-2xl font-black mt-0.5 ${
                  timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-ink-100'
                }`}
              >
                {timeLeft}s
              </span>
              {/* Mini progress bar */}
              <div className="w-full bg-ink-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timeLeft <= 10 ? 'bg-red-500' : 'bg-brand-500'
                  }`}
                  style={{ width: `${(timeLeft / selectedDuration) * 100}%` }}
                />
              </div>
            </div>

            {/* Score */}
            <div className="bg-ink-950 border border-ink-800 rounded-xl p-3 flex flex-col items-center justify-center">
              <span className="text-[10px] text-ink-400 font-bold uppercase tracking-wider">Total Score</span>
              <span className="text-2xl font-black text-brand-400 mt-0.5">{score}</span>
              <span className="text-[10px] text-ink-500 mt-0.5">pts</span>
            </div>

            {/* Streak Combo */}
            <div className="bg-ink-950 border border-ink-800 rounded-xl p-3 flex flex-col items-center justify-center">
              <span className="text-[10px] text-ink-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Flame className={`w-3.5 h-3.5 ${streak >= 3 ? 'text-gold-500 animate-bounce' : 'text-ink-500'}`} />
                Streak
              </span>
              <span
                className={`text-2xl font-black mt-0.5 ${
                  streak >= 5 ? 'text-gold-400' : streak > 0 ? 'text-brand-300' : 'text-ink-400'
                }`}
              >
                {streak}x
              </span>
              <span className="text-[10px] text-brand-400/80 font-semibold">
                {streak >= 10 ? '2.0x Multiplier!' : streak >= 6 ? '1.5x Multiplier' : streak >= 3 ? '1.25x' : '1.0x'}
              </span>
            </div>

            {/* Live Reaction Clock */}
            <div className="bg-ink-950 border border-ink-800 rounded-xl p-3 flex flex-col items-center justify-center">
              <span className="text-[10px] text-ink-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-violet-400" /> Reaction
              </span>
              <span className="text-2xl font-black font-mono text-violet-300 mt-0.5">
                {(currentReactionMs / 1000).toFixed(2)}s
              </span>
              <span className="text-[10px] text-ink-500 mt-0.5">
                {hits} hits / {misses} miss
              </span>
            </div>
          </div>

          {/* Active Target Note Banner */}
          <div className="bg-gradient-to-r from-ink-950 via-brand-950/30 to-ink-950 border-2 border-brand-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl text-center sm:text-left">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-400" />
                Target Question:
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                {currentQuestion.promptText}
              </h2>
              <p className="text-xs text-ink-400">
                {currentQuestion.subPromptText}
                {notesNotation === 'indian' && (
                  <span className="text-brand-300 font-semibold ml-2">
                    • Swara: {getSwaraForNote(currentQuestion.targetNote, rootSa).fullName} ({getSwaraForNote(currentQuestion.targetNote, rootSa).shortName})
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border-2 border-brand-400 flex flex-col items-center justify-center shadow-lg shadow-brand-500/20">
                <span className="text-2xl font-black text-brand-300">{currentQuestion.targetNote}</span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-brand-400">Target</span>
              </div>
              <button
                onClick={handleEndQuiz}
                className="px-3 py-2 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-300 hover:text-white text-xs font-bold border border-ink-700"
              >
                Quit
              </button>
            </div>
          </div>

          {/* Interactive Fretboard Surface for Quiz */}
          <div className="relative overflow-x-auto rounded-xl border border-ink-800/80 bg-gradient-to-b from-[#1c1917] via-[#141211] to-[#0c0a09] p-3 sm:p-5 select-none shadow-inner">
            <div className="min-w-[720px] relative">
              {/* Fret number header */}
              <div className="grid grid-cols-[60px_repeat(12,1fr)] gap-0 text-center text-[11px] font-mono font-bold text-ink-500 pb-2">
                <div className="text-brand-500/80">NUT (0)</div>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(fret => (
                  <div key={fret} className="flex flex-col items-center">
                    <span>{fret}</span>
                    {fretDots.includes(fret) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400/40 mt-0.5 inline-block" />
                    )}
                  </div>
                ))}
              </div>

              {/* Strings and Frets Grid */}
              <div className="relative border-l-8 border-ink-300/80 rounded-l-sm bg-black/20 py-2">
                {GUITAR_STRINGS.map(str => {
                  const gauge = stringGauges[str.stringNumber] || 2;
                  const isTargetString = currentQuestion.targetString === str.stringNumber;

                  return (
                    <div
                      key={str.stringNumber}
                      className={`grid grid-cols-[60px_repeat(12,1fr)] items-center h-10 relative border-b border-ink-800/40 last:border-b-0 transition-colors ${
                        isTargetString
                          ? 'bg-brand-500/10 ring-1 ring-brand-500/30'
                          : currentQuestion.targetString !== undefined
                          ? 'opacity-65'
                          : ''
                      }`}
                    >
                      {/* Nut / Open String Button */}
                      <div className="flex items-center justify-center pr-2 border-r-4 border-brand-100/90 bg-ink-950/60 h-full">
                        <button
                          onClick={() => handleFretClick(str.stringNumber, 0)}
                          className={`w-10 h-7 rounded-md font-bold text-xs flex items-center justify-center transition-all ${
                            lastFeedback &&
                            lastFeedback.stringNumber === str.stringNumber &&
                            lastFeedback.fret === 0
                              ? lastFeedback.type === 'hit'
                                ? 'bg-gold-500 text-ink-950 ring-2 ring-gold-300 font-black'
                                : 'bg-red-600 text-white animate-shake'
                              : isTargetString
                              ? 'bg-brand-500/30 text-brand-200 border border-brand-500/50 hover:bg-brand-500 hover:text-ink-950'
                              : 'bg-ink-800 text-ink-400 hover:text-white hover:bg-ink-700'
                          }`}
                          title={`Click to check Open ${str.name} String`}
                        >
                          {str.name} (0)
                        </button>
                      </div>

                      {/* Physical String Wire */}
                      <div
                        className="absolute left-[60px] right-0 pointer-events-none transition-all duration-150"
                        style={{
                          height: `${gauge}px`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background:
                            str.stringNumber >= 4
                              ? 'linear-gradient(to bottom, #d4af37, #8b6508, #5c4308)'
                              : 'linear-gradient(to bottom, #f3f4f6, #9ca3af, #6b7280)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.6)',
                        }}
                      />

                      {/* Fret Slots */}
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(fret => {
                        const noteData = getFretNote(str.stringNumber, fret);
                        const isHitFeedback =
                          lastFeedback &&
                          lastFeedback.stringNumber === str.stringNumber &&
                          lastFeedback.fret === fret &&
                          lastFeedback.type === 'hit';

                        const isMissFeedback =
                          lastFeedback &&
                          lastFeedback.stringNumber === str.stringNumber &&
                          lastFeedback.fret === fret &&
                          lastFeedback.type === 'miss';

                        return (
                          <div
                            key={fret}
                            onClick={() => handleFretClick(str.stringNumber, fret)}
                            className={`h-full relative flex items-center justify-center cursor-pointer group border-r border-ink-600/50 hover:bg-brand-500/15 transition-all ${
                              fret === 12 ? 'border-r-2 border-ink-400/80' : ''
                            } ${isHitFeedback ? 'bg-gold-500/30' : ''} ${
                              isMissFeedback ? 'bg-red-500/30' : ''
                            }`}
                          >
                            {/* Fret Wire Metal Bar */}
                            <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-ink-400 via-ink-200 to-ink-500 pointer-events-none shadow-sm" />

                            {/* Fret position Dot Marker on neck */}
                            {str.stringNumber === 3 && fretDots.includes(fret) && (
                              <div className="absolute pointer-events-none w-2.5 h-2.5 rounded-full bg-ink-300/15 shadow-inner" />
                            )}

                            {/* HIT Animation Indicator */}
                            {isHitFeedback && (
                              <div className="z-20 w-8 h-8 rounded-full bg-gold-500 text-ink-950 font-black text-xs flex flex-col items-center justify-center shadow-lg ring-4 ring-gold-400/60 animate-bounce">
                                <span>✓</span>
                                <span className="text-[8px] leading-none">+{lastFeedback.earnedPoints}</span>
                              </div>
                            )}

                            {/* MISS Animation Indicator */}
                            {isMissFeedback && (
                              <div className="z-20 w-8 h-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-lg ring-4 ring-red-400/60 animate-pulse">
                                <span>✕ {lastFeedback.noteName}</span>
                              </div>
                            )}

                            {/* Subtle Target Hint Outline when hovered */}
                            {!isHitFeedback && !isMissFeedback && (
                              <div className="opacity-0 group-hover:opacity-100 z-10 w-6 h-6 rounded-full bg-brand-500/40 text-brand-100 flex items-center justify-center text-[10px] font-bold pointer-events-none transition-opacity">
                                ?
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: QUIZ ENDED / SUMMARY CARD */}
      {gameState === 'ended' && (
        <div className="space-y-6 py-2 animate-in zoom-in-95 duration-200">
          <div className="bg-ink-950 border border-ink-800 rounded-2xl p-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-brand-400">Quiz Completed</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">Final Score: {score} Pts</h2>
            </div>

            {/* Performance Rank Banner */}
            <div className="max-w-md mx-auto p-4 rounded-xl bg-gradient-to-r from-brand-950/60 via-ink-900 to-brand-950/60 border border-brand-500/40 text-center space-y-1">
              <span className="text-xs uppercase tracking-wider font-extrabold text-brand-300">Your Rank</span>
              <div className="text-2xl font-black text-brand-200">{rank.badge}</div>
              <p className="text-xs text-ink-300">{rank.description}</p>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
              <div className="p-3 rounded-xl bg-ink-900/90 border border-ink-800">
                <span className="text-[10px] text-ink-400 uppercase font-bold block">Accuracy</span>
                <span className="text-xl font-black text-gold-400">{accuracy}%</span>
                <span className="text-[10px] text-ink-500 block">
                  {hits} / {totalAttempts}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-ink-900/90 border border-ink-800">
                <span className="text-[10px] text-ink-400 uppercase font-bold block">Avg Reaction</span>
                <span className="text-xl font-black text-violet-400">{(avgReactionMs / 1000).toFixed(2)}s</span>
                <span className="text-[10px] text-ink-500 block">Per note</span>
              </div>

              <div className="p-3 rounded-xl bg-ink-900/90 border border-ink-800">
                <span className="text-[10px] text-ink-400 uppercase font-bold block">Best Streak</span>
                <span className="text-xl font-black text-gold-400">{bestStreak}🔥</span>
                <span className="text-[10px] text-ink-500 block">Consecutive</span>
              </div>

              <div className="p-3 rounded-xl bg-ink-900/90 border border-ink-800">
                <span className="text-[10px] text-ink-400 uppercase font-bold block">Questions</span>
                <span className="text-xl font-black text-ink-200">{hits}</span>
                <span className="text-[10px] text-ink-500 block">Completed</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                onClick={handleStartQuiz}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again ({selectedDuration}s)</span>
              </button>
              <button
                onClick={() => setGameState('idle')}
                className="px-5 py-2.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-200 font-semibold text-sm border border-ink-700 transition-all"
              >
                Change Settings
              </button>
              {onExit && (
                <button
                  onClick={onExit}
                  className="px-5 py-2.5 rounded-xl bg-ink-900 hover:bg-ink-800 text-ink-400 hover:text-ink-200 font-semibold text-sm border border-ink-800 transition-all"
                >
                  Return to Explorer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
