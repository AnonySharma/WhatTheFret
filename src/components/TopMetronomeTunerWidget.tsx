import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Activity,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sliders,
  ChevronDown,
  Pin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { metronome, getTempoMarking, TapTempoCalculator } from '../utils/metronome';
import {
  METRONOME_CONFIG,
  METRONOME_TIME_SIGNATURES,
  type TimeSignatureDef,
  GUITAR_STRINGS,
} from '../constants';
import { pitchDetector, PitchDetectionResult } from '../utils/pitchDetector';
import { guitarAudio } from '../utils/audioSynth';

interface TopMetronomeTunerWidgetProps {
  isMicActive: boolean;
  onToggleMic: () => void;
}

export const TopMetronomeTunerWidget: React.FC<TopMetronomeTunerWidgetProps> = ({
  isMicActive,
  onToggleMic,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(metronome.getIsRunning());
  const [bpm, setBpm] = useState<number>(metronome.getBpm());
  const [timeSignature, setTimeSignature] = useState<TimeSignatureDef>(metronome.getTimeSignature());
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const [volume, setVolume] = useState<number>(metronome.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(metronome.getIsMuted());

  // Tooltip / Popover state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [pitchData, setPitchData] = useState<PitchDetectionResult | null>(null);
  const [tapFeedback, setTapFeedback] = useState<string>('Tap');

  const containerRef = useRef<HTMLDivElement>(null);
  const tapCalcRef = useRef<TapTempoCalculator>(new TapTempoCalculator());
  const closeTimeoutRef = useRef<number | null>(null);

  // Sync metronome events
  useEffect(() => {
    const unsubBeat = metronome.onBeat((beatIndex, _total, isDownbeat) => {
      setActiveBeat(beatIndex);
      setTimeout(() => setActiveBeat(-1), 110);
    });

    const unsubState = metronome.onStateChange(running => {
      setIsRunning(running);
      if (!running) setActiveBeat(-1);
    });

    return () => {
      unsubBeat();
      unsubState();
    };
  }, []);

  // Listen to pitch detector if mic is active
  useEffect(() => {
    if (isMicActive) {
      pitchDetector.startListening(data => {
        setPitchData(data);
      });
    } else {
      setPitchData(null);
    }
  }, [isMicActive]);

  // Click outside to close if not pinned
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!isPinned) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPinned]);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      closeTimeoutRef.current = window.setTimeout(() => {
        setIsOpen(false);
      }, 350);
    }
  };

  const handleBpmChange = (newBpm: number) => {
    const clamped = Math.max(METRONOME_CONFIG.MIN_BPM, Math.min(METRONOME_CONFIG.MAX_BPM, newBpm));
    setBpm(clamped);
    metronome.setBpm(clamped);
  };

  const handleTapTempo = () => {
    const calculated = tapCalcRef.current.recordTap();
    if (calculated !== null) {
      handleBpmChange(calculated);
      setTapFeedback(`${calculated}`);
    } else {
      setTapFeedback('Tap again');
    }
  };

  const tempoMarking = getTempoMarking(bpm);

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative shrink-0"
    >
      {/* Top Bar Trigger Button - Compact, polished HUD Pill */}
      <button
        onClick={() => {
          setIsPinned(prev => !prev);
          setIsOpen(true);
        }}
        className={`flex items-center gap-2 px-2.5 sm:px-3 h-9 rounded-xl border text-xs font-bold transition-all shadow-sm ${
          isRunning || isMicActive
            ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/20'
            : isOpen || isPinned
            ? 'bg-stone-850 border-stone-700 text-stone-200'
            : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-amber-500/40 hover:text-white'
        }`}
        title="Hover to open Quick Metronome & Tuner Settings"
      >
        {/* Metronome Beat LED Indicator */}
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all duration-75 ${
            isRunning
              ? activeBeat === 0
                ? 'bg-amber-400 scale-140 ring-4 ring-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,1)]'
                : 'bg-emerald-400 scale-110 ring-2 ring-emerald-400/40'
              : 'bg-stone-600'
          }`}
        />

        {/* Metronome Icon & BPM */}
        <div className="flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono font-extrabold text-[11px] text-stone-100">{bpm}</span>
          <span className="text-[10px] text-stone-400 font-normal">BPM</span>
        </div>

        <span className="text-stone-700 hidden sm:inline">•</span>

        {/* Tuner Indicator */}
        <div className="items-center gap-1 hidden sm:flex">
          <Mic className={`w-3 h-3 ${isMicActive ? 'text-emerald-400 animate-pulse' : 'text-stone-500'}`} />
          {isMicActive && pitchData ? (
            <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
              {pitchData.note} ({pitchData.cents > 0 ? `+${pitchData.cents}` : pitchData.cents}¢)
            </span>
          ) : (
            <span className="text-[10px] text-stone-400">{isMicActive ? 'Listening' : 'Tuner'}</span>
          )}
        </div>

        <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Hover Tooltip / Popover Panel ("Tooltip Thingy") */}
      {isOpen && (
        <div
          className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-[6.5rem] sm:top-full sm:right-0 sm:mt-2 max-h-[calc(100dvh-8rem)] overflow-y-auto sm:w-96 rounded-2xl bg-stone-950/95 backdrop-blur-2xl border border-stone-800 shadow-2xl p-4 text-stone-100 z-50 animate-in fade-in-50 zoom-in-95 duration-150 space-y-4"
          style={{ boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(245, 158, 11, 0.15)' }}
        >
          {/* Header of Popover */}
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-400">
                <Activity className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold text-stone-200">Metronome & Tuner Hub</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPinned(prev => !prev)}
                className={`p-1 rounded-lg text-xs transition-colors ${
                  isPinned ? 'bg-amber-500/20 text-amber-300' : 'text-stone-500 hover:text-stone-300'
                }`}
                title={isPinned ? 'Unpin popover' : 'Pin popover open'}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setIsPinned(false);
                  setIsOpen(false);
                }}
                className="p-1 rounded-lg text-stone-500 hover:text-stone-300 text-xs"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Section 1: Metronome Controls */}
          <div className="space-y-3">
            {/* Play/Pause & Big BPM */}
            <div className="bg-stone-900/80 p-3 rounded-xl border border-stone-800 flex items-center justify-between gap-3">
              <button
                onClick={() => metronome.toggle()}
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-md transition-all active:scale-95 shrink-0 ${
                  isRunning
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40'
                }`}
              >
                {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <div className="flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono text-white">{bpm}</span>
                  <span className="text-[10px] font-bold text-amber-400 uppercase">BPM</span>
                </div>
                <div className="text-[10px] text-stone-400">
                  <span className="text-amber-300 font-semibold">{tempoMarking.italian}</span> • {tempoMarking.name}
                </div>
              </div>

              {/* Step adjustments */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleBpmChange(bpm - 5)}
                  className="px-1.5 py-1 rounded bg-stone-950 hover:bg-stone-800 border border-stone-800 text-[10px] font-bold text-stone-300"
                >
                  -5
                </button>
                <button
                  onClick={() => handleBpmChange(bpm + 5)}
                  className="px-1.5 py-1 rounded bg-stone-950 hover:bg-stone-800 border border-stone-800 text-[10px] font-bold text-stone-300"
                >
                  +5
                </button>
                <button
                  onClick={handleTapTempo}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-[10px] font-bold text-amber-300 active:scale-90"
                >
                  {tapFeedback}
                </button>
              </div>
            </div>

            {/* BPM Slider */}
            <input
              type="range"
              min={METRONOME_CONFIG.MIN_BPM}
              max={METRONOME_CONFIG.MAX_BPM}
              value={bpm}
              onChange={e => handleBpmChange(Number(e.target.value))}
              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />

            {/* Time Signatures & Beat Dots */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {METRONOME_TIME_SIGNATURES.slice(0, 4).map(ts => (
                  <button
                    key={ts.label}
                    onClick={() => {
                      setTimeSignature(ts);
                      metronome.setTimeSignature(ts);
                    }}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all border ${
                      timeSignature.label === ts.label
                        ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                    }`}
                  >
                    {ts.label}
                  </button>
                ))}
              </div>

              {/* Beat LED Dots */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: timeSignature.beats }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-75 flex items-center justify-center text-[8px] font-black ${
                      activeBeat === i
                        ? i === 0
                          ? 'bg-amber-400 text-stone-950 scale-125 shadow-[0_0_8px_rgba(245,158,11,1)]'
                          : 'bg-emerald-400 text-stone-950 scale-110'
                        : 'bg-stone-800 text-stone-600 border border-stone-700/60'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Quick Tuner & Pitch Readout */}
          <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-stone-200">Instant Guitar Tuner</span>
              </div>
              <button
                onClick={onToggleMic}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                  isMicActive
                    ? 'bg-red-950/80 border-red-800 text-red-300'
                    : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                }`}
              >
                {isMicActive ? 'Turn Off Mic' : 'Activate Mic'}
              </button>
            </div>

            {/* Pitch Gauge Readout */}
            {isMicActive ? (
              pitchData ? (
                <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-amber-400">{pitchData.note}</span>
                    <span className="text-[10px] text-stone-400 font-mono ml-1.5">Oct {pitchData.octave}</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-extrabold flex items-center gap-1 ${
                        pitchData.inTune ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {pitchData.inTune ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> In Tune
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          {pitchData.cents > 0 ? `+${pitchData.cents}¢ Sharp` : `${pitchData.cents}¢ Flat`}
                        </>
                      )}
                    </span>
                    <span className="text-[9px] text-stone-500 font-mono">{pitchData.frequency} Hz</span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-stone-500 italic text-center py-2">
                  Pluck a guitar string or hum into microphone...
                </div>
              )
            ) : (
              <div className="text-[11px] text-stone-400 text-center py-1">
                Click "Activate Mic" to detect guitar pitch in real time.
              </div>
            )}

            {/* Quick String Reference Plucks */}
            <div className="pt-1">
              <span className="text-[9px] uppercase font-bold text-stone-500 block mb-1">Hear Reference Pitch:</span>
              <div className="grid grid-cols-6 gap-1">
                {GUITAR_STRINGS.map(s => (
                  <button
                    key={s.stringNumber}
                    onClick={() => guitarAudio.pluck(s.openFrequencyHz, 2.5)}
                    className="p-1 rounded bg-stone-950 hover:bg-stone-850 border border-stone-800 text-center transition-colors"
                    title={`String ${s.stringNumber}: ${s.name} (${s.openFrequencyHz} Hz)`}
                  >
                    <span className="text-[10px] font-black text-amber-300">{s.openNote}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
