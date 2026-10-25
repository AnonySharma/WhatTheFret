import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Sparkles,
  Music,
  Activity,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  METRONOME_CONFIG,
  METRONOME_TIME_SIGNATURES,
  type TimeSignatureDef,
  type TempoMarking,
} from '../constants';
import { metronome, getTempoMarking, TapTempoCalculator } from '../utils/metronome';

interface MetronomeOverlayProps {
  isDocked?: boolean;
  onClose?: () => void;
}

export const MetronomeOverlay: React.FC<MetronomeOverlayProps> = ({
  isDocked = false,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(metronome.getIsRunning());
  const [bpm, setBpm] = useState<number>(metronome.getBpm());
  const [timeSignature, setTimeSignature] = useState<TimeSignatureDef>(metronome.getTimeSignature());
  const [volume, setVolume] = useState<number>(metronome.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(metronome.getIsMuted());

  // Active beat animation state
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const [isDownbeat, setIsDownbeat] = useState<boolean>(false);
  const [tapFeedback, setTapFeedback] = useState<string>('Tap Tempo');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const tapCalcRef = useRef<TapTempoCalculator>(new TapTempoCalculator());
  const tapTimeoutRef = useRef<number | null>(null);

  // Sync state listeners with metronome engine
  useEffect(() => {
    const unsubBeat = metronome.onBeat((beatIndex, _totalBeats, downbeat) => {
      setActiveBeat(beatIndex);
      setIsDownbeat(downbeat);
      // Quick reset after 120ms so pulse is snappy
      setTimeout(() => {
        setActiveBeat(-1);
      }, 120);
    });

    const unsubState = metronome.onStateChange(running => {
      setIsRunning(running);
      if (!running) {
        setActiveBeat(-1);
      }
    });

    return () => {
      unsubBeat();
      unsubState();
    };
  }, []);

  const handleTogglePlay = () => {
    metronome.toggle();
  };

  const handleBpmChange = (newBpm: number) => {
    const clamped = Math.max(METRONOME_CONFIG.MIN_BPM, Math.min(METRONOME_CONFIG.MAX_BPM, newBpm));
    setBpm(clamped);
    metronome.setBpm(clamped);
  };

  const handleAdjustBpm = (delta: number) => {
    handleBpmChange(bpm + delta);
  };

  const handleTimeSignatureSelect = (ts: TimeSignatureDef) => {
    setTimeSignature(ts);
    metronome.setTimeSignature(ts);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    metronome.setVolume(newVol);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    metronome.setMuted(next);
  };

  const handleTapTempo = () => {
    const calculated = tapCalcRef.current.recordTap();
    if (calculated !== null) {
      handleBpmChange(calculated);
      setTapFeedback(`${calculated} BPM`);
    } else {
      setTapFeedback('Tap again...');
    }

    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = window.setTimeout(() => {
      setTapFeedback('Tap Tempo');
      tapCalcRef.current.reset();
    }, 2500);
  };

  const tempoMarking: TempoMarking = getTempoMarking(bpm);

  return (
    <div
      className={`bg-ink-900 border border-ink-800 rounded-2xl shadow-2xl transition-all overflow-hidden ${
        isDocked
          ? 'w-full'
          : 'border-brand-500/30 ring-1 ring-brand-500/20 backdrop-blur-md bg-ink-900/95'
      }`}
    >
      {/* Header bar */}
      <div className="bg-ink-950/80 px-4 py-3 border-b border-ink-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full transition-all duration-100 ${
              isRunning
                ? activeBeat === 0
                  ? 'bg-brand-400 ring-4 ring-brand-400/50 shadow-[0_0_12px_rgba(245,158,11,1)]'
                  : 'bg-gold-400 ring-2 ring-gold-400/40'
                : 'bg-ink-600'
            }`}
          />
          <h3 className="font-bold text-sm text-ink-100 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-brand-400" />
            <span>Precision Rhythm Metronome</span>
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink-800 text-ink-300 border border-ink-700 font-mono">
            {timeSignature.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1 rounded-lg text-ink-400 hover:text-ink-200 hover:bg-ink-800 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-ink-400 hover:text-ink-200 hover:bg-ink-800 transition-colors"
              title="Close Metronome"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Top Row: Big BPM display, Markings, and Play Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-ink-950/60 p-4 rounded-xl border border-ink-800">
            {/* Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold shadow-xl transition-all active:scale-95 shrink-0 ${
                isRunning
                  ? 'bg-gradient-to-br from-red-600 to-red-700 text-white ring-4 ring-red-500/20 shadow-red-900/30'
                  : 'bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 hover:from-brand-400 hover:to-brand-600 text-white shadow-brand-900/40 ring-4 ring-brand-500/20'
              }`}
              title={isRunning ? 'Stop Metronome' : 'Start Metronome'}
            >
              {isRunning ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-0.5" />
              )}
            </button>

            {/* Large BPM Readout */}
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-4xl sm:text-5xl font-black text-ink-100 tracking-tight font-mono">
                  {bpm}
                </span>
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">BPM</span>
              </div>
              <div className="text-xs text-ink-400 mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
                <span className="font-semibold text-brand-300">{tempoMarking.italian}</span>
                <span>•</span>
                <span>{tempoMarking.name}</span>
              </div>
            </div>

            {/* Quick Adjustment & Tap Tempo */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-end">
              <button
                onClick={() => handleAdjustBpm(-5)}
                className="px-2.5 py-1.5 rounded-lg bg-ink-900 hover:bg-ink-800 border border-ink-800 text-xs font-bold text-ink-300 active:scale-95"
                title="Decrease 5 BPM"
              >
                -5
              </button>
              <button
                onClick={() => handleAdjustBpm(-1)}
                className="px-2 py-1.5 rounded-lg bg-ink-900 hover:bg-ink-800 border border-ink-800 text-xs font-bold text-ink-300 active:scale-95"
                title="Decrease 1 BPM"
              >
                -1
              </button>
              <button
                onClick={() => handleAdjustBpm(1)}
                className="px-2 py-1.5 rounded-lg bg-ink-900 hover:bg-ink-800 border border-ink-800 text-xs font-bold text-ink-300 active:scale-95"
                title="Increase 1 BPM"
              >
                +1
              </button>
              <button
                onClick={() => handleAdjustBpm(5)}
                className="px-2.5 py-1.5 rounded-lg bg-ink-900 hover:bg-ink-800 border border-ink-800 text-xs font-bold text-ink-300 active:scale-95"
                title="Increase 5 BPM"
              >
                +5
              </button>
              <button
                onClick={handleTapTempo}
                className="px-3 py-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/40 text-brand-300 text-xs font-bold active:scale-90 transition-all shadow-sm"
              >
                {tapFeedback}
              </button>
            </div>
          </div>

          {/* Precision BPM Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-ink-400 font-medium">
              <span>{METRONOME_CONFIG.MIN_BPM} BPM (Largo)</span>
              <span>Tempo Slider</span>
              <span>{METRONOME_CONFIG.MAX_BPM} BPM (Presto)</span>
            </div>
            <input
              type="range"
              min={METRONOME_CONFIG.MIN_BPM}
              max={METRONOME_CONFIG.MAX_BPM}
              value={bpm}
              onChange={e => handleBpmChange(Number(e.target.value))}
              className="w-full h-2 bg-ink-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
          </div>

          {/* Visual Beat Dots / LED Pendulum Indicators */}
          <div className="bg-ink-950 p-3 rounded-xl border border-ink-800 flex flex-col items-center justify-center space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              Live Rhythm Pulse ({timeSignature.beats} Beats per measure)
            </span>

            <div className="flex items-center justify-center gap-3 py-1">
              {Array.from({ length: timeSignature.beats }).map((_, i) => {
                const isCurrent = activeBeat === i;
                const isAccent = timeSignature.accents.includes(i);
                const isDown = i === 0;

                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-75 ${
                        isCurrent
                          ? isDown
                            ? 'bg-brand-400 text-ink-950 scale-125 ring-4 ring-brand-400/60 shadow-[0_0_15px_rgba(245,158,11,1)]'
                            : isAccent
                            ? 'bg-gold-500 text-white scale-115 ring-2 ring-gold-400/50 shadow-[0_0_10px_rgba(249,115,22,0.8)]'
                            : 'bg-gold-400 text-ink-950 scale-110 ring-2 ring-gold-300/40 shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                          : isDown
                          ? 'bg-brand-950/40 border border-brand-600/40 text-brand-500/80'
                          : 'bg-ink-800/80 text-ink-500 border border-ink-700/60'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className="text-[9px] font-mono text-ink-500">
                      {isDown ? 'Down' : isAccent ? 'Acc' : 'Beat'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Signature Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
              Time Signature Meter:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {METRONOME_TIME_SIGNATURES.map(ts => {
                const isSelected = timeSignature.label === ts.label;
                return (
                  <button
                    key={ts.label}
                    onClick={() => handleTimeSignatureSelect(ts)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-brand-600/20 border-brand-500 text-brand-300 ring-1 ring-brand-500 font-bold shadow-sm'
                        : 'bg-ink-950 border-ink-800 text-ink-400 hover:text-ink-200 hover:bg-ink-800'
                    }`}
                  >
                    <div className="text-sm font-extrabold">{ts.label}</div>
                    <div className="text-[9px] text-ink-400 truncate mt-0.5">{ts.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Controls: Audio Volume and Mute Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-ink-800/80 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isMuted
                    ? 'bg-red-950/60 border-red-800 text-red-400'
                    : 'bg-ink-800 border-ink-700 text-ink-300 hover:text-white'
                }`}
                title={isMuted ? 'Unmute Audio Click' : 'Mute Click (Silent Visual Metronome)'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="text-ink-400 text-[11px]">
                {isMuted ? 'Muted (Visual Pulse Only)' : 'Sound Enabled'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-ink-500 text-[10px]">Volume:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={e => handleVolumeChange(Number(e.target.value))}
                className="w-20 sm:w-28 h-1.5 bg-ink-800 rounded-lg appearance-none accent-brand-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
