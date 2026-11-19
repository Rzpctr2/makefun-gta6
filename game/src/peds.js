// Pedestrians: low-poly walkers that stroll the sidewalks, turn at corners
// and keep the city feeling lived in. They walk the pavement edge of each
// block, never through buildings.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { mulberry32, range, rangeInt, pick } from './rng.js';

const SHIRTS = [0xe5534b, 0x2e86c1, 0xf2c94c, 0x7fb069, 0x8e44ad, 0xff8a65, 0xe8e4d8, 0x4fc3f7];
const SKINS = [0xe8b48a, 0xc98a5e, 0x8a5a3a, 0xf0c8a0];

function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

export class Pedestrians {
  constructor(scene, city, seed) {
    this.city = city;
    this.rng = mulberry32(seed + 7);
    this.peds = [];
    for (let i = 0; i < CONFIG.pedCount; i++) {
      this.peds.push(this.spawnPed(scene));
    }
  }

  spawnPed(scene) {
    const rng = this.rng;
    const half = CONFIG.citySize / 2;
    const bx = rangeInt(rng, 0, CONFIG.blocks - 1);
    const bz = rangeInt(rng, 0, CONFIG.blocks - 1);
    // Start on a random sidewalk edge of a random block.
    const edge = pick(rng, ['n', 's', 'e', 'w']);
    const x0 = -half + bx * CONFIG.pitch;
    const z0 = -half + bz * CONFIG.pitch;
    let x, z, yaw;
    if (edge === 'n') { x = x0 + range(rng, 2, CONFIG.blockSize - 2); z = z0 - 1.2; yaw = pick(rng, [Math.PI / 2, -Math.PI / 2]); }
    else if (edge === 's') { x = x0 + range(rng, 2, CONFIG.blockSize - 2); z = z0 + CONFIG.blockSize + 1.2; yaw = pick(rng, [Math.PI / 2, -Math.PI / 2]); }
    else if (edge === 'e') { x = x0 + CONFIG.blockSize + 1.2; z = z0 + range(rng, 2, CONFIG.blockSize - 2); yaw = pick(rng, [0, Math.PI]); }
    else { x = x0 - 1.2; z = z0 + range(rng, 2, CONFIG.blockSize - 2); yaw = pick(rng, [0, Math.PI]); }
    const group = new THREE.Group();
    const shirt = pick(rng, SHIRTS);
    const skin = pick(rng, SKINS);
    group.add(box(0.46, 0.56, 0.26, shirt, 0, 1.0, 0));
    group.add(box(0.3, 0.3, 0.28, skin, 0, 1.44, 0));
    group.add(box(0.32, 0.1, 0.3, pick(rng, [0x2c2c34, 0x6a4a2a, 0xd8d8d8]), 0, 1.62, 0));
    const legL = box(0.18, 0.56, 0.2, 0x2c3e50, -0.12, 0.4, 0);
    const legR = box(0.18, 0.56, 0.2, 0x2c3e50, 0.12, 0.4, 0);
    legL.geometry.translate(0, -0.28, 0);
    legR.geometry.translate(0, -0.28, 0);
    legL.position.y = 0.68;
    legR.position.y = 0.68;
    group.add(legL);
    group.add(legR);
    group.position.set(x, 0, z);
    group.rotation.y = yaw;
    scene.add(group);
    return {
      group, legL, legR, hp: 100, dead: false,
      pos: group.position, yaw,
      speed: range(rng, 1.1, 1.9),
      phase: rng() * Math.PI * 2,
      leg: range(rng, 18, 46), // metres before picking a new direction
      travelled: 0,
    };
  }

  update(dt) {
    for (const p of this.peds) {
      p.pos.x += Math.sin(p.yaw) * p.speed * dt;
      p.pos.z += Math.cos(p.yaw) * p.speed * dt;
      p.travelled += p.speed * dt;
      p.phase += dt * p.speed * 5;
      const swing = Math.sin(p.phase) * 0.5;
      p.legL.rotation.x = swing;
      p.legR.rotation.x = -swing;
      // Turn at a corner or after the leg is walked: face a new direction
      // along the sidewalk grid (90° turns only).
      if (p.travelled > p.leg) {
        p.travelled = 0;
        p.leg = range(this.rng, 18, 46);
        p.yaw += pick(this.rng, [Math.PI / 2, -Math.PI / 2, Math.PI]);
      }
      // Never walk into the sea or off the map.
      const half = CONFIG.citySize / 2;
      if (p.pos.x > half + CONFIG.beachWidth - 4) p.yaw = -Math.PI / 2;
      if (p.pos.x < -half - 2) p.yaw = Math.PI / 2;
      if (p.pos.z > half + 2) p.yaw = Math.PI;
      if (p.pos.z < -half - 2) p.yaw = 0;
      this.city.collideCircle(p.pos, 0.4);
      p.group.rotation.y = p.yaw;
    }
  }
}
