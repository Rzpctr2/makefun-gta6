// Leo Marin on foot: a low-poly figure assembled from boxes, with a walk
// cycle. Movement reads the camera, not the world: WASD steers relative to
// where the camera looks, Shift runs, E climbs into the nearest car.
import * as THREE from 'three';
import { CONFIG } from './config.js';

// Every body part as [width, height, depth, colour, x, y, z]. The order is
// the order the meshes land in the group: torso, head, hair, legs, arms.
const PARTS = [
  [0.52, 0.62, 0.3, 0x2e86c1, 0, 1.05, 0], // torso, teal shirt
  [0.34, 0.34, 0.32, 0xe8b48a, 0, 1.55, 0], // head
  [0.36, 0.12, 0.34, 0x2c2c34, 0, 1.74, 0], // hair
  [0.2, 0.62, 0.24, 0x2c3e50, -0.14, 0.42, 0], // left leg
  [0.2, 0.62, 0.24, 0x2c3e50, 0.14, 0.42, 0], // right leg
  [0.16, 0.58, 0.2, 0x2e86c1, -0.36, 1.05, 0], // left arm
  [0.16, 0.58, 0.2, 0x2e86c1, 0.36, 1.05, 0], // right arm
];

// How far each limb's geometry hangs below its pivot, so the swing rotates
// around the hip or shoulder instead of the middle of the limb.
const PIVOT_DROP = { legs: 0.31, arms: 0.29 };
const PIVOT_HEIGHT = { legs: 0.73, arms: 1.34 };

export class Player {
  constructor(scene) {
    this.group = new THREE.Group();
    const built = PARTS.map(([w, h, d, colour, x, y, z]) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshLambertMaterial({ color: colour }),
      );
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      this.group.add(mesh);
      return mesh;
    });
    [this.leftLeg, this.rightLeg] = [built[3], built[4]];
    [this.leftArm, this.rightArm] = [built[5], built[6]];
    for (const leg of [this.leftLeg, this.rightLeg]) {
      leg.geometry.translate(0, -PIVOT_DROP.legs, 0);
      leg.position.y = PIVOT_HEIGHT.legs;
    }
    for (const arm of [this.leftArm, this.rightArm]) {
      arm.geometry.translate(0, -PIVOT_DROP.arms, 0);
      arm.position.y = PIVOT_HEIGHT.arms;
    }
    scene.add(this.group);
    this.pos = new THREE.Vector3(0, 0, 8);
    this.yaw = Math.PI; // facing the city centre
    this.walkPhase = 0;
    this.moving = false;
    this.speed = 0;
  }

  get position() {
    return this.pos;
  }

  // input: {x, z} in camera space; camYaw: camera heading; dt seconds.
  update(input, camYaw, dt, city) {
    const len = Math.hypot(input.x, input.z);
    this.moving = len > 0.01;
    const run = input.run;
    const speed = run ? CONFIG.runSpeed : CONFIG.walkSpeed;
    if (this.moving) {
      // Normalise the stick, but never amplify a tiny nudge: inputs shorter
      // than one unit keep their length.
      const ix = input.x / Math.max(len, 1);
      const iz = input.z / Math.max(len, 1);
      // The camera looks along F = (sin yaw, cos yaw) and its right hand is
      // R = (-cos yaw, sin yaw), so a camera-space step becomes a world step
      // of R * strafe + F * forward.
      const sin = Math.sin(camYaw);
      const cos = Math.cos(camYaw);
      const wx = -ix * cos + iz * sin;
      const wz = ix * sin + iz * cos;
      this.pos.x += wx * speed * dt;
      this.pos.z += wz * speed * dt;
      this.yaw = Math.atan2(wx, wz);
      this.speed = speed;
      this.walkPhase += dt * speed * 1.6;
    } else {
      this.speed = 0;
      this.walkPhase += dt * 2;
    }
    city.collideCircle(this.pos, 0.45);
    city.clampToLand(this.pos);
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.yaw;
    // Walk cycle: legs swing opposite each other, arms counter them, and the
    // whole swing eases to nothing when Leo stands still.
    const amp = this.moving ? 0.55 : 0;
    const swing = Math.sin(this.walkPhase) * amp;
    this.leftLeg.rotation.x = swing;
    this.rightLeg.rotation.x = -swing;
    this.leftArm.rotation.x = -swing * 0.8;
    this.rightArm.rotation.x = swing * 0.8;
    // A touch of bounce while walking.
    this.group.position.y = this.moving
      ? Math.abs(Math.sin(this.walkPhase)) * 0.06
      : 0;
  }

  // Teleport (used by saves and staged screenshots).
  place(x, z, yaw) {
    this.pos.set(x, 0, z);
    this.yaw = yaw;
    this.group.position.copy(this.pos);
    this.group.rotation.y = yaw;
  }
}
