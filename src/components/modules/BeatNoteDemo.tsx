import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, Waves } from 'lucide-react';
import { guitarAudio } from '../../utils/audioSynth';
import { beatEnvelope, centsBetween, describeBeat, detunedFrequency } from '../../utils/beats';

interface BeatNoteDemoProps {
  /** Pitch of the open string you are tuning towards (Hz). */
  referenceFreq: number;
  referenceName: string;
}

const PRESETS = [
  { label: 'In tune', hz: 0 },
  { label: 'Almost', hz: 0.5 },
  { label: 'Close', hz: 2 },
  { label: 'Off', hz: 5 },
  { label: 'Far off', hz: 10 },
];

const W = 600;
const H = 120;
const WINDOW_S = 2.4;

export const BeatNoteDemo: React.FC<BeatNoteDemoProps> = ({ referenceFreq, referenceName }) => {
  const [offsetHz, setOffsetHz] = useState<number>(2); // signed: negative = flat
  const [playing, setPlaying] = useState<boolean>(false);
  const [mutedHint, setMutedHint] = useState<boolean>(false);
  const tonesRef = useRef<ReturnType<typeof guitarAudio.holdTones> | null>(null);

  const beatHz = Math.abs(offsetHz);
  const detuned = detunedFrequency(referenceFreq, beatHz, offsetHz < 0 ? 'flat' : 'sharp');
  const cents = offsetHz === 0 ? 0 : centsBetween(referenceFreq, detuned);
  const info = describeBeat(beatHz);

  const stop = useCallback(() => {
    tonesRef.current?.stop();
    tonesRef.current = null;
    setPlaying(false);
    setMutedHint(false);
  }, []);

  const start = () => {
    tonesRef.current?.stop();
    tonesRef.current = null;
    // holdTones returns an inert controller while muted: don't pretend something is playing
    if (guitarAudio.isAudioMuted()) {
      setPlaying(false);
      setMutedHint(true);
      return;
    }
    setMutedHint(false);
    tonesRef.current = guitarAudio.holdTones([referenceFreq, detuned]);
    setPlaying(true);
  };

  // retune live while the slider moves
  useEffect(() => {
    tonesRef.current?.setFrequencies([referenceFreq, detuned]);
  }, [referenceFreq, detuned]);

  // a different string pair means a different reference note: stop the old tones
  useEffect(() => stop, [referenceFreq, stop]);

  // The envelope is the loudness swell you hear; drawn in "slow motion" (the carrier is not shown).
  const envelopePath = useMemo(() => {
    const pts: string[] = [];
    const steps = 240;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * WINDOW_S;
      const a = beatEnvelope(t, beatHz);
      pts.push(`${((i / steps) * W).toFixed(1)},${(H / 2 - a * (H / 2 - 8)).toFixed(1)}`);
    }
    const top = pts.join(' L');
    const bottom = [...pts].reverse().map(p => {
      const [x, y] = p.split(',').map(Number);
      return `${x},${(H - y).toFixed(1)}`;
    });
    return `M${top} L${bottom.join(' L')} Z`;
  }, [beatHz]);

  const wave = useMemo(() => {
    // two close sine waves, stretched so the carrier is visible; their sum is the swelling signal
    const carrier = 38;
    const pts: string[] = [];
    const steps = 900;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * WINDOW_S;
      const ph1 = 2 * Math.PI * carrier * t;
      const ph2 = 2 * Math.PI * (carrier + (offsetHz < 0 ? -beatHz : beatHz)) * t;
      const y = (Math.sin(ph1) + Math.sin(ph2)) / 2;
      pts.push(`${((i / steps) * W).toFixed(1)},${(H / 2 - y * (H / 2 - 8)).toFixed(1)}`);
    }
    return 'M' + pts.join(' L');
  }, [beatHz, offsetHz]);

  const beatsInWindow = Math.round(beatHz * WINDOW_S * 10) / 10;

  return (
    <div className="bg-ink-900 border border-ink-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400">
            <Waves className="w-4 h-4" />
          </span>
          <h3 className="font-bold text-ink-100 text-sm sm:text-base">Beat Notes: hear "matched" vs "not matched"</h3>
        </div>
        <p className="text-sm text-ink-300 leading-relaxed">
          When two strings are almost the same pitch, their sound waves drift in and out of step. Where the peaks line up the sound
          swells; where they cancel it fades. You hear that as a <strong className="text-brand-300">pulsing "wah-wah-wah"</strong>,
          and the pulses per second equal the <strong className="text-brand-300">difference in frequency</strong> between the strings
          (110 Hz against 112 Hz beats twice a second). Turn the peg and the pulsing slows down; the moment it stops, the strings match.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_16rem] gap-4">
        <div className="space-y-3">
          <div className="rounded-xl bg-ink-950 border border-ink-800 p-3">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28 sm:h-32" role="img" aria-label="Combined waveform of the two strings">
              <line x1="0" y1={H / 2} x2={W} y2={H / 2} className="stroke-ink-700" strokeWidth="1" />
              <path d={envelopePath} className="fill-brand-500 stroke-brand-500" fillOpacity="0.12" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="4 3" />
              <path d={wave} fill="none" className="stroke-brand-400" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            <div className="flex items-center justify-between text-[11px] font-mono text-ink-400 mt-1">
              <span>2.4 seconds of sound</span>
              <span className="text-brand-300">
                {beatHz === 0 ? 'no beats: one steady tone' : `${beatsInWindow} swells in this window`}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="beat-offset" className="font-bold text-ink-200">
                Second string is {beatHz === 0 ? 'in tune' : offsetHz < 0 ? 'flat (too low)' : 'sharp (too high)'}
              </label>
              <span className="font-mono text-ink-400">
                {offsetHz > 0 ? '+' : ''}
                {offsetHz.toFixed(1)} Hz · {cents > 0 ? '+' : ''}
                {cents.toFixed(0)}¢
              </span>
            </div>
            <input
              id="beat-offset"
              type="range"
              min={-12}
              max={12}
              step={0.5}
              value={offsetHz}
              onChange={e => setOffsetHz(parseFloat(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-[10px] text-ink-500 font-mono">
              <span>flat</span>
              <span>in tune</span>
              <span>sharp</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => setOffsetHz(offsetHz < 0 && p.hz > 0 ? -p.hz : p.hz)}
                aria-pressed={beatHz === p.hz}
                className={`h-8 px-3 rounded-lg text-xs font-bold border ${
                  beatHz === p.hz ? 'bg-brand-600/20 border-brand-400 text-brand-200' : 'bg-ink-950 border-ink-800 text-ink-300 hover:border-brand-500/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={playing ? stop : start}
            className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
              playing ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-brand-600 hover:bg-brand-500 text-white'
            }`}
          >
            {playing ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {playing ? 'Stop both tones' : `Play ${referenceName} + second string`}
          </button>
          {mutedHint && (
            <p role="status" className="text-[11px] text-gold-300 leading-relaxed">
              Sound is muted. Turn it back on in the top bar, then press play.
            </p>
          )}
          <div className="rounded-xl bg-ink-950 border border-ink-800 p-3 space-y-2" aria-live="polite">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-brand-300 uppercase tracking-wide">{info.label}</span>
              <span className="font-mono text-[11px] text-ink-400">{beatHz.toFixed(1)} beats/sec</span>
            </div>
            <p className="text-xs text-ink-200 leading-relaxed">
              <strong className="text-ink-100">What you hear: </strong>
              {info.sounds}
            </p>
            <p className="text-xs text-ink-400 leading-relaxed">
              <strong className="text-gold-400">What to do: </strong>
              {info.advice}
            </p>
          </div>
          <p className="text-[11px] text-ink-500 leading-relaxed">
            Reference is {referenceName} at {referenceFreq.toFixed(1)} Hz; the second tone is {detuned.toFixed(1)} Hz. Use headphones or a
            decent speaker; tiny laptop speakers hide low notes.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-ink-950/80 border border-ink-800 p-4 space-y-2">
        <h4 className="text-sm font-bold text-ink-100">Using beats on your real guitar</h4>
        <ol className="list-decimal list-inside space-y-1 text-xs text-ink-300 leading-relaxed">
          <li>Fret the lower string at the matching fret (see the pitch matcher above) and pluck it together with the open string.</li>
          <li>Listen for the slow wobble. Fast and rough means far apart; slow and smooth means close.</li>
          <li>Turn the peg of the open string a hair. If the wobble slows, keep going; if it speeds up, turn the other way.</li>
          <li>Stop when the wobble fades into one steady, ringing tone. Let both strings ring; muting one hides the beats.</li>
        </ol>
        <p className="text-[11px] text-ink-500">
          Tip: the same trick works for octaves and for harmonics (a 5th-fret harmonic on one string against the 7th-fret harmonic on the next).
        </p>
      </div>
    </div>
  );
};
