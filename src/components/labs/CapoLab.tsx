import React, { useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Play, RotateCcw, Volume2, X } from 'lucide-react';
import { guitarAudio } from '../../utils/audioSynth';
import { parseProgression } from '../../utils/labs';
import {
  MAX_CAPO_FRET,
  capoFrequencies,
  isEasyOpenShape,
  openStringNames,
  quizQuestion,
  rankCapoOptions,
  shapeFrequencies,
  soundingChord,
} from '../../utils/capo';
import { useTimeouts } from './useTimeouts';

const SHAPES = ['C', 'A', 'G', 'E', 'D', 'Am', 'Em', 'Dm'];
const PRESETS: { label: string; text: string }[] = [
  { label: 'Bb Gm Eb F', text: 'Bb Gm Eb F' },
  { label: 'D Bm G A', text: 'D Bm G A' },
  { label: 'F Dm Bb C', text: 'F Dm Bb C' },
  { label: 'Eb Cm Ab Bb', text: 'Eb Cm Ab Bb' },
];
const QUIZ_LENGTH = 5;

const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e'];
const MARKERS = [3, 5, 7, 9];

// SVG geometry: nut on the left, body on the right, high e at the top (like tab)
const FRETS_SHOWN = 10;
const FRET_W = 62;
const NUT_W = 40;
const STR_GAP = 24;
const PAD_Y = 24;
const WIDTH = NUT_W + FRET_W * FRETS_SHOWN + 12;
const HEIGHT = PAD_Y * 2 + STR_GAP * 5;
const yForString = (sIdx: number) => PAD_Y + (5 - sIdx) * STR_GAP;

const capoLabel = (fret: number) => (fret === 0 ? 'No capo' : `Capo ${fret}`);
const newSeeds = () => Array.from({ length: QUIZ_LENGTH }, () => Math.floor(Math.random() * 2 ** 32));

const CARD = 'bg-ink-900 border border-ink-800 rounded-2xl p-4 sm:p-6 space-y-5';
const LABEL = 'text-[11px] font-bold uppercase tracking-wider text-ink-400';

const WHY_CARDS: { title: string; body: string }[] = [
  {
    title: 'Match a singer’s range',
    body: 'A song sits too low or too high for the voice? Slide the capo up and keep the exact chords you already know. Only the key changes.',
  },
  {
    title: 'Keep the open-string chime',
    body: 'Barre chords mute the ring of open strings. A capo lets open strings keep ringing in any key, which is why capo’d acoustic parts sparkle.',
  },
  {
    title: 'Swap barres for open shapes',
    body: 'Bb, Eb and F# are painful barres. With the capo on the right fret they become G, C and D, shapes you can play half asleep.',
  },
];

