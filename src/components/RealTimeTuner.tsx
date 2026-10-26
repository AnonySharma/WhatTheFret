import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, CheckCircle2, AlertCircle, Award, Target, Activity } from 'lucide-react';
import { pitchDetector, PitchDetectionResult, noteFrequency, micErrorMessage } from '../utils/pitchDetector';
import { GUITAR_STRINGS, NoteName } from '../utils/guitarTheory';
import { guitarAudio } from '../utils/audioSynth';
import { MetronomeOverlay } from './MetronomeOverlay';
import { celebrate } from '../utils/celebrate';

interface RealTimeTunerProps {
  isMicActive: boolean;
  onToggleMic: () => void;
}

export const RealTimeTuner: React.FC<RealTimeTunerProps> = ({ isMicActive, onToggleMic }) => {
  const [pitchData, setPitchData] = useState<PitchDetectionResult | null>(null);
  const [selectedStringIndex, setSelectedStringIndex] = useState<number>(0); // 0 = String 6 Low E
  const [challengeTargetNote, setChallengeTargetNote] = useState<NoteName>('E');
  const [challengeStreak, setChallengeStreak] = useState<number>(0);
  const [challengeSuccess, setChallengeSuccess] = useState<boolean>(false);
  const [showMetronome, setShowMetronome] = useState<boolean>(true);
  const [micError, setMicError] = useState<string | null>(null);
  const successTimeoutRef = useRef<number | null>(null);
  const onToggleMicRef = useRef(onToggleMic);
  onToggleMicRef.current = onToggleMic;

  // Sync mic detector state
  useEffect(() => {
    if (!isMicActive) {
      setPitchData(null);
      return;
    }
    setMicError(null);
    let cancelled = false;
    const listener = (res: PitchDetectionResult | null) => setPitchData(res);
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

  // Don't let the success timer fire after the tuner is gone
  useEffect(
    () => () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    },
    []
  );

  // Check challenge target note match
  useEffect(() => {
    if (pitchData && pitchData.note === challengeTargetNote && pitchData.inTune && !challengeSuccess) {
      setChallengeSuccess(true);
      setChallengeStreak(prev => prev + 1);
      celebrate({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });

      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = window.setTimeout(() => {
        setChallengeSuccess(false);
        // Next random note from common guitar roots
        const candidates: NoteName[] = ['E', 'A', 'D', 'G', 'B', 'C', 'F'];
        const filtered = candidates.filter(n => n !== challengeTargetNote);
        const nextTarget = filtered[Math.floor(Math.random() * filtered.length)];
        setChallengeTargetNote(nextTarget);
      }, 2000);
    }
  }, [pitchData, challengeTargetNote, challengeSuccess]);

  // Play target reference tone
  const handlePlayReferencePitch = (freq: number) => {
    guitarAudio.pluck(freq, 3.5, 0.9);
  };

  // Needle angle for meter: -50 cents = -45deg, +50 cents = +45deg
  const cents = pitchData ? Math.max(-50, Math.min(50, pitchData.cents)) : 0;
  const needleRotation = (cents / 50) * 45;

  return (
    <div className="space-y-6">
      {/* Top Banner / Explainer */}
      <div className="bg-gradient-to-r from-ink-900 via-ink-850 to-ink-900 border border-ink-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Mic className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-ink-100">Real-Time Pitch Studio & Tuner</h2>
          </div>
          <p className="text-xs sm:text-sm text-ink-400 mt-1">
            Pluck a real guitar, hum, or whistle into your microphone. See live pitch detection, frequency (Hz), and cents deviation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowMetronome(prev => !prev)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 border ${
              showMetronome
                ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                : 'bg-ink-800 hover:bg-ink-700 text-ink-300 border-ink-700'
            }`}
          >
            <Activity className="w-4 h-4 text-brand-400" />
            <span>{showMetronome ? 'Metronome Overlay (Active)' : 'Open Metronome Overlay'}</span>
          </button>

          <button
            onClick={onToggleMic}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
              isMicActive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'
                : 'bg-gold-600 hover:bg-gold-500 text-white shadow-gold-900/30'
            }`}
          >
            {isMicActive ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Turn Off Microphone</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Activate Live Listening</span>
              </>
            )}
          </button>
        </div>
      </div>

      {micError && (
        <p role="alert" className="text-xs sm:text-sm text-red-300 bg-red-950/40 border border-red-900/60 rounded-xl px-4 py-2.5">
          {micError}
        </p>
      )}

      {/* Integrated Metronome Overlay */}
      {showMetronome && (
        <div className="transition-all animate-in fade-in-50 duration-200">
          <MetronomeOverlay isDocked={true} onClose={() => setShowMetronome(false)} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tuner Gauge & Live Feedback */}
        <div className="lg:col-span-2 bg-ink-900 border border-ink-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-between space-y-6 relative overflow-hidden">
          {/* Subtle live signal pulse */}
          {isMicActive && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-ping" />
              <span className="text-xs font-semibold text-gold-400">Listening live...</span>
            </div>
          )}

          {/* Tuner Gauge Arc */}
          <div className="w-full max-w-md flex flex-col items-center pt-2">
            <div className="relative w-64 h-36 flex items-end justify-center">
              {/* Semi-circular meter arc */}
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 110">
                {/* Background arc track */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  className="stroke-ink-800"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                {/* Flat zone (gold) */}
                <path
                  d="M 20 100 A 80 80 0 0 1 80 27"
                  fill="none"
                  className="stroke-gold-500"
                  strokeWidth="8"
                  strokeDasharray="4 3"
                />
                {/* In-tune sweet spot (gold) */}
                <path
                  d="M 85 24 A 80 80 0 0 1 115 24"
                  fill="none"
                  className="stroke-gold-500"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Sharp zone (gold) */}
                <path
                  d="M 120 27 A 80 80 0 0 1 180 100"
                  fill="none"
                  className="stroke-gold-500"
                  strokeWidth="8"
                  strokeDasharray="4 3"
                />

                {/* Meter labels */}
                <text x="20" y="112" className="fill-ink-500" fontSize="10" textAnchor="middle">-50¢</text>
                <text x="100" y="18" className="fill-gold-500" fontSize="11" fontWeight="bold" textAnchor="middle">IN TUNE</text>
                <text x="180" y="112" className="fill-ink-500" fontSize="10" textAnchor="middle">+50¢</text>

                {/* Animated Needle */}
                <g
                  style={{
                    transform: `rotate(${needleRotation}deg)`,
                    transformOrigin: '100px 100px',
                    transition: 'transform 0.12s cubic-bezier(0.2, 0.8, 0.4, 1)',
                  }}
                >
                  <line
                    x1="100"
                    y1="100"
                    x2="100"
                    y2="22"
                    className={
                      !pitchData
                        ? 'stroke-ink-500'
                        : pitchData.inTune
                        ? 'stroke-gold-500'
                        : 'stroke-brand-500'
                    }
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="100" cy="100" r="7" className="fill-ink-700 stroke-brand-600" strokeWidth="2" />
                </g>
              </svg>
            </div>

            {/* Note Display Bubble */}
            <div className="mt-4 flex flex-col items-center">
              <div
                className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center border shadow-2xl transition-all ${
                  !pitchData
                    ? 'bg-ink-950/80 border-ink-800 text-ink-500'
                    : pitchData.inTune
                    ? 'bg-gold-950/60 border-gold-500 text-gold-300 scale-105 shadow-gold-950/50'
                    : 'bg-brand-950/50 border-brand-500/60 text-brand-300'
                }`}
              >
                <span className="text-4xl font-extrabold tracking-tight">
                  {pitchData ? pitchData.note : '—'}
                </span>
                <span className="text-xs font-mono font-medium text-ink-400">
                  {pitchData ? `Octave ${pitchData.octave}` : 'Waiting for audio...'}
                </span>
              </div>

              {/* Status Message */}
              <div className="mt-3 text-center">
                {pitchData ? (
                  <div className="space-y-1">
                    <p
                      className={`text-sm font-bold flex items-center justify-center gap-1.5 ${
                        pitchData.inTune
                          ? 'text-gold-400'
                          : pitchData.cents < 0
                          ? 'text-brand-400'
                          : 'text-gold-400'
                      }`}
                    >
                      {pitchData.inTune ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-gold-400" />
                          <span>Perfect Pitch! (+/- {Math.abs(pitchData.cents)} cents)</span>
                        </>
                      ) : pitchData.cents < 0 ? (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>Tune UP: {Math.abs(pitchData.cents)} cents Flat (b)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>Tune DOWN: {pitchData.cents} cents Sharp (#)</span>
                        </>
                      )}
                    </p>
                    <p className="text-xs font-mono text-ink-400">
                      Frequency: <span className="text-ink-200 font-bold">{pitchData.frequency} Hz</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-ink-500 italic">
                    {isMicActive
                      ? 'Pluck any guitar string or hum into mic...'
                      : 'Click "Activate Live Listening" to detect notes'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* String Selector for Guided Tuning */}
          <div className="w-full border-t border-ink-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-400">
                Standard Tuning Target Strings:
              </span>
              <span className="text-xs text-brand-400 font-medium">Click string to hear reference</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {GUITAR_STRINGS.map((str, idx) => {
                const isSelected = selectedStringIndex === idx;
                const isMatched =
                  pitchData &&
                  pitchData.note === str.openNote &&
                  pitchData.octave === str.openOctave;

                return (
                  <button
                    key={str.stringNumber}
                    onClick={() => {
                      setSelectedStringIndex(idx);
                      handlePlayReferencePitch(str.openFrequencyHz);
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-brand-600/30 border-brand-500 text-brand-200 shadow-md ring-1 ring-brand-500'
                        : isMatched
                        ? 'bg-gold-950/60 border-gold-500/80 text-gold-300'
                        : 'bg-ink-950 border-ink-800 text-ink-300 hover:bg-ink-800'
                    }`}
                  >
                    <span className="text-[10px] text-ink-400 font-medium">String {str.stringNumber}</span>
                    <span className="text-base font-extrabold">{str.openNote}</span>
                    <span className="text-[10px] font-mono text-ink-400">{str.openFrequencyHz.toFixed(1)} Hz</span>
                    <Volume2 className="w-3 h-3 text-brand-400 mt-1 opacity-70" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Real-Time Pitch Challenges & 5th Fret Ear Training */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Real-time Challenge Card */}
          <div className="bg-ink-900 border border-ink-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-400" />
                <h3 className="font-bold text-sm text-ink-100">Live Note Pluck Challenge</h3>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold border border-brand-500/30">
                <Award className="w-3.5 h-3.5" />
                <span>Streak: {challengeStreak}</span>
              </div>
            </div>

            <p className="text-xs text-ink-400">
              Pluck the requested note on your guitar or virtual fretboard. The tuner listens live!
            </p>

            <div className="bg-ink-950 border border-ink-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-ink-500 uppercase font-semibold">Pluck this note:</span>
                <div className="text-3xl font-black text-brand-400 mt-0.5">{challengeTargetNote}</div>
              </div>

              {challengeSuccess ? (
                <div className="px-3 py-1.5 rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-300 text-xs font-bold flex items-center gap-1.5 animate-bounce">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Success!</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    // Play the target note for user (octave 3 sits in the guitar's range for every candidate)
                    guitarAudio.pluck(noteFrequency(challengeTargetNote, 3), 2.5);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-300 text-xs font-semibold flex items-center gap-1 border border-ink-700"
                >
                  <Volume2 className="w-3.5 h-3.5 text-brand-400" />
                  <span>Hear Target</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-ink-400">
              {pitchData ? (
                <span>
                  Currently hearing: <strong className="text-ink-200">{pitchData.note}</strong> ({pitchData.cents} cents)
                </span>
              ) : (
                <span>Microphone waiting for audio...</span>
              )}
            </div>
          </div>

          {/* Ear Tuning Simulator (From PDF Page 1) */}
          <div className="bg-ink-900 border border-ink-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-ink-100 flex items-center gap-1.5">
              <span>🎧 Ear Tuning Simulator</span>
            </h3>
            <p className="text-xs text-ink-400">
              Hear 5th Fret Low E (110 Hz) compared directly with Open A (110 Hz). When both are identical, they sound seamless without wobble!
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => guitarAudio.pluck(110.0, 3.0)}
                className="p-2.5 rounded-xl bg-ink-950 border border-ink-800 hover:border-brand-500/40 text-ink-200 text-xs font-bold flex flex-col items-center gap-1"
              >
                <span>5th Fret Low E</span>
                <span className="text-[10px] text-brand-400 font-mono">110.0 Hz ('A')</span>
              </button>

              <button
                onClick={() => guitarAudio.pluck(110.0, 3.0)}
                className="p-2.5 rounded-xl bg-ink-950 border border-ink-800 hover:border-brand-500/40 text-ink-200 text-xs font-bold flex flex-col items-center gap-1"
              >
                <span>Open A String</span>
                <span className="text-[10px] text-gold-400 font-mono">110.0 Hz ('A')</span>
              </button>
            </div>

            <button
              onClick={() => {
                // Play unison together
                guitarAudio.pluck(110.0, 4.0, 0.7);
                setTimeout(() => guitarAudio.pluck(110.0, 4.0, 0.7), 150);
              }}
              className="w-full py-2 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/40 text-brand-300 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Hear Unison Harmony</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
