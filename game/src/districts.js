// Districts: 6 named areas + 2 landmarks. districtAt() is pure position
// lookup; the banner fires once per entry. Landmarks are cheap shared-geo
// meshes so the skyline reads from far away.
import * as THREE from 'three';
export const DISTRICTS = [
  { name: 'Pelabuhan Solmar', x: 220, z: -40, r: 90, tint: 0x2e7fa8 },
  { name: 'Boulevard Palma', x: 0, z: -180, r: 110, tint: 0xf2c94c },
  { name: 'Casco Viejo', x: -140, z: 60, r: 100, tint: 0xe8b48a },
  { name: 'La Rosa', x: 80, z: 160, r: 95, tint: 0xff5a8a },
  { name: 'Bukit Marisol', x: -180, z: -180, r: 90, tint: 0x7fb069 },
  { name: 'Mercado', x: 140, z: -140, r: 85, tint: 0x4fc3f7 },
];
export function districtAt(x, z) {
  let best = null, bd = Infinity;
  for (const d of DISTRICTS) { const dd = Math.hypot(x - d.x, z - d.z); if (dd < bd) { bd = dd; best = d; } }
  return bd < best.r + 60 ? best : null;
}
export class Landmarks {
  constructor(scene) {
    const g = new THREE.Group();
    const mat = (c, e = 0) => new THREE.MeshLambertMaterial({ color: c, emissive: e });
    const light = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3, 26, 8), mat(0xe8e4d8));
    light.position.set(238, 13, -40); g.add(light);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 2, 8), mat(0xd23c2e, 0x8a1a10));
    cap.position.set(238, 27, -40); g.add(cap);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(16, 1.1, 8, 24), mat(0xf2c94c, 0x664400));
    wheel.position.set(0, 22, -196); g.add(wheel);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(2, 22, 2), mat(0x2c313a));
    leg.position.set(0, 11, -196); g.add(leg);
    const neon = new THREE.Mesh(new THREE.BoxGeometry(14, 2.4, 1), mat(0xff5a8a, 0xff5a8a));
    neon.position.set(80, 18, 130); g.add(neon);
    scene.add(g); this.group = g;
  }
}
