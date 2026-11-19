// Leo Marin on foot: a low-poly figure built from boxes, with a walk cycle.
// Movement is camera-relative (WASD); Shift runs; E enters the nearest car.
import * as THREE from 'three';
import { CONFIG } from './config.js';

function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color }),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

export class Player {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.add(box(0.52, 0.62, 0.3, 0x2e86c1, 0, 1.05, 0)); // torso, teal shirt
    this.group.add(box(0.34, 0.34, 0.32, 0xe8b48a, 0, 1.55, 0)); // head
    this.group.add(box(0.36, 0.12, 0.34, 0x2c2c34, 0, 1.74, 0)); // hair
    this.group.add(box(0.2, 0.62, 0.24, 0x2c3e50, -0.14, 0.42, 0)); // left leg
    this.group.add(box(0.2, 0.62, 0.24, 0x2c3e50, 0.14, 0.42, 0)); // right leg
    this.group.add(box(0.16, 0.58, 0.2, 0x2e86c1, -0.36, 1.05, 0)); // left arm
    this.group.add(box(0.16, 0.58, 0.2, 0x2e86c1, 0.36, 1.05, 0)); // right arm
    this.leftLeg = this.group.children[3];
    this.rightLeg = this.group.children[4];
    this.leftArm = this.group.children[5];
    this.rightArm = this.group.children[6];
    // Pivot the limbs at the hip/shoulder so the swing looks right.
    for (const limb of [this.leftLeg, this.rightLeg]) limb.geometry.translate(0, -0.31, 0);
    for (const limb of [this.leftArm, this.rightArm]) limb.geometry.translate(0, -0.29, 0);
    this.leftLeg.position.y = 0.73;
    this.rightLeg.position.y = 0.73;
    this.leftArm.position.y = 1.34;
    this.rightArm.position.y = 1.34;
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
      const ix = input.x / Math.max(len, 1);
      const iz = input.z / Math.max(len, 1);
      // Rotate camera-relative input into world space. The camera looks
      // along F = (sin yaw, cos yaw) and its right is R = (-cos yaw, sin yaw),
      // so world = R * strafe + F * forward.
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
    // Walk cycle: limbs swing opposite, eased to rest when idle.
    const amp = this.moving ? 0.55 : 0;
    const swing = Math.sin(this.walkPhase) * amp;
    this.leftLeg.rotation.x = swing;
    this.rightLeg.rotation.x = -swing;
    this.leftArm.rotation.x = -swing * 0.8;
    this.rightArm.rotation.x = swing * 0.8;
    // Slight bob while moving.
    this.group.position.y = this.moving ? Math.abs(Math.sin(this.walkPhase)) * 0.06 : 0;
  }

  // Teleport (used by saves and staged screenshots).
  place(x, z, yaw) {
    this.pos.set(x, 0, z);
    this.yaw = yaw;
    this.group.position.copy(this.pos);
    this.group.rotation.y = yaw;
  }
}
