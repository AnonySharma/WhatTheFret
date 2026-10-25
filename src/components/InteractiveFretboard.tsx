import React, { useState } from 'react';
import { Play, Volume2, Sparkles, RefreshCw, Globe, Zap, Compass } from 'lucide-react';
import { GUITAR_STRINGS, getFretNote, CHORD_DATABASE, ChordVoicing, NoteName, calculateBarreChord, getSwaraForNote } from '../utils/guitarTheory';
import { guitarAudio } from '../utils/audioSynth';
import { FretboardQuiz } from './FretboardQuiz';

interface InteractiveFretboardProps {
  customFrets?: (number | -1)[];
  onFretChange?: (frets: (number | -1)[]) => void;
  activeChordName?: string;
  highlightTriadNotes?: NoteName[];
  displayMode?: 'notes' | 'intervals' | 'sargam';
  showFretLimit?: number;
  notesNotation?: 'western' | 'indian';
  rootSa?: NoteName;
}

export const InteractiveFretboard: React.FC<InteractiveFretboardProps> = ({
  customFrets,
  onFretChange,
  activeChordName,
  highlightTriadNotes,
  displayMode: initialDisplayMode = 'notes',
  showFretLimit = 12,
  notesNotation = 'western',
  rootSa = 'C',
}) => {
  const [selectedChordId, setSelectedChordId] = useState<string>('c-major-open');
  const [fretsState, setFretsState] = useState<(number | -1)[]>(
    customFrets || [-1, 3, 2, 0, 1, 0] // Default C Major
  );
  const [displayMode, setDisplayMode] = useState<'notes' | 'intervals' | 'sargam'>(
    notesNotation === 'indian' ? 'sargam' : initialDisplayMode
  );
  const [viewMode, setViewMode] = useState<'explorer' | 'quiz'>('explorer');
  const [vibratingString, setVibratingString] = useState<number | null>(null);
  const [barreRoot, setBarreRoot] = useState<NoteName>('F');
  const [barreShape, setBarreShape] = useState<'E-Major' | 'E-Minor' | 'A-Major' | 'A-Minor'>('E-Major');

  // Sync when notation changes from parent
  React.useEffect(() => {
    if (notesNotation === 'indian') {
      setDisplayMode('sargam');
    }
  }, [notesNotation]);

  // Sync when customFrets is updated by parent
  React.useEffect(() => {
    if (customFrets) {
      setFretsState(customFrets);
    }
  }, [customFrets]);

  const activeChord: ChordVoicing | undefined =
    CHORD_DATABASE.find(c => c.id === selectedChordId) ||
    calculateBarreChord(barreRoot, barreShape);

  const currentFrets = customFrets || fretsState;

  const handleStringFretClick = (stringNum: number, fret: number) => {
    // stringNum is 6 (Low E) to 1 (High E). Array index is 6 - stringNum
    const strIdx = 6 - stringNum;
    const newFrets = [...currentFrets];

    if (newFrets[strIdx] === fret) {
      // Toggle to open (0) or muted (-1)
      newFrets[strIdx] = fret === 0 ? -1 : 0;
    } else {
      newFrets[strIdx] = fret;
    }

    setFretsState(newFrets);
    if (onFretChange) onFretChange(newFrets);

    // Play note audio if not muted
    if (newFrets[strIdx] >= 0) {
      const noteData = getFretNote(stringNum, newFrets[strIdx]);
      guitarAudio.pluck(noteData.frequency);
      triggerStringVibration(stringNum);
    }
  };

  const handleMuteToggle = (stringNum: number) => {
    const strIdx = 6 - stringNum;
    const newFrets = [...currentFrets];
    // Cycle: fret -> open (0) -> muted (-1)
    if (newFrets[strIdx] === -1) {
      newFrets[strIdx] = 0;
      const noteData = getFretNote(stringNum, 0);
      guitarAudio.pluck(noteData.frequency);
    } else {
      newFrets[strIdx] = -1;
    }
    setFretsState(newFrets);
    if (onFretChange) onFretChange(newFrets);
  };

  const triggerStringVibration = (stringNum: number) => {
    setVibratingString(stringNum);
    setTimeout(() => {
      setVibratingString(null);
    }, 400);
  };

  const handleStrum = (direction: 'down' | 'up' = 'down') => {
    const freqs: number[] = [];
    GUITAR_STRINGS.forEach(str => {
      const strIdx = 6 - str.stringNumber;
      const f = currentFrets[strIdx];
      if (f >= 0) {
        const note = getFretNote(str.stringNumber, f);
        freqs.push(note.frequency);
      } else {
        freqs.push(-1);
      }
    });

    guitarAudio.strum(freqs, direction, 28);
    // Vibrate strings in sequence
    GUITAR_STRINGS.forEach((str, i) => {
      setTimeout(() => triggerStringVibration(str.stringNumber), i * 28);
    });
  };

  const loadPresetChord = (chord: ChordVoicing) => {
    setSelectedChordId(chord.id);
    setFretsState(chord.frets);
    if (onFretChange) onFretChange(chord.frets);
    // Strum newly loaded chord
    setTimeout(() => handleStrum('down'), 50);
  };

  const handleBarreChange = (newRoot: NoteName, newShape: 'E-Major' | 'E-Minor' | 'A-Major' | 'A-Minor') => {
    setBarreRoot(newRoot);
    setBarreShape(newShape);
    const chord = calculateBarreChord(newRoot, newShape);
    setFretsState(chord.frets);
    if (onFretChange) onFretChange(chord.frets);
  };

  // String thicknesses
  const stringGauges: Record<number, number> = {
    6: 3.5, // Low E (thick wound)
    5: 2.8, // A (wound)
    4: 2.2, // D (wound)
    3: 1.8, // G
    2: 1.4, // B
    1: 1.1, // High E (thin steel)
  };

  const fretDots = [3, 5, 7, 9, 12, 15];

  return (
    <div className="space-y-4">
      {/* Mode Switcher: Free Explorer vs Speed Quiz */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => setViewMode('explorer')}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
              viewMode === 'explorer'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Fretboard Explorer</span>
          </button>
          <button
            onClick={() => setViewMode('quiz')}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
              viewMode === 'quiz'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
            <span>Interactive Speed Quiz</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Quiz
            </span>
          </button>
        </div>

        {viewMode === 'explorer' ? (
          <button
            onClick={() => setViewMode('quiz')}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/30 flex items-center gap-1.5 transition-all"
          >
            <span>Take Speed Quiz</span>
            <Zap className="w-3.5 h-3.5 fill-current" />
          </button>
        ) : (
          <button
            onClick={() => setViewMode('explorer')}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-medium text-xs border border-stone-700 flex items-center gap-1.5 transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Back to Explorer</span>
          </button>
        )}
      </div>

      {viewMode === 'quiz' ? (
        <FretboardQuiz
          notesNotation={notesNotation}
          rootSa={rootSa}
          onExit={() => setViewMode('explorer')}
        />
      ) : (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          {/* Top Controls: Preset selector, Display Mode, and Strum Action */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-100">
                  {activeChordName || activeChord?.name || 'Interactive Fretboard'}
                </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
              Interactive 6-String
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Click any fret to place a finger and hear its sound. Click the nut to mute/open.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStrum('down')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Strum Down</span>
          </button>
          <button
            onClick={() => handleStrum('up')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs border border-stone-700 transition-all active:scale-95"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Strum Up</span>
          </button>

          {/* Display Mode switcher */}
          <div className="flex items-center bg-stone-950 p-0.5 rounded-lg border border-stone-800 text-xs">
            <button
              onClick={() => setDisplayMode('notes')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                displayMode === 'notes' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => setDisplayMode('intervals')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                displayMode === 'intervals' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Triad Roles
            </button>
            <button
              onClick={() => setDisplayMode('sargam')}
              className={`px-2 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                displayMode === 'sargam' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Show Indian Classical Swaras (Sa Re Ga Ma Pa Dha Ni)"
            >
              <span>Sargam</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Quick Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-stone-500 font-medium text-[11px] uppercase tracking-wider whitespace-nowrap mr-1">
          Common Chords:
        </span>
        {CHORD_DATABASE.slice(0, 8).map(chord => (
          <button
            key={chord.id}
            onClick={() => loadPresetChord(chord)}
            className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all border ${
              selectedChordId === chord.id
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-stone-950/60 text-stone-300 border-stone-800 hover:bg-stone-800 hover:text-white'
            }`}
          >
            {chord.name}
          </button>
        ))}
      </div>

      {/* Realistic Guitar Fretboard Surface */}
      <div className="relative overflow-x-auto rounded-xl border border-stone-800/80 bg-gradient-to-b from-[#241711] via-[#1a110c] to-[#120b08] p-3 sm:p-5 select-none shadow-inner">
        {/* Subtle wood grain background styling */}
        <div className="min-w-[720px] relative">
          {/* Fret number header */}
          <div className="grid grid-cols-[50px_repeat(12,1fr)] gap-0 text-center text-[11px] font-mono font-bold text-stone-500 pb-2">
            <div className="text-amber-500/80">NUT (0)</div>
            {Array.from({ length: showFretLimit }, (_, i) => i + 1).map(fret => (
              <div key={fret} className="flex flex-col items-center">
                <span>{fret}</span>
                {fretDots.includes(fret) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/40 mt-0.5 inline-block" />
                )}
              </div>
            ))}
          </div>

          {/* Strings and Frets Grid */}
          <div className="relative border-l-8 border-stone-300/80 rounded-l-sm bg-black/20 py-2">
            {GUITAR_STRINGS.map(str => {
              const strIdx = 6 - str.stringNumber;
              const currentFret = currentFrets[strIdx];
              const isVibrating = vibratingString === str.stringNumber;
              const gauge = stringGauges[str.stringNumber] || 2;

              return (
                <div
                  key={str.stringNumber}
                  className="grid grid-cols-[50px_repeat(12,1fr)] items-center h-9 relative border-b border-stone-800/40 last:border-b-0"
                >
                  {/* Nut & String Name / Mute Toggle */}
                  <div className="flex items-center justify-center pr-2 border-r-4 border-amber-100/90 bg-stone-950/60 h-full">
                    <button
                      onClick={() => handleMuteToggle(str.stringNumber)}
                      aria-label={`${str.name} string nut status`}
                      className={`w-7 h-7 rounded-md font-bold text-xs flex items-center justify-center transition-all ${
                        currentFret === -1
                          ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                          : currentFret === 0
                          ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                          : 'bg-stone-800 text-stone-400 hover:text-white'
                      }`}
                      title={currentFret === -1 ? 'Muted (X)' : currentFret === 0 ? 'Open String (O)' : 'Fretted'}
                    >
                      {currentFret === -1 ? 'X' : currentFret === 0 ? 'O' : str.name}
                    </button>
                  </div>

                  {/* Physical String Wire running through */}
                  <div
                    className={`absolute left-[50px] right-0 pointer-events-none transition-all duration-150 ${
                      isVibrating ? 'brightness-150 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : ''
                    }`}
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
                  {Array.from({ length: showFretLimit }, (_, i) => i + 1).map(fret => {
                    const noteData = getFretNote(str.stringNumber, fret);
                    const isFretted = currentFret === fret;
                    const isTriadHighlighted =
                      highlightTriadNotes && highlightTriadNotes.includes(noteData.note);

                    let badgeText: string = noteData.note;
                    if (displayMode === 'sargam') {
                      const tonic = activeChord?.root || rootSa || 'C';
                      const swara = getSwaraForNote(noteData.note, tonic);
                      badgeText = swara.shortName;
                    } else if (displayMode === 'intervals' && activeChord) {
                      const root = activeChord.root;
                      const [r, third, fifth] = activeChord.triadNotes;
                      if (noteData.note === root) badgeText = 'Root';
                      else if (noteData.note === third) badgeText = '3rd';
                      else if (noteData.note === fifth) badgeText = '5th';
                    }

                    const hoverText =
                      displayMode === 'sargam'
                        ? getSwaraForNote(noteData.note, activeChord?.root || rootSa || 'C').shortName
                        : noteData.note;

                    return (
                      <div
                        key={fret}
                        onClick={() => handleStringFretClick(str.stringNumber, fret)}
                        className={`h-full relative flex items-center justify-center cursor-pointer group border-r border-stone-600/50 hover:bg-amber-500/10 transition-colors ${
                          fret === 12 ? 'border-r-2 border-stone-400/80' : ''
                        }`}
                      >
                        {/* Fret Wire Metal Bar */}
                        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-stone-400 via-stone-200 to-stone-500 pointer-events-none shadow-sm" />

                        {/* Fret position Dot Marker on neck */}
                        {str.stringNumber === 3 && fretDots.includes(fret) && (
                          <div className="absolute pointer-events-none w-2.5 h-2.5 rounded-full bg-stone-300/15 shadow-inner" />
                        )}

                        {/* Interactive Note Marker / Fingering Bubble */}
                        {isFretted && (
                          <div
                            className={`z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-lg transition-transform animate-in zoom-in-50 duration-150 ${
                              activeChord && noteData.note === activeChord.root
                                ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300'
                                : 'bg-orange-600 text-white border border-orange-400/80'
                            }`}
                          >
                            {badgeText}
                          </div>
                        )}

                        {/* Ghost Preview Marker on Hover */}
                        {!isFretted && (
                          <div
                            className={`opacity-0 group-hover:opacity-100 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold transition-opacity pointer-events-none ${
                              isTriadHighlighted
                                ? 'bg-amber-500/50 text-white'
                                : 'bg-stone-700/80 text-stone-300'
                            }`}
                          >
                            {hoverText}
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

      {/* Active Chord Analysis Banner */}
      {activeChord && (
        <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-amber-300 text-sm">{activeChord.name}</span>
              <span className="text-stone-400">• Triad Notes:</span>
              <div className="flex items-center gap-1 font-mono font-bold">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {activeChord.triadNotes[0]} ({getSwaraForNote(activeChord.triadNotes[0], activeChord.root).shortName} - Root)
                </span>
                <span>+</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeChord.triadNotes[1]} ({getSwaraForNote(activeChord.triadNotes[1], activeChord.root).shortName} - 3rd)
                </span>
                <span>+</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {activeChord.triadNotes[2]} ({getSwaraForNote(activeChord.triadNotes[2], activeChord.root).shortName} - 5th)
                </span>
              </div>
            </div>
            <p className="text-stone-400">{activeChord.description}</p>
            {activeChord.lowEMutedReason && (
              <p className="text-amber-400/90 text-[11px] font-medium">
                💡 <span className="underline">Bass Gravity Rule:</span> {activeChord.lowEMutedReason}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => {
                // Play triad notes in arpeggio
                const triadFreqs = activeChord.triadNotes.map(n => {
                  const f = getFretNote(5, 0); // fallback
                  return f.frequency;
                });
                // Strum chord
                handleStrum('down');
              }}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold border border-stone-700 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
              <span>Play Voicing</span>
            </button>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};

