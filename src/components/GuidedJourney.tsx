import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ArrowRight, Sparkles, Award, Play, RotateCcw, Trophy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { loadUserProgress, toggleLessonCompletion, saveUserProgress, calculateProgressStats } from '../utils/progressStore';

interface GuidedJourneyProps {
  onSelectLesson: (lessonIndex: number) => void;
}

export const GuidedJourney: React.FC<GuidedJourneyProps> = ({ onSelectLesson }) => {
  const [completedStages, setCompletedStages] = useState<number[]>(() => {
    return loadUserProgress().completedLessons;
  });

  // Listen to window storage event for instant updates
  useEffect(() => {
    const handleUpdate = () => {
      setCompletedStages(loadUserProgress().completedLessons);
    };
    window.addEventListener('guitar_progress_updated', handleUpdate);
    return () => window.removeEventListener('guitar_progress_updated', handleUpdate);
  }, []);

  const stages = [
    {
      title: "Stage 1: The 12 Tones & Tuning by Ear",
      subtitle: "Understand semitones, Perfect 4ths, and the 4th-fret G exception.",
      lessonIndex: 0,
      badge: "Tuning Master",
      badgeIcon: "🎧",
      challengeText: "Tune Low E to Open A using the 5th fret unison rule.",
    },
    {
      title: "Stage 2: Deriving the Major Scale DNA",
      subtitle: "Whole and Half step jumps (+2, +2, +1, +2, +2, +2, +1) and Relative Minor (Root - 3 Frets).",
      lessonIndex: 1,
      badge: "Scale Architect",
      badgeIcon: "🧬",
      challengeText: "Derive C Major with zero sharps, then locate its twin A Minor.",
    },
    {
      title: "Stage 3: The +4 / +3 Triad Code",
      subtitle: "Stacking Thirds: Major (+4, +3) vs Minor (+3, +4).",
      lessonIndex: 2,
      badge: "Triad Decoder",
      badgeIcon: "💎",
      challengeText: "Construct both Major and Minor triads on root note C.",
    },
    {
      title: "Stage 4: Diatonic Harmony Machine",
      subtitle: "The 'Skip one, take one' method. Why ii is naturally minor.",
      lessonIndex: 3,
      badge: "Harmony Explorer",
      badgeIcon: "🎼",
      challengeText: "Play a classic I - IV - V - I chord progression.",
    },
    {
      title: "Stage 5: Fretboard Mapping & Bass Gravity",
      subtitle: "Mapping triad notes to 6 strings and why we mute the thickest string.",
      lessonIndex: 4,
      badge: "Fretboard Cartographer",
      badgeIcon: "🗺️",
      challengeText: "Test the Bass Gravity rule by comparing Muted Low E vs Open E.",
    },
    {
      title: "Stage 6: Barre Chords & Shifting the Nut",
      subtitle: "Sliding open E and A shapes; your index finger as the human nut.",
      lessonIndex: 5,
      badge: "Barre Champion",
      badgeIcon: "⚡",
      challengeText: "Slide the E-Major shape up 1 fret to play an F Major barre chord.",
    },
    {
      title: "Stage 7: Step-by-Step Chord Derivation",
      subtitle: "The 5-step intuitive thought process to rebuild any chord from scratch.",
      lessonIndex: 6,
      badge: "Guitar Maestro",
      badgeIcon: "👑",
      challengeText: "Derive G Minor step-by-step: Math ➔ Notes ➔ Anchor ➔ Shape.",
    },
  ];

  const handleToggleComplete = (idx: number) => {
    const updated = toggleLessonCompletion(idx);
    setCompletedStages(updated.completedLessons);

    if (updated.completedLessons.includes(idx)) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#1aa89b', '#f5a524', '#8b5cf6', '#f87171'],
      });
    }
  };

  const handleResetProgress = () => {
    if (window.confirm('Reset all lesson progress back to 0%?')) {
      const updated = saveUserProgress({ completedLessons: [] });
      setCompletedStages(updated.completedLessons);
    }
  };

  const stats = calculateProgressStats(completedStages, stages.length);

  return (
    <div className="space-y-6">
      {/* High-End Hero Progress Dashboard Banner */}
      <div className="bg-gradient-to-br from-ink-900 via-ink-900/90 to-brand-950/30 border border-ink-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glowing background shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-gold-600/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-inner">
                <Trophy className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-400">
                Persistent Progress Tracking
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-ink-100 tracking-tight">
              Intuitive Guitar Mastery Journey
            </h2>

            <p className="text-xs sm:text-sm text-ink-300 max-w-xl leading-relaxed">
              Every lesson you complete is automatically recorded in your browser’s localStorage. Follow the 7 theoretical milestones to unlock your Certified Maestro status!
            </p>

            <div className="pt-1 flex items-center gap-2 text-xs">
              <span className="font-bold text-ink-400">Current Rank:</span>
              <span className={`font-black text-sm ${stats.levelColor} flex items-center gap-1`}>
                <span>{stats.badgeIcon}</span>
                <span>{stats.levelTitle}</span>
              </span>
            </div>
          </div>

          {/* Progress Circular & Linear Meter */}
          <div className="bg-ink-950/80 border border-ink-800/90 rounded-2xl p-5 shadow-inner flex flex-col items-center justify-center min-w-[240px] shrink-0 space-y-3">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-200 via-brand-400 to-brand-500">
                {stats.percentage}%
              </span>
              <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Completed</span>
            </div>

            {/* Linear Bar */}
            <div className="w-full h-3 bg-ink-900 rounded-full overflow-hidden p-0.5 border border-ink-800">
              <div
                className="h-full bg-gradient-to-r from-brand-600 via-brand-500 to-gold-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between w-full text-[11px] font-bold text-ink-400">
              <span>{stats.count} of {stats.totalLessons} Lessons Done</span>
              <button
                onClick={handleResetProgress}
                className="text-ink-500 hover:text-red-400 transition-colors flex items-center gap-1"
                title="Reset progress"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Interactive Stage Cards */}
      <div className="space-y-3.5">
        {stages.map((stage, idx) => {
          const isDone = completedStages.includes(stage.lessonIndex);

          return (
            <div
              key={stage.title}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm ${
                isDone
                  ? 'bg-ink-900/90 border-gold-500/50 shadow-lg shadow-gold-950/20'
                  : 'bg-ink-900/50 border-ink-800/80 hover:border-ink-700/90 hover:bg-ink-900/70'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Complete Checkbox Toggle */}
                <button
                  onClick={() => handleToggleComplete(stage.lessonIndex)}
                  className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                    isDone
                      ? 'bg-gold-500 text-ink-950 shadow-md shadow-gold-950/50'
                      : 'border-2 border-ink-700 hover:border-brand-400/80 text-transparent hover:text-ink-500'
                  }`}
                  aria-label={isDone ? `Mark stage ${idx + 1} incomplete` : `Mark stage ${idx + 1} complete`}
                  title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  <Check className={`w-4 h-4 stroke-[3] ${isDone ? 'text-ink-950' : ''}`} />
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-ink-800 text-brand-400">
                      STEP 0{idx + 1}
                    </span>
                    <h3 className="font-extrabold text-ink-100 text-sm sm:text-base">
                      {stage.title}
                    </h3>
                  </div>

                  <p className="text-xs text-ink-300 leading-relaxed max-w-xl">
                    {stage.subtitle}
                  </p>

                  <div className="pt-1 text-[11px] text-ink-400 flex items-center gap-1.5 font-medium">
                    <span className="text-brand-400 font-bold">🎯 Milestone Check:</span>
                    <span>{stage.challengeText}</span>
                  </div>
                </div>
              </div>

              {/* Badges & Action Buttons */}
              <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors ${
                    isDone
                      ? 'bg-gold-950/80 border-gold-500/50 text-gold-300 shadow-sm'
                      : 'bg-ink-950 border-ink-800 text-ink-400'
                  }`}
                >
                  <span>{stage.badgeIcon}</span>
                  <span>{stage.badge}</span>
                </span>

                <button
                  onClick={() => onSelectLesson(stage.lessonIndex)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <span>Launch Lesson</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
