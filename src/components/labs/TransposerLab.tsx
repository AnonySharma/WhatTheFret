import React, { useMemo, useState } from 'react';
import { ArrowRight, Play, Volume2 } from 'lucide-react';
import { NOTE_NAMES, type NoteName } from '../../constants';
import { guitarAudio } from '../../utils/audioSynth';
import {
  borrowedChords,
  capoOptions,
  getChordFrequencies,
  keyUsesFlats,
  pivotChords,
  semitonesBetween,
  spellNote,
  symbolToChord,
  transposeProgressionDetailed,
} from '../../utils/labs';
import { useTimeouts } from './useTimeouts';

const PRESETS: { label: string; text: string }[] = [
  { label: 'Pop (I V vi IV)', text: 'C G Am F' },
  { label: 'Doo-wop (I vi IV V)', text: 'C Am F G' },
  { label: 'Minor feel (vi IV I V)', text: 'Am F C G' },
  { label: 'Rock (I IV V I)', text: 'C F G C' },
];

const KeyPicker: React.FC<{ value: NoteName; onChange: (k: NoteName) => void; label: string }> = ({
  value,
  onChange,
  label,
}) => (
  <div>
    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1.5">{label}</div>
    <div className="grid grid-cols-6 gap-1.5">
      {NOTE_NAMES.map(k => (
        <button
          key={k}
          onClick={() => onChange(k)}
          aria-pressed={value === k}
          className={`h-9 rounded-lg text-xs font-extrabold border transition-colors ${
            value === k
              ? 'bg-brand-600 border-brand-400 text-white'
              : 'bg-ink-950 border-ink-800 text-ink-300 hover:bg-ink-800'
          }`}
        >
          {k}
        </button>
      ))}
    </div>
  </div>
);

const keyLabel = (k: NoteName, flats: boolean) => spellNote(NOTE_NAMES.indexOf(k), flats);

