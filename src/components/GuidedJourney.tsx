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
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
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
      <div className="bg-gradient-to-br from-stone-900 via-stone-900/90 to-amber-950/30 border border-stone-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glowing background shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-orange-600/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-inner">
                <Trophy className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Persistent Progress Tracking
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-stone-100 tracking-tight">
              Intuitive Guitar Mastery Journey
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 max-w-xl leading-relaxed">
              Every lesson you complete is automatically recorded in your browser’s localStorage. Follow the 7 theoretical milestones to unlock your Certified Maestro status!
            </p>

            <div className="pt-1 flex items-center gap-2 text-xs">
              <span className="font-bold text-stone-400">Current Rank:</span>
              <span className={`font-black text-sm ${stats.levelColor} flex items-center gap-1`}>
                <span>{stats.badgeIcon}</span>
                <span>{stats.levelTitle}</span>
              </span>
            </div>
          </div>

          {/* Progress Circular & Linear Meter */}
          <div className="bg-stone-950/80 border border-stone-800/90 rounded-2xl p-5 shadow-inner flex flex-col items-center justify-center min-w-[240px] shrink-0 space-y-3">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
                {stats.percentage}%
              </span>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Completed</span>
            </div>

            {/* Linear Bar */}
            <div className="w-full h-3 bg-stone-900 rounded-full overflow-hidden p-0.5 border border-stone-800">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-orange-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between w-full text-[11px] font-bold text-stone-400">
              <span>{stats.count} of {stats.totalLessons} Lessons Done</span>
              <button
                onClick={handleResetProgress}
                className="text-stone-500 hover:text-red-400 transition-colors flex items-center gap-1"
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
                  ? 'bg-stone-900/90 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                  : 'bg-stone-900/50 border-stone-800/80 hover:border-stone-700/90 hover:bg-stone-900/70'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Complete Checkbox Toggle */}
                <button
                  onClick={() => handleToggleComplete(stage.lessonIndex)}
                  className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-950/50'
                      : 'border-2 border-stone-700 hover:border-amber-400/80 text-transparent hover:text-stone-500'
                  }`}
                  aria-label={isDone ? `Mark stage ${idx + 1} incomplete` : `Mark stage ${idx + 1} complete`}
                  title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  <Check className={`w-4 h-4 stroke-[3] ${isDone ? 'text-stone-950' : ''}`} />
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-800 text-amber-400">
                      STEP 0{idx + 1}
                    </span>
                    <h3 className="font-extrabold text-stone-100 text-sm sm:text-base">
                      {stage.title}
                    </h3>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed max-w-xl">
                    {stage.subtitle}
                  </p>

                  <div className="pt-1 text-[11px] text-stone-400 flex items-center gap-1.5 font-medium">
                    <span className="text-amber-400 font-bold">🎯 Milestone Check:</span>
                    <span>{stage.challengeText}</span>
                  </div>
                </div>
              </div>

              {/* Badges & Action Buttons */}
              <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors ${
                    isDone
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-sm'
                      : 'bg-stone-950 border-stone-800 text-stone-400'
                  }`}
                >
                  <span>{stage.badgeIcon}</span>
                  <span>{stage.badge}</span>
                </span>

                <button
                  onClick={() => onSelectLesson(stage.lessonIndex)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
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
