// The live minimap: a 2D canvas in the HUD corner that draws the road grid,
// the beach and the sea, the player arrow, police dots, the objective
// marker and a dashed GPS line to it. North is up — the city is a map, not
// a compass — so the player can read it at a glance. The pause screen
// reuses the same painter on a bigger canvas.

import { STREETS } from './city.js';

const WORLD_SPAN = 360;

function setup(canvas) {
  const ctx = canvas.getContext('2d');
  return { ctx, size: canvas.width };
}

export function drawMinimap(canvas, state) {
  const { ctx, size } = setup(canvas);
  const scale = size / WORLD_SPAN;
  const toX = (x) => (x + WORLD_SPAN / 2) * scale;
  const toY = (z) => (z + WORLD_SPAN / 2) * scale;

  ctx.clearRect(0, 0, size, size);
  // Sea + sand on the west edge.
  ctx.fillStyle = '#1d5f86';
  ctx.fillRect(0, 0, toX(-132), size);
  ctx.fillStyle = '#e8d49a';
  ctx.fillRect(toX(-150), 0, toX(-126) - toX(-150), size);
  // Blocks.
  ctx.fillStyle = '#2a2f36';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#3a3f46';
  for (const s of STREETS) {
    ctx.fillRect(0, toY(s) - 3 * scale * 2, size, 6 * scale * 2);
    ctx.fillRect(toX(s) - 3 * scale * 2, 0, 6 * scale * 2, size);
  }
  // Central plaza.
  ctx.fillStyle = '#d8cdb4';
  ctx.fillRect(toX(6), toY(6), toX(30) - toX(6), toY(30) - toY(6));

  // Search zone, when the police are hunting.
  if (state.zone) {
    ctx.strokeStyle = 'rgba(255, 90, 78, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(toX(state.zone.x), toY(state.zone.z), state.zone.r * scale, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Respray bay ring.
  if (state.bay) {
    ctx.strokeStyle = '#2e7fa8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(toX(state.bay.x), toY(state.bay.z), 7 * scale, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Race checkpoints, cyan; the next one is bigger.
  if (state.race) {
    state.race.checkpoints.forEach(([cx, cz], i) => {
      ctx.fillStyle = i === state.race.cp ? '#39d0ff' : 'rgba(57, 208, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(toX(cx), toY(cz), i === state.race.cp ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  // GPS route: dashed gold line from the player to the objective.
  if (state.target) {
    ctx.strokeStyle = '#f2c94c';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(toX(state.player.x), toY(state.player.z));
    ctx.lineTo(toX(state.target.x), toY(state.target.z));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.arc(toX(state.target.x), toY(state.target.z), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0c1218';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // Police units: blue dots, the helicopter gold.
  for (const unit of state.police ?? []) {
    ctx.fillStyle = '#4c7dc9';
    ctx.beginPath();
    ctx.arc(toX(unit.x), toY(unit.z), 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (state.heli) {
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.arc(toX(state.heli.x), toY(state.heli.z), 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Player arrow, pointing where Leo faces.
  ctx.save();
  ctx.translate(toX(state.player.x), toY(state.player.z));
  ctx.rotate(Math.PI - state.player.heading);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(5, 6);
  ctx.lineTo(-5, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
