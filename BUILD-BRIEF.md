# BUILD BRIEF — Palma Verde Round-2 Rebuild (gta6-01, target JUARA 1)

> Read this first. It is the design the fresh code implements. Round 1
> (commit 631ddcb0) was rejected for provenance, not for the game: the
> game below is the same game, re-implemented line by line in the
> recorded session so ≥30% of counted lines are authored by it.

## 0. Facts

- Bounty gta6-01 "Make GTA 6", $1,666, 100 paid places (1st $500).
  Resubmit deadline **24 Nov 2026 22:00 WIB**. Results 10 Dec.
- Recording round 2: `01a1fdaf-d50a-7641-87ab-850cb49f817f`, started
  21 Nov 17:38 WIB, before this session began.
- Repo: https://github.com/Rzpctr2/makefun-gta6 (public). Quota at round 1:
  1 entry made, 2 left that day, hard limit 19/20, can_submit yes.
- Total source ≤160 KiB (163,840 bytes) so the judge sees every file.

## 1. Non-negotiables

1. **Make a game, not a rubric entry.** Benchmark = GTA San Andreas
   feel — sun-soaked, golden hour, palms, neon nights — with fully
   original names, characters and places (Palma Verde, Leo Marin,
   Nadia Sol, Kiko, Ilsa Maren).
2. **Two games must win:** the screenshot contact sheet the AI judge
   reads, and live play by the make.fun team for the top 10. The core
   loop must run: mission → crime → wanted → chase → escape → reward.
3. **Every system must be visible in a staged shot.** If it cannot be
   forced into a `?shot=` frame, it is not built.
4. **Transcript gate:** ≥30% authored lines, entrypoint included,
   unwritten ≤40%, every counted file written during the recording.

## 2. The city

- Streets every 36 m from -144 to +144, 12 m road, 24 m blocks.
- West edge is sea with a wavy shoreline (bay + headland, never a
  straight line); sand beach between shore and town.
- Six districts tile the map: Pelabuhan Solmar (harbour, pier,
  lighthouse), Casco Viejo (old town, fountain), Bukit Marisol
  (hillside villas), Boulevard Palma (ferris wheel, palm rows), La Rosa
  (neon, clock tower), Mercado (fish market). District banners on entry.
- ~200 seeded buildings (InstancedMesh), palm rows, street lamps that
  light at night, 14 traffic cars, 26 parked cars, 22 pedestrians.

## 3. The eight missions

| # | Title | New mechanic | Reward |
|---|---|---|---|
| 1 | Selamat Datang di Palma Verde | tutorial: walk, drive, minimap | $300 |
| 2 | Paket Panas | delivery timer | $500 + REP |
| 3 | Tukar Guling | steal the sports car, lose the heat | $700 + sport car |
| 4 | Sarang di Menara | first shootout, 3 foes | $1,200 + pistol |
| 5 | Kasir Kosong | 20 s hold while the safe cracks | $1,500 + SMG |
| 6 | Sopir Pelarian | getaway drive, 4 stars, Ilsa shoots | $2,000 + NOS |
| 7 | Jembatan Terbakar | ambush a convoy, destroy 3 cars | $2,500 + REP |
| 8 | Bank Solmarina | vault hold + shootout + escape, 5 stars | $5,000 + ending |

Stages: talk / reach / hold / combat / combatCars / escape / wanted.
Par-time bonus $250. Fail = toast + retry, never game over.
Auto-start next mission 2.5 s after the previous ends.

## 4. Wanted + police

- Heat 0–100, stars = floor(heat/20). Crimes: steal +25, hit ped +20,
  shoot +30, kill +40, kill cop +50. Only witnessed crimes count
  (ped within 300 m, police within 520 m, or already wanted).
- 8 units, deterministic call signs (IBIS-10, TARPON-17, …), intercept
  pursuit, unstick reverse, RAMMING / BOXING IN / PURSUIT status.
- Helicopter (visual + spotlight cone) at 3+ stars; roadblock 80 m ahead
  at 3+ stars with a gap to thread; "Fresh Coat" respray bay $150 clears
  wanted. Busted (on foot, ≤2 stars, slow, unit <3 m, 1.6 s) = $200 fine
  + safehouse respawn. Evade: unseen + outside the search zone for
  5 + 1.8×stars seconds, then heat decays.

## 5. Feel

- Speed FOV 62°→72°, trauma shake (trauma²×0.15 m, decay 1.5/s;
  pistol +0.12, kill +0.25, crash up to +0.70; forced 0 in shots).
- Car-car collisions (push + speed ×0.7 + thud); wall hit cuts speed
  ×0.55 once; steering authority halves at top speed; yaw cap 2.2 rad/s.
- dt clamped [0, 0.05] (headless virtual time can go negative).
- Lock-on assist in a 15° cone; crosshair turns red on lock.
- Radio: 3 synth stations (synthwave 112 bpm, latin 96, talk 80) +
  18 procedural SFX, lazy AudioContext, no-op without a gesture.
- Clock: 1 game minute per ~2 real seconds; 4 staged times (dawn 6:00,
  noon 12:00, golden hour 18:52, neon night 21:00).

## 6. Shots (shots.json, seed 7)

1. `1-chase.jpg` — sunset chase, mission 6, 4 stars (cover).
2. `2-street.jpg` — golden-hour plaza, Nadia dialog portrait.
3. `3-drive.jpg` — neon night drive, mission 2 timer, heli up.
4. `4-mission.jpg` — dawn at Bank Solmarina, mission 8, SMG, 5 stars.

## 7. What is NOT built

Full economy/shops, collectibles, full heli AI, 4th station, extra
districts, side activities beyond the race, 4th weapon, 4-tab pause,
custom WebGL renderer, rain (rejected: "wet after rain" only).
