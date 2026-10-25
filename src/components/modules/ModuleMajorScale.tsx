import React, { useState } from 'react';
import { Play, Volume2, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { deriveMajorScale, NoteName, NOTE_NAMES, shiftSemitones } from '../../utils/guitarTheory';
import { guitarAudio } from '../../utils/audioSynth';

export const ModuleMajorScale: React.FC = () => {
  const [selectedRoot, setSelectedRoot] = useState<NoteName>('C');
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [isPlayingScale, setIsPlayingScale] = useState<boolean>(false);

  const scaleData = deriveMajorScale(selectedRoot);

  const handlePlayScale = () => {
    if (isPlayingScale) return;
    setIsPlayingScale(true);

    const freqs = scaleData.notes.map((note, idx) => {
      // Base C3 ~ 130.8 Hz
      const noteIdx = NOTE_NAMES.indexOf(note);
      return 130.8 * Math.pow(2, (noteIdx + (idx >= 7 ? 12 : 0)) / 12);
    });

    scaleData.notes.forEach((note, idx) => {
      setTimeout(() => {
        setActiveStepIndex(idx);
        const noteIdx = NOTE_NAMES.indexOf(note);
        const freq = 146.8 * Math.pow(2, (noteIdx >= NOTE_NAMES.indexOf(selectedRoot) ? (noteIdx - NOTE_NAMES.indexOf(selectedRoot)) : (noteIdx - NOTE_NAMES.indexOf(selectedRoot) + 12)) / 12);
        guitarAudio.pluck(freq, 0.8, 0.85);

        if (idx === scaleData.notes.length - 1) {
          setTimeout(() => {
            setIsPlayingScale(false);
            setActiveStepIndex(null);
          }, 600);
        }
      }, idx * 450);
    });
  };

  const handlePlayRelativeMinor = () => {
    // Relative minor scale starting on relativeMinor
    const relMinor = scaleData.relativeMinor;
    const relScale = deriveMajorScale(selectedRoot); // uses same notes, just starting from relMinor
    const startIdx = relScale.notes.indexOf(relMinor);
    const reordered: NoteName[] = [];
    for (let i = 0; i < 7; i++) {
      reordered.push(relScale.notes[(startIdx + i) % 7]);
    }

    reordered.forEach((note, idx) => {
      setTimeout(() => {
        const noteIdx = NOTE_NAMES.indexOf(note);
        const freq = 110.0 * Math.pow(2, noteIdx / 12);
        guitarAudio.pluck(freq, 1.0, 0.85);
      }, idx * 350);
    });
  };

  const popularRoots: NoteName[] = ['C', 'G', 'D', 'A', 'E', 'F'];

  return (
    <div className="space-y-6">
      {/* Title & Core Principle */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-mono text-xs font-bold border border-amber-500/20">
            Section 2
          </span>
          <h2 className="text-xl font-bold text-stone-100">Deriving the Major Scale (Scale DNA)</h2>
        </div>
        <p className="text-sm text-stone-300 leading-relaxed">
          Instead of memorizing scale shapes, understand the DNA: A scale is a curated filter of the 12 chromatic tones built by physical fret jumps:
          <strong className="text-amber-300"> Whole, Whole, Half, Whole, Whole, Whole, Half (+2, +2, +1, +2, +2, +2, +1)</strong>.
          On guitar, a Whole step = 2 frets; a Half step = 1 fret.
        </p>
      </div>

      {/* Root Selector & Play Control */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Choose Root Note:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {popularRoots.map(root => (
                <button
                  key={root}
                  onClick={() => setSelectedRoot(root)}
                  className={`w-9 h-9 rounded-xl font-extrabold text-sm transition-all border ${
                    selectedRoot === root
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-2 ring-amber-500/30'
                      : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  {root}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handlePlayScale}
            disabled={isPlayingScale}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Hear Scale DNA ({selectedRoot} Major)</span>
          </button>
        </div>

        {/* Visual Jumping Arc Diagram (Recreating PDF Page 2) */}
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-6 relative overflow-x-auto">
          <div className="min-w-[560px] max-w-3xl mx-auto py-6">
            {/* Arcs SVG */}
            <div className="relative h-20">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 80">
                {scaleData.steps.map((step, idx) => {
                  const startX = 50 + idx * 85;
                  const endX = startX + 85;
                  const isHalf = step.semitones === 1;
                  const arcHeight = isHalf ? 35 : 55;
                  const midX = (startX + endX) / 2;

                  return (
                    <g key={idx}>
                      <path
                        d={`M ${startX} 75 Q ${midX} ${75 - arcHeight} ${endX} 75`}
                        fill="none"
                        stroke={isHalf ? '#ef4444' : '#f59e0b'}
                        strokeWidth={activeStepIndex === idx ? '3.5' : '2'}
                        className="transition-all"
                      />
                      <text
                        x={midX}
                        y={70 - arcHeight}
                        fill={isHalf ? '#ef4444' : '#fbbf24'}
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        +{step.semitones} ({step.stepName})
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Note Circles along horizontal fret line */}
            <div className="relative border-t-2 border-stone-700 pt-3">
              <div className="flex items-center justify-between px-6">
                {[...scaleData.notes, scaleData.root].map((note, idx) => {
                  const isRoot = idx === 0 || idx === 7;
                  const isActive = activeStepIndex === idx;

                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm shadow-lg transition-all ${
                          isActive
                            ? 'bg-amber-400 text-stone-950 scale-125 ring-4 ring-amber-400/30'
                            : isRoot
                            ? 'bg-amber-600 text-white ring-2 ring-amber-400/50'
                            : 'bg-stone-800 text-stone-200 border border-stone-700'
                        }`}
                      >
                        {note}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-stone-500 mt-1">
                        {idx === 0 ? 'Root' : idx === 7 ? '8ve' : `Deg ${idx + 1}`}
                      </span>
                      <span className="text-[10px] font-bold text-amber-400/90 font-mono">
                        {['Sa', 'Re', 'Ga', 'ma', 'Pa', 'Dha', 'Ni', "Sa'"][idx]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Natural Half-Steps Explainer & Indian Sargam Equivalence */}
        <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 text-xs text-stone-300 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Why C Major has Zero Sharps or Flats (And Bilawal Thaat):</span>
          </div>
          <p className="text-stone-400 leading-relaxed">
            In the natural musical alphabet, the half steps occur naturally between <strong className="text-stone-200">E and F</strong> (+1) and between <strong className="text-stone-200">B and C</strong> (+1).
            Because the Major Scale DNA formula requires +1 jumps at steps 3→4 and 7→8, starting on C aligns naturally with E→F and B→C with 0 accidentals!
          </p>
          <p className="text-amber-300/90 leading-relaxed pt-1 border-t border-stone-800/80 font-medium">
            🪕 <strong className="underline">Indian Classical Connection:</strong> This exact scale is known as <strong className="text-amber-200">Bilawal Thaat</strong> in Indian classical music (<span className="font-mono font-bold">Sa - Re - Ga - ma - Pa - Dha - Ni</span>). Notice how <strong className="text-stone-100">Ga ➔ ma</strong> (+1) and <strong className="text-stone-100">Ni ➔ Sa</strong> (+1) are the exact physical half-step jumps!
          </p>
        </div>

        {/* Relative Minor Card (The Formula from Page 2) */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-stone-900 to-emerald-950/40 border border-emerald-500/30 rounded-xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  The Relative Minor Formula
                </span>
                <span className="text-sm font-bold text-stone-200">
                  Relative Minor = Root − 3 Frets (3 Semitones)
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Every major scale has a twin minor scale sharing the <strong className="text-stone-200">exact same notes</strong>, just starting from a different emotional center.
              </p>
            </div>

            <button
              onClick={handlePlayRelativeMinor}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700/60 hover:bg-emerald-600 border border-emerald-500/60 text-emerald-100 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Hear {scaleData.relativeMinor} Minor Twin</span>
            </button>
          </div>

          <div className="bg-stone-950/90 border border-stone-800 rounded-lg p-3 text-xs flex flex-wrap items-center gap-2 text-stone-300">
            <span className="font-bold text-amber-400">{selectedRoot} Major</span>
            <span>minus 3 frets ➔</span>
            <span className="font-extrabold text-emerald-400 text-sm px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              {scaleData.relativeMinor} Minor
            </span>
            <span className="text-stone-500">| Identical Notes:</span>
            <span className="font-mono text-stone-300">
              ({scaleData.notes.join(' - ')})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
