import React, { useState } from 'react';
import { Volume2, Play, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { guitarAudio } from '../../utils/audioSynth';
import { getFretNote } from '../../utils/guitarTheory';

export const ModuleFretboardMapping: React.FC = () => {
  const [bassMode, setBassMode] = useState<'muted' | 'openE' | 'gBass'>('muted');

  // C Major standard frets:
  // String 6, 5, 4, 3, 2, 1
  const getFretsForBassMode = (mode: 'muted' | 'openE' | 'gBass') => {
    switch (mode) {
      case 'muted':
        return [-1, 3, 2, 0, 1, 0]; // Standard C Major (X 3 2 0 1 0)
      case 'openE':
        return [0, 3, 2, 0, 1, 0]; // C/E inversion (0 3 2 0 1 0)
      case 'gBass':
        return [3, 3, 2, 0, 1, 0]; // C/G inversion (3 3 2 0 1 0)
    }
  };

  const playChordWithBassMode = (mode: 'muted' | 'openE' | 'gBass') => {
    setBassMode(mode);
    const frets = getFretsForBassMode(mode);
    const freqs: number[] = [];

    // Strings 6 to 1
    const stringNums = [6, 5, 4, 3, 2, 1];
    stringNums.forEach((sNum, idx) => {
      const f = frets[idx];
      if (f >= 0) {
        freqs.push(getFretNote(sNum, f).frequency);
      } else {
        freqs.push(-1);
      }
    });

    guitarAudio.strum(freqs, 'down', 32);
  };

  return (
    <div className="space-y-6">
      {/* Title & Core Principle */}
      <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 font-mono text-xs font-bold border border-brand-500/20">
            Section 5
          </span>
          <h2 className="text-xl font-bold text-ink-100">Mapping the Triad to the Fretboard & Bass Gravity</h2>
        </div>
        <p className="text-sm text-ink-300 leading-relaxed">
          Now that we know C Major is explicitly the notes <strong className="text-brand-300">C, E, and G</strong>, how do we play it on a 6-string guitar? We map every C, E, and G on the first three frets and pick a combination our hand can physically reach—multiplying notes across octaves for fullness.
        </p>
      </div>

      <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Interactive Fret Matrix Diagram (Recreating PDF Page 5) */}
        <div className="bg-ink-950 border border-ink-800 rounded-xl p-5 overflow-x-auto">
          <div className="min-w-[500px] max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between text-xs text-ink-400 font-mono pb-1 border-b border-ink-800">
              <span>STRING</span>
              <span>NUT (0)</span>
              <span>FRET 1</span>
              <span>FRET 2</span>
              <span>FRET 3</span>
              <span>TRIAD NOTE</span>
            </div>

            {/* String 1: High e */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-ink-900/60 border border-ink-800/80 text-xs">
              <span className="font-bold text-ink-300 w-16">High e (1)</span>
              <span className="px-2 py-1 rounded bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30">
                E (Open)
              </span>
              <span className="text-ink-600">—</span>
              <span className="text-ink-600">—</span>
              <span className="px-2 py-1 rounded bg-ink-800 text-ink-400">G (3rd)</span>
              <span className="text-gold-400 font-bold w-16 text-right">3rd (E)</span>
            </div>

            {/* String 2: B */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-ink-900/60 border border-ink-800/80 text-xs">
              <span className="font-bold text-ink-300 w-16">B (2)</span>
              <span className="text-ink-600">—</span>
              <span className="px-2 py-1 rounded bg-brand-500 text-ink-950 font-black shadow-md">
                C (Fret 1)
              </span>
              <span className="text-ink-600">—</span>
              <span className="text-ink-600">—</span>
              <span className="text-brand-400 font-bold w-16 text-right">Root (C)</span>
            </div>

            {/* String 3: G */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-ink-900/60 border border-ink-800/80 text-xs">
              <span className="font-bold text-ink-300 w-16">G (3)</span>
              <span className="px-2 py-1 rounded bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30">
                G (Open)
              </span>
              <span className="text-ink-600">—</span>
              <span className="text-ink-600">—</span>
              <span className="text-ink-600">—</span>
              <span className="text-violet-400 font-bold w-16 text-right">5th (G)</span>
            </div>

            {/* String 4: D */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-ink-900/60 border border-ink-800/80 text-xs">
              <span className="font-bold text-ink-300 w-16">D (4)</span>
              <span className="text-ink-600">—</span>
              <span className="text-ink-600">—</span>
              <span className="px-2 py-1 rounded bg-gold-500 text-ink-950 font-black shadow-md">
                E (Fret 2)
              </span>
              <span className="text-ink-600">—</span>
              <span className="text-gold-400 font-bold w-16 text-right">3rd (E)</span>
            </div>

            {/* String 5: A */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-ink-900/60 border border-ink-800/80 text-xs">
              <span className="font-bold text-ink-300 w-16">A (5)</span>
              <span className="text-ink-600">—</span>
              <span className="text-ink-600">—</span>
              <span className="text-ink-600">—</span>
              <span className="px-2 py-1 rounded bg-brand-500 text-ink-950 font-black shadow-md">
                C (Fret 3)
              </span>
              <span className="text-brand-400 font-bold w-16 text-right">Root (C)</span>
            </div>

            {/* String 6: Low E (The Bass Gravity Question!) */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-950/20 border border-red-500/30 text-xs">
              <div className="flex items-center gap-1.5 w-16">
                <span className="font-bold text-red-300">Low E (6)</span>
                <span className="text-[10px] font-bold text-red-400">X</span>
              </div>
              <span className="px-2 py-1 rounded bg-red-950/80 text-red-300 font-mono line-through">
                E (Open)
              </span>
              <span className="text-ink-600">—</span>
              <span className="text-ink-600">—</span>
              <span className="px-2 py-1 rounded bg-ink-800 text-ink-400">G (3rd)</span>
              <span className="text-red-400 font-bold w-16 text-right">Muted (X)</span>
            </div>
          </div>
        </div>

        {/* The Bass Gravity Experiment (Core question from PDF Page 5) */}
        <div className="bg-gradient-to-r from-ink-950 via-ink-900 to-ink-950 border border-brand-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-ink-100">
              The Bass Gravity Experiment: Why do we mute or skip the Low E string?
            </h3>
          </div>

          <p className="text-xs text-ink-300 leading-relaxed">
            Even though there is technically an <strong className="text-brand-300">'E' note</strong> available on that open string (and E belongs to the C Major chord!), adding it as the lowest sounding note completely changes the gravity of the chord. To the human ear, the <strong className="text-ink-100">lowest pitched note acts as the harmonic foundation</strong>. We want C to be our lowest note so the chord feels grounded and resolved!
          </p>

          {/* Interactive Listening A/B Test */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => playChordWithBassMode('muted')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                bassMode === 'muted'
                  ? 'bg-gold-950/60 border-gold-500 text-gold-200 ring-2 ring-gold-500/40 shadow-lg'
                  : 'bg-ink-950 border-ink-800 text-ink-300 hover:bg-ink-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm">1. Muted Low E (Pure C)</span>
                <CheckCircle2 className="w-4 h-4 text-gold-400" />
              </div>
              <p className="text-[11px] text-ink-400 mt-1">
                Root C (fret 3) is lowest note. Sounds stable, grounded, and fully resolved.
              </p>
              <div className="mt-2 text-xs font-bold text-gold-400 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear Grounded C</span>
              </div>
            </button>

            <button
              onClick={() => playChordWithBassMode('openE')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                bassMode === 'openE'
                  ? 'bg-brand-950/60 border-brand-500 text-brand-200 ring-2 ring-brand-500/40 shadow-lg'
                  : 'bg-ink-950 border-ink-800 text-ink-300 hover:bg-ink-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm">2. Open Low E (C/E)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold">1st Inversion</span>
              </div>
              <p className="text-[11px] text-ink-400 mt-1">
                3rd (E) is lowest note. Sounds restless, warm, and floating without firm footing.
              </p>
              <div className="mt-2 text-xs font-bold text-brand-400 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear Floating C/E</span>
              </div>
            </button>

            <button
              onClick={() => playChordWithBassMode('gBass')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                bassMode === 'gBass'
                  ? 'bg-violet-950/60 border-violet-500 text-violet-200 ring-2 ring-violet-500/40 shadow-lg'
                  : 'bg-ink-950 border-ink-800 text-ink-300 hover:bg-ink-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm">3. 3rd Fret Low E (C/G)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-bold">2nd Inversion</span>
              </div>
              <p className="text-[11px] text-ink-400 mt-1">
                5th (G) is lowest note. Rich, rumbling bass commonly used in acoustic folk strumming.
              </p>
              <div className="mt-2 text-xs font-bold text-violet-400 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear Folk C/G</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
