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

  // Filter chord database
  const filteredChords = useMemo(() => {
    return CHORD_DATABASE.filter(chord => {
      // Root filter
      if (selectedRoot !== 'All' && chord.root !== selectedRoot) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'open' && chord.category !== 'open') return false;
        if (selectedCategory === 'barre' && !chord.category.startsWith('barre')) return false;
        if (selectedCategory === 'Major' && chord.type !== 'Major') return false;
        if (selectedCategory === 'Minor' && chord.type !== 'Minor') return false;
        if (selectedCategory === '7th' && !chord.type.includes('7')) return false;
        if (selectedCategory === 'Suspended' && !chord.type.toLowerCase().includes('sus')) return false;
        if (selectedCategory === 'Extended' && !chord.type.match(/(add|9|11|13|dim|aug)/i)) return false;
      }

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = chord.name.toLowerCase().includes(q);
        const matchesRoot = chord.root.toLowerCase() === q;
        const matchesType = chord.type.toLowerCase().includes(q);
        const matchesTriad = chord.triadNotes.some(n => n.toLowerCase() === q);
        return matchesName || matchesRoot || matchesType || matchesTriad;
      }

      return true;
    });
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
        return { label: '1', name: 'Index', bg: 'bg-sky-500', text: 'text-white', border: 'border-sky-400' };
      case 2:
        return { label: '2', name: 'Middle', bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-400' };
      case 3:
        return { label: '3', name: 'Ring', bg: 'bg-amber-500', text: 'text-stone-950', border: 'border-amber-400' };
      case 4:
        return { label: '4', name: 'Pinky', bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-400' };
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
      <div className="bg-stone-900/90 border border-stone-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono text-xs font-bold border border-amber-500/30">
                PRO CHORD LAB
              </span>
              <h1 className="text-2xl font-extrabold text-stone-100 tracking-tight">
                Virtual Guitar Chord Library
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
              Explore 40+ precision chord voicings with <strong className="text-amber-300">exact finger positioning (1-4)</strong>, open/muted string acoustics, and Indian Sargam harmonic mapping.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chord (e.g. C, Am, G7, Dsus4)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-stone-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Categories */}
        <div className="flex items-center gap-2 pt-4 border-t border-stone-800/80 mt-4 overflow-x-auto scrollbar-none pb-1">
          <span className="text-[11px] font-bold uppercase text-stone-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3 text-amber-400" />
            Category:
          </span>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-1 ring-amber-400/30'
                  : 'bg-stone-950/70 text-stone-400 border-stone-800 hover:text-white hover:bg-stone-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Root Selector Pills */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold uppercase text-stone-400 shrink-0 mr-1">
            Root:
          </span>
          <button
            onClick={() => setSelectedRoot('All')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
              selectedRoot === 'All'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-white'
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
                  ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-white'
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
        <div className="lg:col-span-4 bg-stone-900/90 border border-stone-800/90 rounded-2xl p-4 shadow-xl flex flex-col h-[640px]">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Matching Voicings ({filteredChords.length})
            </span>
            <span className="text-[11px] text-amber-400 font-mono font-semibold">
              Select to inspect
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
            {filteredChords.length === 0 ? (
              <div className="text-center py-12 text-stone-500 text-xs">
                No chords match your current filters.
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRoot('All');
                    setSelectedCategory('All');
                  }}
                  className="block mx-auto mt-3 px-3 py-1 rounded-lg bg-stone-800 text-amber-400 font-bold hover:bg-stone-700"
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
                        ? 'bg-amber-600/15 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-stone-950/60 border-stone-800 hover:bg-stone-950 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-stone-100 group-hover:text-amber-300">
                          {chord.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                          chord.category.startsWith('barre')
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                        }`}>
                          {chord.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-1">
                        <span>Bass: <strong className="text-stone-300">{chord.bassNote}</strong></span>
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
                      className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
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
        <div className="lg:col-span-8 bg-stone-900/90 border border-stone-800/90 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
          {/* Chord Title & Quick Strum Audio Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-800/80">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-stone-100 tracking-tight">
                  {selectedChord.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-xs font-mono font-bold border border-amber-500/30">
                  {selectedChord.type}
                </span>
                {selectedChord.barreFret && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-mono font-bold border border-purple-500/30">
                    Barre Fret {selectedChord.barreFret}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-1">
                {selectedChord.description}
              </p>
            </div>

            {/* Audio Plucking Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => strumChord('down')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Strum Down</span>
              </button>

              <button
                onClick={() => strumChord('up')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 hover:border-amber-500/40 text-stone-200 text-xs font-bold active:scale-95 transition-all"
              >
                <span>Strum Up</span>
              </button>

              <button
                onClick={arpeggiateChord}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 hover:border-amber-500/40 text-amber-300 text-xs font-bold active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Arpeggio</span>
              </button>
            </div>
          </div>

          {/* VIRTUAL GUITAR NECK VISUALIZER */}
          <div className="bg-[#121316] border border-stone-800/90 rounded-2xl p-6 shadow-inner relative select-none">
            {/* Visual Headstock Nut Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-800">
              <div className="text-[11px] font-mono font-bold text-stone-400">
                NUT STATUS (O = Ring Open, X = Muted)
              </div>
              <div className="text-[11px] text-stone-500">
                Click any string or fret to pluck sound
              </div>
            </div>

            {/* Nut Row: O / X indicators for each string */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {[0, 1, 2, 3, 4, 5].map(sIdx => {
                const fret = selectedChord.frets[sIdx];
                const stringNumber = 6 - sIdx;
                const strDef = GUITAR_STRINGS.find(s => s.stringNumber === stringNumber)!;
                const isMuted = fret === -1;
                const isOpen = fret === 0;

                return (
                  <div
                    key={sIdx}
                    onClick={() => playSingleString(sIdx)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer transition-all ${
                      isMuted
                        ? 'bg-red-950/20 border-red-900/40 text-red-400'
                        : isOpen
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-950/40'
                        : 'bg-stone-900/40 border-stone-800 text-stone-500'
                    }`}
                  >
                    <span className="text-base font-black font-mono">
                      {isMuted ? 'X' : isOpen ? 'O' : `F${fret}`}
                    </span>
                    <span className="text-[10px] font-bold mt-0.5">
                      {strDef.name}
                    </span>
                    <span className="text-[9px] text-stone-400">
                      {isMuted ? 'Muted' : isOpen ? 'Open' : `Fret ${fret}`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* The Fretboard Grid */}
            <div className="relative border-t-4 border-stone-300 rounded-b-xl overflow-hidden bg-gradient-to-b from-[#1a1815] to-[#121110]">
              {/* Wood Grain Texture line effect */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              {/* Barre Finger Bracket Overlay if chord is a barre */}
              {selectedChord.barreFret && (
                <div
                  className="absolute z-20 pointer-events-none transition-all flex items-center justify-center"
                  style={{
                    top: `${((selectedChord.barreFret - minFret) / fretsToDisplay.length) * 100}%`,
                    left: '4%',
                    right: '4%',
                    height: `${100 / fretsToDisplay.length}%`,
                  }}
                >
                  <div className="w-full h-7 rounded-full bg-purple-500/40 border-2 border-purple-400 shadow-lg flex items-center justify-center backdrop-blur-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-200">
                      Barre Finger 1 Across Fret {selectedChord.barreFret}
                    </span>
                  </div>
                </div>
              )}

              {/* Fret Rows */}
              {fretsToDisplay.map((fretNum) => {
                const isFretMarker = [3, 5, 7, 9, 12, 15].includes(fretNum);
                const isDoubleMarker = fretNum === 12;

                return (
                  <div
                    key={fretNum}
                    className="relative border-b-2 border-stone-600/70 h-16 flex items-center justify-between px-2 group"
                  >
                    {/* Fret wire shadow effect */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-400/80 shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />

                    {/* Fret Number Label on left side */}
                    <div className="absolute -left-1 text-[10px] font-mono font-bold text-stone-500 pl-2 pointer-events-none">
                      {fretNum > 0 ? `F${fretNum}` : 'Nut'}
                    </div>

                    {/* Pearl Inlay Dot Marker */}
                    {isFretMarker && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {isDoubleMarker ? (
                          <div className="flex gap-4">
                            <div className="w-3.5 h-3.5 rounded-full bg-stone-400/20 border border-stone-400/40 shadow-inner" />
                            <div className="w-3.5 h-3.5 rounded-full bg-stone-400/20 border border-stone-400/40 shadow-inner" />
                          </div>
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-stone-400/20 border border-stone-400/40 shadow-inner" />
                        )}
                      </div>
                    )}

                    {/* 6 String columns across this fret */}
                    <div className="w-full grid grid-cols-6 h-full items-center z-10">
                      {[0, 1, 2, 3, 4, 5].map(sIdx => {
                        const stringNumber = 6 - sIdx;
                        const targetFret = selectedChord.frets[sIdx];
                        const finger = selectedChord.fingers ? selectedChord.fingers[sIdx] : 0;
                        const isFrettedHere = targetFret === fretNum;
                        const noteData = getFretNote(stringNumber, fretNum);
                        const isRoot = noteData.note === selectedChord.root;
                        const isPlaying = activePlayingString === stringNumber;
                        const fingerBadge = getFingerBadge(finger);

                        // String thickness gauge
                        const stringGaugeHeight = [4, 3.5, 3, 2.5, 2, 1.5][sIdx];

                        return (
                          <div
                            key={sIdx}
                            onClick={() => playSingleString(sIdx)}
                            className="relative h-full flex items-center justify-center cursor-pointer group/string"
                          >
                            {/* Guitar String Line */}
                            <div
                              className={`absolute left-0 right-0 transition-colors ${
                                isPlaying
                                  ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                                  : 'bg-stone-400/70 group-hover/string:bg-stone-200'
                              }`}
                              style={{ height: `${stringGaugeHeight}px` }}
                            />

                            {/* Fretted Dot with Finger Number */}
                            {isFrettedHere && (
                              <div
                                className={`w-8 h-8 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform transform hover:scale-110 z-30 border ${
                                  isRoot
                                    ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 border-amber-300 ring-2 ring-amber-400/50'
                                    : fingerBadge
                                    ? `${fingerBadge.bg} ${fingerBadge.text} ${fingerBadge.border}`
                                    : 'bg-stone-100 text-stone-950 border-stone-300'
                                }`}
                              >
                                <span className="text-[11px] font-black leading-none">
                                  {noteData.note}
                                </span>
                                {finger > 0 && (
                                  <span className="text-[9px] font-extrabold leading-none opacity-90 mt-0.5">
                                    F{finger}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Finger Legend & String Labels */}
            <div className="grid grid-cols-6 gap-2 mt-4 pt-3 border-t border-stone-800 text-center">
              {GUITAR_STRINGS.map((str, idx) => (
                <div key={str.stringNumber} className="text-stone-400 text-[10px] font-mono">
                  <div className="font-bold text-stone-200">Str {str.stringNumber}</div>
                  <div className="text-amber-400 font-extrabold">{str.openNote}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Finger Number Legend & Acoustic Reason breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Left Hand Finger Guide */}
            <div className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-3.5 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Left-Hand Finger Guide
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-sky-950/50 border border-sky-800/50">
                  <span className="text-xs font-black text-sky-300 block">1</span>
                  <span className="text-[10px] text-stone-300">Index</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-800/50">
                  <span className="text-xs font-black text-emerald-300 block">2</span>
                  <span className="text-[10px] text-stone-300">Middle</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-800/50">
                  <span className="text-xs font-black text-amber-300 block">3</span>
                  <span className="text-[10px] text-stone-300">Ring</span>
                </div>
                <div className="p-2 rounded-lg bg-rose-950/50 border border-rose-800/50">
                  <span className="text-xs font-black text-rose-300 block">4</span>
                  <span className="text-[10px] text-stone-300">Pinky</span>
                </div>
              </div>
            </div>

            {/* Indian Sargam & Harmonic Breakdown */}
            <div className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-3.5 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                Indian Sargam Harmonization
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedChord.triadNotes.map((note, idx) => {
                  const swara = getSwaraForNote(note, selectedChord.root);
                  return (
                    <div
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 flex items-center gap-1.5 text-xs"
                    >
                      <span className="font-extrabold text-amber-300">{swara.shortName}</span>
                      <span className="text-stone-400">({note})</span>
                      <span className="text-[10px] text-stone-500 font-mono">[{swara.westernInterval}]</span>
                    </div>
                  );
                })}
              </div>
              {selectedChord.lowEMutedReason && (
                <p className="text-[11px] text-stone-400 italic pt-1 border-t border-stone-800/60">
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
