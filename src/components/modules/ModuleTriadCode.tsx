import React, { useState } from 'react';
import { Volume2, Play, RefreshCw, Sparkles, Heart } from 'lucide-react';
import { deriveTriad, NoteName, NOTE_NAMES, shiftSemitones } from '../../utils/guitarTheory';
import { guitarAudio } from '../../utils/audioSynth';

export const ModuleTriadCode: React.FC = () => {
  const [selectedRoot, setSelectedRoot] = useState<NoteName>('C');
  const [triadType, setTriadType] = useState<'Major' | 'Minor' | 'Diminished' | 'Augmented'>('Major');
  const [activeHighlight, setActiveHighlight] = useState<'root' | 'third' | 'fifth' | 'all' | null>(null);

  const triad = deriveTriad(selectedRoot, triadType);

  const getFreqForNote = (note: NoteName, octave: number = 3) => {
    const idx = NOTE_NAMES.indexOf(note);
    // Base A2 = 110Hz -> A3 = 220Hz
    return 130.81 * Math.pow(2, idx / 12) * Math.pow(2, octave - 3);
  };

  const playStepByStep = () => {
    const fRoot = getFreqForNote(triad.root, 3);
    const fThird = getFreqForNote(triad.thirdNote, 3);
    const fFifth = getFreqForNote(triad.fifthNote, 3);

    // 1. Pluck Root
    setActiveHighlight('root');
    guitarAudio.pluck(fRoot, 1.2, 0.9);

    // 2. Pluck 3rd
    setTimeout(() => {
      setActiveHighlight('third');
      guitarAudio.pluck(fThird, 1.2, 0.9);
    }, 700);

    // 3. Pluck 5th
    setTimeout(() => {
      setActiveHighlight('fifth');
      guitarAudio.pluck(fFifth, 1.2, 0.9);
    }, 1400);

    // 4. Strum All Together
    setTimeout(() => {
      setActiveHighlight('all');
      guitarAudio.strum([fRoot, fThird, fFifth], 'down', 35);
      setTimeout(() => setActiveHighlight(null), 1200);
    }, 2100);
  };

  const popularRoots: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A'];

  return (
    <div className="space-y-6">
      {/* Title & Core Principle */}
      <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 font-mono text-xs font-bold border border-brand-500/20">
            Section 3
          </span>
          <h2 className="text-xl font-bold text-ink-100">The +4 / +3 Triad Code (Sound DNA)</h2>
        </div>
        <p className="text-sm text-ink-300 leading-relaxed">
          People often rote learn chord shapes without knowing why they sound the way they do. A chord is not arbitrary; it is built by stacking musical intervals—specifically <strong className="text-brand-300">"Thirds"</strong>. A standard triad consists of three notes: <strong className="text-ink-100">Root (1)</strong>, <strong className="text-ink-100">Third (3)</strong>, and <strong className="text-ink-100">Fifth (5)</strong>.
        </p>
      </div>

      <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Controls: Root note and Triad Flavor */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Root:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {popularRoots.map(root => (
                <button
                  key={root}
                  onClick={() => setSelectedRoot(root)}
                  className={`w-9 h-9 rounded-xl font-extrabold text-sm transition-all border ${
                    selectedRoot === root
                      ? 'bg-brand-600 text-white border-brand-500 shadow-md ring-2 ring-brand-500/30'
                      : 'bg-ink-950 text-ink-300 border-ink-800 hover:bg-ink-800'
                  }`}
                >
                  {root}
                </button>
              ))}
            </div>
          </div>

          {/* Triad Type Toggle */}
          <div className="flex items-center bg-ink-950 p-1 rounded-xl border border-ink-800 text-xs">
            <button
              onClick={() => setTriadType('Major')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                triadType === 'Major'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              Major (+4, +3)
            </button>
            <button
              onClick={() => setTriadType('Minor')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                triadType === 'Minor'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              Minor (+3, +4)
            </button>
            <button
              onClick={() => setTriadType('Diminished')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                triadType === 'Diminished'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              Diminished (+3, +3)
            </button>
          </div>
        </div>

        {/* Visual Arc Diagram (Recreating PDF Page 3) */}
        <div className="bg-gradient-to-r from-ink-950 via-ink-900 to-ink-950 border border-ink-800 rounded-xl p-6 sm:p-8 relative overflow-x-auto">
          <div className="min-w-[480px] max-w-xl mx-auto space-y-4">
            {/* SVG Arcs */}
            <div className="h-28 relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 110">
                {/* Arc 1: Root to Third */}
                <path
                  d="M 60 95 Q 165 10 270 95"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="3.5"
                  className={activeHighlight === 'third' || activeHighlight === 'all' ? 'stroke-gold-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : ''}
                />
                <text
                  x="165"
                  y="45"
                  fill="#f97316"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  +{triad.firstJump} Semitones ({triadType === 'Major' ? 'Major 3rd' : 'Minor 3rd'})
                </text>

                {/* Arc 2: Third to Fifth */}
                <path
                  d="M 270 95 Q 355 25 440 95"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="3.5"
                  className={activeHighlight === 'fifth' || activeHighlight === 'all' ? 'stroke-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]' : ''}
                />
                <text
                  x="355"
                  y="50"
                  fill="#a78bfa"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  +{triad.secondJump} Semitones ({triadType === 'Major' ? 'Minor 3rd' : 'Major 3rd'})
                </text>
              </svg>
            </div>

            {/* Note Balls along bottom baseline */}
            <div className="border-t-2 border-ink-700 pt-4 flex items-center justify-between px-8">
              {/* Root */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => guitarAudio.pluck(getFreqForNote(triad.root, 3))}
                  className={`w-14 h-14 rounded-full flex flex-col items-center justify-center font-black text-lg shadow-xl transition-all ${
                    activeHighlight === 'root' || activeHighlight === 'all'
                      ? 'bg-brand-400 text-ink-950 scale-110 ring-4 ring-brand-300'
                      : 'bg-ink-950 text-white border-2 border-brand-500 hover:scale-105'
                  }`}
                >
                  <span>{triad.root}</span>
                  <span className="text-[9px] font-mono opacity-80">Root</span>
                </button>
                <span className="text-xs font-bold text-ink-300 mt-2">ROOT (1)</span>
                <span className="text-[11px] font-mono font-bold text-brand-400">Sa (सा)</span>
                <span className="text-[10px] text-ink-500">Achala (Fixed)</span>
              </div>

              {/* 3rd */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => guitarAudio.pluck(getFreqForNote(triad.thirdNote, 3))}
                  className={`w-14 h-14 rounded-full flex flex-col items-center justify-center font-black text-lg shadow-xl transition-all ${
                    activeHighlight === 'third' || activeHighlight === 'all'
                      ? 'bg-gold-400 text-ink-950 scale-110 ring-4 ring-gold-300'
                      : 'bg-ink-950 text-white border-2 border-gold-500 hover:scale-105'
                  }`}
                >
                  <span>{triad.thirdNote}</span>
                  <span className="text-[9px] font-mono opacity-80">3rd</span>
                </button>
                <span className="text-xs font-bold text-ink-300 mt-2">3rd</span>
                <span className="text-[11px] font-mono font-bold text-gold-400">
                  {triadType === 'Major' ? 'Shuddha Ga (ग)' : 'Komal ga (ग॒)'}
                </span>
                <span className="text-[10px] text-ink-500">{triadType === 'Major' ? 'Pure' : '"Less" (-1 Fret)'}</span>
              </div>

              {/* 5th */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => guitarAudio.pluck(getFreqForNote(triad.fifthNote, 3))}
                  className={`w-14 h-14 rounded-full flex flex-col items-center justify-center font-black text-lg shadow-xl transition-all ${
                    activeHighlight === 'fifth' || activeHighlight === 'all'
                      ? 'bg-violet-400 text-ink-950 scale-110 ring-4 ring-violet-300'
                      : 'bg-ink-950 text-white border-2 border-violet-500 hover:scale-105'
                  }`}
                >
                  <span>{triad.fifthNote}</span>
                  <span className="text-[9px] font-mono opacity-80">5th</span>
                </button>
                <span className="text-xs font-bold text-ink-300 mt-2">5th</span>
                <span className="text-[11px] font-mono font-bold text-violet-400">Pa (प)</span>
                <span className="text-[10px] text-ink-500">Achala (Walls)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Indian Swara Lesson Callout */}
        <div className="bg-ink-950/70 border border-ink-800 rounded-xl p-4 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-brand-300 font-bold">
            <span>🪕 Indian Swara Insight: Why Sa & Pa Never Move</span>
          </div>
          <p className="text-ink-300 leading-relaxed">
            In Indian classical music, <strong className="text-brand-300">Sa</strong> and <strong className="text-violet-300">Pa</strong> are called <strong className="text-ink-100">Achala Swaras (immovable notes)</strong>—they never have a sharp or flat variant. The entire emotional shift between Major and Minor chords rests purely on whether <strong className="text-gold-300">Ga</strong> is natural (<span className="text-ink-100">Shuddha Ga</span>, +4 frets) or "less" (<span className="text-ink-100">Komal ga</span>, +3 frets)!
          </p>
        </div>

        {/* Action Button & Explainer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-ink-950/80 border border-ink-800 rounded-xl p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-ink-100 text-sm">
                {selectedRoot} {triadType} Triad: [{triad.notes.join(' - ')}]
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-ink-800 text-ink-300">
                Formula: +{triad.firstJump}, +{triad.secondJump}
              </span>
            </div>
            <p className="text-xs text-ink-400 mt-1">{triad.moodDescription}</p>
          </div>

          <button
            onClick={playStepByStep}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shrink-0 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Hear Triad Build (Root ➔ 3rd ➔ 5th ➔ Chord)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
