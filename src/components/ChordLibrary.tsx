import React, { useState, useMemo } from 'react';
import {
  Search,
  Volume2,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  ChevronRight,
  Music,
  Sliders,
  Filter,
} from 'lucide-react';
import {
  CHORD_DATABASE,
  ChordVoicing,
  NOTE_NAMES,
  NoteName,
  GUITAR_STRINGS,
  POPULAR_ROOTS,
} from '../constants';
import { getFretNote, getSwaraForNote, shiftSemitones } from '../utils/guitarTheory';
import { guitarAudio } from '../utils/audioSynth';
import { searchChords } from '../utils/chordSearch';

interface ChordLibraryProps {
  notesNotation?: 'western' | 'indian';
}

export const ChordLibrary: React.FC<ChordLibraryProps> = ({ notesNotation = 'western' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoot, setSelectedRoot] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedChordId, setSelectedChordId] = useState<string>('c-major-open');
  const [strumSpeed, setStrumSpeed] = useState<number>(35); // ms between strings
  const [activePlayingString, setActivePlayingString] = useState<number | null>(null);

  // Filter chord database (symbol-aware search: "Am", "A minor", "F#m7", "Bb" ...)
  const filteredChords = useMemo(() => {
    const byFilters = CHORD_DATABASE.filter(chord => {
      if (selectedRoot !== 'All' && chord.root !== selectedRoot) {
        return false;
      }

      if (selectedCategory !== 'All') {
        if (selectedCategory === 'open' && chord.category !== 'open') return false;
        if (selectedCategory === 'barre' && !chord.category.startsWith('barre')) return false;
        if (selectedCategory === 'Major' && chord.type !== 'Major') return false;
        if (selectedCategory === 'Minor' && chord.type !== 'Minor') return false;
        if (selectedCategory === '7th' && !chord.type.includes('7')) return false;
        if (selectedCategory === 'Suspended' && !chord.type.toLowerCase().includes('sus')) return false;
        if (selectedCategory === 'Extended' && !chord.type.match(/(add|9|11|13|dim|aug)/i)) return false;
      }

      return true;
    });
    return searchChords(byFilters, searchQuery);
  }, [searchQuery, selectedRoot, selectedCategory]);

  const selectedChord: ChordVoicing = useMemo(() => {
    return CHORD_DATABASE.find(c => c.id === selectedChordId) || filteredChords[0] || CHORD_DATABASE[0];
  }, [selectedChordId, filteredChords]);

  // Compute neck fret range needed to display chord clearly
  const minFret = useMemo(() => {
    const validFrets = selectedChord.frets.filter(f => f > 0);
    if (validFrets.length === 0) return 0;
    const lowest = Math.min(...validFrets);
    return Math.max(0, lowest > 4 ? lowest - 1 : 0);
  }, [selectedChord]);

  const maxFret = useMemo(() => {
    const validFrets = selectedChord.frets.filter(f => f > 0);
    const highest = validFrets.length ? Math.max(...validFrets) : 3;
    return Math.max(minFret + 4, highest + 1);
  }, [selectedChord, minFret]);

  const fretsToDisplay = useMemo(() => {
    const count = Math.max(5, maxFret - minFret + 1);
    return Array.from({ length: count }, (_, i) => minFret + i);
  }, [minFret, maxFret]);

  // Fret columns drawn after the nut (fret 0 is the nut column itself)
  const neckFrets = useMemo(() => fretsToDisplay.filter(f => f > 0), [fretsToDisplay]);

  // Audio Playback
  const playSingleString = (stringIndex: number) => {
    const fret = selectedChord.frets[stringIndex];
    if (fret === -1) return;
    const stringNumber = 6 - stringIndex; // 0=String 6, 5=String 1
    const { frequency } = getFretNote(stringNumber, fret);
    setActivePlayingString(stringNumber);
    guitarAudio.pluck(frequency, 2.2, 0.85);
    setTimeout(() => setActivePlayingString(null), 300);
  };

  const strumChord = (direction: 'down' | 'up' = 'down') => {
    const freqs: number[] = [];
    selectedChord.frets.forEach((fret, idx) => {
      const stringNumber = 6 - idx;
      if (fret >= 0) {
        freqs.push(getFretNote(stringNumber, fret).frequency);
      } else {
        freqs.push(-1);
      }
    });

    guitarAudio.strum(freqs, direction, strumSpeed);
  };

  const arpeggiateChord = () => {
    const validIndices: number[] = [];
    selectedChord.frets.forEach((f, idx) => {
      if (f >= 0) validIndices.push(idx);
    });

    validIndices.forEach((idx, step) => {
      setTimeout(() => {
        const stringNumber = 6 - idx;
        const fret = selectedChord.frets[idx];
        const { frequency } = getFretNote(stringNumber, fret);
        setActivePlayingString(stringNumber);
        guitarAudio.pluck(frequency, 1.8, 0.85);
        setTimeout(() => setActivePlayingString(null), 250);
      }, step * 220);
    });
  };

  // Finger badge colors
  const getFingerBadge = (fingerNum?: number) => {
    switch (fingerNum) {
      case 1:
        return { label: '1', name: 'Index', bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-400' };
      case 2:
        return { label: '2', name: 'Middle', bg: 'bg-gold-500', text: 'text-white', border: 'border-gold-400' };
      case 3:
        return { label: '3', name: 'Ring', bg: 'bg-brand-500', text: 'text-ink-950', border: 'border-brand-400' };
      case 4:
        return { label: '4', name: 'Pinky', bg: 'bg-red-500', text: 'text-white', border: 'border-red-400' };
      default:
        return null;
    }
  };

  const categories = [
    { id: 'All', label: 'All Chords' },
    { id: 'open', label: 'Open' },
    { id: 'barre', label: 'Barre' },
    { id: 'Major', label: 'Major' },
    { id: 'Minor', label: 'Minor' },
    { id: '7th', label: '7th / Jazz' },
    { id: 'Suspended', label: 'Suspended' },
    { id: 'Extended', label: 'Extended' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Search */}
      <div className="bg-ink-900/90 border border-ink-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 font-mono text-xs font-bold border border-brand-500/30">
                PRO CHORD LAB
              </span>
              <h1 className="text-2xl font-extrabold text-ink-100 tracking-tight">
                Virtual Guitar Chord Library
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-ink-300 mt-1 max-w-2xl">
              Explore 40+ precision chord voicings with <strong className="text-brand-300">exact finger positioning (1-4)</strong>, open/muted string acoustics, and Indian Sargam harmonic mapping.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chord (e.g. C, Am, G7, Dsus4)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-950 border border-ink-800 text-ink-100 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all placeholder:text-ink-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Categories */}
        <div className="flex items-center gap-2 pt-4 border-t border-ink-800/80 mt-4 overflow-x-auto scrollbar-none pb-1">
          <span className="text-[11px] font-bold uppercase text-ink-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3 text-brand-400" />
            Category:
          </span>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-brand-600 text-white border-brand-500 shadow-md ring-1 ring-brand-400/30'
                  : 'bg-ink-950/70 text-ink-400 border-ink-800 hover:text-white hover:bg-ink-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Root Selector Pills */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold uppercase text-ink-400 shrink-0 mr-1">
            Root:
          </span>
          <button
            onClick={() => setSelectedRoot('All')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
              selectedRoot === 'All'
                ? 'bg-brand-600 text-white border-brand-500'
                : 'bg-ink-950 text-ink-400 border-ink-800 hover:text-white'
            }`}
          >
            All
          </button>
          {NOTE_NAMES.map(root => (
            <button
              key={root}
              onClick={() => setSelectedRoot(root)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                selectedRoot === root
                  ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                  : 'bg-ink-950 text-ink-400 border-ink-800 hover:text-white'
              }`}
            >
              {root}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Chord List & Virtual Neck Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filtered Chord Voicings (4 cols) */}
        <div className="lg:col-span-4 bg-ink-900/90 border border-ink-800/90 rounded-2xl p-4 shadow-xl flex flex-col h-[640px]">
          <div className="flex items-center justify-between pb-3 border-b border-ink-800">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">
              Matching Voicings ({filteredChords.length})
            </span>
            <span className="text-[11px] text-brand-400 font-mono font-semibold">
              Select to inspect
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
            {filteredChords.length === 0 ? (
              <div className="text-center py-12 text-ink-500 text-xs">
                No chords match your current filters.
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRoot('All');
                    setSelectedCategory('All');
                  }}
                  className="block mx-auto mt-3 px-3 py-1 rounded-lg bg-ink-800 text-brand-400 font-bold hover:bg-ink-700"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredChords.map(chord => {
                const isSelected = chord.id === selectedChord.id;
                return (
                  <div
                    key={chord.id}
                    onClick={() => setSelectedChordId(chord.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-brand-600/15 border-brand-500 shadow-md ring-1 ring-brand-500/30'
                        : 'bg-ink-950/60 border-ink-800 hover:bg-ink-950 hover:border-ink-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-ink-100 group-hover:text-brand-300">
                          {chord.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                          chord.category.startsWith('barre')
                            ? 'bg-violet-950/80 text-violet-300 border border-violet-800/50'
                            : 'bg-gold-950/80 text-gold-300 border border-gold-800/50'
                        }`}>
                          {chord.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-ink-400 mt-1">
                        <span>Bass: <strong className="text-ink-300">{chord.bassNote}</strong></span>
                        <span>•</span>
                        <span>Triad: [{chord.triadNotes.join(', ')}]</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChordId(chord.id);
                        strumChord('down');
                      }}
                      className="p-2 rounded-lg bg-ink-900 border border-ink-800 text-ink-400 hover:text-brand-400 hover:border-brand-500/40 transition-colors"
                      title="Quick Preview"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Virtual Guitar Neck & Finger Visualizer (8 cols) */}
        <div className="lg:col-span-8 bg-ink-900/90 border border-ink-800/90 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
          {/* Chord Title & Quick Strum Audio Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-ink-800/80">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-ink-100 tracking-tight">
                  {selectedChord.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-brand-500/10 text-brand-300 text-xs font-mono font-bold border border-brand-500/30">
                  {selectedChord.type}
                </span>
                {selectedChord.barreFret && (
                  <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-xs font-mono font-bold border border-violet-500/30">
                    Barre Fret {selectedChord.barreFret}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-400 mt-1">
                {selectedChord.description}
              </p>
            </div>

            {/* Audio Plucking Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => strumChord('down')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Strum Down</span>
              </button>

              <button
                onClick={() => strumChord('up')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink-950 border border-ink-800 hover:border-brand-500/40 text-ink-200 text-xs font-bold active:scale-95 transition-all"
              >
                <span>Strum Up</span>
              </button>

              <button
                onClick={arpeggiateChord}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink-950 border border-ink-800 hover:border-brand-500/40 text-brand-300 text-xs font-bold active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Arpeggio</span>
              </button>
            </div>
          </div>

          {/* VIRTUAL GUITAR NECK VISUALIZER: horizontal, nut on the left, body on the right */}
          <div className="bg-[#0f1424] border border-ink-800/90 rounded-2xl p-3 sm:p-5 shadow-inner relative select-none">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pb-3 mb-3 border-b border-ink-800">
              <div className="text-[11px] font-mono font-bold text-ink-400">
                NUT <span className="text-ink-600">◀</span> headstock side · body side <span className="text-ink-600">▶</span>
              </div>
              <div className="text-[11px] text-ink-500">
                Tap a string to hear it · <span className="text-gold-400">O</span> open · <span className="text-red-400">X</span> muted
              </div>
            </div>

            <div style={{ '--nut-w': '3.5rem', '--cols': neckFrets.length } as React.CSSProperties}>
              {/* Fret numbers */}
              <div className="grid mb-1" style={{ gridTemplateColumns: 'var(--nut-w) repeat(var(--cols), minmax(0, 1fr))' }}>
                <div className="text-[10px] font-mono font-bold text-ink-500 text-center">
                  {neckFrets[0] > 1 ? `Fret ${neckFrets[0]}+` : 'Nut'}
                </div>
                {neckFrets.map(fretNum => (
                  <div key={fretNum} className="text-center text-[10px] font-mono font-bold text-ink-500">
                    {fretNum}
                  </div>
                ))}
              </div>

              {/* The fretboard: high E on top, low E on the bottom (same as tab) */}
              <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-[#141a2c] to-[#0f1424]">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0f8a82_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                {/* Barre overlay */}
                {selectedChord.barreFret && neckFrets.includes(selectedChord.barreFret) && (
                  <div
                    className="absolute z-20 pointer-events-none top-1 bottom-1 flex items-center justify-center"
                    style={{
                      left: `calc(var(--nut-w) + ${neckFrets.indexOf(selectedChord.barreFret)} * ((100% - var(--nut-w)) / var(--cols)) + 8%)`,
                      width: 'calc(((100% - var(--nut-w)) / var(--cols)) * 0.84)',
                    }}
                  >
                    <div className="w-5 h-full rounded-full bg-violet-500/35 border-2 border-violet-400 shadow-lg" />
                  </div>
                )}

                {[5, 4, 3, 2, 1, 0].map(sIdx => {
                  const stringNumber = 6 - sIdx;
                  const strDef = GUITAR_STRINGS.find(s => s.stringNumber === stringNumber)!;
                  const targetFret = selectedChord.frets[sIdx];
                  const finger = selectedChord.fingers ? selectedChord.fingers[sIdx] : 0;
                  const fingerBadge = getFingerBadge(finger);
                  const isMuted = targetFret === -1;
                  const isOpen = targetFret === 0;
                  const isPlaying = activePlayingString === stringNumber;
                  const gauge = [4, 3.5, 3, 2.5, 2, 1.5][sIdx];

                  return (
                    <div
                      key={sIdx}
                      className="grid h-10 sm:h-11 items-stretch"
                      style={{ gridTemplateColumns: 'var(--nut-w) repeat(var(--cols), minmax(0, 1fr))' }}
                    >
                      {/* Nut cell: string name + open / muted state */}
                      <button
                        type="button"
                        onClick={() => playSingleString(sIdx)}
                        aria-label={`${strDef.name} string, ${isMuted ? 'muted' : isOpen ? 'open' : `fret ${targetFret}`}`}
                        className={`relative z-10 flex items-center justify-center gap-1 border-r-[6px] border-ink-200/90 bg-ink-950/70 text-xs font-mono font-black ${
                          isMuted ? 'text-red-400' : isOpen ? 'text-gold-300' : 'text-ink-500'
                        }`}
                      >
                        <span className="text-[10px] text-ink-400">{strDef.openNote}</span>
                        <span className="w-4 text-center">{isMuted ? 'X' : isOpen ? 'O' : ''}</span>
                      </button>

                      {neckFrets.map(fretNum => {
                        const isFrettedHere = targetFret === fretNum;
                        const noteData = getFretNote(stringNumber, fretNum);
                        const isRoot = noteData.note === selectedChord.root;

                        return (
                          <div
                            key={fretNum}
                            onClick={() => playSingleString(sIdx)}
                            className="relative flex items-center justify-center cursor-pointer group/string border-r-2 border-ink-500/60"
                          >
                            {sIdx === 2 && [3, 5, 7, 9, 12, 15].includes(fretNum) && (
                              <div className="absolute -bottom-0 translate-y-1/2 w-3 h-3 rounded-full bg-ink-400/20 border border-ink-400/40 pointer-events-none" />
                            )}
                            <div
                              className={`absolute left-0 right-0 transition-colors ${
                                isPlaying
                                  ? 'bg-brand-400 shadow-[0_0_8px_#1aa89b]'
                                  : 'bg-ink-400/70 group-hover/string:bg-ink-200'
                              }`}
                              style={{ height: `${gauge}px` }}
                            />
                            {isFrettedHere && (
                              <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex flex-col items-center justify-center shadow-lg z-30 border ${
                                  isRoot
                                    ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-ink-950 border-brand-300 ring-2 ring-brand-400/50'
                                    : fingerBadge
                                    ? `${fingerBadge.bg} ${fingerBadge.text} ${fingerBadge.border}`
                                    : 'bg-ink-100 text-ink-950 border-ink-300'
                                }`}
                              >
                                <span className="text-[10px] sm:text-[11px] font-black leading-none">{noteData.note}</span>
                                {finger > 0 && (
                                  <span className="text-[8px] sm:text-[9px] font-extrabold leading-none opacity-90 mt-0.5">
                                    F{finger}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              {selectedChord.barreFret && (
                <p className="mt-2 text-[11px] text-violet-300 font-mono">
                  Barre: lay finger 1 flat across fret {selectedChord.barreFret}
                </p>
              )}
            </div>
          </div>

          {/* Finger Number Legend & Acoustic Reason breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Left Hand Finger Guide */}
            <div className="bg-ink-950/70 border border-ink-800/80 rounded-xl p-3.5 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                Left-Hand Finger Guide
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-violet-950/50 border border-violet-800/50">
                  <span className="text-xs font-black text-violet-300 block">1</span>
                  <span className="text-[10px] text-ink-300">Index</span>
                </div>
                <div className="p-2 rounded-lg bg-gold-950/50 border border-gold-800/50">
                  <span className="text-xs font-black text-gold-300 block">2</span>
                  <span className="text-[10px] text-ink-300">Middle</span>
                </div>
                <div className="p-2 rounded-lg bg-brand-950/50 border border-brand-800/50">
                  <span className="text-xs font-black text-brand-300 block">3</span>
                  <span className="text-[10px] text-ink-300">Ring</span>
                </div>
                <div className="p-2 rounded-lg bg-red-950/50 border border-red-800/50">
                  <span className="text-xs font-black text-red-300 block">4</span>
                  <span className="text-[10px] text-ink-300">Pinky</span>
                </div>
              </div>
            </div>

            {/* Indian Sargam & Harmonic Breakdown */}
            <div className="bg-ink-950/70 border border-ink-800/80 rounded-xl p-3.5 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-400 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-brand-400" />
                Indian Sargam Harmonization
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedChord.triadNotes.map((note, idx) => {
                  const swara = getSwaraForNote(note, selectedChord.root);
                  return (
                    <div
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-ink-900 border border-ink-800 flex items-center gap-1.5 text-xs"
                    >
                      <span className="font-extrabold text-brand-300">{swara.shortName}</span>
                      <span className="text-ink-400">({note})</span>
                      <span className="text-[10px] text-ink-500 font-mono">[{swara.westernInterval}]</span>
                    </div>
                  );
                })}
              </div>
              {selectedChord.lowEMutedReason && (
                <p className="text-[11px] text-ink-400 italic pt-1 border-t border-ink-800/60">
                  💡 {selectedChord.lowEMutedReason}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
