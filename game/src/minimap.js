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

  draw(playerPos, playerYaw, traffic, peds, objective, police) {
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
    // Objective marker (a pulsing diamond) + GPS route (dashed line).
    if (objective) {
      const [ox, oz] = toMap(objective.x, objective.z);
      const [px0, pz0] = toMap(playerPos.x, playerPos.z);
      ctx.strokeStyle = 'rgba(242,201,76,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(px0, pz0); ctx.lineTo(ox, oz); ctx.stroke(); ctx.setLineDash([]);
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
    // Police (blue dots) + search zone.
    if (police && police.activeUnits().length) {
      const [zx, zy] = toMap(police.zone.x, police.zone.z);
      ctx.strokeStyle = 'rgba(42,106,255,0.7)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(zx, zy, (police.zone.r / span) * s, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#2a6aff';
      for (const u of police.activeUnits()) {
        const [x, z] = toMap(u.car.pos.x, u.car.pos.z);
        ctx.beginPath(); ctx.arc(x, z, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Heli (gold dot) + respray bay (teal ring).
    if (police && police.heli && police.heli.on) {
      const [hx, hz] = toMap(police.heli.group.position.x, police.heli.group.position.z);
      ctx.fillStyle = '#f2c94c'; ctx.beginPath(); ctx.arc(hx, hz, 4, 0, Math.PI * 2); ctx.fill();
    }
    if (police && police.respray) {
      const [rx, rz] = toMap(police.respray.x, police.respray.z);
      ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(rx, rz, 4, 0, Math.PI * 2); ctx.stroke();
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
