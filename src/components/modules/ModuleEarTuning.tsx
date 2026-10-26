import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { guitarAudio } from '../../utils/audioSynth';
import { BeatNoteDemo } from './BeatNoteDemo';
import { useTimeouts } from '../labs/useTimeouts';

export const ModuleEarTuning: React.FC = () => {
  const [activePairIndex, setActivePairIndex] = useState<number>(0);
  const [isPlayingUnison, setIsPlayingUnison] = useState<boolean>(false);
  const { after } = useTimeouts();

  // The 5 pairs for tuning down the neck:
  // 1. Low E 5th fret -> Open A
  // 2. A 5th fret -> Open D
  // 3. D 5th fret -> Open G
  // 4. G 4th fret -> Open B (The Exception!)
  // 5. B 5th fret -> Open High E
  const pairs = [
    {
      sourceString: 6,
      sourceName: 'Low E',
      fret: 5,
      targetString: 5,
      targetName: 'A',
      note: 'A2',
      freq: 110.0,
      isException: false,
      description: 'Walking up 5 frets on the Low E string arrives at note "A", physically identical in pitch to the open A string directly below it.',
    },
    {
      sourceString: 5,
      sourceName: 'A',
      fret: 5,
      targetString: 4,
      targetName: 'D',
      note: 'D3',
      freq: 146.8,
      isException: false,
      description: 'Touching the 5th fret of the A string gives "D", matching the open D string below.',
    },
    {
      sourceString: 4,
      sourceName: 'D',
      fret: 5,
      targetString: 3,
      targetName: 'G',
      note: 'G3',
      freq: 196.0,
      isException: false,
      description: 'Touching the 5th fret of the D string gives "G", matching the open G string.',
    },
    {
      sourceString: 3,
      sourceName: 'G',
      fret: 4,
      targetString: 2,
      targetName: 'B',
      note: 'B3',
      freq: 246.9,
      isException: true,
      description: 'THE ONE EXCEPTION: G to B is a Major Third (4 frets) apart instead of a Perfect 4th (5 frets). That one-semitone squeeze is built into standard tuning and keeps common chord shapes within easy reach. Press the 4th fret of G!',
    },
    {
      sourceString: 2,
      sourceName: 'B',
      fret: 5,
      targetString: 1,
      targetName: 'High E',
      note: 'E4',
      freq: 329.6,
      isException: false,
      description: 'Returns to the standard 5-fret Perfect 4th rule. 5th fret of B matches open High E.',
    },
  ];

  const currentPair = pairs[activePairIndex];

  const playSource = () => {
    guitarAudio.pluck(currentPair.freq, 3.0, 0.85);
  };

  const playTarget = () => {
    guitarAudio.pluck(currentPair.freq, 3.0, 0.85);
  };

  const playBothUnison = () => {
    setIsPlayingUnison(true);
    guitarAudio.pluck(currentPair.freq, 3.5, 0.8);
    after(() => {
      guitarAudio.pluck(currentPair.freq, 3.5, 0.8);
      setIsPlayingUnison(false);
    }, 180);
  };

  return (
    <div className="space-y-6">
      {/* Title & Core Principle */}
      <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 font-mono text-xs font-bold border border-brand-500/20">
            Section 1
          </span>
          <h2 className="text-xl font-bold text-ink-100">The 12 Tones & Tuning by Ear</h2>
        </div>
        <p className="text-sm text-ink-300 leading-relaxed">
          Western music is built on 12 distinct notes before repeating at the octave. Moving 1 fret up increases pitch by exactly 1 semitone. Standard guitar tuning is designed in <strong className="text-brand-300">Perfect Fourths</strong> (5 semitones), allowing you to tune the guitar to itself without any electronic tuner!
        </p>
      </div>

      {/* Interactive Visual Tuning Diagram (Recreating PDF Page 1) */}
      <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-ink-100 text-sm sm:text-base flex items-center gap-2">
            <span>Interactive Pitch Matcher</span>
            {currentPair.isException && (
              <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400 text-xs font-bold border border-gold-500/30">
                Major 3rd Exception (4th Fret)
              </span>
            )}
          </h3>

          {/* Pair Selectors */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {pairs.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setActivePairIndex(idx)}
                aria-pressed={activePairIndex === idx}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  activePairIndex === idx
                    ? p.isException
                      ? 'bg-gold-600 text-white border-gold-500 shadow-md'
                      : 'bg-brand-600 text-white border-brand-500 shadow-md'
                    : 'bg-ink-950 text-ink-300 border-ink-800 hover:bg-ink-800'
                }`}
              >
                {p.sourceName} → {p.targetName} {p.isException && '(Maj 3rd)'}
              </button>
            ))}
          </div>
        </div>

        {/* Visual String Graphic Matching PDF Page 1 */}
        <div className="bg-gradient-to-r from-ink-950 via-ink-900 to-ink-950 border border-ink-800 rounded-xl p-6 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-8 relative py-4">
            {/* Target Open String (Upper Line) */}
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="sm:w-28 shrink-0 font-bold text-sm text-ink-300 flex items-center gap-1.5">
                <span className="min-w-6 h-6 px-1 rounded-md bg-ink-800 flex items-center justify-center text-xs text-brand-400 font-mono">
                  {currentPair.targetName}
                </span>
                <span className="text-xs text-ink-400">Open</span>
              </div>

              {/* String Wire */}
              <div className="flex-1 h-1.5 bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 rounded-full sm:mx-4 mt-6 sm:mt-0 relative shadow-sm">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-mono font-bold text-gold-400 tracking-wider whitespace-nowrap">
                  MATCHES OPEN STRING PITCH ({currentPair.note})
                </div>
              </div>

              <button
                onClick={playTarget}
                className="px-3 py-1.5 rounded-lg bg-gold-600/30 hover:bg-gold-600/50 border border-gold-500/50 text-gold-300 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Pluck Open {currentPair.targetName}</span>
              </button>
            </div>

            {/* Dotted Connection Arc */}
            <div className="h-10 relative flex items-center justify-center">
              <svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 400 50">
                <path
                  d="M 320 45 C 320 15, 260 5, 180 5"
                  fill="none"
                  className="stroke-gold-500"
                  strokeWidth="2.5"
                  strokeDasharray="5 5"
                />
              </svg>
            </div>

            {/* Source String With Fretted Note (Lower Line) */}
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="sm:w-28 shrink-0 font-bold text-sm text-ink-300 flex items-center gap-1.5">
                <span className="min-w-6 h-6 px-1 rounded-md bg-ink-800 flex items-center justify-center text-xs text-brand-400 font-mono">
                  {currentPair.sourceName}
                </span>
                <span className="text-xs text-ink-400">String</span>
              </div>

              {/* String Wire */}
              <div className="flex-1 h-2 bg-gradient-to-r from-brand-600 via-ink-500 to-brand-700 rounded-full sm:mx-4 mt-6 mb-2 sm:my-0 relative shadow-sm">
                {/* Nut */}
                <div className="absolute left-0 -top-4 -bottom-4 w-2 bg-ink-200 rounded-sm shadow-md" />

                {/* Fretted Marker */}
                <div
                  className="absolute -top-3.5 flex flex-col items-center"
                  style={{ left: currentPair.isException ? '75%' : '80%' }}
                >
                  <span className="text-[10px] font-bold text-brand-300 -top-5 absolute whitespace-nowrap">
                    {currentPair.fret}th Fret
                  </span>
                  <button
                    onClick={playSource}
                    className="min-w-8 h-8 px-1.5 whitespace-nowrap rounded-full bg-brand-500 hover:bg-brand-400 text-ink-950 font-black text-xs flex items-center justify-center shadow-lg ring-4 ring-brand-500/20 active:scale-95 transition-all"
                  >
                    {currentPair.targetName}
                  </button>
                </div>
              </div>

              <button
                onClick={playSource}
                className="px-3 py-1.5 rounded-lg bg-brand-600/30 hover:bg-brand-600/50 border border-brand-500/50 text-brand-300 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Pluck {currentPair.fret}th Fret</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lesson takeaway box */}
        <div className="bg-ink-950/80 border border-ink-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-ink-200 text-sm">
              {currentPair.sourceName} ({currentPair.fret}th Fret) = Open {currentPair.targetName} ({currentPair.note})
            </h4>
            <p className="text-xs text-ink-400">{currentPair.description}</p>
          </div>

          <button
            onClick={playBothUnison}
            disabled={isPlayingUnison}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shrink-0 active:scale-95"
          >
            <Volume2 className="w-4 h-4" />
            <span>Play Unison Harmony</span>
          </button>
        </div>
      </div>

      <BeatNoteDemo
        referenceFreq={currentPair.freq}
        referenceName={`open ${currentPair.targetName}`}
      />
    </div>
  );
};