export const CapoLab: React.FC = () => {
  const [capo, setCapo] = useState(2);
  const [flats, setFlats] = useState(false);
  const [shape, setShape] = useState('G');
  const [progText, setProgText] = useState(PRESETS[0].text);
  const [playingFret, setPlayingFret] = useState<number | null>(null);
  const { after, clear } = useTimeouts();
  const dragging = useRef(false);

  const newNames = useMemo(() => openStringNames(capo, flats), [capo, flats]);
  const sounding = soundingChord(shape, capo);

  const progression = useMemo(() => parseProgression(progText), [progText]);
  const ranked = useMemo(() => rankCapoOptions(progression), [progression]);
  const best = ranked[0];
  const noCapo = ranked.find(r => r.fret === 0);
  const shown = useMemo(() => {
    const top = ranked.slice(0, 4);
    return noCapo && !top.includes(noCapo) ? [...top, noCapo] : top;
  }, [ranked, noCapo]);

  const openFreqs = (fret: number) => capoFrequencies([0, 0, 0, 0, 0, 0], fret);

  const fretFromPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * WIDTH) / rect.width;
    return Math.max(0, Math.min(MAX_CAPO_FRET, Math.ceil((x - NUT_W) / FRET_W)));
  };

  const playRow = (fret: number, shapes: string[]) => {
    clear();
    shapes.forEach((s, i) => {
      after(() => {
        setPlayingFret(fret);
        const f = shapeFrequencies(s, fret);
        if (f) guitarAudio.strum(f, 'down', 32);
        if (i === shapes.length - 1) after(() => setPlayingFret(null), 800);
      }, i * 900);
    });
  };

  // ---- quiz ----
  const [seeds, setSeeds] = useState<number[]>(newSeeds);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const finished = qIndex >= QUIZ_LENGTH;
  const question = useMemo(() => (finished ? null : quizQuestion(seeds[qIndex])), [seeds, qIndex, finished]);

  const answer = (option: string) => {
    if (!question || picked !== null) return;
    setPicked(option);
    if (option === question.answer) setScore(s => s + 1);
  };
  const nextQuestion = () => {
    setPicked(null);
    setQIndex(i => i + 1);
  };
  const restartQuiz = () => {
    setSeeds(newSeeds());
    setQIndex(0);
    setPicked(null);
    setScore(0);
  };

  const capoX = NUT_W + capo * FRET_W - 14;

  return (
    <div className="space-y-4">
      {/* 1. What a capo does */}
      <div className={CARD}>
        <div>
          <h3 className="text-lg font-black text-ink-100">What a capo does</h3>
          <p className="text-sm text-ink-300 mt-1">
            A capo is a <strong className="text-brand-300">movable nut</strong>. It clamps across the neck and shortens
            every string at once, raising each one by one semitone per fret. Your open strings get new names and every
            shape you already know sounds in a higher key. Drag the capo along the neck, or pick a fret.
          </p>
        </div>

        <div className="rounded-xl bg-ink-950 border border-ink-800 overflow-x-auto">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            style={{ minWidth: 640, touchAction: 'pan-y' }}
            className="w-full h-auto block cursor-ew-resize select-none"
            role="img"
            aria-label={capo === 0 ? 'Guitar neck with no capo' : `Guitar neck with the capo on fret ${capo}`}
            onPointerDown={e => {
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              setCapo(fretFromPointer(e));
            }}
            onPointerMove={e => {
              if (dragging.current) setCapo(fretFromPointer(e));
            }}
            onPointerUp={() => {
              dragging.current = false;
            }}
            onPointerCancel={() => {
              dragging.current = false;
            }}
          >
            {/* fret numbers */}
            {Array.from({ length: FRETS_SHOWN }, (_, i) => i + 1).map(f => (
              <text
                key={f}
                x={NUT_W + (f - 0.5) * FRET_W}
                y={13}
                textAnchor="middle"
                fontSize="9"
                fill={f === capo ? '#fbbf24' : '#78716c'}
                fontFamily="monospace"
              >
                {f}
              </text>
            ))}
            {/* frets */}
            {Array.from({ length: FRETS_SHOWN + 1 }, (_, i) => i).map(f => (
              <line
                key={f}
                x1={NUT_W + f * FRET_W}
                x2={NUT_W + f * FRET_W}
                y1={PAD_Y - 6}
                y2={PAD_Y + STR_GAP * 5 + 6}
                stroke={f === 0 ? '#d6d3d1' : '#44403c'}
                strokeWidth={f === 0 ? 5 : 1.5}
              />
            ))}
            {MARKERS.map(f => (
              <circle key={f} cx={NUT_W + (f - 0.5) * FRET_W} cy={PAD_Y + STR_GAP * 2.5} r={4} fill="#292524" />
            ))}
            {/* strings: dimmed where the capo has cut them off */}
            {STRING_LABELS.map((label, i) => {
              const w = 0.8 + (5 - i) * 0.35;
              return (
                <g key={i}>
                  <text x={NUT_W - 14} y={yForString(i) + 3} textAnchor="middle" fontSize="9" fill="#a8a29e" fontFamily="monospace">
                    {label}
                  </text>
                  <line x1={NUT_W} x2={capoX + 7} y1={yForString(i)} y2={yForString(i)} stroke="#78716c" strokeWidth={w} opacity={capo > 0 ? 0.3 : 1} />
                  <line x1={capoX + 7} x2={WIDTH - 12} y1={yForString(i)} y2={yForString(i)} stroke="#a8a29e" strokeWidth={w} />
                  {capo > 0 && (
                    <text
                      x={capoX + 20}
                      y={yForString(i) - 4}
                      fontSize="10"
                      fontWeight="800"
                      fontFamily="monospace"
                      fill="#fbbf24"
                    >
                      {newNames[i]}
                    </text>
                  )}
                </g>
              );
            })}
            {/* the capo */}
            {capo > 0 && (
              <rect
                x={capoX}
                y={PAD_Y - 12}
                width={14}
                height={STR_GAP * 5 + 24}
                rx={5}
                fill="#f59e0b"
                stroke="#78350f"
                strokeWidth={1.5}
              />
            )}
          </svg>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Capo fret">
          {Array.from({ length: MAX_CAPO_FRET + 1 }, (_, f) => (
            <button
              key={f}
              onClick={() => setCapo(f)}
              aria-pressed={capo === f}
              className={`h-9 px-3 rounded-lg text-xs font-extrabold border ${
                capo === f
                  ? 'bg-brand-600 border-brand-400 text-white'
                  : 'bg-ink-950 border-ink-800 text-ink-300 hover:bg-ink-800'
              }`}
            >
              {f === 0 ? 'No capo' : `Fret ${f}`}
            </button>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className={LABEL}>Open strings, low to high</div>
            <button
              onClick={() => setFlats(v => !v)}
              aria-pressed={flats}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-bold border ${
                flats ? 'bg-ink-100 text-ink-950 border-ink-100' : 'bg-ink-950 border-ink-800 text-ink-300'
              }`}
            >
              Show flats
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {STRING_LABELS.map((label, i) => (
              <div key={i} className="rounded-lg bg-ink-950 border border-ink-800 py-2 text-center font-mono text-sm">
                <span className="text-ink-400">{label}</span>
                <span className="text-ink-600 mx-1">{capo === 0 ? '=' : '→'}</span>
                <span className={capo === 0 ? 'text-ink-400' : 'text-brand-300 font-black'}>{newNames[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => guitarAudio.strum(openFreqs(0), 'down', 45)}
            className="h-9 px-3 rounded-xl bg-ink-950 border border-ink-800 hover:border-brand-500/50 text-xs font-bold text-ink-200 flex items-center gap-1.5"
          >
            <Volume2 className="w-4 h-4 text-brand-400" /> Hear open strings
          </button>
          <button
            onClick={() => guitarAudio.strum(openFreqs(capo), 'down', 45)}
            disabled={capo === 0}
            className="h-9 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Volume2 className="w-4 h-4" /> Hear with capo {capo || ''}
          </button>
        </div>
      </div>

      {/* 2. Same shapes, new key */}
      <div className={CARD}>
        <div>
          <h3 className="text-lg font-black text-ink-100">Same shapes, new key</h3>
          <p className="text-sm text-ink-300 mt-1">
            Your fingers keep playing the shape; the capo decides what you hear. Pick the shape you finger and the capo
            fret (it follows the neck above) to see the chord that actually sounds.
          </p>
        </div>

        <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <div className={LABEL + ' mb-1.5'}>Shape you finger</div>
            <div className="flex flex-wrap gap-1.5">
              {SHAPES.map(s => (
                <button
                  key={s}
                  onClick={() => setShape(s)}
                  aria-pressed={shape === s}
                  className={`h-9 min-w-[2.75rem] px-3 rounded-lg text-xs font-extrabold border ${
                    shape === s
                      ? 'bg-brand-600 border-brand-400 text-white'
                      : 'bg-ink-950 border-ink-800 text-ink-300 hover:bg-ink-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className={LABEL + ' mb-1.5'}>Capo fret</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCapo(c => Math.max(0, c - 1))}
                aria-label="Capo one fret lower"
                disabled={capo === 0}
                className="w-9 h-9 rounded-lg bg-ink-950 border border-ink-800 text-ink-200 font-black disabled:opacity-30"
              >
                −
              </button>
              <span className="w-12 text-center font-mono font-black text-ink-100" aria-live="polite">
                {capo}
              </span>
              <button
                onClick={() => setCapo(c => Math.min(MAX_CAPO_FRET, c + 1))}
                aria-label="Capo one fret higher"
                disabled={capo === MAX_CAPO_FRET}
                className="w-9 h-9 rounded-lg bg-ink-950 border border-ink-800 text-ink-200 font-black disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-ink-950 border border-brand-500/30 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-ink-400 font-bold">You play</div>
              <div className="text-2xl font-black text-ink-100">{shape}</div>
            </div>
            <ArrowRight className="w-5 h-5 text-ink-600" aria-hidden />
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-ink-400 font-bold">{capoLabel(capo)}</div>
              <div className="text-sm font-mono text-brand-300 font-bold">+{capo} semitone{capo === 1 ? '' : 's'}</div>
            </div>
            <ArrowRight className="w-5 h-5 text-ink-600" aria-hidden />
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-ink-400 font-bold">It sounds</div>
              <div className="text-2xl font-black text-brand-300">{sounding}</div>
            </div>
          </div>
          <button
            onClick={() => {
              const f = shapeFrequencies(shape, capo);
              if (f) guitarAudio.strum(f, 'down', 32);
            }}
            aria-label={`Hear ${shape} shape with ${capoLabel(capo).toLowerCase()}`}
            className="h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Play className="w-4 h-4" /> Strum it
          </button>
        </div>

        <div id="capo-finder" className="space-y-2 pt-1 border-t border-ink-800">
          <h4 className="text-sm font-black text-ink-100 pt-4">Work backwards: which capo makes it easy?</h4>
          <p className="text-xs text-ink-400">
            Type the chords you want to <em>hear</em>. Capo positions are ranked by how many of them turn into easy open
            chords (C A G E D, Am Em Dm and their 7ths).
          </p>
          <label htmlFor="capo-prog" className={LABEL}>
            Chord progression (spaces, commas or | between chords)
          </label>
          <input
            id="capo-prog"
            value={progText}
            onChange={e => setProgText(e.target.value)}
            spellCheck={false}
            className="w-full h-10 px-3 rounded-xl bg-ink-950 border border-ink-800 focus:border-brand-500 outline-none font-mono text-sm text-ink-100"
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => setProgText(p.text)}
                className="px-2.5 h-8 rounded-lg bg-ink-950 border border-ink-800 hover:border-brand-500/50 text-[11px] font-mono font-semibold text-ink-300"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {!best ? (
          <p className="text-sm text-ink-400">Type a few chords above to see the best capo positions.</p>
        ) : (
          <ul className="space-y-2">
            {shown.map(r => {
              const isBest = r === best;
              const allEasy = r.score === r.total;
              return (
                <li
                  key={r.fret}
                  className={`rounded-xl border p-3 flex flex-wrap items-center gap-x-4 gap-y-2 ${
                    isBest && r.score > 0 ? 'bg-brand-950/40 border-brand-500/60' : 'bg-ink-950 border-ink-800'
                  }`}
                >
                  <div className="w-24 shrink-0">
                    <div className="text-sm font-black text-ink-100">{capoLabel(r.fret)}</div>
                    <div className={`text-[11px] font-semibold ${allEasy ? 'text-emerald-400' : 'text-ink-400'}`}>
                      {r.score}/{r.total} easy
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                    {r.shapes.map((s, i) => (
                      <span
                        key={i}
                        className={`px-2 h-7 inline-flex items-center rounded-md font-mono text-xs font-bold border bg-ink-900 ${
                          playingFret === r.fret ? 'border-brand-400' : 'border-ink-800'
                        } ${isEasyOpenShape(s) ? 'text-ink-100' : 'text-ink-500'}`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  {isBest && r.score > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-black uppercase tracking-wider">
                      {r.fret === 0 ? 'No capo needed' : 'Best'}
                    </span>
                  )}
                  <button
                    onClick={() => playRow(r.fret, r.shapes)}
                    aria-label={`Hear ${r.shapes.join(' ')} with ${capoLabel(r.fret).toLowerCase()}`}
                    className="w-9 h-9 shrink-0 rounded-lg bg-ink-900 border border-ink-800 hover:border-brand-500/50 text-brand-400 flex items-center justify-center"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {best && best.score === 0 && (
          <p className="text-xs text-ink-400">No capo position turns these into easy open chords. Check the spelling, or try a barre.</p>
        )}
        {best && best.fret > 0 && best.score > 0 && (
          <p className="text-sm text-ink-300">
            Put the capo on fret <strong className="text-brand-300">{best.fret}</strong> and play{' '}
            <strong className="text-brand-300 font-mono">{best.shapes.join(' ')}</strong>. It sounds like{' '}
            <span className="font-mono">{progression.join(' ')}</span>.
          </p>
        )}
      </div>

      {/* 3. Why use one */}
      <div className={CARD}>
        <h3 className="text-lg font-black text-ink-100">Why use one</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {WHY_CARDS.map(c => (
            <div key={c.title} className="rounded-xl bg-ink-950 border border-ink-800 p-4">
              <h4 className="text-sm font-extrabold text-brand-300">{c.title}</h4>
              <p className="text-xs text-ink-300 mt-1.5 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-ink-950 border border-brand-500/30 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gold-400">Worked example</div>
            <p className="text-sm text-ink-200 mt-1">
              Song in Bb: <span className="font-mono font-bold">Bb Gm Eb F</span>. Without a capo that is all barre
              chords. <strong className="text-brand-300">Capo 3 → play </strong>
              <span className="font-mono font-bold text-brand-300">G Em C D</span>.
            </p>
          </div>
          <button
            onClick={() => {
              setProgText('Bb Gm Eb F');
              document.getElementById('capo-finder')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="h-9 px-3 rounded-xl bg-ink-900 border border-brand-500/30 hover:border-brand-500/60 text-brand-300 text-xs font-bold"
          >
            Try it in the finder
          </button>
        </div>

        <div className="rounded-xl bg-gold-950/20 border border-gold-500/30 p-4">
          <h4 className="text-sm font-extrabold text-gold-400">Heads-up</h4>
          <ul className="mt-1.5 space-y-1 text-xs text-ink-300 list-disc pl-4 leading-relaxed">
            <li>A capo placed too far from the fret wire, or squeezed too tight, pulls notes sharp. Sit it just behind the wire and clamp only as hard as needed for clean strings.</li>
            <li>The higher the capo, the thinner and brighter the guitar sounds. Frets 1 to 7 are the practical range.</li>
            <li>Tune with the capo ON. Clamping it nudges the strings, so check the tuner afterwards.</li>
          </ul>
        </div>
      </div>

      {/* 4. Quiz */}
      <div className={CARD}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-ink-100">Quick quiz</h3>
          <span className="text-[11px] font-mono text-ink-400">
            {finished ? 'Done' : `Question ${qIndex + 1} of ${QUIZ_LENGTH}`} · {score} correct
          </span>
        </div>

        {question ? (
          <div className="space-y-3">
            <p className="text-sm font-bold text-ink-100">{question.prompt}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {question.options.map(o => {
                const isAnswer = o === question.answer;
                const isPicked = o === picked;
                const state =
                  picked === null
                    ? 'bg-ink-950 border-ink-800 text-ink-100 hover:border-brand-500/50'
                    : isAnswer
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    : isPicked
                    ? 'bg-red-950/60 border-red-500/60 text-red-300'
                    : 'bg-ink-950 border-ink-800 text-ink-500';
                return (
                  <button
                    key={o}
                    onClick={() => answer(o)}
                    disabled={picked !== null}
                    className={`h-11 rounded-xl border text-sm font-extrabold flex items-center justify-center gap-1.5 ${state}`}
                  >
                    {picked !== null && isAnswer && <Check className="w-4 h-4" aria-hidden />}
                    {picked !== null && isPicked && !isAnswer && <X className="w-4 h-4" aria-hidden />}
                    {o}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="flex flex-wrap items-center justify-between gap-3" role="status">
                <p className={`text-sm ${picked === question.answer ? 'text-emerald-300' : 'text-red-300'}`}>
                  <strong>{picked === question.answer ? 'Correct. ' : 'Not quite. '}</strong>
                  <span className="text-ink-300">{question.explanation}</span>
                </p>
                <button
                  onClick={nextQuestion}
                  className="h-9 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold"
                >
                  {qIndex === QUIZ_LENGTH - 1 ? 'See score' : 'Next question'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 space-y-3" role="status">
            <div className="text-3xl font-black text-brand-300">
              {score}/{QUIZ_LENGTH}
            </div>
            <p className="text-sm text-ink-300">
              {score === QUIZ_LENGTH
                ? 'Perfect. You can read a capo like a pro.'
                : score >= 3
                ? 'Solid. Remember: capo fret = semitones added to the shape.'
                : 'Keep going: add the capo fret to the shape’s root, one semitone per fret.'}
            </p>
            <button
              onClick={restartQuiz}
              className="h-9 px-4 rounded-xl bg-ink-950 border border-ink-800 hover:border-brand-500/50 text-xs font-bold text-ink-200 inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
