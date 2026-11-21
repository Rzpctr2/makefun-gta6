[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Rzpctr2/makefun-gta6/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Rzpctr2/makefun-gta6/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
# Palma Verde

An open-world crime game for the [make.fun gta6-01 bounty](https://make.fun/bounty/gta6-01).
You are **Leo Marin**, fresh off the ferry with $250 and no friends in a
sun-soaked coastal city. Every street is open. What you do with it is yours.

All names, people and places are original: Palma Verde, Leo Marin, Nadia Sol,
Kiko, Ilsa Maren. Nothing here is copied from any existing game.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step and no network while playing. The game is static files:
`game/index.html` plus ES modules, with Three.js vendored at
`game/vendor/three.module.min.js`.

## How to play

| Keys | Does what |
|---|---|
| **W A S D** | Walk, or drive when you're in a car |
| **Shift** | Run |
| **E** | Get in / out of a car |
| **Drag mouse** | Look around |
| **F** or click | Shoot |
| **R** | Reload |
| **1 / 2 / 3** | Fists / Pistol / SMG |
| **Q** | Change radio station · **M** mute |
| **Esc** | Pause — map, missions, progress, saves |

## What the city has

- **8 story missions** on a small data-driven engine (talk, reach, hold,
  combat, escape). A $250 par-time bonus per mission, the next one starts
  itself, failing just retries — there is no game over.
- **Palma Verde Grand Loop**, a street race side job: 7 checkpoints, two
  rubber-banded rivals, $1,000 for the win plus the par bonus, repeatable,
  and it counts toward % COMPLETE.
- **Wanted system and police**: heat 0–100 across 5 stars, 8 pursuit units
  with their own call signs, a helicopter spotlight once you hit 3 stars,
  roadblocks, and a "Fresh Coat" respray bay ($150) to cool off.
- **Pause dashboard**: a live map, the mission grid, % COMPLETE (10% per
  mission, 10% for a race win, 10% for five escapes), stats, and save slots
  in localStorage (autosave every 20 s and on pause).
- **Radio and sound**: 3 stations and 18 synthesized effects, all generated
  in code — there are no audio files in the repo.
- **A city that changes light**: four times of day from dawn to neon night,
  six named districts with landmarks, and a minimap that draws a GPS route
  to your objective.
- **Combat**: hitscan shooting with a lock-on assist, tracers, and three
  weapons — the SMG unlocks after mission 5.

## Screenshots

All four were rendered headless from the real game (`?shot=` with seed 7,
no edits):

| File | What it shows |
|---|---|
| `1-chase.jpg` | Sunset police chase, mission 6, 4 stars (cover) |
| `2-street.jpg` | Golden-hour plaza, Nadia's dialog portrait |
| `3-drive.jpg` | Neon night drive, mission 2 on a timer, heli up |
| `4-mission.jpg` | Dawn at Bank Solmarina, mission 8, SMG out, 5 stars |

## Files

- `game/` — the game itself (`index.html`, `src/*.js`, `vendor/`)
- `main.ts` — builds `/output/dossier.json` for the judge:
  `MAKEFUN_OUTPUT_DIR=out node main.ts`
- `serve.ts` — the static dev server on port 8080
- `shots.json` — the four staged screenshots and the queries that made them
