import React, { useState } from 'react';
import { Play, Volume2, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { ascendingFrequencies, deriveMajorScale, NoteName } from '../../utils/guitarTheory';
import { useTimeouts } from '../labs/useTimeouts';
import { guitarAudio } from '../../utils/audioSynth';

export const ModuleMajorScale: React.FC = () => {
  const [selectedRoot, setSelectedRoot] = useState<NoteName>('C');
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [isPlayingScale, setIsPlayingScale] = useState<boolean>(false);

  const scaleData = deriveMajorScale(selectedRoot);

  const { after } = useTimeouts();

  const handlePlayScale = () => {
    if (isPlayingScale) return;
    setIsPlayingScale(true);

    // the scale rises from the root and finishes on the octave, so it resolves
    const notes = [...scaleData.notes, scaleData.root];
    const freqs = ascendingFrequencies(scaleData.notes, 146.8, true);
    freqs.forEach((freq, idx) => {
      after(() => {
        setActiveStepIndex(Math.min(idx, notes.length - 1));
        guitarAudio.pluck(freq, 0.8, 0.85);

        if (idx === freqs.length - 1) {
          after(() => {
            setIsPlayingScale(false);
            setActiveStepIndex(null);
          }, 600);
        }
      }, idx * 450);
    });
  };

  const handlePlayRelativeMinor = () => {
    // Relative minor scale: the same seven notes, starting on the relative minor root
    const startIdx = scaleData.notes.indexOf(scaleData.relativeMinor);
    const reordered: NoteName[] = [];
    for (let i = 0; i < 7; i++) {
      reordered.push(scaleData.notes[(startIdx + i) % 7]);
    }

    ascendingFrequencies(reordered, 110.0, true).forEach((freq, idx) => {
      after(() => guitarAudio.pluck(freq, 1.0, 0.85), idx * 350);
    });
  };

  const popularRoots: NoteName[] = ['C', 'G', 'D', 'A', 'E', 'F'];

  return (
    <div className="space-y-6">
      {/* Title & Core Principle */}
      <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 font-mono text-xs font-bold border border-brand-500/20">
            Section 2
          </span>
          <h2 className="text-xl font-bold text-ink-100">Deriving the Major Scale (Scale DNA)</h2>
        </div>
        <p className="text-sm text-ink-300 leading-relaxed">
          Instead of memorizing scale shapes, understand the DNA: A scale is a curated filter of the 12 chromatic tones built by physical fret jumps:
          <strong className="text-brand-300"> Whole, Whole, Half, Whole, Whole, Whole, Half (+2, +2, +1, +2, +2, +2, +1)</strong>.
          On guitar, a Whole step = 2 frets; a Half step = 1 fret.
        </p>
      </div>

      {/* Root Selector & Play Control */}
      <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Choose Root Note:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {popularRoots.map(root => (
                <button
                  key={root}
                  onClick={() => setSelectedRoot(root)}
                  className={`w-9 h-9 rounded-xl font-extrabold text-sm transition-all border ${
                    selectedRoot === root
                      ? 'bg-brand-600 text-white border-brand-500 shadow-md ring-2 ring-brand-500/30'
                      : 'bg-ink-950 text-ink-300 border-ink-800 hover:bg-ink-800 hover:text-white'
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Hear Scale DNA ({selectedRoot} Major)</span>
          </button>
        </div>

        {/* Visual Jumping Arc Diagram (Recreating PDF Page 2) */}
        <div className="bg-ink-950 border border-ink-800 rounded-xl p-6 relative overflow-x-auto">
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
            <div className="relative border-t-2 border-ink-700 pt-3">
              <div className="flex items-center justify-between px-6">
                {[...scaleData.notes, scaleData.root].map((note, idx) => {
                  const isRoot = idx === 0 || idx === 7;
                  const isActive = activeStepIndex === idx;

                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm shadow-lg transition-all ${
                          isActive
                            ? 'bg-brand-400 text-ink-950 scale-125 ring-4 ring-brand-400/30'
                            : isRoot
                            ? 'bg-brand-600 text-white ring-2 ring-brand-400/50'
                            : 'bg-ink-800 text-ink-200 border border-ink-700'
                        }`}
                      >
                        {note}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-ink-500 mt-1">
                        {idx === 0 ? 'Root' : idx === 7 ? '8ve' : `Deg ${idx + 1}`}
                      </span>
                      <span className="text-[10px] font-bold text-brand-400/90 font-mono">
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
        <div className="bg-ink-950/60 border border-ink-800 rounded-xl p-4 text-xs text-ink-300 space-y-2">
          <div className="flex items-center gap-2 text-brand-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Why C Major has Zero Sharps or Flats (And Bilawal Thaat):</span>
          </div>
          <p className="text-ink-400 leading-relaxed">
            In the natural musical alphabet, the half steps occur naturally between <strong className="text-ink-200">E and F</strong> (+1) and between <strong className="text-ink-200">B and C</strong> (+1).
            Because the Major Scale DNA formula requires +1 jumps at steps 3→4 and 7→8, starting on C aligns naturally with E→F and B→C with 0 accidentals!
          </p>
          <p className="text-brand-300/90 leading-relaxed pt-1 border-t border-ink-800/80 font-medium">
            🪕 <strong className="underline">Indian Classical Connection:</strong> This exact scale is known as <strong className="text-brand-200">Bilawal Thaat</strong> in Indian classical music (<span className="font-mono font-bold">Sa - Re - Ga - ma - Pa - Dha - Ni</span>). Notice how <strong className="text-ink-100">Ga ➔ ma</strong> (+1) and <strong className="text-ink-100">Ni ➔ Sa</strong> (+1) are the exact physical half-step jumps!
          </p>
        </div>

        {/* Relative Minor Card (The Formula from Page 2) */}
        <div className="bg-gradient-to-r from-gold-950/40 via-ink-900 to-gold-950/40 border border-gold-500/30 rounded-xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-gold-500/20 text-gold-400 border border-gold-500/30">
                  The Relative Minor Formula
                </span>
                <span className="text-sm font-bold text-ink-200">
                  Relative Minor = Root − 3 Frets (3 Semitones)
                </span>
              </div>
              <p className="text-xs text-ink-400 mt-1">
                Every major scale has a twin minor scale sharing the <strong className="text-ink-200">exact same notes</strong>, just starting from a different emotional center.
              </p>
            </div>

            <button
              onClick={handlePlayRelativeMinor}
              className="px-3.5 py-1.5 rounded-xl bg-gold-700/60 hover:bg-gold-600 border border-gold-500/60 text-gold-100 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Hear {scaleData.relativeMinor} Minor Twin</span>
            </button>
          </div>

          <div className="bg-ink-950/90 border border-ink-800 rounded-lg p-3 text-xs flex flex-wrap items-center gap-2 text-ink-300">
            <span className="font-bold text-brand-400">{selectedRoot} Major</span>
            <span>minus 3 frets ➔</span>
            <span className="font-extrabold text-gold-400 text-sm px-2 py-0.5 rounded bg-gold-500/10 border border-gold-500/20">
              {scaleData.relativeMinor} Minor
            </span>
            <span className="text-ink-500">| Identical Notes:</span>
            <span className="font-mono text-ink-300">
              ({scaleData.notes.join(' - ')})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
