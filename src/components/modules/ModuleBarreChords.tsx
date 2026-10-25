import React, { useState } from 'react';
import { Volume2, Play, Sliders, ArrowRight, Sparkles } from 'lucide-react';
import { calculateBarreChord, NoteName, NOTE_NAMES, getFretNote } from '../../utils/guitarTheory';
import { guitarAudio } from '../../utils/audioSynth';

export const ModuleBarreChords: React.FC = () => {
  const [fretPosition, setFretPosition] = useState<number>(1); // Fret 1 = F Major
  const [shapeFamily, setShapeFamily] = useState<'E-Shape' | 'A-Shape'>('E-Shape');
  const [flavor, setFlavor] = useState<'Major' | 'Minor'>('Major');

  // For E-shape: fret 0 is E, 1 is F, 2 is F#, 3 is G, etc.
  // For A-shape: fret 0 is A, 1 is Bb, 2 is B, 3 is C, etc.
  const rootNote: NoteName =
    shapeFamily === 'E-Shape'
      ? NOTE_NAMES[(NOTE_NAMES.indexOf('E') + fretPosition) % 12]
      : NOTE_NAMES[(NOTE_NAMES.indexOf('A') + fretPosition) % 12];

  const fullShapeKey =
    shapeFamily === 'E-Shape'
      ? flavor === 'Major' ? 'E-Major' : 'E-Minor'
      : flavor === 'Major' ? 'A-Major' : 'A-Minor';

  const chordVoicing = calculateBarreChord(rootNote, fullShapeKey as any);

  const playBarreSound = () => {
    const freqs: number[] = [];
    const stringNums = [6, 5, 4, 3, 2, 1];
    stringNums.forEach((sNum, idx) => {
      const f = chordVoicing.frets[idx];
      if (f >= 0) {
        freqs.push(getFretNote(sNum, f).frequency);
      } else {
        freqs.push(-1);
      }
    });

    guitarAudio.strum(freqs, 'down', 30);
  };

  const fretPresets = [
    { fret: 0, label: shapeFamily === 'E-Shape' ? 'Open E' : 'Open A' },
    { fret: 1, label: shapeFamily === 'E-Shape' ? '1st (F)' : '1st (Bb)' },
    { fret: 3, label: shapeFamily === 'E-Shape' ? '3rd (G)' : '3rd (C)' },
    { fret: 5, label: shapeFamily === 'E-Shape' ? '5th (A)' : '5th (D)' },
    { fret: 7, label: shapeFamily === 'E-Shape' ? '7th (B)' : '7th (E)' },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Core Principle */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-mono text-xs font-bold border border-amber-500/20">
            Section 6
          </span>
          <h2 className="text-xl font-bold text-stone-100">Barre Chords: Shifting the Nut</h2>
        </div>
        <p className="text-sm text-stone-300 leading-relaxed">
          The guitar is geometric. Think of an open chord: the guitar nut holds the 0th fret across open strings. When you shift the chord shape up the neck, your <strong className="text-amber-300">index finger lays completely flat to act as a movable, human nut (the Barre)</strong>. The fretboard calculates all the intervals for you!
        </p>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Controls: Shape Family and Flavor */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Shape toggle */}
            <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
              <button
                onClick={() => setShapeFamily('E-Shape')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  shapeFamily === 'E-Shape' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-400'
                }`}
              >
                E-Shape (6th String Root)
              </button>
              <button
                onClick={() => setShapeFamily('A-Shape')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  shapeFamily === 'A-Shape' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-400'
                }`}
              >
                A-Shape (5th String Root)
              </button>
            </div>

            {/* Flavor toggle */}
            <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
              <button
                onClick={() => setFlavor('Major')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  flavor === 'Major' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-400'
                }`}
              >
                Major
              </button>
              <button
                onClick={() => setFlavor('Minor')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  flavor === 'Minor' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-400'
                }`}
              >
                Minor
              </button>
            </div>
          </div>

          <button
            onClick={playBarreSound}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Hear {rootNote} {flavor} Barre</span>
          </button>
        </div>

        {/* Interactive Movable Nut Slider */}
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Slide The Nut Along The Neck:</span>
            </span>
            <span className="text-sm font-extrabold text-amber-300">
              Fret {fretPosition} ➔ {rootNote} {flavor}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="10"
            value={fretPosition}
            onChange={e => {
              const val = parseInt(e.target.value);
              setFretPosition(val);
              setTimeout(playBarreSound, 40);
            }}
            className="w-full accent-amber-500 h-2 bg-stone-800 rounded-lg cursor-pointer"
          />

          {/* Quick Fret Preset Buttons */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-xs">
            {fretPresets.map(preset => (
              <button
                key={preset.fret}
                onClick={() => {
                  setFretPosition(preset.fret);
                  setTimeout(playBarreSound, 40);
                }}
                className={`px-2.5 py-1 rounded-lg border font-semibold whitespace-nowrap transition-all ${
                  fretPosition === preset.fret
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Movable Barre Neck Graphic (Recreating PDF Page 6) */}
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-5 overflow-x-auto">
          <div className="min-w-[540px] max-w-xl mx-auto space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
              <span className="font-bold text-amber-300">
                Chord: {rootNote} {flavor} ({shapeFamily})
              </span>
              <span className="font-mono text-stone-500">
                Frets: [{chordVoicing.frets.map(f => (f === -1 ? 'X' : f)).join(' ')}]
              </span>
            </div>

            {/* Fret grid */}
            <div className="relative border-4 border-stone-800 rounded-xl bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-4">
              {/* Index Finger Barre Overlay Bar */}
              {fretPosition > 0 && (
                <div
                  className="absolute top-2 bottom-2 w-7 rounded-md bg-sky-500/40 border-2 border-sky-400 z-10 flex flex-col items-center justify-center text-[10px] font-bold text-sky-200 pointer-events-none shadow-lg backdrop-blur-[1px]"
                  style={{
                    left: `${Math.min(90, Math.max(10, 8 + fretPosition * 7.5))}%`,
                  }}
                >
                  <span className="rotate-90 whitespace-nowrap">INDEX BARRE</span>
                </div>
              )}

              {/* 6 strings representation */}
              <div className="space-y-3.5">
                {[6, 5, 4, 3, 2, 1].map((sNum, idx) => {
                  const f = chordVoicing.frets[idx];
                  return (
                    <div key={sNum} className="relative flex items-center h-4">
                      <span className="w-8 text-[11px] font-bold text-stone-400">Str {sNum}</span>
                      <div className="flex-1 h-0.5 bg-stone-600 relative">
                        {f === -1 ? (
                          <span className="absolute left-1 -top-2 text-xs font-bold text-red-400">X</span>
                        ) : f === 0 ? (
                          <span className="absolute left-1 -top-2.5 w-4 h-4 rounded-full border border-amber-400 text-[10px] font-bold text-amber-300 flex items-center justify-center bg-stone-950">
                            0
                          </span>
                        ) : (
                          <div
                            className="absolute -top-2.5 w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] flex items-center justify-center shadow-md z-20"
                            style={{
                              left: `${Math.min(90, Math.max(5, f * 8.5))}%`,
                            }}
                          >
                            {f}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-stone-400 pt-1">
              {chordVoicing.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
