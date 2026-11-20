// Canvas-painted textures: the whole city is drawn from code, so the game
// ships no image files at all. Each texture is painted once at boot.
import * as THREE from 'three';
import { CONFIG, PALETTE } from './config.js';

// A square canvas, painted by `paint`, wrapped as a texture.
function makeTexture(size, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  paint(canvas.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// A building face: warm wall, lit windows, a darker shopfront along the
// ground floor.
export function facadeTexture(base, trim) {
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    // A faint vertical wash keeps the wall from reading flat.
    const wash = ctx.createLinearGradient(0, 0, s, 0);
    wash.addColorStop(0, 'rgba(0,0,0,0.18)');
    wash.addColorStop(0.5, 'rgba(255,255,255,0.06)');
    wash.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, s, s);
    // Windows, 6 across by 10 down. The lit pattern is fixed arithmetic,
    // not random, so every facade of a colour reads the same.
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
    // Ground floor: shopfronts under the windows.
    ctx.fillStyle = trim;
    ctx.fillRect(0, s - 26, s, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let x = 8; x < s; x += 42) ctx.fillRect(x, s - 22, 30, 16);
  });
}

// A roof: plain warm grey, a darker inset rim, a few rooftop boxes.
export function roofTexture() {
  return makeTexture(128, (ctx, s) => {
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

// The ground: a single painted map of the whole city — roads with lane
// dashes, sidewalks, crosswalks, the central plaza and the beach strip. The
// plane is square and the texture maps 1:1 onto it, so this paints in world
// metres, converted to pixels.
export function groundTexture() {
  const size = 2048;
  const { pitch, blockSize, roadWidth, blocks, citySize, beachWidth } = CONFIG;
  const half = citySize / 2;
  const scale = size / (citySize + beachWidth + 40); // pixels per metre
  const toPx = (v) => (v + half + 20) * scale;
  return makeTexture(size, (ctx) => {
    // Start pale, then grass over everything, then pale stone again over
    // the built-up area: grass is what shows outside the grid.
    ctx.fillStyle = '#cfc8b8';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#7fae62';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#cfc8b8';
    ctx.fillRect(
      toPx(-half - 10),
      toPx(-half - 10),
      (citySize + 20) * scale,
      (citySize + 20) * scale,
    );
    // Sand along the east edge.
    ctx.fillStyle = '#e8d49a';
    ctx.fillRect(
      toPx(half),
      toPx(-half - 10),
      (beachWidth + 20) * scale,
      (citySize + 20) * scale,
    );
    // Blocks: warm pavement, each with a planted inner square — except the
    // middle block, the plaza, which stays open pavement.
    const middle = (blocks - 1) / 2;
    for (let bx = 0; bx < blocks; bx++) {
      for (let bz = 0; bz < blocks; bz++) {
        const x0 = -half + bx * pitch;
        const z0 = -half + bz * pitch;
        const plaza = bx === middle && bz === middle;
        ctx.fillStyle = plaza ? '#d8cdb4' : '#c9bfa5';
        ctx.fillRect(toPx(x0), toPx(z0), blockSize * scale, blockSize * scale);
        if (!plaza) {
          ctx.fillStyle = '#8fb573';
          const m = 9;
          ctx.fillRect(
            toPx(x0 + m),
            toPx(z0 + m),
            (blockSize - m * 2) * scale,
            (blockSize - m * 2) * scale,
          );
        }
      }
    }
    // Asphalt bands along every grid line, both directions.
    ctx.fillStyle = '#3a3f46';
    for (let i = 0; i <= blocks; i++) {
      const c = -half + i * pitch - roadWidth / 2;
      ctx.fillRect(
        toPx(c),
        toPx(-half - roadWidth / 2),
        roadWidth * scale,
        (citySize + roadWidth) * scale,
      );
      ctx.fillRect(
        toPx(-half - roadWidth / 2),
        toPx(c),
        (citySize + roadWidth) * scale,
        roadWidth * scale,
      );
    }
    // Dashes down the centre of each road.
    ctx.fillStyle = '#e8e4d8';
    for (let i = 0; i <= blocks; i++) {
      const c = -half + i * pitch - roadWidth / 2;
      for (let d = -half; d < half; d += 12) {
        ctx.fillRect(toPx(c + roadWidth / 2 - 0.4), toPx(d), 0.8 * scale, 5 * scale);
        ctx.fillRect(toPx(d), toPx(c + roadWidth / 2 - 0.4), 5 * scale, 0.8 * scale);
      }
    }
    // Crosswalk stripes at every crossing.
    ctx.fillStyle = 'rgba(232,228,216,0.85)';
    for (let i = 0; i <= blocks; i++) {
      for (let j = 0; j <= blocks; j++) {
        const cx = -half + i * pitch - roadWidth / 2;
        const cz = -half + j * pitch - roadWidth / 2;
        for (let s = 0; s < 5; s++) {
          ctx.fillRect(
            toPx(cx - roadWidth / 2 + 1 + s * 2.4),
            toPx(cz - 5.4),
            1.2 * scale,
            3.4 * scale,
          );
          ctx.fillRect(
            toPx(cx - 5.4),
            toPx(cz - roadWidth / 2 + 1 + s * 2.4),
            3.4 * scale,
            1.2 * scale,
          );
        }
      }
    }
    // Beach umbrellas: small dots of colour in a fixed scatter.
    const umbrellaColours = ['#e5534b', '#f2c94c', '#4fc3f7', '#ff8a65'];
    for (let k = 0; k < 26; k++) {
      const ux = half + 6 + ((k * 37) % beachWidth);
      const uz = -half + 12 + ((k * 53) % (citySize - 24));
      ctx.fillStyle = umbrellaColours[k % 4];
      ctx.beginPath();
      ctx.arc(toPx(ux), toPx(uz), 2.2 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// Water: soft repeating waves, scrolled slowly at runtime.
export function waterTexture() {
  const tex = makeTexture(256, (ctx, s) => {
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
