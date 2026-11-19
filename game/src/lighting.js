// Lighting: time-of-day keyframes lerped over sun, fog, sky and hemi.
// 4 looks for 4 shots: dawn, day, golden hour 18:52, neon night 21:00.
import * as THREE from 'three';
const KEYS = [
  { h: 6, sky: 0xf2b48a, fog: 0xe8c8a8, sun: 0xffd9a0, sunI: 1.4, hemi: 0.7 },
  { h: 12, sky: 0x8ec9e8, fog: 0xcfe4ef, sun: 0xfff2d8, sunI: 2.2, hemi: 1.1 },
  { h: 18.87, sky: 0xff8a5c, fog: 0xe8a06a, sun: 0xffb36a, sunI: 1.9, hemi: 0.8 },
  { h: 21, sky: 0x141c33, fog: 0x1a2238, sun: 0x8aa0ff, sunI: 0.7, hemi: 0.35 },
  { h: 24, sky: 0x141c33, fog: 0x1a2238, sun: 0x8aa0ff, sunI: 0.7, hemi: 0.35 },
];
const lerpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
export class Lighting {
  constructor(scene, sun, hemi) { this.scene = scene; this.sun = sun; this.hemi = hemi; this.hour = 9; }
  setHour(h) {
    this.hour = h;
    let a = KEYS[0], b = KEYS[KEYS.length - 1];
    for (let i = 0; i < KEYS.length - 1; i++) if (h >= KEYS[i].h && h <= KEYS[i + 1].h) { a = KEYS[i]; b = KEYS[i + 1]; break; }
    const t = Math.max(0, Math.min(1, (h - a.h) / (b.h - a.h || 1)));
    this.scene.background = lerpC(a.sky, b.sky, t);
    this.scene.fog.color = lerpC(a.fog, b.fog, t);
    this.sun.color = lerpC(a.sun, b.sun, t);
    this.sun.intensity = a.sunI + (b.sunI - a.sunI) * t;
    this.hemi.intensity = a.hemi + (b.hemi - a.hemi) * t;
    const ang = (h / 24) * Math.PI * 2 - Math.PI / 2;
    this.sunDir = { x: Math.cos(ang), y: Math.sin(ang) };
  }
  get isNight() { return this.hour >= 20 || this.hour < 6; }
}
