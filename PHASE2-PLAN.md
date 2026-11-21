# Palma Verde — Rebuild Plan, Round 2 (gta6-01)

> Round 1 was rejected 20 Nov 2026: only 12.6% of counted lines were
> authored by the agent (442/3,502; need ≥30%) and 9 files were already
> final when the recording began. Round 2 rewrites the whole game fresh,
> in one recorded session, before the resubmit deadline 24 Nov 22:00 WIB.

## The game (unchanged design, fresh code)

Open-world crime 3D in a sun-soaked coastal city. Leo Marin, $250, the
whole map open. 8 story missions, street race, wanted + police, radio,
combat, 6 districts, 4 times of day, pause dashboard, localStorage saves.

## Systems and their files

| System | File | Notes |
|---|---|---|
| Seeded RNG | `game/src/rng.js` | mulberry32 + toolbox; seed 7 reproduces the city |
| Tuning | `game/src/config.js` | world, car, wanted, weapons, economy, palette |
| Input | `game/src/input.js` | keys + mouse look, edge-triggered actions |
| Save | `game/src/save.js` | versioned localStorage slot, one-line summary |
| Textures | `game/src/textures.js` | canvas-painted facades, road, sand, sea |
| City | `game/src/city.js` | streets, wavy shoreline, buildings, palms, lamps, landmarks |
| Districts | `game/src/districts.js` | 6 named districts + landmark list |
| Lighting | `game/src/lighting.js` | 4 time-of-day keyframes, night factor |
| Vehicles | `game/src/vehicles.js` | arcade car, Manhattan traffic, parked rows, bumps |
| Pedestrians | `game/src/peds.js` | sidewalk walkers, panic + witness behaviour |
| Player | `game/src/player.js` | Leo on foot, camera-relative movement |
| Combat | `game/src/combat.js` | hitscan, lock-on, tracers, Fists/Pistol/SMG |
| Police | `game/src/police.js` | heat/stars, 8 units, heli, roadblock, respray bay |
| Radio | `game/src/radio.js` | 3 synth stations + 18 procedural SFX |
| Dialog | `game/src/dialog.js` | portrait overlay, typewriter |
| Missions | `game/src/missions.js` | 8 missions + race, 5 stage types |
| Minimap | `game/src/minimap.js` | 2D canvas map + GPS route |
| HUD | `game/src/hud.js` | cached DOM writes, pause dashboard |
| Shots | `game/src/shots.js` | 4 staged scenes |
| Bootstrap | `game/src/main.js` | loop, camera, crimes, shots, title/pause |

## Rules of the rebuild

1. Recording first, session second: recording `01a1fdaf` started 21 Nov
   17:38 WIB; this session began after it. Never write code outside it.
2. Every counted file is rewritten by this session's own write/edit calls
   — no copy, no paste, no clone. Vendor files (kit starter, byte-identical)
   are left untouched.
3. Total source stays ≤160 KiB so the judge's outline sees every file.
4. Verify before submitting: syntax-check every module, render all 4
   shots headless, `main.ts` runs, `makefun check` green on the pushed
   commit's replica.
5. Submit: `node cli/makefun.mjs submit --competition gta6-01
   --recording 01a1fdaf-d50a-7641-87ab-850cb49f817f --repo-url
   https://github.com/Rzpctr2/makefun-gta6 --commit <sha> --title
   "Palma Verde" --keypair ~/workspace/makefun/makefun-keypair.json
   --repo <repo>` — before 24 Nov 22:00 WIB.
