import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  Play,
  Pause,
  Activity,
  Mic,
  ChevronDown,
  Pin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { metronome, getTempoMarking, TapTempoCalculator } from '../utils/metronome';
import {
  METRONOME_CONFIG,
  METRONOME_TIME_SIGNATURES,
  GUITAR_STRINGS,
} from '../constants';
import { pitchDetector, PitchDetectionResult, micErrorMessage } from '../utils/pitchDetector';
import { guitarAudio } from '../utils/audioSynth';
import { useTimeouts } from './labs/useTimeouts';

const subscribeMetronome = (listener: () => void) => metronome.subscribe(listener);

interface TopMetronomeTunerWidgetProps {
  isMicActive: boolean;
  onToggleMic: () => void;
  /** Opens the full Tuner & Metronome screen. */
  onOpenFull?: () => void;
}

export const TopMetronomeTunerWidget: React.FC<TopMetronomeTunerWidgetProps> = ({
  isMicActive,
  onToggleMic,
  onOpenFull,
}) => {
  // bpm / time signature / running state live in the shared metronome, so this pill and the overlay never drift apart
  const isRunning = useSyncExternalStore(subscribeMetronome, () => metronome.getIsRunning());
  const bpm = useSyncExternalStore(subscribeMetronome, () => metronome.getBpm());
  const timeSignature = useSyncExternalStore(subscribeMetronome, () => metronome.getTimeSignature());
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const { after } = useTimeouts();

  // Tooltip / Popover state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [pitchData, setPitchData] = useState<PitchDetectionResult | null>(null);
  const [tapFeedback, setTapFeedback] = useState<string>('Tap');
  const [micError, setMicError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const tapCalcRef = useRef<TapTempoCalculator>(new TapTempoCalculator());
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const onToggleMicRef = useRef(onToggleMic);
  onToggleMicRef.current = onToggleMic;

  // Sync metronome events
  useEffect(() => {
    const unsubBeat = metronome.onBeat(beatIndex => {
      setActiveBeat(beatIndex);
      after(() => setActiveBeat(-1), 110);
    });

    const unsubState = metronome.onStateChange(running => {
      if (!running) setActiveBeat(-1);
    });

    return () => {
      unsubBeat();
      unsubState();
    };
  }, [after]);

  // A pending hover-close timer must not outlive the widget
  useEffect(
    () => () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    },
    []
  );

  // Listen to pitch detector if mic is active
  useEffect(() => {
    if (!isMicActive) {
      setPitchData(null);
      return;
    }
    setMicError(null);
    let cancelled = false;
    const listener = (data: PitchDetectionResult | null) => setPitchData(data);
    pitchDetector.startListening(listener).then(ok => {
      if (ok || cancelled) return;
      // Permission denied / no microphone: say so and switch the shared mic state back off
      setMicError(micErrorMessage(pitchDetector.getLastError()));
      if (pitchDetector.claimFailure()) onToggleMicRef.current();
    });
    return () => {
      cancelled = true;
      pitchDetector.stopListening(listener);
    };
  }, [isMicActive]);

  // Escape closes the popover and hands focus back to the trigger
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setIsPinned(false);
      setIsOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

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
        ref={triggerRef}
        onClick={() => {
          setIsPinned(prev => !prev);
          setIsOpen(true);
        }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`flex items-center gap-2 px-2.5 sm:px-3 h-9 rounded-xl border text-xs font-bold transition-all shadow-sm ${
          isRunning || isMicActive
            ? 'bg-brand-950/60 border-brand-500/50 text-brand-300 ring-1 ring-brand-500/20'
            : isOpen || isPinned
            ? 'bg-ink-850 border-ink-700 text-ink-200'
            : 'bg-ink-900 border-ink-800 text-ink-300 hover:border-brand-500/40 hover:text-white'
        }`}
        title="Hover to open Quick Metronome & Tuner Settings"
      >
        {/* Metronome Beat LED Indicator */}
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all duration-75 ${
            isRunning
              ? activeBeat === 0
                ? 'bg-brand-400 scale-140 ring-4 ring-brand-400/60 shadow-[0_0_10px_rgba(245,158,11,1)]'
                : 'bg-gold-400 scale-110 ring-2 ring-gold-400/40'
              : 'bg-ink-600'
          }`}
        />

        {/* Metronome Icon & BPM */}
        <div className="flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-brand-400" />
          <span className="font-mono font-extrabold text-[11px] text-ink-100">{bpm}</span>
          <span className="text-[10px] text-ink-400 font-normal">BPM</span>
        </div>

        <span className="text-ink-700 hidden sm:inline">•</span>

        {/* Tuner Indicator */}
        <div className="items-center gap-1 hidden sm:flex">
          <Mic className={`w-3 h-3 ${isMicActive ? 'text-gold-400 animate-pulse' : 'text-ink-500'}`} />
          {isMicActive && pitchData ? (
            <span className="px-1 py-0.2 rounded bg-gold-500/20 text-gold-300 text-[10px] font-mono font-bold">
              {pitchData.note} ({pitchData.cents > 0 ? `+${pitchData.cents}` : pitchData.cents}¢)
            </span>
          ) : (
            <span className="text-[10px] text-ink-400">{isMicActive ? 'Listening' : 'Tuner'}</span>
          )}
        </div>

        <ChevronDown className={`w-3 h-3 text-ink-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Hover Tooltip / Popover Panel ("Tooltip Thingy") */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Metronome and tuner"
          className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-[6.5rem] sm:top-full sm:right-0 sm:mt-2 max-h-[calc(100dvh-8rem)] overflow-y-auto sm:w-96 rounded-2xl bg-ink-950/95 backdrop-blur-2xl border border-ink-800 shadow-2xl p-4 text-ink-100 z-50 animate-in fade-in-50 zoom-in-95 duration-150 space-y-4"
          style={{ boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(245,158,11, 0.15)' }}
        >
          {/* Header of Popover */}
          <div className="flex items-center justify-between border-b border-ink-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-brand-500/10 text-brand-400">
                <Activity className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold text-ink-200">Metronome & Tuner Hub</span>
            </div>

            <div className="flex items-center gap-1">
              {onOpenFull && (
                <button
                  onClick={() => {
                    setIsPinned(false);
                    setIsOpen(false);
                    onOpenFull();
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-brand-300 hover:bg-brand-500/10 transition-colors"
                  title="Open the full Tuner & Metronome screen"
                >
                  <ExternalLink className="w-3 h-3" />
                  Full version
                </button>
              )}
              <button
                onClick={() => setIsPinned(prev => !prev)}
                className={`p-1 rounded-lg text-xs transition-colors ${
                  isPinned ? 'bg-brand-500/20 text-brand-300' : 'text-ink-500 hover:text-ink-300'
                }`}
                title={isPinned ? 'Unpin popover' : 'Pin popover open'}
                aria-label={isPinned ? 'Unpin popover' : 'Pin popover open'}
                aria-pressed={isPinned}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setIsPinned(false);
                  setIsOpen(false);
                }}
                className="p-1 rounded-lg text-ink-500 hover:text-ink-300 text-xs"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Section 1: Metronome Controls */}
          <div className="space-y-3">
            {/* Play/Pause & Big BPM */}
            <div className="bg-ink-900/80 p-3 rounded-xl border border-ink-800 flex items-center justify-between gap-3">
              <button
                onClick={() => metronome.toggle()}
                aria-label={isRunning ? 'Stop metronome' : 'Start metronome'}
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-md transition-all active:scale-95 shrink-0 ${
                  isRunning
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'
                    : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-900/40'
                }`}
              >
                {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <div className="flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono text-white">{bpm}</span>
                  <span className="text-[10px] font-bold text-brand-400 uppercase">BPM</span>
                </div>
                <div className="text-[10px] text-ink-400">
                  <span className="text-brand-300 font-semibold">{tempoMarking.italian}</span> • {tempoMarking.name}
                </div>
              </div>

              {/* Step adjustments */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleBpmChange(bpm - 5)}
                  className="px-1.5 py-1 rounded bg-ink-950 hover:bg-ink-800 border border-ink-800 text-[10px] font-bold text-ink-300"
                >
                  -5
                </button>
                <button
                  onClick={() => handleBpmChange(bpm + 5)}
                  className="px-1.5 py-1 rounded bg-ink-950 hover:bg-ink-800 border border-ink-800 text-[10px] font-bold text-ink-300"
                >
                  +5
                </button>
                <button
                  onClick={handleTapTempo}
                  className="px-2 py-1 rounded bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 text-[10px] font-bold text-brand-300 active:scale-90"
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
              className="w-full h-1.5 bg-ink-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />

            {/* Time Signatures & Beat Dots */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {METRONOME_TIME_SIGNATURES.slice(0, 4).map(ts => (
                  <button
                    key={ts.label}
                    onClick={() => metronome.setTimeSignature(ts)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all border ${
                      timeSignature.label === ts.label
                        ? 'bg-brand-600/30 border-brand-500 text-brand-300'
                        : 'bg-ink-900 border-ink-800 text-ink-400 hover:text-white'
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
                          ? 'bg-brand-400 text-ink-950 scale-125 shadow-[0_0_8px_rgba(245,158,11,1)]'
                          : 'bg-gold-400 text-ink-950 scale-110'
                        : 'bg-ink-800 text-ink-600 border border-ink-700/60'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Quick Tuner & Pitch Readout */}
          <div className="bg-ink-900/90 p-3 rounded-xl border border-ink-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-xs font-bold text-ink-200">Instant Guitar Tuner</span>
              </div>
              <button
                onClick={onToggleMic}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                  isMicActive
                    ? 'bg-red-950/80 border-red-800 text-red-300'
                    : 'bg-gold-950/80 border-gold-800 text-gold-300'
                }`}
              >
                {isMicActive ? 'Turn Off Mic' : 'Activate Mic'}
              </button>
            </div>

            {micError && (
              <p role="alert" className="text-[11px] text-red-300 text-center py-1">
                {micError}
              </p>
            )}

            {/* Pitch Gauge Readout */}
            {isMicActive ? (
              pitchData ? (
                <div className="bg-ink-950 p-2.5 rounded-lg border border-ink-800 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-brand-400">{pitchData.note}</span>
                    <span className="text-[10px] text-ink-400 font-mono ml-1.5">Oct {pitchData.octave}</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-extrabold flex items-center gap-1 ${
                        pitchData.inTune ? 'text-gold-400' : 'text-brand-400'
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
                    <span className="text-[9px] text-ink-500 font-mono">{pitchData.frequency} Hz</span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-ink-500 italic text-center py-2">
                  Pluck a guitar string or hum into microphone...
                </div>
              )
            ) : (
              <div className="text-[11px] text-ink-400 text-center py-1">
                Click "Activate Mic" to detect guitar pitch in real time.
              </div>
            )}

            {/* Quick String Reference Plucks */}
            <div className="pt-1">
              <span className="text-[9px] uppercase font-bold text-ink-500 block mb-1">Hear Reference Pitch:</span>
              <div className="grid grid-cols-6 gap-1">
                {GUITAR_STRINGS.map(s => (
                  <button
                    key={s.stringNumber}
                    onClick={() => guitarAudio.pluck(s.openFrequencyHz, 2.5)}
                    className="p-1 rounded bg-ink-950 hover:bg-ink-850 border border-ink-800 text-center transition-colors"
                    title={`String ${s.stringNumber}: ${s.name} (${s.openFrequencyHz} Hz)`}
                  >
                    <span className="text-[10px] font-black text-brand-300">{s.openNote}</span>
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
