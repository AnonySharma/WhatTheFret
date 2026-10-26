import React, { useState } from 'react';
import {
  Compass,
  Volume2,
  Sparkles,
  Play,
  RotateCcw,
  Music,
  ArrowRight,
  Info,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  CIRCLE_OF_FIFTHS_DATA,
  type CircleKeySegment,
  NOTE_NAMES,
  NoteName,
} from '../constants';
import {
  deriveMajorScale,
  deriveDiatonicHarmony,
  getFretNote,
  getSwaraForNote,
  formatNoteDisplay,
  CHORD_DATABASE,
  calculateBarreChord,
} from '../utils/guitarTheory';
import { guitarAudio } from '../utils/audioSynth';

interface CircleOfFifthsProps {
  notesNotation?: 'western' | 'indian';
  rootSa?: NoteName;
}

export const CircleOfFifths: React.FC<CircleOfFifthsProps> = ({
  notesNotation: notationMode = 'western',
  rootSa = 'C',
}) => {
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0); // 0 = C Major
  const [activeHarmonicFilter, setActiveHarmonicFilter] = useState<'all' | 'major-only' | 'minor-only'>('all');
  const [isPlayingProgression, setIsPlayingProgression] = useState<boolean>(false);

  const activeSegment: CircleKeySegment = CIRCLE_OF_FIFTHS_DATA[selectedSegmentIndex];
  const diatonicChords = deriveDiatonicHarmony(activeSegment.majorKey);
  const scaleData = deriveMajorScale(activeSegment.majorKey);

  // Neighbor indices on the clock (0 to 11)
  const tonicIdx = selectedSegmentIndex;
  const subdominantIdx = (tonicIdx + 11) % 12; // 1 step counter-clockwise (IV)
  const dominantIdx = (tonicIdx + 1) % 12;      // 1 step clockwise (V)

  // Play guitar chord for a given key
  const playChordVoicing = (root: NoteName, type: 'Major' | 'Minor') => {
    // Look up in database or barre calculation
    const preset = CHORD_DATABASE.find(
      c => c.root === root && c.type.toLowerCase().includes(type.toLowerCase())
    );

    const frets = preset
      ? preset.frets
      : calculateBarreChord(root, type === 'Minor' ? 'E-Minor' : 'E-Major').frets;

    const freqs: number[] = [];
    [6, 5, 4, 3, 2, 1].forEach((sNum, idx) => {
      const f = frets[idx];
      if (f >= 0) {
        freqs.push(getFretNote(sNum, f).frequency);
      } else {
        freqs.push(-1);
      }
    });

    guitarAudio.strum(freqs, 'down', 32);
  };

  // Play full diatonic progression I - IV - V - I
  const playCadence = () => {
    if (isPlayingProgression) return;
    setIsPlayingProgression(true);

    const chordsToPlay: { root: NoteName; type: 'Major' | 'Minor' }[] = [
      { root: activeSegment.majorKey, type: 'Major' }, // I
      { root: CIRCLE_OF_FIFTHS_DATA[subdominantIdx].majorKey, type: 'Major' }, // IV
      { root: CIRCLE_OF_FIFTHS_DATA[dominantIdx].majorKey, type: 'Major' }, // V
      { root: activeSegment.majorKey, type: 'Major' }, // I
    ];

    chordsToPlay.forEach((item, i) => {
      setTimeout(() => {
        playChordVoicing(item.root, item.type);
        if (i === chordsToPlay.length - 1) {
          setIsPlayingProgression(false);
        }
      }, i * 750);
    });
  };

  // Play the 7 scale notes sequentially
  const playScaleArpeggio = () => {
    scaleData.notes.forEach((note, i) => {
      setTimeout(() => {
        const noteData = getFretNote(5, 0); // reference
        const norm = getFretNote(4, 0);
        // Play note frequency
        const semiFromC = NOTE_NAMES.indexOf(note);
        const freq = 130.81 * Math.pow(2, semiFromC / 12);
        guitarAudio.pluck(freq, 1.8, 0.85);
      }, i * 220);
    });
  };

  // SVG circular geometry math
  const viewBoxSize = 520;
  const center = viewBoxSize / 2;
  const outerR = 230;
  const midR = 155;
  const innerR = 90;

  // Converts polar coordinates (angle, radius) to Cartesian (x, y)
  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    // 0deg = top (subtract 90deg so 0 is at 12 o'clock)
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  // Generates SVG donut arc path between startAngle and endAngle and inner/outer radius
  const describeArc = (
    cx: number,
    cy: number,
    rIn: number,
    rOut: number,
    startAngle: number,
    endAngle: number
  ) => {
    const p1 = polarToCartesian(cx, cy, rOut, startAngle);
    const p2 = polarToCartesian(cx, cy, rOut, endAngle);
    const p3 = polarToCartesian(cx, cy, rIn, endAngle);
    const p4 = polarToCartesian(cx, cy, rIn, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', p1.x, p1.y,
      'A', rOut, rOut, 0, largeArcFlag, 1, p2.x, p2.y,
      'L', p3.x, p3.y,
      'A', rIn, rIn, 0, largeArcFlag, 0, p4.x, p4.y,
      'Z',
    ].join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Title & Concept Header */}
      <div className="bg-gradient-to-r from-ink-900 via-ink-850 to-ink-900 border border-ink-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Compass className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-ink-100">
              Interactive Circle of Fifths & Modal Transposer
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30">
              Harmonic Clock
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-400 mt-1">
            Click any segment to hear its acoustic voicing, visualize relative minor chords, and see the scale degrees{notationMode === 'indian' ? ' and corresponding Indian Thaats' : ''}.
          </p>
        </div>
      </div>

      {/* Main Interactive Dial and Theory Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visual SVG Circle Dial (7 cols) */}
        <div className="lg:col-span-7 bg-ink-900/90 border border-ink-800 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-sm">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[320px] h-[320px] rounded-full bg-brand-500/5 blur-[90px]" />
          </div>

          {/* Harmonic Neighbor Legend Bar */}
          <div className="w-full flex flex-wrap items-center justify-center gap-2 pb-4 text-[11px] font-semibold border-b border-ink-800/80">
            <span className="text-ink-500 uppercase tracking-wider text-[10px] mr-1">Harmonic Family:</span>
            <span className="px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
              I • Tonic (Center)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30">
              IV • Subdominant (Left)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-gold-500/20 text-gold-300 border border-gold-500/30">
              V • Dominant (Right)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-gold-500/20 text-gold-300 border border-gold-500/30">
              vi • Relative Minor (Inner)
            </span>
          </div>

          {/* SVG Circular Visualizer */}
          <div className="relative w-full max-w-[460px] aspect-square flex items-center justify-center py-2 select-none">
            <svg
              viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
              className="w-full h-full drop-shadow-[0_4px_25px_rgba(0,0,0,0.6)]"
            >
              <defs>
                {/* Glow Filter */}
                <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Circular Plate */}
              <circle cx={center} cy={center} r={outerR + 10} fill="#0d0e11" stroke="#262626" strokeWidth="2" />
              <circle cx={center} cy={center} r={outerR} fill="#1c1917" />

              {/* 12 Outer Slices: Major Keys */}
              {CIRCLE_OF_FIFTHS_DATA.map((seg, i) => {
                const angleStart = i * 30 - 15;
                const angleEnd = i * 30 + 15;
                const pathD = describeArc(center, center, midR, outerR, angleStart, angleEnd);

                const isTonic = i === tonicIdx;
                const isSubdominant = i === subdominantIdx;
                const isDominant = i === dominantIdx;

                // Label center coords
                const labelPos = polarToCartesian(center, center, (outerR + midR) / 2, i * 30);
                const accPos = polarToCartesian(center, center, outerR - 16, i * 30);

                let fillClass = '#1c1917';
                let strokeClass = '#292524';
                let textClass = '#d6d3d1';

                if (isTonic) {
                  fillClass = '#d97706'; // Amber 600
                  strokeClass = '#fbbf24';
                  textClass = '#ffffff';
                } else if (isSubdominant) {
                  fillClass = '#0284c7'; // Sky 600
                  strokeClass = '#a78bfa';
                  textClass = '#ffffff';
                } else if (isDominant) {
                  fillClass = '#ea580c'; // Orange 600
                  strokeClass = '#fbbf24';
                  textClass = '#ffffff';
                }

                // Notation display
                let displayNote = seg.majorDisplay;
                if (notationMode === 'indian') {
                  const swara = getSwaraForNote(seg.majorKey, rootSa);
                  displayNote = swara.shortName;
                }

                return (
                  <g
                    key={`outer-${seg.index}`}
                    onClick={() => {
                      setSelectedSegmentIndex(i);
                      playChordVoicing(seg.majorKey, 'Major');
                    }}
                    className="cursor-pointer group transition-all"
                  >
                    <path
                      d={pathD}
                      fill={fillClass}
                      stroke={strokeClass}
                      strokeWidth={isTonic ? 3 : 1.5}
                      className="transition-all hover:brightness-125"
                      filter={isTonic ? 'url(#gold-glow)' : undefined}
                    />

                    {/* Major Key Text */}
                    <text
                      x={labelPos.x}
                      y={labelPos.y + (notationMode === 'indian' ? 4 : 5)}
                      textAnchor="middle"
                      fill={textClass}
                      fontSize={notationMode === 'indian' ? '17' : '19'}
                      fontWeight="900"
                      className="pointer-events-none font-sans"
                    >
                      {displayNote}
                    </text>

                    {/* Accidental count badge (e.g. 0, 1#, 2b) */}
                    <text
                      x={accPos.x}
                      y={accPos.y}
                      textAnchor="middle"
                      fill={isTonic ? '#fef3c7' : '#78716c'}
                      fontSize="9"
                      fontWeight="bold"
                      className="pointer-events-none font-mono"
                    >
                      {seg.accidentalCount > 0
                        ? `${seg.accidentalCount}#`
                        : seg.accidentalCount < 0
                        ? `${Math.abs(seg.accidentalCount)}b`
                        : '0'}
                    </text>
                  </g>
                );
              })}

              {/* 12 Inner Slices: Relative Minor Keys */}
              {CIRCLE_OF_FIFTHS_DATA.map((seg, i) => {
                const angleStart = i * 30 - 15;
                const angleEnd = i * 30 + 15;
                const pathD = describeArc(center, center, innerR, midR, angleStart, angleEnd);

                const isRelativeMinor = i === tonicIdx;
                const isSupertonic = i === subdominantIdx;
                const isMediant = i === dominantIdx;

                const labelPos = polarToCartesian(center, center, (midR + innerR) / 2, i * 30);

                let fillClass = '#141211';
                let strokeClass = '#27272a';
                let textClass = '#a1a1aa';

                if (isRelativeMinor) {
                  fillClass = '#059669'; // Emerald 600
                  strokeClass = '#fbbf24';
                  textClass = '#ffffff';
                } else if (isSupertonic) {
                  fillClass = '#0891b2'; // Cyan 600
                  strokeClass = '#fbbf24';
                  textClass = '#ffffff';
                } else if (isMediant) {
                  fillClass = '#7c3aed'; // Violet 600
                  strokeClass = '#a78bfa';
                  textClass = '#ffffff';
                }

                let displayNote = seg.minorDisplay;
                if (notationMode === 'indian') {
                  const swara = getSwaraForNote(seg.minorKey, rootSa);
                  displayNote = `${swara.shortName}m`;
                }

                return (
                  <g
                    key={`inner-${seg.index}`}
                    onClick={() => {
                      setSelectedSegmentIndex(i);
                      playChordVoicing(seg.minorKey, 'Minor');
                    }}
                    className="cursor-pointer group transition-all"
                  >
                    <path
                      d={pathD}
                      fill={fillClass}
                      stroke={strokeClass}
                      strokeWidth={isRelativeMinor ? 2.5 : 1.5}
                      className="transition-all hover:brightness-125"
                    />

                    {/* Minor Key Text */}
                    <text
                      x={labelPos.x}
                      y={labelPos.y + 4}
                      textAnchor="middle"
                      fill={textClass}
                      fontSize="12"
                      fontWeight="700"
                      className="pointer-events-none font-sans"
                    >
                      {displayNote}
                    </text>
                  </g>
                );
              })}

              {/* Center Core Hub: Current Key Snapshot */}
              <circle
                cx={center}
                cy={center}
                r={innerR - 4}
                fill="#0c0a09"
                stroke="#d97706"
                strokeWidth="2.5"
                filter="url(#gold-glow)"
              />

              <text
                x={center}
                y={center - 22}
                textAnchor="middle"
                fill="#f59e0b"
                fontSize="10"
                fontWeight="800"
                className="uppercase tracking-widest font-mono"
              >
                KEY TONIC
              </text>

              <text
                x={center}
                y={center + 8}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="28"
                fontWeight="900"
                className="font-sans"
              >
                {notationMode === 'indian'
                  ? `${getSwaraForNote(activeSegment.majorKey, rootSa).shortName} (${activeSegment.majorKey})`
                  : activeSegment.majorKey}
              </text>

              <text
                x={center}
                y={center + 26}
                textAnchor="middle"
                fill="#f97316"
                fontSize="12"
                fontWeight="700"
                className="font-sans"
              >
                Rel: {activeSegment.minorDisplay}
              </text>

              <text
                x={center}
                y={center + 42}
                textAnchor="middle"
                fill="#78716c"
                fontSize="9"
                fontWeight="600"
                className="font-mono"
              >
                {activeSegment.accidentalsList.length > 0
                  ? activeSegment.accidentalsList.join(' ')
                  : 'Natural'}
              </text>
            </svg>
          </div>

          {/* Quick Audio Playback Action Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => playChordVoicing(activeSegment.majorKey, 'Major')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Strum {activeSegment.majorKey} Major</span>
            </button>

            <button
              onClick={() => playChordVoicing(activeSegment.minorKey, 'Minor')}
              className="px-3.5 py-2 rounded-xl bg-ink-800 hover:bg-ink-700 text-gold-300 font-semibold text-xs border border-gold-500/30 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Strum {activeSegment.minorKey} Minor</span>
            </button>

            <button
              onClick={playCadence}
              disabled={isPlayingProgression}
              className="px-3.5 py-2 rounded-xl bg-ink-950 hover:bg-ink-850 text-brand-300 font-semibold text-xs border border-brand-500/40 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPlayingProgression ? 'Playing Cadence...' : 'Play I - IV - V - I'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Harmonic Details, Indian Thaat, and Scale Degrees (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Key Profile Card */}
          <div className="bg-ink-900 border border-ink-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-400 font-bold">
                  Key Harmonic Profile
                </span>
                <h3 className="text-2xl font-black text-white mt-0.5">
                  {activeSegment.majorKey} Major
                  <span className="text-base text-ink-400 font-medium ml-2">/ {activeSegment.minorDisplay}</span>
                </h3>
              </div>

              <span className="px-2.5 py-1 rounded-xl bg-brand-500/20 text-brand-300 font-bold text-xs border border-brand-500/30">
                {activeSegment.accidentals}
              </span>
            </div>

            {/* Indian Thaat & Sargam System Alignment (Indian mode only) */}
            {notationMode === 'indian' && (
            <div className="bg-ink-950/80 border border-ink-800 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-400 font-bold flex items-center gap-1.5">
                  <span>🪕 Indian Classical Thaat:</span>
                </span>
                <span className="text-brand-300 font-extrabold">{activeSegment.thaat}</span>
              </div>
              <p className="text-xs text-ink-400 leading-relaxed">
                {activeSegment.thaatExplanation}
              </p>
            </div>
            )}

            {/* Scale Notes Strip */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-400">
                Major Scale Degrees (7 Tones):
              </span>
              <div className="grid grid-cols-7 gap-1 text-center">
                {scaleData.notes.map((n, idx) => {
                  const swara = getSwaraForNote(n, rootSa);
                  const isRoot = idx === 0;
                  const isThird = idx === 2;
                  const isFifth = idx === 4;

                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center ${
                        isRoot
                          ? 'bg-brand-600/30 border-brand-500 text-brand-200 font-black'
                          : isThird || isFifth
                          ? 'bg-ink-950 border-brand-500/30 text-ink-200 font-bold'
                          : 'bg-ink-950 border-ink-800 text-ink-400'
                      }`}
                    >
                      <span className="text-xs font-extrabold">{n}</span>
                      <span className="text-[10px] text-brand-400/80 font-mono">
                        {notationMode === 'indian' ? swara.shortName : `Deg ${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Diatonic Chord Family Matrix (I, ii, iii, IV, V, vi, vii°) */}
          <div className="bg-ink-900 border border-ink-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-400" />
                <h4 className="font-bold text-sm text-ink-100">
                  Diatonic Chords in {activeSegment.majorKey} Major
                </h4>
              </div>
              <span className="text-[10px] text-ink-400 font-mono">Click to play</span>
            </div>

            <div className="space-y-2">
              {diatonicChords.map(chord => {
                const isTonicChord = chord.degreeNumeral === 'I';
                const isSubdominant = chord.degreeNumeral === 'IV';
                const isDominant = chord.degreeNumeral === 'V';
                const isRelMinor = chord.degreeNumeral === 'vi';

                let badgeColor = 'bg-ink-800 text-ink-300 border-ink-700';
                if (isTonicChord) badgeColor = 'bg-brand-500/20 text-brand-300 border-brand-500/40 font-bold';
                else if (isSubdominant) badgeColor = 'bg-violet-500/20 text-violet-300 border-violet-500/40 font-bold';
                else if (isDominant) badgeColor = 'bg-gold-500/20 text-gold-300 border-gold-500/40 font-bold';
                else if (isRelMinor) badgeColor = 'bg-gold-500/20 text-gold-300 border-gold-500/40 font-bold';

                return (
                  <div
                    key={chord.degreeNumeral}
                    className="bg-ink-950/80 border border-ink-800/90 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs hover:border-brand-500/30 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-8 h-7 rounded-lg flex items-center justify-center font-mono text-xs border ${badgeColor}`}>
                        {chord.degreeNumeral}
                      </span>
                      <div>
                        <div className="font-extrabold text-ink-200">
                          {chord.rootNote} {chord.chordType}
                        </div>
                        <div className="text-[10px] text-ink-400">
                          Triad: {chord.notes.join(' - ')}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => playChordVoicing(chord.rootNote, chord.chordType === 'Minor' ? 'Minor' : 'Major')}
                      className="px-2.5 py-1 rounded-lg bg-ink-900 hover:bg-ink-800 text-ink-300 hover:text-white border border-ink-800 text-[11px] font-semibold flex items-center gap-1 active:scale-95"
                    >
                      <Volume2 className="w-3 h-3 text-brand-400" />
                      <span>Hear</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
