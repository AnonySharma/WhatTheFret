<div align="center">

<img src="public/icon-192.png" alt="WhatTheFret icon: an amber guitar pick with strings and a fretted note" width="96" height="96" />

# WhatTheFret

**Captures the exact feeling a student has when the math of the fretboard finally clicks.**

[**▶ Open the live app**](https://anonysharma.github.io/WhatTheFret/) &nbsp;·&nbsp; React 19 &nbsp;·&nbsp; TypeScript &nbsp;·&nbsp; Web Audio &nbsp;·&nbsp; zero backend

</div>

---

## The idea

Most people learn guitar by memorising shapes: *"this finger here, that finger there, don't ask why."*
Then they hit a barre chord, a key change, or a raaga, and the shapes stop helping.

WhatTheFret teaches the **math underneath the shapes** instead. A major chord is *+4 then +3*. A minor chord is *+3 then +4*. Every scale is the same pattern of whole and half steps. Once you see that on a live fretboard, and *hear* it, the whole neck stops being a wall of dots.

> Major = **+4, +3**  ·  Minor = **+3, +4**  ·  Diminished = **+3, +3**
> Skip one, take one, and you've built the harmony of an entire key.

## What's inside

### 🎓 Seven guided lessons
Each has its own interactive visualiser, so you play with the idea instead of reading about it.

| # | Lesson | The "aha" |
|---|--------|-----------|
| 1 | The 12 tones & tuning by ear | The 5th-fret rule (and why the G string breaks it), plus a **beat-note demo**: hear two strings drift together until the wobble disappears |
| 2 | The major scale | W-W-H-W-W-W-H, and the relative minor is just *root − 3 frets* |
| 3 | The +4 / +3 triad code | Chords are stacked thirds, not shapes |
| 4 | Diatonic harmony | "Skip one, take one" gives you every chord in a key |
| 5 | Fretboard mapping | Bass gravity: the lowest note names the chord |
| 6 | Barre chords | One shape, twelve keys |
| 7 | Chord derivation | Build any chord from scratch |

### 🎸 Chord library: 183 voicings, every root
- **Symbol-aware search**: type `Am`, `F#m7`, `Bbmaj7`, `Dsus4` or `B minor` and get the right chord first.
- Open and barre-free shapes where they exist, movable E-shape and A-shape grips for every root, plus Maj7, 7, m7, sus2/4, add9, dim, aug and power chords.
- **Chord-specific finger guide**: colour-matched to the dots on the neck, with the root note ringed in white.
- **Strum it**: down, up, or arpeggio. Each string wobbles and settles in time with the sound.
- **♥ Favorites**: save the chords you keep coming back to (stored in your browser).

### 🧪 Theory labs
Also reachable by link, e.g. `#labs/caged`.

- **Transposer**: move a progression between keys, capo shortcuts, borrowed chords, pivot chords
- **CAGED**: all five shapes of any major chord across the neck, colour-coded, with audio
- **Ear Trainer**: name mystery intervals, or find a mystery note on *your own guitar* with the microphone
- **Tanpura & Jam** *(Indian mode)*: a synthesised tanpura drone, five taal cycles and a pad for any raaga

### 🪕 Indian mode: one switch
Flip the **Indian** toggle in the top bar and the app grows an Indian-music layer: Sa Re Ga labels on the fretboard, a Raagas & Swaras explorer, Thaat cards on the Circle of Fifths, the tanpura lab, and swara callouts inside the lessons. Flip it off and all of that disappears, so Western-only learners aren't buried in extras.

### 🎙 Tools you'll actually keep open
- **Real-time tuner**: pitch detection in Hz and cents from your microphone
- **Metronome** in the top bar, with a link to the full version
- **Interactive fretboard** with note, interval and sargam views
- **Circle of Fifths** explorer
- **Fretboard quiz** with scoring, streaks and ranks. Progress is saved in your browser.
- **Companion view** for the original *Intuitive Guitar Theory* PDF (included in the repo)

> 🔒 **Privacy:** audio is synthesised in your browser and the tuner listens locally. Nothing is recorded or sent to a server. The mic needs your permission.

## Run it locally

```bash
bun install
bun run dev        # http://localhost:3000/WhatTheFret/
```

| Script            | What it does                         |
| ----------------- | ------------------------------------ |
| `bun run dev`     | Start the dev server                 |
| `bun run build`   | Production build into `dist/`        |
| `bun run preview` | Serve the production build locally   |
| `bun run test`    | Run the music-theory unit tests      |
| `bun run lint`    | Type-check with `tsc --noEmit`       |

## Under the hood

React 19 · TypeScript · Vite · Tailwind CSS 4 (design tokens in `src/index.css`: warm stone surfaces, amber/orange accents) · lucide-react · canvas-confetti · Bun

The music theory is **pure functions with tests**, kept apart from the UI so the maths can be trusted:

```
src/
  App.tsx              App shell and tab routing
  constants.tsx        Lesson content, chord data, swaras
  components/          UI: fretboard, tuner, chord library, ...
  components/modules/  The seven lesson modules
  components/labs/     Transposer, CAGED, Tanpura & Jam, Ear Trainer
  utils/
    guitarTheory.ts    Scales, triads, barre chords, intervals
    chordShapes.ts     Generates movable E/A-shape grips for every root
    chordSearch.ts     Chord-symbol parsing and ranking
    labs.ts            Transposing, CAGED, taals, intervals
    beats.ts           Beat-note maths for the tuning lesson
    audioSynth.ts      Web Audio guitar synthesis
    drone.ts           Tanpura and taal engines
    pitchDetector.ts   Microphone pitch detection (shared by all listeners)
    metronome.ts       Metronome
    useStringVibration.ts  String-wobble animation state
    progressStore.ts   localStorage progress
tests/                 Unit tests (`bun run test`)
public/assets/docs/    Companion PDF
```

## Deployment

The `deploy` branch is published to GitHub Pages by `.github/workflows/deploy.yml` on every push. The workflow installs dependencies, runs the tests, builds, and publishes `dist/`.

One-time setup: in the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

The Vite `base` is set to `/WhatTheFret/` in `vite.config.ts`. If you rename the repository or use a custom domain, update it to match.

---

<div align="center">

*Built for the moment someone looks at the neck and says, "…oh. **That's** what the fret is."*

</div>
