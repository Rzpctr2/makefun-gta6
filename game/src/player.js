// Leo Marin on foot: a low-poly figure in a teal jacket, with a walk cycle.
// Movement reads the camera, not the world: WASD steers relative to where
// the camera looks, Shift runs, E climbs into the nearest car. The car
// itself lives in vehicles.js; this file only owns the person.

import * as THREE from 'three';
import { PLAYER } from './config.js';

export function createPlayer(scene) {
  const group = new THREE.Group();
  const jacket = new THREE.MeshLambertMaterial({ color: 0x2e7fa8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.9, 0.36), jacket);
  body.position.y = 1.08;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), new THREE.MeshLambertMaterial({ color: 0xe8b88a }));
  head.position.y = 1.78;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x2a2018 }));
  hair.position.y = 1.82;
  const legGeo = new THREE.BoxGeometry(0.22, 0.7, 0.22);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x30343a });
  const legL = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.16, 0.35, 0);
  const legR = new THREE.Mesh(legGeo, legMat);
  legR.position.set(0.16, 0.35, 0);
  const armGeo = new THREE.BoxGeometry(0.16, 0.7, 0.16);
  const armL = new THREE.Mesh(armGeo, jacket);
  armL.position.set(-0.4, 1.1, 0);
  const armR = new THREE.Mesh(armGeo, jacket);
  armR.position.set(0.4, 1.1, 0);
  group.add(body, head, hair, legL, legR, armL, armR);
  group.position.set(PLAYER.startPos.x, 0, PLAYER.startPos.z);
  scene.add(group);

  const player = {
    mesh: group,
    x: PLAYER.startPos.x,
    z: PLAYER.startPos.z,
    heading: 0,
    speed: 0,
    health: PLAYER.health,
    radius: PLAYER.radius,
    phase: 0,
    setPose(x, z, heading) {
      this.x = x;
      this.z = z;
      this.heading = heading;
      group.position.set(x, 0, z);
      group.rotation.y = heading;
    },
    // Move relative to the camera yaw. Returns the distance actually walked,
    // so the caller can drive footsteps and stamina-free sprint feel.
    update(dt, input, camYaw, city) {
      const axis = input.axis();
      const running = input.held('run') || input.held('runAlt');
      const top = running ? PLAYER.runSpeed : PLAYER.walkSpeed;
      const forward = { x: Math.sin(camYaw), z: Math.cos(camYaw) };
      const right = { x: Math.cos(camYaw), z: -Math.sin(camYaw) };
      let mx = forward.x * axis.y + right.x * axis.x;
      let mz = forward.z * axis.y + right.z * axis.x;
      const len = Math.hypot(mx, mz);
      if (len > 0.01) {
        mx /= len;
        mz /= len;
        this.speed = top;
        this.heading = Math.atan2(mx, mz);
        const nx = this.x + mx * top * dt;
        const nz = this.z + mz * top * dt;
        const fixed = city.collide(nx, nz, this.radius);
        this.x = fixed.x;
        this.z = fixed.z;
        this.phase += dt * top * 1.9;
      } else {
        this.speed = 0;
      }
      const swing = this.speed > 0 ? Math.sin(this.phase) * 0.6 : 0;
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.7;
      armR.rotation.x = swing * 0.7;
      group.position.set(this.x, 0, this.z);
      group.rotation.y = this.heading;
      return this.speed * dt;
    },
  };
  return player;
}
