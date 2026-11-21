// Palma Verde — the make.fun gta6-01 entrypoint (Node 22, stdlib only).
// The game is plain static files: game/index.html plus ES modules, with
// Three.js vendored under game/vendor — no network while playing, no build
// step. This program packs the entry for the judge: it copies game/,
// screenshots/ and the README into the output directory and writes
// /output/dossier.json with the vendored make.fun library.
//
// Play locally first: `node serve.ts`, then http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyIfPresent(name) {
  const from = join(here, name);
  if (!existsSync(from)) return;
  cpSync(from, join(out, name), { recursive: true });
}

mkdirSync(out, { recursive: true });
copyIfPresent('game');
mkdirSync(join(out, 'screenshots'), { recursive: true });
copyIfPresent('screenshots');
// Ship the README beside the dossier so the entry describes itself even
// outside the repo (round-2 rebuild: fresh implementation, same game).
copyIfPresent('README.md');

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest
// refuse an entry the scorer would refuse — more than 4 screenshots or one
// over 256 KiB; more than 993 files in game/ or 48 MiB of game files in
// all; a path under game/ over 1000 bytes. game/ counts beside /output's
// own 1000-entry cap, together with screenshots/ and dossier.json.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