export const TransposerLab: React.FC = () => {
  const [fromKey, setFromKey] = useState<NoteName>('C');
  const [toKey, setToKey] = useState<NoteName>('D');
  const [text, setText] = useState(PRESETS[0].text);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const { after, clear } = useTimeouts();

  const shift = semitonesBetween(fromKey, toKey);
  const flats = keyUsesFlats(toKey);
  const parsed = useMemo(() => transposeProgressionDetailed(text, shift, flats), [text, shift, flats]);
  const original = useMemo(() => parsed.tokens.map(t => t.input), [parsed]);
  const transposed = useMemo(() => parsed.tokens.map(t => t.output), [parsed]);
  const capos = useMemo(() => capoOptions(toKey), [toKey]);
  const borrowed = useMemo(() => borrowedChords(toKey), [toKey]);
  const pivots = useMemo(() => pivotChords(fromKey, toKey), [fromKey, toKey]);

  const playSymbol = (sym: string) => {
    const chord = symbolToChord(sym);
    if (!chord) return;
    guitarAudio.strum(getChordFrequencies(chord.root, chord.type), 'down', 32);
  };

  const playAll = (symbols: string[]) => {
    clear();
    symbols.forEach((sym, i) => {
      after(() => {
        setPlayingIdx(i);
        playSymbol(sym);
        if (i === symbols.length - 1) after(() => setPlayingIdx(null), 800);
      }, i * 900);
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-ink-900 border border-ink-800 rounded-2xl p-4 sm:p-6 space-y-5">
        <div>
          <h3 className="text-lg font-black text-ink-100">Modal Transposer</h3>
          <p className="text-sm text-ink-300 mt-1">
            Moving a song to a new key is just sliding every chord by the same number of semitones (frets). Type a
            progression, pick the key you have and the key you want, and hear both.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <KeyPicker value={fromKey} onChange={setFromKey} label="Original key" />
          <KeyPicker value={toKey} onChange={setToKey} label="Target key" />
        </div>

        <div className="space-y-2">
          <label htmlFor="prog-input" className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
            Chord progression (spaces, commas or | between chords)
          </label>
          <input
            id="prog-input"
            value={text}
            onChange={e => setText(e.target.value)}
            spellCheck={false}
            aria-describedby={parsed.unparsed.length > 0 ? 'prog-unparsed' : undefined}
            aria-invalid={parsed.unparsed.length > 0}
            className="w-full h-10 px-3 rounded-xl bg-ink-950 border border-ink-800 focus:border-brand-500 outline-none font-mono text-sm text-ink-100"
          />
          {parsed.unparsed.length > 0 && (
            <p id="prog-unparsed" role="status" className="text-[11px] text-gold-300">
              Couldn't read: <span className="font-mono">{parsed.unparsed.join(', ')}</span>. Those are left as typed.
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => setText(p.text)}
                className="px-2.5 h-8 rounded-lg bg-ink-950 border border-ink-800 hover:border-brand-500/50 text-[11px] font-semibold text-ink-300"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-ink-950 border border-ink-800 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-400">
            <span className="font-bold text-ink-200">{keyLabel(fromKey, keyUsesFlats(fromKey))}</span>
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="font-bold text-brand-300">{keyLabel(toKey, flats)}</span>
            <span className="font-mono px-2 py-0.5 rounded bg-ink-900 border border-ink-800">
              {shift === 0 ? 'no change' : `+${shift} semitone${shift === 1 ? '' : 's'} (${shift} fret${shift === 1 ? '' : 's'} up)`}
            </span>
          </div>

          <ChordRow label="Original" chords={original} onPlay={playSymbol} />
          <ChordRow label="Transposed" chords={transposed} onPlay={playSymbol} activeIdx={playingIdx} accent />

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => playAll(original)}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-ink-900 border border-ink-800 hover:border-brand-500/50 text-xs font-bold text-ink-200"
            >
              <Play className="w-3.5 h-3.5" /> Hear original
            </button>
            <button
              onClick={() => playAll(transposed)}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Hear transposed
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="Capo shortcuts" hint={`Play easy open shapes, sound in ${keyLabel(toKey, flats)}`}>
          <ul className="space-y-1.5 text-sm">
            {capos.map(o => (
              <li key={o.shapeKey} className="flex items-center justify-between rounded-lg bg-ink-950 border border-ink-800 px-3 py-2">
                <span className="text-ink-200">
                  Shapes of <strong className="text-brand-300">{o.shapeKey}</strong>
                </span>
                <span className="font-mono text-xs text-gold-300">{o.capo === 0 ? 'no capo' : `capo ${o.capo}`}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title={`Pivot chords ${keyLabel(fromKey, keyUsesFlats(fromKey))} → ${keyLabel(toKey, flats)}`}
          hint="Chords both keys share: the smooth way to modulate"
        >
          {fromKey === toKey ? (
            <p className="text-xs text-ink-400">Pick two different keys to see their shared chords.</p>
          ) : pivots.length === 0 ? (
            <p className="text-xs text-ink-400">These keys share no diatonic triads. Modulate with a dominant chord instead.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {pivots.map(p => {
                const sym = `${p.root}${p.type === 'Minor' ? 'm' : p.type === 'Diminished' ? 'dim' : ''}`;
                return (
                  <li key={sym} className="flex items-center justify-between rounded-lg bg-ink-950 border border-ink-800 px-3 py-2">
                    <span className="text-ink-200">
                      <strong>{sym}</strong>{' '}
                      <span className="text-ink-400 text-xs">
                        = {p.numeralInA} → {p.numeralInB}
                      </span>
                    </span>
                    <HearButton onClick={() => playSymbol(sym)} />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title={`Borrowed chords in ${keyLabel(toKey, flats)}`} hint="From the parallel minor key (modal interchange)">
          <ul className="space-y-1.5 text-sm">
            {borrowed.map(b => (
              <li key={b.numeral} className="flex items-center justify-between rounded-lg bg-ink-950 border border-ink-800 px-3 py-2 gap-2">
                <span className="text-ink-200 min-w-0">
                  <strong className="text-violet-300 font-mono mr-1.5">{b.numeral}</strong>
                  <strong>{b.display}</strong>
                  <span className="block text-[11px] text-ink-400 truncate">{b.note}</span>
                </span>
                <HearButton onClick={() => playSymbol(b.display)} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
};

const Panel: React.FC<{ title: string; hint: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <section className="bg-ink-900 border border-ink-800 rounded-2xl p-4 space-y-3">
    <div>
      <h4 className="text-sm font-extrabold text-ink-100">{title}</h4>
      <p className="text-[11px] text-ink-400">{hint}</p>
    </div>
    {children}
  </section>
);

const HearButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    aria-label="Hear chord"
    className="shrink-0 w-8 h-8 rounded-lg bg-ink-900 border border-ink-800 hover:border-brand-500/50 flex items-center justify-center text-brand-400"
  >
    <Volume2 className="w-3.5 h-3.5" />
  </button>
);

const ChordRow: React.FC<{
  label: string;
  chords: string[];
  onPlay: (s: string) => void;
  activeIdx?: number | null;
  accent?: boolean;
}> = ({ label, chords, onPlay, activeIdx, accent }) => (
  <div>
    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">{label}</div>
    <div className="flex flex-wrap gap-1.5">
      {chords.length === 0 && <span className="text-xs text-ink-500">Type some chords above.</span>}
      {chords.map((c, i) => (
        <button
          key={`${c}-${i}`}
          onClick={() => onPlay(c)}
          className={`min-w-12 h-10 px-3 rounded-xl border font-mono font-extrabold text-sm transition-colors ${
            activeIdx === i
              ? 'bg-gold-500 border-gold-300 text-ink-950'
              : accent
              ? 'bg-brand-500/10 border-brand-500/40 text-brand-200 hover:bg-brand-500/20'
              : 'bg-ink-900 border-ink-800 text-ink-200 hover:bg-ink-800'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  </div>
);
