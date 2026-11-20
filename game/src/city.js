// Palma Verde, the city itself: a procedural coastal grid built once from a
// seed. Buildings, palms and lamps are InstancedMeshes — a few draw calls
// for the whole city — the ground is one painted plane and the sea is a
// scrolling water plane. This module also owns the collision boxes and the
// road graph that traffic and pedestrians drive on.
import * as THREE from 'three';
import { CONFIG, PALETTE } from './config.js';
import { mulberry32, range, rangeInt, pick } from './rng.js';
import { facadeTexture, roofTexture, groundTexture, waterTexture } from './textures.js';

// Wall colour first, shopfront trim second. The index is the facade
// variant a tower is assigned when it is placed.
const FACADE_SETS = [
  { wall: '#e8b48a', trim: '#7a5a3a' },
  { wall: '#dfe6ea', trim: '#5a6a75' },
  { wall: '#f0d9a0', trim: '#8a6a3a' },
  { wall: '#c9a0a0', trim: '#6a4a4a' },
  { wall: '#a8c8b8', trim: '#4a6a5a' },
];

export class City {
  constructor(scene, seed) {
    this.scene = scene;
    this.rng = mulberry32(seed);
    this.buildings = []; // {minX, maxX, minZ, maxZ, h} — collision boxes
    this.roads = []; // road centre lines, in metres: {axis: 'x' | 'z', at}
    this.group = new THREE.Group();
    scene.add(this.group);
    this.buildGround();
    this.buildRoadGraph();
    this.buildBuildings();
    this.buildProps();
    this.buildSea();
  }

