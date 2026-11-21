// Every surface in Palma Verde is painted in code at boot, so the game
// ships zero image files. One canvas per material, drawn once, reused by
// every mesh that shares it — facades, roads, sand and sea included.

import * as THREE from 'three';

function blankCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return [canvas, canvas.getContext('2d')];
}

function toTexture(canvas, repeatX = 1, repeatY = 1, rotation = 0) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (rotation) {
    tex.center.set(0.5, 0.5);
    tex.rotation = rotation;
  }
  return tex;
}

// A building face: flat base colour, a grid of windows, a few lit warm,
// a darker ground floor and a pale parapet line on top.
function paintFacade(rng, base, floors, cols) {
  const [canvas, ctx] = blankCanvas(128, 256);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 256);
  const winW = 128 / cols;
  const winH = 256 / (floors + 1);
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < cols; c++) {
      const lit = rng.chance(0.28);
      ctx.fillStyle = lit ? '#ffd98a' : '#20262e';
      ctx.fillRect(c * winW + winW * 0.22, f * winH + winH * 0.3, winW * 0.56, winH * 0.44);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 256 - 22, 128, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(0, 0, 128, 4);
  return canvas;
}

function paintRoad() {
  const [canvas, ctx] = blankCanvas(128, 128);
  ctx.fillStyle = '#3a3f46';
  ctx.fillRect(0, 0, 128, 128);
  // Speckle so the asphalt is not a flat slab at street level.
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
  }
  ctx.fillStyle = '#f2c94c';
  ctx.fillRect(62, 8, 4, 44);
  ctx.fillRect(62, 76, 4, 44);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(4, 0, 3, 128);
  ctx.fillRect(121, 0, 3, 128);
  return canvas;
}

function paintSidewalk() {
  const [canvas, ctx] = blankCanvas(128, 128);
  ctx.fillStyle = '#cfc8b8';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath(); ctx.moveTo(i * 32, 0); ctx.lineTo(i * 32, 128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * 32); ctx.lineTo(128, i * 32); ctx.stroke();
  }
  return canvas;
}

function paintSand(rng) {
  const [canvas, ctx] = blankCanvas(128, 128);
  ctx.fillStyle = '#e8d49a';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = rng.chance(0.5) ? 'rgba(120,90,40,0.25)' : 'rgba(255,250,230,0.35)';
    ctx.fillRect(rng.range(0, 128), rng.range(0, 128), 2, 2);
  }
  return canvas;
}

function paintSea() {
  const [canvas, ctx] = blankCanvas(128, 128);
  const grad = ctx.createLinearGradient(0, 0, 128, 128);
  grad.addColorStop(0, '#2e7fa8');
  grad.addColorStop(1, '#1d5f86');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  for (let y = 16; y < 128; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(32, y - 6, 96, y + 6, 128, y);
    ctx.stroke();
  }
  return canvas;
}

const FACADE_BASES = ['#c9a37e', '#b98a68', '#d8cdb4', '#a8b8b0', '#c96f4a', '#8fa8a0', '#d8b48a'];

export function makeTextures(rng) {
  const facades = FACADE_BASES.map((base) => toTexture(
    paintFacade(rng.fork(base), base, rng.int(3, 7), rng.int(3, 5)),
  ));
  // One road canvas, two orientations: the painted dashes run along V, so
  // the along-Z strips take it straight (repeat 1x27) while the along-X
  // strips take it rotated 90 deg (repeat 1x27 then rotate = 27 along U).
  const roadCanvas = paintRoad();
  return {
    facades,
    roadX: toTexture(roadCanvas, 1, 27, Math.PI / 2),
    roadZ: toTexture(roadCanvas, 1, 27),
    sidewalk: toTexture(paintSidewalk(), 8, 8),
    sand: toTexture(paintSand(rng.fork('sand')), 10, 10),
    sea: toTexture(paintSea(), 6, 6),
  };
}

// Flat colours the code reaches for directly, without a texture.
export const FLAT = {
  asphalt: 0x3a3f46,
  sidewalk: 0xcfc8b8,
  sand: 0xe8d49a,
  sea: 0x2e7fa8,
  grass: 0x7fae62,
  plaza: 0xd8cdb4,
  trunk: 0x6b4a2f,
  leaf: 0x4e7d3a,
  neonPink: 0xff5a8a,
  neonCyan: 0x39d0ff,
};
