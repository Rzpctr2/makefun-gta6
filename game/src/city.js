// Palma Verde, the city itself: a procedural coastal town built once from
// a seed. Streets every 36 m, a wavy shoreline and bay on the west edge, a
// central plaza, six districts, and landmarks that read from far away.
// Buildings, palms and lamps are InstancedMeshes — a handful of draw calls
// for the whole town. Collision is circles: one list the cars, the player
// and the pedestrians all test against.

import * as THREE from 'three';
import { WORLD } from './config.js';
import { LANDMARKS } from './districts.js';
import { FLAT } from './textures.js';

export const STREETS = [-144, -108, -72, -36, 0, 36, 72, 108, 144];
const BLOCK_CENTERS = [-126, -90, -54, -18, 18, 54, 90, 126];

export function shoreXAt(z) {
  return WORLD.shoreBase + WORLD.shoreSwing * Math.sin(z * 0.045) + 6 * Math.sin(z * 0.013);
}

function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color }),
  );
  mesh.position.set(x, y, z);
  return mesh;
}

export function buildCity(scene, rng, textures) {
  const group = new THREE.Group();
  scene.add(group);
  const colliders = [];

  // --- Ground: one sidewalk slab, road strips on top, sand + sea west. ---
  // 720 m wide so its edge sits past fog far (420 m) and never reads as a
  // hard horizon line; it is a flat colour, so the larger plane costs nothing.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(720, 720),
    new THREE.MeshLambertMaterial({ color: FLAT.sidewalk }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(-4, 0, 0);
  group.add(ground);

  const roadMatX = new THREE.MeshLambertMaterial({ map: textures.roadX });
  const roadMatZ = new THREE.MeshLambertMaterial({ map: textures.roadZ });
  for (const s of STREETS) {
    const alongX = new THREE.Mesh(new THREE.PlaneGeometry(324, WORLD.roadWidth), roadMatX);
    alongX.rotation.x = -Math.PI / 2;
    alongX.position.set(0, 0.02, s);
    group.add(alongX);
    const alongZ = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.roadWidth, 324), roadMatZ);
    alongZ.rotation.x = -Math.PI / 2;
    alongZ.position.set(s, 0.02, 0);
    group.add(alongZ);
  }

  // Sea: a plane with a wavy east edge following the shoreline.
  // Shape Y maps to -Z after the -90° X rotation, so the wavy edge is
  // drawn with negated z to land on the analytic shoreline.
  const seaShape = new THREE.Shape();
  seaShape.moveTo(-300, 200);
  seaShape.lineTo(shoreXAt(-200), 200);
  for (let z = -200; z <= 200; z += 10) seaShape.lineTo(shoreXAt(z), -z);
  seaShape.lineTo(-300, -200);
  seaShape.closePath();
  const sea = new THREE.Mesh(
    new THREE.ShapeGeometry(seaShape),
    new THREE.MeshLambertMaterial({ map: textures.sea }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = 0.03;
  group.add(sea);

  // Beach: a sand strip hugging the same wavy line.
  const beachShape = new THREE.Shape();
  beachShape.moveTo(shoreXAt(-200) - 4, 200);
  for (let z = -200; z <= 200; z += 10) beachShape.lineTo(shoreXAt(z) - 4, -z);
  for (let z = 200; z >= -200; z -= 10) beachShape.lineTo(shoreXAt(z) + WORLD.beachWidth, -z);
  beachShape.closePath();
  const beach = new THREE.Mesh(
    new THREE.ShapeGeometry(beachShape),
    new THREE.MeshLambertMaterial({ map: textures.sand }),
  );
  beach.rotation.x = -Math.PI / 2;
  beach.position.y = 0.025;
  group.add(beach);

  // --- Buildings: one InstancedMesh, seeded heights and colours. ---
  const spots = [];
  for (const bx of BLOCK_CENTERS) {
    for (const bz of BLOCK_CENTERS) {
      if (bx === 18 && bz === 18) continue; // central plaza, kept open
      if (bx < shoreXAt(bz) + WORLD.beachWidth + 12) continue; // beach / sea
      spots.push({ bx, bz });
    }
  }
  const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
  buildingGeo.translate(0, 0.5, 0);
  const buildingMat = new THREE.MeshLambertMaterial({ map: textures.facades[0] });
  const buildings = new THREE.InstancedMesh(buildingGeo, buildingMat, spots.length * 2);
  const dummy = new THREE.Object3D();
  const colour = new THREE.Color();
  let placed = 0;
  const facadeCount = textures.facades.length;
  for (const spot of spots) {
    const n = rng.int(1, 2);
    for (let i = 0; i < n; i++) {
      const w = rng.range(9, 15);
      const d = rng.range(9, 15);
      const h = rng.range(8, 46) * (1 + (Math.abs(spot.bx) + Math.abs(spot.bz) < 72 ? 0.35 : 0));
      const ox = (i === 0 ? -4 : 5) + rng.range(-1.5, 1.5);
      const oz = (i === 0 ? -4 : 5) + rng.range(-1.5, 1.5);
      dummy.position.set(spot.bx + ox, 0, spot.bz + oz);
      dummy.scale.set(w, h, d);
      dummy.rotation.y = 0;
      dummy.updateMatrix();
      buildings.setMatrixAt(placed, dummy.matrix);
      colour.setHSL(rng.range(0.05, 0.13), rng.range(0.25, 0.45), rng.range(0.55, 0.75));
      buildings.setColorAt(placed, colour);
      colliders.push({ x: spot.bx + ox, z: spot.bz + oz, r: Math.max(w, d) * 0.62 });
      placed++;
    }
  }
  buildings.count = placed;
  buildings.instanceMatrix.needsUpdate = true;
  group.add(buildings);

  // --- Palms: instanced trunks + cone canopies, boulevard and beach rows. ---
  const palmSpots = [];
  for (let z = -126; z <= 126; z += 18) {
    palmSpots.push({ x: -8, z });
    palmSpots.push({ x: 8, z });
    palmSpots.push({ x: shoreXAt(z) + 7, z });
  }
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 6, 5);
  trunkGeo.translate(0, 3, 0);
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshLambertMaterial({ color: FLAT.trunk }), palmSpots.length);
  const canopyGeo = new THREE.ConeGeometry(2.6, 3.2, 6);
  canopyGeo.translate(0, 7, 0);
  const canopies = new THREE.InstancedMesh(canopyGeo, new THREE.MeshLambertMaterial({ color: FLAT.leaf }), palmSpots.length);
  palmSpots.forEach((p, i) => {
    dummy.position.set(p.x, 0, p.z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.y = rng.range(0, Math.PI);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    canopies.setMatrixAt(i, dummy.matrix);
  });
  group.add(trunks, canopies);

  // --- Street lamps: poles + glowing heads, lit at night. ---
  const lampMat = new THREE.MeshLambertMaterial({ color: 0x30343a });
  const lampHeadMat = new THREE.MeshLambertMaterial({ color: 0xffe9a8, emissive: 0xffc94c, emissiveIntensity: 0 });
  const lampGeo = new THREE.CylinderGeometry(0.09, 0.12, 5.4, 5);
  lampGeo.translate(0, 2.7, 0);
  const lampSpots = [];
  for (const s of STREETS) for (let t = -144; t <= 144; t += 72) lampSpots.push({ x: s + 7, z: t });
  const lamps = new THREE.InstancedMesh(lampGeo, lampMat, lampSpots.length);
  const lampHeads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 6, 5), lampHeadMat, lampSpots.length);
  lampSpots.forEach((p, i) => {
    dummy.position.set(p.x, 0, p.z);
    dummy.rotation.y = 0;
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    lamps.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 5.5;
    dummy.updateMatrix();
    lampHeads.setMatrixAt(i, dummy.matrix);
  });
  group.add(lamps, lampHeads);

  // --- Landmarks, one mesh group each. ---
  const ferris = new THREE.Group();
  let ferrisWheel = null;
  const landmarkMeshes = [];
  for (const mark of LANDMARKS) {
    let mesh = null;
    if (mark.kind === 'pier') {
      mesh = box(8, 1, 60, 0x8a6f4d, mark.x, 0.5, mark.z - 30);
      colliders.push({ x: mark.x, z: mark.z - 30, r: 6 });
    } else if (mark.kind === 'lighthouse') {
      mesh = new THREE.Group();
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3, 22, 8), new THREE.MeshLambertMaterial({ color: 0xf2e8d5 }));
      tower.position.y = 11;
      const top = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 3, 8), new THREE.MeshLambertMaterial({ color: 0xc94c4c }));
      top.position.y = 23;
      mesh.add(tower, top);
      mesh.position.set(mark.x, 0, mark.z);
      colliders.push({ x: mark.x, z: mark.z, r: 4 });
    } else if (mark.kind === 'fountain') {
      mesh = new THREE.Group();
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.6, 1.2, 12), new THREE.MeshLambertMaterial({ color: 0xd8cdb4 }));
      rim.position.y = 0.6;
      const water = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.4, 0.4, 12), new THREE.MeshLambertMaterial({ color: 0x2e7fa8 }));
      water.position.y = 1.1;
      mesh.add(rim, water);
      mesh.position.set(mark.x, 0, mark.z);
      colliders.push({ x: mark.x, z: mark.z, r: 6.5 });
    } else if (mark.kind === 'ferris') {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(11, 0.5, 6, 24), new THREE.MeshLambertMaterial({ color: 0xf2c94c }));
      wheel.position.y = 14;
      ferrisWheel = wheel;
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 8), new THREE.MeshLambertMaterial({ color: 0x30343a }));
      hub.rotation.x = Math.PI / 2;
      hub.position.y = 14;
      const legL = box(0.8, 15, 0.8, 0x30343a, -4, 7, 0);
      const legR = box(0.8, 15, 0.8, 0x30343a, 4, 7, 0);
      ferris.add(wheel, hub, legL, legR);
      ferris.position.set(mark.x, 0, mark.z);
      mesh = ferris;
      colliders.push({ x: mark.x, z: mark.z, r: 5 });
    } else if (mark.kind === 'clocktower') {
      mesh = new THREE.Group();
      const tower = box(7, 34, 7, 0x8a6f4d, 0, 17, 0);
      const face = new THREE.Mesh(new THREE.CircleGeometry(2.4, 16), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
      face.position.set(0, 28, 3.6);
      const neon = box(7.4, 0.7, 0.4, 0, 0, 24, 3.6);
      neon.material = new THREE.MeshBasicMaterial({ color: FLAT.neonPink });
      mesh.add(tower, face, neon);
      mesh.position.set(mark.x, 0, mark.z);
      colliders.push({ x: mark.x, z: mark.z, r: 5 });
    } else if (mark.kind === 'market') {
      mesh = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const stall = box(5, 2.2, 3, i % 2 ? 0xc96f4a : 0x5e8a7b, -12 + i * 6, 1.1, 0);
        const awning = box(5.4, 0.3, 3.6, 0xf2e8d5, -12 + i * 6, 2.6, 0);
        mesh.add(stall, awning);
      }
      mesh.position.set(mark.x, 0, mark.z);
      colliders.push({ x: mark.x, z: mark.z, r: 8 });
    } else if (mark.kind === 'villas') {
      mesh = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        mesh.add(box(10, 6 + i, 8, 0xf2e8d5, -14 + i * 9, 3 + i * 0.5, (i % 2 ? 6 : -6)));
      }
      mesh.position.set(mark.x, 0, mark.z);
      colliders.push({ x: mark.x, z: mark.z, r: 12 });
    }
    if (mesh) {
      group.add(mesh);
      landmarkMeshes.push(mesh);
    }
  }

  function collide(x, z, radius) {
    // World edge + sea keep everyone on the map.
    const edge = WORLD.halfSize;
    x = Math.max(-edge, Math.min(edge, x));
    z = Math.max(-edge, Math.min(edge, z));
    const shore = shoreXAt(z) + 2;
    if (x < shore + radius) x = shore + radius;
    for (const c of colliders) {
      const dx = x - c.x;
      const dz = z - c.z;
      const min = c.r + radius;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        x = c.x + (dx / d) * min;
        z = c.z + (dz / d) * min;
      }
    }
    return { x, z };
  }

  return {
    group,
    colliders,
    collide,
    onRoad(x, z) {
      const near = (v) => STREETS.some((s) => Math.abs(v - s) <= WORLD.roadWidth / 2 + 1);
      return near(x) || near(z);
    },
    randomStreetPoint(r) {
      const along = r.pick(STREETS);
      const across = r.range(-144, 144);
      return r.chance(0.5) ? { x: across, z: along } : { x: along, z: across };
    },
    setNight(n) {
      lampHeadMat.emissiveIntensity = n * 1.6;
    },
    tick(dt) {
      // Only the wheel spins — the legs stay planted.
      if (ferrisWheel) ferrisWheel.rotation.z += dt * 0.12;
    },
  };
}