  // --- ground -------------------------------------------------------------
  buildGround() {
    const { citySize, beachWidth } = CONFIG;
    const total = citySize + beachWidth + 40;
    const geo = new THREE.PlaneGeometry(total, total);
    const mat = new THREE.MeshLambertMaterial({ map: groundTexture() });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    // The plane is centred on the city; nudge it east so the beach is covered.
    ground.position.x = (beachWidth + 40) / 2 - 20;
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  // Road centre lines: one per grid line, both axes.
  buildRoadGraph() {
    const { pitch, blocks } = CONFIG;
    const half = CONFIG.citySize / 2;
    for (let i = 0; i <= blocks; i++) {
      const at = -half + i * pitch - CONFIG.roadWidth / 2;
      this.roads.push({ axis: 'x', at });
      this.roads.push({ axis: 'z', at });
    }
  }

  roadCentres(axis) {
    return this.roads.filter((r) => r.axis === axis).map((r) => r.at);
  }

  // --- buildings ----------------------------------------------------------
  // Decide where every tower goes, in block order. This is the only place
  // that draws building numbers from the seed, so the layout is fixed by
  // it: count, footprint, position, height and facade variant, in that order.
  planTowers() {
    const { pitch, blockSize, blocks, buildingGap } = CONFIG;
    const half = CONFIG.citySize / 2;
    const rng = this.rng;
    const byFacade = FACADE_SETS.map(() => []);
    const roofs = [];
    const middle = (blocks - 1) / 2;
    for (let bx = 0; bx < blocks; bx++) {
      for (let bz = 0; bz < blocks; bz++) {
        if (bx === middle && bz === middle) continue; // the plaza stays open
        const x0 = -half + bx * pitch + buildingGap;
        const z0 = -half + bz * pitch + buildingGap;
        const w = blockSize - buildingGap * 2;
        const count = rangeInt(rng, 1, 3); // 1–3 towers per block
        for (let k = 0; k < count; k++) {
          const tw = range(rng, w * 0.36, w * 0.6);
          const td = range(rng, w * 0.36, w * 0.6);
          const px = x0 + range(rng, 0, w - tw);
          const pz = z0 + range(rng, 0, w - td);
          // Taller near the centre and the beach (east).
          const distC = Math.hypot(px, pz) / half;
          const beachBoost = (px / half) * 0.5 + 0.5;
          const h = range(
            rng,
            CONFIG.buildingMinH,
            CONFIG.buildingMaxH * (1.15 - distC * 0.55) * (0.7 + beachBoost * 0.45),
          );
          const variant = rangeInt(rng, 0, FACADE_SETS.length - 1);
          const tower = { x: px + tw / 2, z: pz + td / 2, w: tw, d: td, h };
          byFacade[variant].push(tower);
          roofs.push(tower);
          this.buildings.push({ minX: px, maxX: px + tw, minZ: pz, maxZ: pz + td, h });
        }
      }
    }
    return { byFacade, roofs };
  }

  buildBuildings() {
    const { byFacade, roofs } = this.planTowers();
    const rng = this.rng;
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    boxGeo.translate(0, 0.5, 0); // scale y = height, base sits on the ground
    const facadeMats = FACADE_SETS.map(
      ({ wall, trim }) => new THREE.MeshLambertMaterial({ map: facadeTexture(wall, trim) }),
    );
    const roofMat = new THREE.MeshLambertMaterial({ map: roofTexture() });
    const dummy = new THREE.Object3D();
    const colour = new THREE.Color();
    // One InstancedMesh per facade variant; a roof box rides on each tower.
    byFacade.forEach((list, vi) => {
      if (!list.length) return;
      const mesh = new THREE.InstancedMesh(boxGeo, facadeMats[vi], list.length);
      list.forEach((b, i) => {
        dummy.position.set(b.x, 0, b.z);
        dummy.scale.set(b.w, b.h, b.d);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        // A slight per-tower tint so the facades do not look cloned.
        colour.setHSL(0.08 + rng() * 0.04, 0.08, 0.92 + rng() * 0.08);
        mesh.setColorAt(i, colour);
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    });
    // Roof caps: one instanced thin box per tower, slightly wider than it.
    const roofGeo = new THREE.BoxGeometry(1, 1, 1);
    roofGeo.translate(0, 0.5, 0);
    const roofMesh = new THREE.InstancedMesh(roofGeo, roofMat, roofs.length);
    roofs.forEach((b, i) => {
      dummy.position.set(b.x, b.h, b.z);
      dummy.scale.set(b.w + 0.6, 0.8, b.d + 0.6);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      roofMesh.setMatrixAt(i, dummy.matrix);
    });
    this.group.add(roofMesh);
  }

  // --- props: palms along the beach and sidewalks, street lamps -----------
  // Where every palm stands. Beach row first, then sparse sidewalk corners.
  planPalms() {
    const rng = this.rng;
    const half = CONFIG.citySize / 2;
    const spots = [];
    for (let z = -half + 16; z < half - 8; z += 14) {
      spots.push({ x: half + 8 + rng() * 18, z: z + rng() * 6 });
    }
    for (let i = 0; i < 46; i++) {
      const bx = rangeInt(rng, 0, CONFIG.blocks - 1);
      const bz = rangeInt(rng, 0, CONFIG.blocks - 1);
      const x = -half + bx * CONFIG.pitch + pick(rng, [2, CONFIG.blockSize - 2]);
      const z = -half + bz * CONFIG.pitch + pick(rng, [2, CONFIG.blockSize - 2]);
      spots.push({ x, z });
    }
    return spots;
  }

  buildProps() {
    const rng = this.rng;
    const half = CONFIG.citySize / 2;
    // Palm trunks and canopies, instanced from the planned spots.
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 5.5, 6);
    trunkGeo.translate(0, 2.75, 0);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8a6a44 });
    const canopyGeo = new THREE.ConeGeometry(2.6, 2.2, 7);
    canopyGeo.translate(0, 6.2, 0);
    const canopyMat = new THREE.MeshLambertMaterial({ color: 0x3f8f4f });
    const palmSpots = this.planPalms();
    const dummy = new THREE.Object3D();
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, palmSpots.length);
    const canopies = new THREE.InstancedMesh(canopyGeo, canopyMat, palmSpots.length);
    palmSpots.forEach((p, i) => {
      dummy.position.set(p.x, 0, p.z);
      dummy.rotation.set(0, rng() * Math.PI * 2, 0);
      dummy.scale.setScalar(range(rng, 0.85, 1.25));
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      canopies.setMatrixAt(i, dummy.matrix);
    });
    trunks.castShadow = true;
    this.group.add(trunks);
    this.group.add(canopies);
    // Street lamps: pole plus warm head, along the edges of the east–west
    // roads.
    const poleGeo = new THREE.CylinderGeometry(0.09, 0.12, 5, 6);
    poleGeo.translate(0, 2.5, 0);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x2c313a });
    const headGeo = new THREE.SphereGeometry(0.28, 8, 6);
    headGeo.translate(0, 5.1, 0);
    const headMat = new THREE.MeshLambertMaterial({
      color: 0xffe9a8,
      emissive: 0xffdf8a,
      emissiveIntensity: 0.7,
    });
    const lampSpots = [];
    for (const r of this.roads) {
      if (r.axis !== 'x') continue;
      for (let d = -half + 20; d < half; d += 52) {
        lampSpots.push({ x: d, z: r.at + CONFIG.roadWidth / 2 + 0.8 });
      }
    }
    const poles = new THREE.InstancedMesh(poleGeo, poleMat, lampSpots.length);
    const heads = new THREE.InstancedMesh(headGeo, headMat, lampSpots.length);
    lampSpots.forEach((p, i) => {
      dummy.position.set(p.x, 0, p.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      poles.setMatrixAt(i, dummy.matrix);
      heads.setMatrixAt(i, dummy.matrix);
    });
    this.group.add(poles);
    this.group.add(heads);
  }

  // --- sea ------------------------------------------------------------------
  buildSea() {
    const { citySize, beachWidth, seaWidth } = CONFIG;
    const half = citySize / 2;
    this.waterTex = waterTexture();
    const geo = new THREE.PlaneGeometry(seaWidth, citySize + 400);
    const mat = new THREE.MeshLambertMaterial({ map: this.waterTex, color: PALETTE.sea });
    const sea = new THREE.Mesh(geo, mat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(half + beachWidth + seaWidth / 2, -0.4, 0);
    this.group.add(sea);
    // A pale sand bar where the waves meet the beach.
    const barGeo = new THREE.PlaneGeometry(6, citySize + 20);
    const barMat = new THREE.MeshLambertMaterial({ color: 0xf2e2b0 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.rotation.x = -Math.PI / 2;
    bar.position.set(half + beachWidth - 2, 0.05, 0);
    this.group.add(bar);
  }

  update(dt) {
    // Slow scroll so the water feels alive without costing anything.
    if (this.waterTex) this.waterTex.offset.y += dt * 0.015;
  }

  // --- collision ------------------------------------------------------------
  // Push a circle (x, z, radius) out of every building box it overlaps.
  // Returns true if any push happened.
  collideCircle(pos, radius) {
    let hit = false;
    for (const b of this.buildings) {
      const cx = Math.max(b.minX, Math.min(pos.x, b.maxX));
      const cz = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
      const dx = pos.x - cx;
      const dz = pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < radius * radius) {
        hit = true;
        if (d2 > 1e-6) {
          const d = Math.sqrt(d2);
          pos.x = cx + (dx / d) * radius;
          pos.z = cz + (dz / d) * radius;
        } else {
          pos.x += radius;
        }
      }
    }
    return hit;
  }

  // Keep a position inside the playable land (city + beach).
  clampToLand(pos, margin = 2) {
    const half = CONFIG.citySize / 2;
    pos.x = Math.max(-half - margin, Math.min(half + CONFIG.beachWidth - margin, pos.x));
    pos.z = Math.max(-half - margin, Math.min(half + margin, pos.z));
  }

  nearestRoadCentre(axis, value) {
    const centres = this.roadCentres(axis);
    let best = centres[0];
    let bestD = Infinity;
    for (const c of centres) {
      const d = Math.abs(c - value);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }
}
