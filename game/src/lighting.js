// Time of day as four keyframes, lerped across sun, sky, fog and ambient
// light. Four looks for four screenshots: dawn, noon, golden hour 18:52,
// neon night 21:00. Night is a number 0..1 the city reads to switch on
// windows, street lamps and neon.

import * as THREE from 'three';

const KEYS = [
  { hour: 6, sun: 0xffd9a0, sunI: 1.1, sky: 0xf7c98b, fog: 0xe8c9a0, hemi: 0.55, night: 0.15, sunY: 0.35 },
  { hour: 12, sun: 0xfff2d8, sunI: 1.6, sky: 0x8ec9e8, fog: 0xcfe4ef, hemi: 0.9, night: 0, sunY: 0.95 },
  { hour: 18.87, sun: 0xffb45e, sunI: 1.35, sky: 0xf2a35e, fog: 0xe8a06a, hemi: 0.6, night: 0.1, sunY: 0.22 },
  { hour: 21, sun: 0x8aa0ff, sunI: 0.35, sky: 0x141c2e, fog: 0x1a2233, hemi: 0.28, night: 1, sunY: 0.1 },
];

function lerpKey(a, b, t) {
  return {
    sun: new THREE.Color(a.sun).lerp(new THREE.Color(b.sun), t),
    sunI: a.sunI + (b.sunI - a.sunI) * t,
    sky: new THREE.Color(a.sky).lerp(new THREE.Color(b.sky), t),
    fog: new THREE.Color(a.fog).lerp(new THREE.Color(b.fog), t),
    hemi: a.hemi + (b.hemi - a.hemi) * t,
    night: a.night + (b.night - a.night) * t,
    sunY: a.sunY + (b.sunY - a.sunY) * t,
  };
}

function keyAt(hour) {
  let lower = KEYS[0];
  let upper = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (hour >= KEYS[i].hour && hour <= KEYS[i + 1].hour) {
      lower = KEYS[i];
      upper = KEYS[i + 1];
      break;
    }
  }
  const span = Math.max(0.001, upper.hour - lower.hour);
  const t = Math.min(1, Math.max(0, (hour - lower.hour) / span));
  return lerpKey(lower, upper, t);
}

export function makeLighting(scene) {
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.6);
  sun.position.set(60, 80, 20);
  scene.add(sun);
  const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x8a7a5a, 0.9);
  scene.add(hemi);
  scene.fog = new THREE.Fog(0xcfe4ef, 120, 420);

  let night = 0;
  return {
    // Move the sun, sky and fog to an hour; returns the night factor 0..1.
    apply(hour) {
      const k = keyAt(hour);
      sun.color.copy(k.sun);
      sun.intensity = k.sunI;
      const angle = ((hour - 6) / 12) * Math.PI;
      sun.position.set(Math.cos(angle) * 120, 30 + k.sunY * 90, Math.sin(angle) * 60);
      scene.background = k.sky;
      scene.fog.color.copy(k.fog);
      hemi.intensity = k.hemi;
      night = k.night;
      return night;
    },
    get night() {
      return night;
    },
  };
}
