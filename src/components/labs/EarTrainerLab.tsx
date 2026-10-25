import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Mic, MicOff, RefreshCw, Volume2, X } from 'lucide-react';
import { guitarAudio } from '../../utils/audioSynth';
import { pitchDetector, type PitchDetectionResult } from '../../utils/pitchDetector';
import {
  INTERVALS,
  intervalSecondMidi,
  isBlindFretCorrect,
  makeBlindFretQuestion,
  makeIntervalQuestion,
  midiToFreq,
  type BlindFretQuestion,
  type IntervalQuestion,
} from '../../utils/labs';
import { GUITAR_STRINGS } from '../../constants';
import { useTimeouts } from './useTimeouts';

type Mode = 'interval' | 'fret';
type Level = 'easy' | 'medium' | 'all';

const LEVELS: Record<Level, { label: string; semitones: number[] }> = {
  easy: { label: 'Easy: m3 M3 P4 P5 P8', semitones: [3, 4, 5, 7, 12] },
  medium: { label: 'Medium: add 2nds, 6ths', semitones: [1, 2, 3, 4, 5, 7, 8, 9, 12] },
  all: { label: 'All 12 intervals + tritone', semitones: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
};

export const EarTrainerLab: React.FC = () => {
  const [mode, setMode] = useState<Mode>('interval');
  return (
    <div className="space-y-4">
      <div className="bg-ink-900 border border-ink-800 rounded-2xl p-4 sm:p-6 space-y-3">
        <h3 className="text-lg font-black text-ink-100">Ear Trainer & Blind Fret Guessing</h3>
        <p className="text-sm text-ink-300">
          Hear the emotional distance between two notes before you touch the neck. Name the interval, or find a
          mystery note on your own guitar (the tuner listens through your microphone).
        </p>
        <div className="inline-flex p-1 rounded-xl bg-ink-950 border border-ink-800" role="tablist">
          {(
            [
              ['interval', 'Interval ear training'],
              ['fret', 'Blind fret guessing'],
            ] as [Mode, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={`h-9 px-3 rounded-lg text-xs font-bold ${
                mode === id ? 'bg-brand-600 text-white' : 'text-ink-300 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {mode === 'interval' ? <IntervalTrainer /> : <BlindFretTrainer />}
    </div>
  );
};

const Score: React.FC<{ correct: number; total: number; streak: number }> = ({ correct, total, streak }) => (
  <div className="flex items-center gap-4 text-xs font-mono text-ink-300">
    <span>
      Score <strong className="text-ink-100">{correct}/{total}</strong>
    </span>
    <span>
      Streak <strong className="text-gold-300">{streak}</strong>
    </span>
  </div>
);

const IntervalTrainer: React.FC = () => {
  const [level, setLevel] = useState<Level>('easy');
  const [direction, setDirection] = useState<'up' | 'down' | 'mixed'>('up');
  const [question, setQuestion] = useState<IntervalQuestion | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0, streak: 0 });
  const { after } = useTimeouts();

  const allowed = LEVELS[level].semitones;

  const play = useCallback(
    (q: IntervalQuestion) => {
      guitarAudio.pluck(midiToFreq(q.rootMidi), 1.6, 0.85);
      after(() => guitarAudio.pluck(midiToFreq(intervalSecondMidi(q)), 1.8, 0.85), 700);
    },
    [after]
  );

  const next = useCallback(() => {
    const q = makeIntervalQuestion(allowed, direction);
    setQuestion(q);
    setAnswer(null);
    play(q);
  }, [allowed, direction, play]);

  const choose = (semitones: number) => {
    if (!question || answer !== null) return;
    setAnswer(semitones);
    const ok = semitones === question.semitones;
    setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1, streak: ok ? s.streak + 1 : 0 }));
    // reveal: play it again on the correct answer so the ear locks it in
    after(() => play(question), 500);
  };

  return (
    <div className="bg-ink-900 border border-ink-800 rounded-2xl p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(LEVELS) as Level[]).map(l => (
            <button
              key={l}
              onClick={() => {
                setLevel(l);
                setQuestion(null);
                setAnswer(null);
              }}
              aria-pressed={level === l}
              className={`h-9 px-3 rounded-lg text-xs font-bold border ${
                level === l ? 'bg-brand-600/20 border-brand-400 text-brand-200' : 'bg-ink-950 border-ink-800 text-ink-300'
              }`}
            >
              {LEVELS[l].label}
            </button>
          ))}
        </div>
        <select
          value={direction}
          onChange={e => setDirection(e.target.value as 'up' | 'down' | 'mixed')}
          aria-label="Direction"
          className="h-9 px-2 rounded-lg bg-ink-950 border border-ink-800 text-xs text-ink-100"
        >
          <option value="up">Ascending</option>
          <option value="down">Descending</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={next}
          className="h-11 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> {question ? 'Next interval' : 'Play a mystery interval'}
        </button>
        {question && (
          <button
            onClick={() => play(question)}
            className="h-11 px-4 rounded-xl bg-ink-950 border border-ink-800 text-ink-200 text-sm font-bold flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4" /> Hear again
          </button>
        )}
        <div className="ml-auto">
          <Score {...score} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {INTERVALS.filter(i => allowed.includes(i.semitones)).map(i => {
          const isAnswer = question && answer !== null && i.semitones === question.semitones;
          const isWrongPick = answer === i.semitones && question && i.semitones !== question.semitones;
          return (
            <button
              key={i.semitones}
              disabled={!question || answer !== null}
              onClick={() => choose(i.semitones)}
              className={`text-left rounded-xl border p-3 transition-colors disabled:cursor-default ${
                isAnswer
                  ? 'bg-brand-500/20 border-brand-400'
                  : isWrongPick
                  ? 'bg-red-500/15 border-red-400'
                  : 'bg-ink-950 border-ink-800 hover:border-brand-500/50 disabled:opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-ink-100 text-sm">{i.name}</span>
                <span className="font-mono text-[11px] text-ink-400">{i.short}</span>
              </div>
              <div className="text-[11px] text-ink-400 mt-0.5">
                {i.semitones} fret{i.semitones === 1 ? '' : 's'} · {i.swara}
              </div>
            </button>
          );
        })}
      </div>

      {question && answer !== null && (
        <div
          className={`rounded-xl border p-3 text-sm ${
            answer === question.semitones ? 'border-brand-400 bg-brand-500/10 text-brand-100' : 'border-red-400/60 bg-red-500/10 text-red-100'
          }`}
          role="status"
        >
          <div className="flex items-center gap-2 font-bold">
            {answer === question.semitones ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {answer === question.semitones ? 'Correct!' : `Not quite. It was a ${INTERVALS[question.semitones].name}.`}
          </div>
          <p className="text-xs mt-1 text-ink-200">
            {INTERVALS[question.semitones].name} ({question.semitones} fret{question.semitones === 1 ? '' : 's'},{' '}
            {question.direction === 'up' ? 'ascending' : 'descending'}): {INTERVALS[question.semitones].character}. On
            the same string, play the first note then move {question.semitones} fret
            {question.semitones === 1 ? '' : 's'} {question.direction === 'up' ? 'up' : 'down'}.
          </p>
        </div>
      )}
    </div>
  );
};

const BlindFretTrainer: React.FC = () => {
  const [q, setQ] = useState<BlindFretQuestion | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0, streak: 0 });
  const [micOn, setMicOn] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [heard, setHeard] = useState<string | null>(null);
  const qRef = useRef<BlindFretQuestion | null>(null);
  const doneRef = useRef(false);
  const stableRef = useRef<{ note: string; count: number }>({ note: '', count: 0 });
  const { after } = useTimeouts();

  qRef.current = q;
  doneRef.current = guess !== null;

  const next = () => {
    const nq = makeBlindFretQuestion(12);
    setQ(nq);
    setGuess(null);
    stableRef.current = { note: '', count: 0 };
    guitarAudio.pluck(nq.frequency, 2.2, 0.9);
  };

  const submit = useCallback((fret: number) => {
    const cur = qRef.current;
    if (!cur || doneRef.current) return;
    doneRef.current = true;
    const ok = isBlindFretCorrect(cur, fret);
    setGuess(fret);
    setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1, streak: ok ? s.streak + 1 : 0 }));
  }, []);

  const stopMic = useCallback(() => {
    pitchDetector.stopListening();
    setMicOn(false);
    setHeard(null);
  }, []);

  const startMic = async () => {
    setMicError(null);
    const ok = await pitchDetector.startListening((res: PitchDetectionResult | null) => {
      const cur = qRef.current;
      if (!res || !cur || doneRef.current || res.clarity < 0.85 || res.rmsVolume < 0.01) return;
      setHeard(`${res.note}${res.octave}`);
      // a note counts only after it has been held for several consecutive frames
      const st = stableRef.current;
      if (st.note === res.note) st.count += 1;
      else stableRef.current = { note: res.note, count: 1 };
      if (stableRef.current.count >= 8) {
        const correct = res.note === cur.note;
        doneRef.current = true;
        setGuess(correct ? cur.fret : -1);
        setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1, streak: correct ? s.streak + 1 : 0 }));
      }
    });
    if (ok) setMicOn(true);
    else setMicError('Could not access the microphone. Check browser permission, or use the fret buttons instead.');
  };

  useEffect(() => () => pitchDetector.stopListening(), []);

  const strDef = q ? GUITAR_STRINGS.find(s => s.stringNumber === q.stringNumber)! : null;
  const correct = q && guess !== null && guess !== -1 && isBlindFretCorrect(q, guess);

  return (
    <div className="bg-ink-900 border border-ink-800 rounded-2xl p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={next}
          className="h-11 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> {q ? 'Next mystery note' : 'Play a mystery note'}
        </button>
        {q && (
          <button
            onClick={() => guitarAudio.pluck(q.frequency, 2.2, 0.9)}
            className="h-11 px-4 rounded-xl bg-ink-950 border border-ink-800 text-ink-200 text-sm font-bold flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4" /> Hear again
          </button>
        )}
        <div className="ml-auto">
          <Score {...score} />
        </div>
      </div>

      {q && strDef && (
        <>
          <div className="rounded-xl bg-ink-950 border border-ink-800 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Challenge</div>
            <p className="text-ink-100 mt-1 text-sm sm:text-base">
              The note you heard was played on the{' '}
              <strong className="text-brand-300">
                {strDef.name} string (string {q.stringNumber})
              </strong>
              . Which fret is it? Pick below, or play it on your own guitar and let the mic judge the note.
            </p>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5">
            {Array.from({ length: 13 }, (_, f) => (
              <button
                key={f}
                disabled={guess !== null}
                onClick={() => submit(f)}
                className={`h-11 rounded-lg border font-mono font-extrabold text-sm ${
                  guess !== null && isBlindFretCorrect(q, f)
                    ? 'bg-brand-500/25 border-brand-400 text-brand-100'
                    : guess === f
                    ? 'bg-red-500/20 border-red-400 text-red-100'
                    : 'bg-ink-950 border-ink-800 text-ink-200 hover:border-brand-500/50 disabled:opacity-60'
                }`}
              >
                {f === 0 ? 'Open' : f}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={micOn ? stopMic : startMic}
              className={`h-10 px-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                micOn ? 'bg-gold-500 text-ink-950 border-gold-300' : 'bg-ink-950 border-ink-800 text-ink-200'
              }`}
            >
              {micOn ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {micOn ? 'Stop listening' : 'Play it on my guitar'}
            </button>
            {micOn && <span className="text-xs text-ink-400 font-mono">Hearing: {heard ?? '…'}</span>}
            {micError && <span className="text-xs text-red-300">{micError}</span>}
          </div>

          {guess !== null && (
            <div
              role="status"
              className={`rounded-xl border p-3 text-sm ${
                correct || (guess === q.fret) ? 'border-brand-400 bg-brand-500/10 text-brand-100' : 'border-red-400/60 bg-red-500/10 text-red-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {correct ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {correct ? 'Correct!' : 'Not quite.'} The note was {q.note}: fret {q.fret === 0 ? '0 (open)' : q.fret} on the{' '}
                {strDef.name} string
                {q.fret === 0 ? ' (also fret 12)' : q.fret === 12 ? ' (also open)' : ''}.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
