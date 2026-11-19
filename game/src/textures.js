// Canvas-generated textures: the whole city is painted from code, so the
// game ships no image files at all. Every texture is drawn once at boot.
import * as THREE from 'three';
import { CONFIG, PALETTE } from './config.js';

function canvasTexture(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// A building facade: lit windows on a warm wall, with a darker ground floor.
export function facadeTexture(base, trim) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    // Subtle vertical shading so the wall is not flat.
    const grad = ctx.createLinearGradient(0, 0, s, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0.18)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.06)');
    grad.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    // Window grid: 6 columns x 10 rows, some lit warm, some dark glass.
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 6; col++) {
        const x = 14 + col * 40;
        const y = 14 + row * 24;
        const lit = ((row * 7 + col * 3) % 5) < 2;
        ctx.fillStyle = lit ? '#ffd98a' : '#2c3e50';
        ctx.fillRect(x, y, 24, 14);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(x, y, 24, 3);
      }
    }
    // Ground floor: shopfronts.
    ctx.fillStyle = trim;
    ctx.fillRect(0, s - 26, s, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let x = 8; x < s; x += 42) ctx.fillRect(x, s - 22, 30, 16);
  });
}

// Roof: plain warm grey with a darker rim and a few rooftop boxes.
export function roofTexture() {
  return canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = '#8a8378';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#6f6a61';
    ctx.fillRect(6, 6, s - 12, s - 12);
    ctx.fillStyle = '#9a948a';
    ctx.fillRect(20, 20, 26, 18);
    ctx.fillRect(78, 60, 30, 22);
    ctx.fillStyle = '#5d5952';
    ctx.fillRect(48, 84, 18, 18);
  });
}

// The ground: one big painted map of the whole city — roads, lane dashes,
// sidewalks, crosswalks, the central plaza and the beach strip. The plane is
// square and the texture maps 1:1 onto it, so drawing is in world metres.
export function groundTexture() {
  const size = 2048;
  const { pitch, blockSize, roadWidth, blocks, citySize, beachWidth } = CONFIG;
  const half = citySize / 2;
  const scale = size / (citySize + beachWidth + 40); // px per metre
  const toPx = (v) => (v + half + 20) * scale;
  return canvasTexture(size, (ctx) => {
    // Base: sidewalk pale stone everywhere.
    ctx.fillStyle = '#cfc8b8';
    ctx.fillRect(0, 0, size, size);
    // Grass corners outside the grid.
    ctx.fillStyle = '#7fae62';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#cfc8b8';
    ctx.fillRect(toPx(-half - 10), toPx(-half - 10), (citySize + 20) * scale, (citySize + 20) * scale);
    // Beach strip on the east edge.
    ctx.fillStyle = '#e8d49a';
    ctx.fillRect(toPx(half), toPx(-half - 10), (beachWidth + 20) * scale, (citySize + 20) * scale);
    // Blocks: warm pavement with a planted inner square.
    for (let bx = 0; bx < blocks; bx++) {
      for (let bz = 0; bz < blocks; bz++) {
        const x0 = -half + bx * pitch;
        const z0 = -half + bz * pitch;
        const cx = (bx === (blocks - 1) / 2) && (bz === (blocks - 1) / 2);
        ctx.fillStyle = cx ? '#d8cdb4' : '#c9bfa5';
        ctx.fillRect(toPx(x0), toPx(z0), blockSize * scale, blockSize * scale);
        if (!cx) {
          ctx.fillStyle = '#8fb573';
          const m = 9;
          ctx.fillRect(toPx(x0 + m), toPx(z0 + m), (blockSize - m * 2) * scale, (blockSize - m * 2) * scale);
        }
      }
    }
    // Roads: asphalt bands along every grid line.
    ctx.fillStyle = '#3a3f46';
    for (let i = 0; i <= blocks; i++) {
      const c = -half + i * pitch - roadWidth / 2;
      ctx.fillRect(toPx(c), toPx(-half - roadWidth / 2), roadWidth * scale, (citySize + roadWidth) * scale);
      ctx.fillRect(toPx(-half - roadWidth / 2), toPx(c), (citySize + roadWidth) * scale, roadWidth * scale);
    }
    // Lane dashes, centre of each road.
    ctx.fillStyle = '#e8e4d8';
    for (let i = 0; i <= blocks; i++) {
      const c = -half + i * pitch - roadWidth / 2;
      for (let d = -half; d < half; d += 12) {
        ctx.fillRect(toPx(c + roadWidth / 2 - 0.4), toPx(d), 0.8 * scale, 5 * scale);
        ctx.fillRect(toPx(d), toPx(c + roadWidth / 2 - 0.4), 5 * scale, 0.8 * scale);
      }
    }
    // Crosswalk stripes at every intersection.
    ctx.fillStyle = 'rgba(232,228,216,0.85)';
    for (let i = 0; i <= blocks; i++) {
      for (let j = 0; j <= blocks; j++) {
        const cx = -half + i * pitch - roadWidth / 2;
        const cz = -half + j * pitch - roadWidth / 2;
        for (let s = 0; s < 5; s++) {
          ctx.fillRect(toPx(cx - roadWidth / 2 + 1 + s * 2.4), toPx(cz - 5.4), 1.2 * scale, 3.4 * scale);
          ctx.fillRect(toPx(cx - 5.4), toPx(cz - roadWidth / 2 + 1 + s * 2.4), 3.4 * scale, 1.2 * scale);
        }
      }
    }
    // Beach umbrellas: tiny dots of colour.
    for (let k = 0; k < 26; k++) {
      const ux = half + 6 + ((k * 37) % beachWidth);
      const uz = -half + 12 + ((k * 53) % (citySize - 24));
      ctx.fillStyle = ['#e5534b', '#f2c94c', '#4fc3f7', '#ff8a65'][k % 4];
      ctx.beginPath();
      ctx.arc(toPx(ux), toPx(uz), 2.2 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// Water: repeating soft waves, scrolled slowly at runtime.
export function waterTexture() {
  const tex = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#2e7fa8';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 3;
    for (let y = 16; y < s; y += 32) {
      ctx.beginPath();
      for (let x = 0; x <= s; x += 16) {
        const yy = y + Math.sin((x / s) * Math.PI * 2 + y) * 5;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 10);
  return tex;
}

export { PALETTE };
