import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Play,
  Pause,
  Sparkles,
  HelpCircle,
  Layers,
  Music,
  Check,
  Sun,
  Moon,
  Clock,
  Heart,
  Sliders,
  ChevronRight,
  Headphones,
} from 'lucide-react';
import {
  INDIAN_SWARAS,
  INDIAN_THAATS,
  INDIAN_RAAGAS,
  IndianRaaga,
  NoteName,
  NOTE_NAMES,
  GUITAR_STRINGS,
} from '../constants';
import { getFretNote, getSemitoneDistance, shiftSemitones } from '../utils/guitarTheory';
import { guitarAudio } from '../utils/audioSynth';

interface IndianSwarasExplorerProps {
  rootSa?: NoteName;
  onSetRootSa?: (root: NoteName) => void;
  notesNotation: 'western' | 'indian';
  onToggleNotation: (mode: 'western' | 'indian') => void;
}

export const IndianSwarasExplorer: React.FC<IndianSwarasExplorerProps> = ({
  rootSa = 'C',
  onSetRootSa,
  notesNotation,
  onToggleNotation,
}) => {
  const [activeTab, setActiveTab] = useState<'raagas' | 'swaras' | 'thaats'>('raagas');
  const [selectedRaagaId, setSelectedRaagaId] = useState<string>('raag-yaman');
  const [activeSwaraOffset, setActiveSwaraOffset] = useState<number | null>(null);
  const [isDronePlaying, setIsDronePlaying] = useState<boolean>(false);
  const [isPlayingScale, setIsPlayingScale] = useState<boolean>(false);
  const droneIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const selectedRaaga: IndianRaaga =
    INDIAN_RAAGAS.find(r => r.id === selectedRaagaId) || INDIAN_RAAGAS[0];

  const getFreqForOffset = (semitoneOffset: number, octaveBase: number = 130.81) => {
    const rootIdx = NOTE_NAMES.indexOf(rootSa);
    const totalSemitones = rootIdx + semitoneOffset;
    return octaveBase * Math.pow(2, totalSemitones / 12);
  };

  const playSwara = (semitoneOffset: number, duration: number = 2.0) => {
    setActiveSwaraOffset(semitoneOffset);
    const freq = getFreqForOffset(semitoneOffset, 196.0); // G3/C4 range for bright clarity
    guitarAudio.pluck(freq, duration, 0.9);
    setTimeout(() => setActiveSwaraOffset(null), 400);
  };

  const playSwaraByName = (swaraName: string, duration: number = 1.8) => {
    const swara = INDIAN_SWARAS.find(s => s.shortName === swaraName);
    if (swara) {
      playSwara(swara.semitoneOffset, duration);
    }
  };

  // Play ascending Arohana or descending Avarohana
  const playRaagaPassage = (swaraList: string[]) => {
    if (isPlayingScale) return;
    setIsPlayingScale(true);

    swaraList.forEach((swaraName, idx) => {
      setTimeout(() => {
        playSwaraByName(swaraName, 1.6);
        if (idx === swaraList.length - 1) {
          setTimeout(() => setIsPlayingScale(false), 500);
        }
      }, idx * 420);
    });
  };

  // Acoustic Tanpura Drone (Sa + Pa pulsing gently in background)
  useEffect(() => {
    if (isDronePlaying) {
      const playDronePulse = () => {
        const saFreq = getFreqForOffset(0, 130.81); // Root Sa low drone
        const paFreq = getFreqForOffset(7, 130.81); // Pa Perfect 5th
        guitarAudio.pluck(saFreq, 3.8, 0.4);
        setTimeout(() => {
          guitarAudio.pluck(paFreq, 3.5, 0.35);
        }, 1200);
      };

      playDronePulse();
      droneIntervalRef.current = setInterval(playDronePulse, 2800);
    } else {
      if (droneIntervalRef.current) {
        clearInterval(droneIntervalRef.current);
        droneIntervalRef.current = null;
      }
    }

    return () => {
      if (droneIntervalRef.current) {
        clearInterval(droneIntervalRef.current);
      }
    };
  }, [isDronePlaying, rootSa]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-ink-900 via-ink-900/95 to-brand-950/20 border border-ink-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 font-mono text-xs font-bold border border-brand-500/20">
                EASTERN HARMONY
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-ink-100 tracking-tight">
                Indian Classical Raagas & Sargam Mechanics
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-ink-300 mt-2 max-w-2xl leading-relaxed">
              Explore the rich melodic universe of Indian Raagas on guitar. Understand the acoustic logic of <strong className="text-red-400">Komal (less/flat)</strong> and <strong className="text-gold-400">Teevra (extra/sharp)</strong> notes, and play Arohana/Avarohana with an authentic Sa-Pa Tanpura drone.
            </p>
          </div>

          {/* Controls: Tanpura Drone & Notation Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Tanpura Drone Toggle */}
            <button
              onClick={() => setIsDronePlaying(prev => !prev)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shadow-md active:scale-95 ${
                isDronePlaying
                  ? 'bg-brand-600 text-white border-brand-400 ring-2 ring-brand-400/30 animate-pulse'
                  : 'bg-ink-950 text-ink-300 border-ink-800 hover:border-brand-500/40 hover:text-white'
              }`}
            >
              <Headphones className="w-3.5 h-3.5 text-brand-300" />
              <span>{isDronePlaying ? 'Tanpura Drone Active' : 'Start Sa-Pa Drone'}</span>
            </button>

            {/* Notation Toggle */}
            <button
              onClick={() => onToggleNotation(notesNotation === 'western' ? 'indian' : 'western')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink-950 border border-ink-800 text-xs font-bold text-ink-200 hover:border-ink-700"
            >
              <span className="text-[10px] text-brand-400 font-bold uppercase">Notation:</span>
              <span className="font-extrabold text-brand-300">
                {notesNotation === 'western' ? 'Western (C D E)' : 'Sargam (Sa Re Ga)'}
              </span>
            </button>
          </div>
        </div>

        {/* Tab switcher: Raagas Library / 12 Swaras Soundboard / 10 Thaats */}
        <div className="flex items-center gap-2 pt-4 border-t border-ink-800/80 mt-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('raagas')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'raagas'
                ? 'bg-brand-600 text-white border-brand-500 shadow-md ring-1 ring-brand-400/30'
                : 'bg-ink-950 text-ink-400 border-ink-800 hover:text-white'
            }`}
          >
            Classical Raagas Library ({INDIAN_RAAGAS.length})
          </button>
          <button
            onClick={() => setActiveTab('swaras')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'swaras'
                ? 'bg-brand-600 text-white border-brand-500 shadow-md ring-1 ring-brand-400/30'
                : 'bg-ink-950 text-ink-400 border-ink-800 hover:text-white'
            }`}
          >
            The 12 Swaras Soundboard ("Less" & "Extra")
          </button>
          <button
            onClick={() => setActiveTab('thaats')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'thaats'
                ? 'bg-brand-600 text-white border-brand-500 shadow-md ring-1 ring-brand-400/30'
                : 'bg-ink-950 text-ink-400 border-ink-800 hover:text-white'
            }`}
          >
            The 10 Parent Thaats (Modal Framework)
          </button>
        </div>
      </div>

      {/* TAB 1: CLASSICAL RAAGAS EXPLORER */}
      {activeTab === 'raagas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Raaga Selector Sidebar (4 cols) */}
            <div className="lg:col-span-4 bg-ink-900/90 border border-ink-800/90 rounded-2xl p-4 shadow-xl flex flex-col h-[680px]">
              <div className="flex items-center justify-between pb-3 border-b border-ink-800">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">
                  Select Raaga ({INDIAN_RAAGAS.length})
                </span>
                <span className="text-[11px] font-mono text-brand-400 font-semibold">
                  Key Sa = {rootSa}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
                {INDIAN_RAAGAS.map(raaga => {
                  const isSelected = raaga.id === selectedRaaga.id;
                  return (
                    <div
                      key={raaga.id}
                      onClick={() => setSelectedRaagaId(raaga.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'bg-brand-600/15 border-brand-500 shadow-md ring-1 ring-brand-500/30'
                          : 'bg-ink-950/60 border-ink-800 hover:bg-ink-950 hover:border-ink-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-ink-100 group-hover:text-brand-300">
                            {raaga.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-ink-400 mt-0.5">
                          <span>{raaga.thaat}</span>
                          <span className="mx-1">•</span>
                          <span className="text-brand-400/90">{raaga.timeOfDay}</span>
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-brand-400 translate-x-1' : 'text-ink-600'}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Raaga Detailed Workspace (8 cols) */}
            <div className="lg:col-span-8 bg-ink-900/90 border border-ink-800/90 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
              {/* Raaga Title & Meta */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-ink-800">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black text-ink-100">
                        {selectedRaaga.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 text-xs font-mono font-bold border border-brand-500/30">
                        {selectedRaaga.thaat}
                      </span>
                    </div>
                    <p className="text-xs text-ink-400 mt-1 max-w-xl">
                      {selectedRaaga.description}
                    </p>
                  </div>

                  {/* Mood & Time Pill */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-ink-950 border border-ink-800 text-ink-300 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-brand-400" />
                      {selectedRaaga.timeOfDay}
                    </span>
                    <span className="text-[11px] text-brand-400/90 font-medium flex items-center gap-1">
                      <Heart className="w-3 h-3 text-red-400" />
                      Rasa: {selectedRaaga.mood}
                    </span>
                  </div>
                </div>

                {/* Vadi & Samvadi Sonic Pillars */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-ink-950/70 border border-ink-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ink-400 block">Vadi (King Note)</span>
                      <span className="text-lg font-black text-brand-300">{selectedRaaga.vadi}</span>
                    </div>
                    <button
                      onClick={() => playSwaraByName(selectedRaaga.vadi, 2.5)}
                      className="p-2 rounded-lg bg-ink-900 text-ink-400 hover:text-brand-300 border border-ink-800"
                      title="Pluck Vadi Note"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-ink-950/70 border border-ink-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ink-400 block">Samvadi (Queen Note)</span>
                      <span className="text-lg font-black text-violet-300">{selectedRaaga.samvadi}</span>
                    </div>
                    <button
                      onClick={() => playSwaraByName(selectedRaaga.samvadi, 2.5)}
                      className="p-2 rounded-lg bg-ink-900 text-ink-400 hover:text-violet-300 border border-ink-800"
                      title="Pluck Samvadi Note"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Arohana (Ascent) & Avarohana (Descent) Interactive Audio Strips */}
              <div className="space-y-4">
                {/* Arohana (Ascending) */}
                <div className="p-4 rounded-xl bg-ink-950 border border-ink-800/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                      <span>▲</span> Arohana (Ascending Scale)
                    </span>
                    <button
                      disabled={isPlayingScale}
                      onClick={() => playRaagaPassage(selectedRaaga.arohana)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gold-950/60 border border-gold-500/40 text-gold-300 hover:bg-gold-900/60 text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play Arohana</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedRaaga.arohana.map((swaraName, idx) => {
                      const isKomal = swaraName === 're' || swaraName === 'ga' || swaraName === 'dha' || swaraName === 'ni';
                      const isTeevra = swaraName === 'Ma';
                      return (
                        <button
                          key={idx}
                          onClick={() => playSwaraByName(swaraName, 2.0)}
                          className={`px-3 py-2 rounded-xl text-sm font-extrabold border active:scale-95 transition-all flex flex-col items-center justify-center min-w-[52px] ${
                            isKomal
                              ? 'bg-red-950/50 text-red-300 border-red-800/60 hover:bg-red-900/60'
                              : isTeevra
                              ? 'bg-gold-950/50 text-gold-300 border-gold-800/60 hover:bg-gold-900/60'
                              : 'bg-ink-900 text-ink-100 border-ink-800 hover:bg-ink-800'
                          }`}
                        >
                          <span>{swaraName}</span>
                          <span className="text-[9px] text-ink-400 font-normal">
                            {isKomal ? 'Komal' : isTeevra ? 'Teevra' : 'Shuddha'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Avarohana (Descending) */}
                <div className="p-4 rounded-xl bg-ink-950 border border-ink-800/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                      <span>▼</span> Avarohana (Descending Scale)
                    </span>
                    <button
                      disabled={isPlayingScale}
                      onClick={() => playRaagaPassage(selectedRaaga.avarohana)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play Avarohana</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedRaaga.avarohana.map((swaraName, idx) => {
                      const isKomal = swaraName === 're' || swaraName === 'ga' || swaraName === 'dha' || swaraName === 'ni';
                      const isTeevra = swaraName === 'Ma';
                      return (
                        <button
                          key={idx}
                          onClick={() => playSwaraByName(swaraName, 2.0)}
                          className={`px-3 py-2 rounded-xl text-sm font-extrabold border active:scale-95 transition-all flex flex-col items-center justify-center min-w-[52px] ${
                            isKomal
                              ? 'bg-red-950/50 text-red-300 border-red-800/60 hover:bg-red-900/60'
                              : isTeevra
                              ? 'bg-gold-950/50 text-gold-300 border-gold-800/60 hover:bg-gold-900/60'
                              : 'bg-ink-900 text-ink-100 border-ink-800 hover:bg-ink-800'
                          }`}
                        >
                          <span>{swaraName}</span>
                          <span className="text-[9px] text-ink-400 font-normal">
                            {isKomal ? 'Komal' : isTeevra ? 'Teevra' : 'Shuddha'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Single String Fretboard Position Guide */}
              <div className="bg-ink-950/70 border border-ink-800 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-brand-400" />
                  Guitar String Fret Positions (Single-String Indian Sitar/Meend Technique)
                </span>
                <p className="text-xs text-ink-400 leading-relaxed">
                  Indian classical music on guitar is often played along a single string to allow microtonal sliding (<strong className="text-brand-300">Meend / Gamak</strong>). If your open High E string is tuned as Sa:
                </p>

                <div className="grid grid-cols-7 sm:grid-cols-12 gap-1.5 pt-2">
                  {Array.from(new Set([...selectedRaaga.arohana, ...selectedRaaga.avarohana])).map((swaraName: string, i: number) => {
                    const swara = INDIAN_SWARAS.find(s => s.shortName === swaraName);
                    const fret = swara ? swara.semitoneOffset : i;
                    return (
                      <div
                        key={i}
                        onClick={() => playSwaraByName(swaraName, 2.0)}
                        className="p-2 rounded-lg bg-ink-900 border border-ink-800 text-center cursor-pointer hover:border-brand-500/40 transition-colors"
                      >
                        <span className="text-xs font-black text-brand-300 block">{swaraName}</span>
                        <span className="text-[10px] text-ink-400 font-mono">Fret {fret}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 12 SWARAS SOUNDBOARD */}
      {activeTab === 'swaras' && (
        <div className="space-y-6">
          {/* The 3 Fundamental Rules of Swaras */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rule 1: Achala Swaras */}
            <div className="bg-ink-900/90 border border-ink-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-brand-500/40 transition-all">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-sm mb-3 border border-brand-500/20">
                ⚓
              </div>
              <h3 className="font-extrabold text-ink-100 text-base">Achala Swaras (Fixed)</h3>
              <span className="text-xs font-mono text-brand-400 font-bold block mt-0.5">Sa (Root) & Pa (5th)</span>
              <p className="text-xs text-ink-400 mt-2 leading-relaxed">
                <strong className="text-ink-200">Sa</strong> and <strong className="text-ink-200">Pa</strong> are immovable. They <em>never</em> have sharp or flat variants. Just like the Perfect 5th in our Triad Code, they form the rock-solid outer walls of music.
              </p>
            </div>

            {/* Rule 2: Komal Swaras */}
            <div className="bg-ink-900/90 border border-ink-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-red-500/40 transition-all">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-sm mb-3 border border-red-500/20">
                🔻
              </div>
              <h3 className="font-extrabold text-ink-100 text-base">Komal Swaras ("Less" / Lower)</h3>
              <span className="text-xs font-mono text-red-400 font-bold block mt-0.5">re, ga, dha, ni (Flat Notes)</span>
              <p className="text-xs text-ink-400 mt-2 leading-relaxed">
                "Komal" translates to soft or delicate. When Re, Ga, Dha, or Ni are dropped by <strong className="text-red-300">1 fret (-1 semitone)</strong>, they become "less" (Komal). <strong className="text-ink-200">Komal Ga</strong> is what turns a happy Major chord into a sad Minor chord!
              </p>
            </div>

            {/* Rule 3: Teevra Swara */}
            <div className="bg-ink-900/90 border border-ink-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-gold-500/40 transition-all">
              <div className="w-8 h-8 rounded-xl bg-gold-500/10 text-gold-400 flex items-center justify-center font-bold text-sm mb-3 border border-gold-500/20">
                🔺
              </div>
              <h3 className="font-extrabold text-ink-100 text-base">Teevra Swara ("Extra" / Higher)</h3>
              <span className="text-xs font-mono text-gold-400 font-bold block mt-0.5">Ma (Teevra Madhyam, #4)</span>
              <p className="text-xs text-ink-400 mt-2 leading-relaxed">
                <strong className="text-ink-200">Madhyam (Ma)</strong> is the only swara in Indian music that goes "extra / higher" (+1 semitone)! It never goes lower (there is no Komal Ma); instead, shifting 1 fret higher creates <strong className="text-gold-300">Teevra Ma (Augmented 4th)</strong>.
              </p>
            </div>
          </div>

          {/* Interactive 12 Swaras Table & Soundboard */}
          <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-ink-100 flex items-center gap-2">
                  <span>Interactive 12-Swara Saptak Soundboard</span>
                  <span className="text-xs font-normal text-ink-400">(Key Sa = {rootSa})</span>
                </h3>
                <p className="text-xs text-ink-400">
                  Click any swara card to hear its guitar frequency and inspect its interval physics:
                </p>
              </div>

              {onSetRootSa && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-ink-400 font-medium">Tonic Sa:</span>
                  {(['C', 'D', 'E', 'G', 'A'] as NoteName[]).map(r => (
                    <button
                      key={r}
                      onClick={() => onSetRootSa(r)}
                      className={`w-7 h-7 rounded-lg font-bold border transition-all ${
                        rootSa === r
                          ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                          : 'bg-ink-950 text-ink-400 border-ink-800 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {INDIAN_SWARAS.map(swara => {
                const rootIdx = NOTE_NAMES.indexOf(rootSa);
                const actualWesternNote = NOTE_NAMES[(rootIdx + swara.semitoneOffset) % 12];
                const isPlaying = activeSwaraOffset === swara.semitoneOffset;

                let badgeColor = 'bg-ink-800 text-ink-300 border-ink-700';
                if (swara.type === 'Achala') badgeColor = 'bg-brand-500/20 text-brand-300 border-brand-500/30';
                else if (swara.type === 'Komal') badgeColor = 'bg-red-500/20 text-red-300 border-red-500/30';
                else if (swara.type === 'Teevra') badgeColor = 'bg-gold-500/20 text-gold-300 border-gold-500/30';

                return (
                  <button
                    key={swara.semitoneOffset}
                    onClick={() => playSwara(swara.semitoneOffset)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-between transition-all group active:scale-95 text-left relative overflow-hidden ${
                      isPlaying
                        ? 'bg-brand-600/30 border-brand-500 ring-2 ring-brand-500 shadow-lg'
                        : 'bg-ink-950 border-ink-800 hover:border-ink-700 hover:bg-ink-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-mono font-bold text-ink-400">+{swara.semitoneOffset} st</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badgeColor}`}>
                        {swara.type}
                      </span>
                    </div>

                    <div className="my-2 text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-xl font-black text-ink-100 group-hover:text-brand-300 transition-colors">
                          {swara.shortName}
                        </span>
                        <span className="text-[10px] font-semibold text-ink-400">
                          ({swara.type === 'Komal' ? 'Less' : swara.type === 'Teevra' ? 'Extra' : swara.type === 'Achala' ? 'Fixed' : 'Pure'})
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-brand-400/90 block mt-0.5">
                        {actualWesternNote}
                      </span>
                    </div>

                    <div className="w-full text-center border-t border-ink-800/80 pt-1.5">
                      <span className="text-[10px] text-ink-400 font-medium block truncate">
                        {swara.westernInterval}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: THE 10 PARENT THAATS */}
      {activeTab === 'thaats' && (
        <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-400" />
            <h3 className="text-base font-bold text-ink-100">
              The 10 Indian Thaats (Musical Scale Frameworks)
            </h3>
          </div>
          <p className="text-xs text-ink-400">
            In Hindustani classical music, Pandit Vishnu Narayan Bhatkhande organized all classical melodies under 10 parent scales called "Thaats". Notice the direct parallel to Western Church Modes!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {INDIAN_THAATS.map(thaat => (
              <div
                key={thaat.name}
                className="bg-ink-950 border border-ink-800/90 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-brand-500/30 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-ink-100 text-sm">{thaat.name}</h4>
                      <span className="text-[11px] text-brand-400/90 font-medium">{thaat.mood}</span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-ink-900 border border-ink-800 text-ink-300">
                      {thaat.westernEquivalent}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2.5">
                    {thaat.swaras.map((s, i) => {
                      const isKomal = s === 're' || s === 'ga' || s === 'dha' || s === 'ni';
                      const isTeevra = s === 'Ma';
                      return (
                        <span
                          key={i}
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            isKomal
                              ? 'bg-red-950 text-red-300 border border-red-800/60'
                              : isTeevra
                              ? 'bg-gold-950 text-gold-300 border border-gold-800/60'
                              : 'bg-ink-800 text-ink-200'
                          }`}
                        >
                          {s}
                        </span>
                      );
                    })}
                  </div>

                  <p className="text-xs text-ink-400 mt-2 leading-relaxed">
                    {thaat.description}
                  </p>
                </div>

                <button
                  onClick={() => playRaagaPassage(thaat.swaras)}
                  className="w-full py-2 rounded-xl bg-ink-900 hover:bg-ink-800 text-ink-200 text-xs font-bold border border-ink-800 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <Play className="w-3 h-3 fill-current text-brand-400" />
                  <span>Play {thaat.name} Scale</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
