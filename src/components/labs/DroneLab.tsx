import React, { useEffect, useMemo, useState } from 'react';
import { Pause, Play, Square } from 'lucide-react';
import { INDIAN_RAAGAS, NOTE_NAMES, type NoteName } from '../../constants';
import { guitarAudio } from '../../utils/audioSynth';
import { RhythmEngine, TanpuraEngine, beatAccents, type TanpuraTuning } from '../../utils/drone';
import {
  TAALS,
  padOffsets,
  saFrequency,
  sequenceOffsets,
  vibhagStarts,
} from '../../utils/labs';
import { useTimeouts } from './useTimeouts';

const SWARA_LABELS = ['Sa', 're', 'Re', 'ga', 'Ga', 'ma', 'Ma', 'Pa', 'dha', 'Dha', 'ni', 'Ni'];

export const DroneLab: React.FC<{ notation: 'western' | 'indian' }> = ({ notation }) => {
  const [sa, setSa] = useState<NoteName>('C');
  const [tuning, setTuning] = useState<TanpuraTuning>('Pa');
  const [cycle, setCycle] = useState(6);
  const [droneVol, setDroneVol] = useState(0.6);
  const [droneOn, setDroneOn] = useState(false);

  const [taalId, setTaalId] = useState('keherwa');
  const [bpm, setBpm] = useState(80);
  const [rhythmVol, setRhythmVol] = useState(0.7);
  const [rhythmOn, setRhythmOn] = useState(false);
  const [beat, setBeat] = useState<number | null>(null);

  const [raagaId, setRaagaId] = useState(INDIAN_RAAGAS[0].id);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [playingLine, setPlayingLine] = useState(false);
  const { after, clear } = useTimeouts();

  // lazy init: construct each engine once, not on every render
  const [tanpura] = useState(() => new TanpuraEngine());
  const [rhythm] = useState(() => new RhythmEngine());

  const taal = TAALS.find(t => t.id === taalId)!;
  const accents = useMemo(() => beatAccents(taal, vibhagStarts(taal)), [taal]);
  const raaga = INDIAN_RAAGAS.find(r => r.id === raagaId)!;
  const allowed = useMemo(() => new Set(padOffsets(raaga.arohana, raaga.avarohana)), [raaga]);
  const saHz = saFrequency(sa);

  // Stop everything when leaving the lab
  useEffect(
    () => () => {
      tanpura.stop();
      rhythm.stop();
    },
    [tanpura, rhythm]
  );

  useEffect(() => {
    if (droneOn) tanpura.setSa(saHz);
  }, [saHz, droneOn, tanpura]);
  useEffect(() => tanpura.setTuning(tuning), [tuning, tanpura]);
  useEffect(() => tanpura.setCycleSeconds(cycle), [cycle, tanpura]);
  useEffect(() => tanpura.setVolume(droneVol), [droneVol, tanpura]);
  useEffect(() => rhythm.setBpm(bpm), [bpm, rhythm]);
  useEffect(() => rhythm.setVolume(rhythmVol), [rhythmVol, rhythm]);
  useEffect(() => {
    if (rhythm.isRunning) rhythm.setAccents(accents);
    setBeat(null);
  }, [accents, rhythm]);

  const toggleDrone = () => {
    if (tanpura.isRunning) {
      tanpura.stop();
      setDroneOn(false);
    } else {
      tanpura.setCycleSeconds(cycle);
      tanpura.setVolume(droneVol);
      tanpura.start(saHz, tuning);
      setDroneOn(true);
    }
  };

  const toggleRhythm = () => {
    if (rhythm.isRunning) {
      rhythm.stop();
      setRhythmOn(false);
      setBeat(null);
    } else {
      rhythm.setVolume(rhythmVol);
      rhythm.start(accents, bpm, setBeat);
      setRhythmOn(true);
    }
  };

  const stopAll = () => {
    tanpura.stop();
    rhythm.stop();
    clear();
    setDroneOn(false);
    setRhythmOn(false);
    setBeat(null);
    setPlayingLine(false);
  };

  const padFreq = (offset: number) => saHz * 2 * Math.pow(2, offset / 12);
  const hitPad = (offset: number) => {
    guitarAudio.pluck(padFreq(offset), 1.6, 0.85);
    setActivePad(offset);
    after(() => setActivePad(null), 220);
  };

  const playLine = () => {
    if (playingLine) return;
    clear();
    setPlayingLine(true);
    const up = sequenceOffsets(raaga.arohana, 'asc');
    const down = sequenceOffsets(raaga.avarohana, 'desc');
    const line = [...up, ...down];
    line.forEach((off, i) => {
      after(() => {
        guitarAudio.pluck(padFreq(off), 1.4, 0.85);
        setActivePad(((off % 12) + 12) % 12);
        if (i === line.length - 1) {
          after(() => {
            setActivePad(null);
            setPlayingLine(false);
          }, 500);
        }
      }, i * 520);
    });
  };

  const saLabel = (o: number) => (notation === 'indian' ? SWARA_LABELS[o] : NOTE_NAMES[(NOTE_NAMES.indexOf(sa) + o) % 12]);

  return (
    <div className="space-y-4">
      <div className="bg-ink-900 border border-ink-800 rounded-2xl p-4 sm:p-6 space-y-3">
        <h3 className="text-lg font-black text-ink-100">Tanpura Drone & Modal Jam Pad</h3>
        <p className="text-sm text-ink-300">
          A tanpura holds Sa (the home note) and Pa (its fifth) in a slow loop. Every note you play over it is judged
          against that fixed centre, so intervals, and the mood of a raaga, become audible. Start the drone, add a
          rhythm cycle, then improvise on the pad or on your own guitar.
        </p>
        <button
          onClick={stopAll}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-ink-950 border border-ink-800 text-xs font-bold text-ink-300 hover:text-white"
        >
          <Square className="w-3.5 h-3.5" /> Stop everything
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="bg-ink-900 border border-ink-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <h4 className="text-sm font-extrabold text-ink-100">Tanpura</h4>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1.5">Sa (pitch)</div>
            <div className="grid grid-cols-6 gap-1.5">
              {NOTE_NAMES.map(n => (
                <button
                  key={n}
                  onClick={() => setSa(n)}
                  aria-pressed={sa === n}
                  className={`h-9 rounded-lg text-xs font-extrabold border ${
                    sa === n ? 'bg-brand-600 border-brand-400 text-white' : 'bg-ink-950 border-ink-800 text-ink-300 hover:bg-ink-800'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-ink-400 mt-1.5 font-mono">Sa = {saHz.toFixed(1)} Hz</p>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1.5">Tuning of first string</div>
            <div className="flex gap-1.5">
              {(
                [
                  ['Pa', 'Pa (Sa–Pa)'],
                  ['Ma', 'Ma (Sa–Ma)'],
                  ['Ni', 'Ni (Sa–Ni)'],
                ] as [TanpuraTuning, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTuning(id)}
                  aria-pressed={tuning === id}
                  className={`flex-1 h-9 rounded-lg text-xs font-bold border ${
                    tuning === id ? 'bg-brand-600/20 border-brand-400 text-brand-200' : 'bg-ink-950 border-ink-800 text-ink-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-ink-400 mt-1.5">Use Ma for raagas that omit Pa; Ni for those that avoid both.</p>
          </div>

          <Slider label="Loop speed" value={cycle} min={3} max={12} step={0.5} unit="s / cycle" onChange={setCycle} />
          <Slider label="Volume" value={droneVol} min={0} max={1} step={0.05} unit="" onChange={setDroneVol} percent />

          <button
            onClick={toggleDrone}
            className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
              droneOn ? 'bg-gold-500 text-ink-950' : 'bg-brand-600 hover:bg-brand-500 text-white'
            }`}
          >
            {droneOn ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            {droneOn ? 'Stop tanpura' : 'Start tanpura'}
          </button>
        </section>

        <section className="bg-ink-900 border border-ink-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <h4 className="text-sm font-extrabold text-ink-100">Taal (rhythm cycle)</h4>
          <div className="flex flex-wrap gap-1.5">
            {TAALS.map(t => (
              <button
                key={t.id}
                onClick={() => setTaalId(t.id)}
                aria-pressed={taalId === t.id}
                className={`h-9 px-3 rounded-lg text-xs font-bold border ${
                  taalId === t.id ? 'bg-brand-600/20 border-brand-400 text-brand-200' : 'bg-ink-950 border-ink-800 text-ink-300'
                }`}
              >
                {t.name} <span className="text-ink-500 font-mono">{t.beats}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-ink-400">
            {taal.name}: {taal.beats} beats grouped {taal.grouping.join(' + ')}. Beat 1 is <em>sam</em> (the strong "home"
            beat); the quieter, airy beat is the <em>khali</em> ("empty").
          </p>

          <div className="flex flex-wrap gap-1.5" aria-label="Beat cycle">
            {accents.map((a, i) => (
              <div
                key={i}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-2 transition-colors ${
                  beat === i + 1
                    ? 'bg-gold-500 border-gold-300 text-ink-950'
                    : a === 'sam'
                    ? 'border-brand-400 text-brand-300'
                    : a === 'khali'
                    ? 'border-dashed border-ink-500 text-ink-400'
                    : a === 'tali'
                    ? 'border-violet-400 text-violet-300'
                    : 'border-ink-700 text-ink-400'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <Slider label="Tempo" value={bpm} min={30} max={200} step={1} unit="BPM" onChange={setBpm} />
          <Slider label="Volume" value={rhythmVol} min={0} max={1} step={0.05} unit="" onChange={setRhythmVol} percent />

          <button
            onClick={toggleRhythm}
            className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
              rhythmOn ? 'bg-gold-500 text-ink-950' : 'bg-brand-600 hover:bg-brand-500 text-white'
            }`}
          >
            {rhythmOn ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            {rhythmOn ? 'Stop rhythm' : 'Start rhythm'}
          </button>
          <p className="text-[10px] text-ink-500">
            The pulse is a simple synthesised bass-and-tick accent pattern, not sampled tabla bols.
          </p>
        </section>
      </div>

      <section className="bg-ink-900 border border-ink-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-extrabold text-ink-100">Modal jam pad</h4>
          <select
            value={raagaId}
            onChange={e => setRaagaId(e.target.value)}
            aria-label="Raaga"
            className="h-9 px-2 rounded-lg bg-ink-950 border border-ink-800 text-xs text-ink-100 max-w-full"
          >
            {INDIAN_RAAGAS.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-ink-400">
          {raaga.name} · {raaga.thaat} · {raaga.timeOfDay}. Notes in this raaga are lit; the dim pads are outside it.
        </p>

        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
          {Array.from({ length: 12 }, (_, o) => {
            const inRaaga = allowed.has(o);
            return (
              <button
                key={o}
                onPointerDown={() => hitPad(o)}
                // keyboard / assistive-tech activation (a real pointer press already fired onPointerDown)
                onClick={e => {
                  if (e.detail === 0) hitPad(o);
                }}
                aria-label={`Play ${saLabel(o)}`}
                className={`h-16 rounded-xl border-2 text-sm font-extrabold transition-all active:scale-95 ${
                  activePad === o
                    ? 'bg-gold-500 border-gold-300 text-ink-950'
                    : inRaaga
                    ? o === 0
                      ? 'bg-brand-600/30 border-brand-400 text-brand-100'
                      : o === 7
                      ? 'bg-violet-500/20 border-violet-400 text-violet-100'
                      : 'bg-ink-950 border-brand-500/50 text-ink-100 hover:bg-ink-800'
                    : 'bg-ink-950/40 border-ink-800 text-ink-600'
                }`}
              >
                {saLabel(o)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={playLine}
            disabled={playingLine}
            className="h-10 px-4 rounded-xl bg-ink-950 border border-brand-500/40 text-brand-200 text-xs font-bold flex items-center gap-2 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" /> Hear arohana + avarohana
          </button>
          <span className="text-[11px] text-ink-400 font-mono break-words">
            ↑ {raaga.arohana.join(' ')} · ↓ {raaga.avarohana.join(' ')}
          </span>
        </div>
      </section>
    </div>
  );
};

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (n: number) => void;
  percent?: boolean;
}> = ({ label, value, min, max, step, unit, onChange, percent }) => (
  <label className="block">
    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1">
      <span>{label}</span>
      <span className="font-mono normal-case text-ink-300">{percent ? `${Math.round(value * 100)}%` : `${value} ${unit}`}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full accent-brand-500"
    />
  </label>
);
