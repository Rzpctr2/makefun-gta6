# Palma Verde — an open-world crime game

[![make.fun](https://img.shields.io/badge/make.fun-gta6--01-f2c94c)](https://make.fun/bounty/gta6-01)
[![Palma Verde](https://img.shields.io/badge/Palma%20Verde-Phase%202-2e7fa8)](https://make.fun/bounty/gta6-01)
[![status](https://img.shields.io/badge/status-playable-brightgreen)](https://make.fun/bounty/gta6-01)

A sun-soaked coastal city. One newcomer, **Leo Marin**, with $250 in his
pocket and the whole map open. Walk it, drive it — make it yours.

Entry for the [make.fun gta6-01 bounty](https://make.fun/bounty/gta6-01):
build an open-world crime game. All names, characters and places are
original — Palma Verde, Leo Marin, Nadia Sol, Kiko, Ilsa Maren.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network while playing: the game is plain static files
(`game/index.html` + ES modules, Three.js vendored as
`game/vendor/three.module.min.js`).

## Controls

- **W A S D** — move / drive · **Shift** — run · **E** — enter / leave a car
- **Drag mouse** — look around · **Esc** — pause (progress dashboard)
- **Q** — radio station · **M** — mute · **1 / 2 / 3** — Fists / Pistol / SMG
- **F** or click — shoot · **R** — reload

## What's inside

- **8 story missions** (data-driven engine: talk / reach / hold / combat /
  escape), par-time bonus $250, auto-advance, fail = retry, never game over
- **Street race side job** — Palma Verde Grand Loop, 7 checkpoints, 2 rivals,
  $1,000 + par bonus, repeatable; counts toward % COMPLETE
- **Wanted + police** — heat 0–100, 5 stars, 8 pursuit units with call signs,
  helicopter spotlight (3+ stars), roadblocks, "Fresh Coat" respray bay ($150)
- **Pause dashboard** — live map, mission grid, % COMPLETE
  (10% per mission + 10% race win + 10% for 5 escapes), stats, save slots
  via localStorage (autosave every 20 s + on pause)
- **Radio + procedural SFX** — 3 stations, 18 synthesized sounds, no audio files
- **Sunset / neon / dawn lighting** — 4 times of day, 6 named districts
  with landmarks, live minimap with GPS route to the objective
- **Combat** — hitscan, lock-on assist, tracers, 3 weapons (SMG unlocks
  after mission 5)

## Screenshots

Rendered headless from the real game (`?shot=` + seed 7, no edits):

| File | Shot |
|---|---|
| `1-chase.jpg` | Sunset police chase, mission 6, 4 stars (cover) |
| `2-street.jpg` | Golden-hour plaza, Nadia's dialog portrait |
| `3-drive.jpg` | Neon night drive, mission 2 on a timer, heli up |
| `4-mission.jpg` | Dawn at Bank Solmarina, mission 8, SMG out, 5 stars |

## Layout

- `game/` — the game (`index.html`, `src/*.js`, `vendor/`)
- `main.ts` — builds `/output/dossier.json` for the judge
  (`MAKEFUN_OUTPUT_DIR=out node main.ts`)
- `serve.ts` — static dev server on port 8080
- `shots.json` — the 4 staged screenshots and their queries
