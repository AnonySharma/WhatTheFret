# What The Fret

An interactive web app that untangles music theory and maps the **+4 / +3 triad logic** directly onto the guitar neck. Instead of memorising chord and scale shapes, you learn the interval math behind them and see it on a live fretboard.

**Live site:** https://anonysharma.github.io/WhatTheFret/

## Features

- **Guided lessons**: seven interactive modules, each with its own visualiser:
  1. The 12 tones and tuning by ear (5th-fret rule, and the 4th-fret exception on the G string)
  2. Deriving the major scale (W-W-H-W-W-W-H) and the relative minor (root - 3 frets)
  3. The +4 / +3 triad code (major = +4, +3; minor = +3, +4)
  4. Diatonic harmony ("skip one, take one")
  5. Fretboard mapping and bass gravity
  6. Barre chords
  7. Chord derivation
- **Chord library** and an **interactive fretboard** with audio playback
- **Circle of Fifths** explorer
- **Real-time tuner** with pitch detection (Hz and cents) from your microphone, plus a metronome
- **Indian swaras explorer**: Sa Re Ga Ma and the Shuddha/Komal mapping to semitones
- **Fretboard quiz** and progress tracking (saved in your browser's `localStorage`)
- **Companion view** for the original "Intuitive Guitar Theory" PDF (included in the repo)

The tuner needs microphone permission. Audio is synthesised in the browser, and nothing is sent to a server.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS 4, lucide-react, canvas-confetti. Package management with [Bun](https://bun.sh).

## Getting started

```bash
bun install
bun run dev        # http://localhost:3000/WhatTheFret/
```

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `bun run dev`     | Start the dev server                     |
| `bun run build`   | Production build into `dist/`            |
| `bun run preview` | Serve the production build locally       |
| `bun run test`    | Run the music-theory unit tests          |
| `bun run lint`    | Type-check with `tsc --noEmit`           |

## Project structure

```
src/
  App.tsx              App shell and tab routing
  constants.tsx        Lesson content, chord data, swaras
  components/          UI: fretboard, tuner, chord library, ...
  components/modules/  The seven lesson modules
  utils/
    guitarTheory.ts    Pure theory logic (scales, triads, barre chords)
    audioSynth.ts      Web Audio synthesis
    pitchDetector.ts   Microphone pitch detection
    metronome.ts       Metronome
    progressStore.ts   localStorage progress
public/assets/docs/    Companion PDF
```

## Deployment

This branch (`deploy`) is deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push. The workflow installs dependencies, runs the tests, builds, and publishes `dist/`.

One-time setup: in the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

The Vite `base` is set to `/WhatTheFret/` in `vite.config.ts`. If you rename the repository or use a custom domain, update it to match.
