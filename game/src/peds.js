// Pedestrians: low-poly walkers that stroll the sidewalks, turn at corners
// and keep the city feeling lived in. A crime nearby makes them run and,
// sometimes, call the police — that is how a quiet street turns into a
// wanted level.

import * as THREE from 'three';
import { WANTED } from './config.js';

const SHIRTS = [0xd8b48a, 0x5e8a7b, 0xc96f4a, 0x8fa8a0, 0xf2e8d5, 0x2e7fa8];
const SKINS = [0xe8b88a, 0xc98a5e, 0x8a5a3a, 0xf2c9a0];

function makePedMesh(rng) {
  const group = new THREE.Group();
  const shirt = rng.pick(SHIRTS);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.32), new THREE.MeshLambertMaterial({ color: shirt }));
  body.position.y = 1.05;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshLambertMaterial({ color: rng.pick(SKINS) }));
  head.position.y = 1.68;
  const legGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x30343a });
  const legL = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.14, 0.3, 0);
  const legR = new THREE.Mesh(legGeo, legMat);
  legR.position.set(0.14, 0.3, 0);
  group.add(body, head, legL, legR);
  return { group, legL, legR };
}

export function createPeds(scene, rng, city, count = 22) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const start = city.randomStreetPoint(rng);
    const { group, legL, legR } = makePedMesh(rng);
    group.position.set(start.x, 0, start.z);
    scene.add(group);
    list.push({
      mesh: group, legL, legR,
      x: start.x, z: start.z,
      heading: rng.range(0, Math.PI * 2),
      speed: rng.range(1.1, 1.9),
      target: city.randomStreetPoint(rng),
      phase: rng.range(0, Math.PI * 2),
      panic: 0,
      radius: 0.5,
      hp: 100,
      alive: true,
      downT: 0,
      kind: 'ped',
    });
  }

  return {
    list,
    // danger: {x, z} of a fresh crime, or null. Peds inside the witness
    // radius run away from it; the caller decides whether one of them
    // actually reports the crime.
    update(dt, danger) {
      for (const ped of list) {
        if (!ped.alive) {
          // Down for 8 s, then back on their feet across town.
          ped.downT += dt;
          if (ped.downT > 8) {
            const spot = city.randomStreetPoint(rng);
            ped.x = spot.x;
            ped.z = spot.z;
            ped.hp = 100;
            ped.alive = true;
            ped.downT = 0;
            ped.mesh.rotation.z = 0;
            ped.mesh.position.y = 0;
          }
          continue;
        }
        if (danger && Math.hypot(ped.x - danger.x, ped.z - danger.z) < WANTED.witnessPed) {
          ped.panic = 2;
        }
        let speed = ped.speed;
        if (ped.panic > 0) {
          ped.panic -= dt;
          speed = 4.5;
          const away = Math.atan2(ped.x - (danger?.x ?? ped.x), ped.z - (danger?.z ?? ped.z));
          ped.heading = away;
        } else {
          const dx = ped.target.x - ped.x;
          const dz = ped.target.z - ped.z;
          if (Math.hypot(dx, dz) < 3) {
            ped.target = city.randomStreetPoint(rng);
            continue;
          }
          const want = Math.atan2(dx, dz);
          let diff = want - ped.heading;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          ped.heading += THREE.MathUtils.clamp(diff, -2.4 * dt, 2.4 * dt);
        }
        ped.x += Math.sin(ped.heading) * speed * dt;
        ped.z += Math.cos(ped.heading) * speed * dt;
        const fixed = city.collide(ped.x, ped.z, ped.radius);
        ped.x = fixed.x;
        ped.z = fixed.z;
        ped.phase += dt * speed * 2.4;
        ped.legL.rotation.x = Math.sin(ped.phase) * 0.55;
        ped.legR.rotation.x = -Math.sin(ped.phase) * 0.55;
        ped.mesh.position.set(ped.x, 0, ped.z);
        ped.mesh.rotation.y = ped.heading;
      }
    },
    // The closest pedestrian to a point, for witness checks and lock-on.
    nearest(x, z, maxDist = Infinity) {
      let best = null;
      let bestD = maxDist;
      for (const ped of list) {
        const d = Math.hypot(ped.x - x, ped.z - z);
        if (d < bestD) { best = ped; bestD = d; }
      }
      return best;
    },
  };
}
