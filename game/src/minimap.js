// The live minimap: a 2D canvas in the HUD corner that draws the road grid,
// the beach, the player arrow, traffic dots, pedestrian dots and the current
// objective marker, rotated so the player always points up.
import { CONFIG } from './config.js';

export class Minimap {
  constructor(canvas, city) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.city = city;
    this.size = canvas.width;
  }

  draw(playerPos, playerYaw, traffic, peds, objective) {
    const ctx = this.ctx;
    const s = this.size;
    const half = CONFIG.citySize / 2;
    const span = CONFIG.citySize + CONFIG.beachWidth + 20;
    const toMap = (x, z) => [((x + span / 2) / span) * s, ((z + span / 2) / span) * s];
    ctx.clearRect(0, 0, s, s);
    // Base.
    ctx.fillStyle = '#20262e';
    ctx.fillRect(0, 0, s, s);
    // Sea + beach on the east.
    const [bx] = toMap(half, 0);
    ctx.fillStyle = '#2e7fa8';
    ctx.fillRect(bx, 0, s - bx, s);
    ctx.fillStyle = '#e8d49a';
    ctx.fillRect(bx - ((CONFIG.beachWidth / span) * s), 0, (CONFIG.beachWidth / span) * s, s);
    // Blocks.
    ctx.fillStyle = '#3a4149';
    for (let i = 0; i < CONFIG.blocks; i++) {
      for (let j = 0; j < CONFIG.blocks; j++) {
        const [x, z] = toMap(-half + i * CONFIG.pitch, -half + j * CONFIG.pitch);
        ctx.fillRect(x, z, (CONFIG.blockSize / span) * s, (CONFIG.blockSize / span) * s);
      }
    }
    // Roads.
    ctx.strokeStyle = '#8a939e';
    ctx.lineWidth = Math.max(2, (CONFIG.roadWidth / span) * s * 0.6);
    for (const r of this.city.roads) {
      const [x1, z1] = toMap(r.axis === 'x' ? r.at : -half, r.axis === 'x' ? -half : r.at);
      const [x2, z2] = toMap(r.axis === 'x' ? r.at : half, r.axis === 'x' ? half : r.at);
      ctx.beginPath();
      ctx.moveTo(x1, z1);
      ctx.lineTo(x2, z2);
      ctx.stroke();
    }
    // Objective marker (a pulsing diamond).
    if (objective) {
      const [ox, oz] = toMap(objective.x, objective.z);
      const pulse = 4 + Math.sin(performance.now() / 250) * 1.5;
      ctx.fillStyle = '#f2c94c';
      ctx.beginPath();
      ctx.moveTo(ox, oz - pulse);
      ctx.lineTo(ox + pulse, oz);
      ctx.lineTo(ox, oz + pulse);
      ctx.lineTo(ox - pulse, oz);
      ctx.closePath();
      ctx.fill();
    }
    // Pedestrians (small pale dots).
    ctx.fillStyle = '#c9d4de';
    for (const p of peds) {
      const [x, z] = toMap(p.pos.x, p.pos.z);
      ctx.fillRect(x - 1, z - 1, 2, 2);
    }
    // Traffic (amber dots).
    ctx.fillStyle = '#f2a93c';
    for (const c of traffic) {
      const [x, z] = toMap(c.pos.x, c.pos.z);
      ctx.beginPath();
      ctx.arc(x, z, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Player arrow (white, pointing along the heading).
    const [px, pz] = toMap(playerPos.x, playerPos.z);
    ctx.save();
    ctx.translate(px, pz);
    // The arrow is drawn pointing up (-z on the map); rotate it to the
    // player's heading: (sin yaw, cos yaw) in map space is angle PI - yaw.
    ctx.rotate(Math.PI - playerYaw);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#20262e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
