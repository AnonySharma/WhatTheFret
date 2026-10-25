import React, { useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { NOTE_NAMES, type NoteName } from '../../constants';
import { getFretNote } from '../../utils/guitarTheory';
import { guitarAudio } from '../../utils/audioSynth';
import { CAGED_MAX_FRET, cagedPositions, majorTriadNotes, type CagedId } from '../../utils/labs';

const SHAPE_COLORS: Record<CagedId, { fill: string; text: string; chip: string }> = {
  C: { fill: '#35c4b4', text: '#0a0e1a', chip: 'bg-brand-400 text-ink-950' },
  A: { fill: '#f5a524', text: '#0a0e1a', chip: 'bg-gold-500 text-ink-950' },
  G: { fill: '#8b5cf6', text: '#ffffff', chip: 'bg-violet-500 text-white' },
  E: { fill: '#f87171', text: '#0a0e1a', chip: 'bg-red-400 text-ink-950' },
  D: { fill: '#cfd6e6', text: '#0a0e1a', chip: 'bg-ink-200 text-ink-950' },
};

const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e'];
const MARKERS = [3, 5, 7, 9, 12, 15];

// SVG geometry: nut on the left, body on the right, high e at the top (like tab)
const FRET_W = 52;
const NUT_W = 40;
const STR_GAP = 26;
const PAD_Y = 22;
const WIDTH = NUT_W + FRET_W * CAGED_MAX_FRET + 12;
const HEIGHT = PAD_Y * 2 + STR_GAP * 5 + 10;

const xForFret = (fret: number) => NUT_W + (fret - 0.5) * FRET_W;
const yForString = (sIdx: number) => PAD_Y + (5 - sIdx) * STR_GAP;

export const CagedLab: React.FC = () => {
  const [root, setRoot] = useState<NoteName>('C');
  const [selected, setSelected] = useState<CagedId | 'all'>('all');

  const positions = useMemo(() => cagedPositions(root), [root]);
  const triad = useMemo(() => majorTriadNotes(root), [root]);
  const visible = positions.filter(p => selected === 'all' || p.shapeId === selected);
  const order = useMemo(() => {
    const seen: CagedId[] = [];
    positions.forEach(p => {
      if (!seen.includes(p.shapeId)) seen.push(p.shapeId);
    });
    return seen;
  }, [positions]);

  const playPosition = (frets: number[]) => {
    const freqs = frets.map((f, i) => (f >= 0 ? getFretNote(6 - i, f).frequency : -1));
    guitarAudio.strum(freqs, 'down', 30);
  };

  return (
    <div className="space-y-4">
      <div className="bg-ink-900 border border-ink-800 rounded-2xl p-4 sm:p-6 space-y-5">
        <div>
          <h3 className="text-lg font-black text-ink-100">CAGED System</h3>
          <p className="text-sm text-ink-300 mt-1">
            One major chord can be played in five interlocking shapes, named after the open chords C, A, G, E and D.
            Slide a shape up the neck with a barre and it becomes the same chord in a new place. Pick a key and see
            all five shapes tile the neck, climbing in the order{' '}
            <strong className="text-brand-300 font-mono">{order.join(' → ')}</strong>.
          </p>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1.5">Chord</div>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {NOTE_NAMES.map(n => (
              <button
                key={n}
                onClick={() => setRoot(n)}
                aria-pressed={root === n}
                className={`h-9 rounded-lg text-xs font-extrabold border ${
                  root === n
                    ? 'bg-brand-600 border-brand-400 text-white'
                    : 'bg-ink-950 border-ink-800 text-ink-300 hover:bg-ink-800'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelected('all')}
            aria-pressed={selected === 'all'}
            className={`h-9 px-3 rounded-lg text-xs font-bold border ${
              selected === 'all' ? 'bg-ink-100 text-ink-950 border-ink-100' : 'bg-ink-950 border-ink-800 text-ink-300'
            }`}
          >
            All five
          </button>
          {order.map(id => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              aria-pressed={selected === id}
              className={`h-9 px-3 rounded-lg text-xs font-extrabold border flex items-center gap-1.5 ${
                selected === id ? 'border-ink-100' : 'border-ink-800 hover:border-ink-600'
              } bg-ink-950 text-ink-100`}
            >
              <span className={`w-4 h-4 rounded-full ${SHAPE_COLORS[id].chip}`} />
              {id} shape
            </button>
          ))}
          <span className="ml-auto text-[11px] text-ink-400 font-mono">
            {root} major = {triad.join(' · ')}
          </span>
        </div>

        <div className="rounded-xl bg-ink-950 border border-ink-800 overflow-x-auto">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            style={{ minWidth: 760 }}
            className="w-full h-auto block"
            role="img"
            aria-label={`CAGED shapes for ${root} major across the first ${CAGED_MAX_FRET} frets`}
          >
            {/* fret numbers */}
            {Array.from({ length: CAGED_MAX_FRET }, (_, i) => i + 1).map(f => (
              <text key={f} x={xForFret(f)} y={12} textAnchor="middle" fontSize="9" fill="#5f6b8b" fontFamily="monospace">
                {f}
              </text>
            ))}
            {/* frets */}
            {Array.from({ length: CAGED_MAX_FRET + 1 }, (_, i) => i).map(f => (
              <line
                key={f}
                x1={NUT_W + f * FRET_W}
                x2={NUT_W + f * FRET_W}
                y1={PAD_Y - 6}
                y2={PAD_Y + STR_GAP * 5 + 6}
                stroke={f === 0 ? '#cfd6e6' : '#343c56'}
                strokeWidth={f === 0 ? 5 : 1.5}
              />
            ))}
            {/* position markers */}
            {MARKERS.map(f => (
              <circle key={f} cx={xForFret(f)} cy={PAD_Y + STR_GAP * 2.5} r={4} fill="#232a40" />
            ))}
            {/* strings */}
            {STRING_LABELS.map((label, i) => (
              <g key={i}>
                <line
                  x1={NUT_W}
                  x2={WIDTH - 12}
                  y1={yForString(i)}
                  y2={yForString(i)}
                  stroke="#5f6b8b"
                  strokeWidth={0.8 + (5 - i) * 0.35}
                />
                <text x={NUT_W - 14} y={yForString(i) + 3} textAnchor="middle" fontSize="9" fill="#8791b0" fontFamily="monospace">
                  {label}
                </text>
              </g>
            ))}
            {/* shapes */}
            {visible.map((p, pi) => {
              const c = SHAPE_COLORS[p.shapeId];
              return (
                <g key={`${p.shapeId}-${p.offset}-${pi}`} opacity={selected === 'all' ? 0.92 : 1}>
                  {p.frets.map((fret, sIdx) => {
                    if (fret < 0) return null;
                    const note = getFretNote(6 - sIdx, fret).note;
                    const isRoot = note === root;
                    const cx = fret === 0 ? NUT_W - 4 : xForFret(fret);
                    return (
                      <g key={sIdx}>
                        <circle
                          cx={cx}
                          cy={yForString(sIdx)}
                          r={fret === 0 ? 6 : 10}
                          fill={fret === 0 ? 'none' : c.fill}
                          stroke={fret === 0 ? c.fill : isRoot ? '#ffffff' : 'none'}
                          strokeWidth={fret === 0 ? 2 : 2}
                        />
                        {fret > 0 && (
                          <text x={cx} y={yForString(sIdx) + 3.5} textAnchor="middle" fontSize="9" fontWeight="800" fill={c.text}>
                            {note}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  {/* shape tag above the lowest fret of the shape */}
                  <text
                    x={xForFret((p.minFret + p.maxFret) / 2 + 0.5) - FRET_W / 2 + FRET_W / 2}
                    y={HEIGHT - 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="800"
                    fill={c.fill}
                  >
                    {p.shapeId}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="text-[11px] text-ink-400">
          Open circles are open strings; white-ringed dots are the root. On a phone, swipe the diagram sideways.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {positions.map((p, i) => (
          <div key={i} className="bg-ink-900 border border-ink-800 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center font-black ${SHAPE_COLORS[p.shapeId].chip}`}>
                {p.shapeId}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-ink-100">
                  {root} via {p.shapeId} shape
                </div>
                <div className="text-[11px] font-mono text-ink-400">
                  frets {p.minFret === 0 ? 'open' : p.minFret}–{p.maxFret} · {p.frets.map(f => (f < 0 ? 'x' : f)).join(' ')}
                </div>
              </div>
            </div>
            <button
              onClick={() => playPosition(p.frets)}
              aria-label={`Hear ${root} ${p.shapeId} shape`}
              className="w-9 h-9 shrink-0 rounded-lg bg-ink-950 border border-ink-800 hover:border-brand-500/50 text-brand-400 flex items-center justify-center"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
