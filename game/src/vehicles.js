// Cars: one box-built low-poly car serves the player, the traffic and the
// parked rows. Driving is arcade — throttle, speed-sensitive steering and a
// yaw cap — and traffic follows the street grid in Manhattan steps, so it
// never cuts across a block.

import * as THREE from 'three';
import { CAR } from './config.js';
import { STREETS } from './city.js';

const TRAFFIC_COLORS = [0xc94c4c, 0x4c7dc9, 0xe8d49a, 0x5e8a7b, 0xd8d8d8, 0x30343a, 0xc96f4a];

export function makeCarMesh(color, police = false) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: police ? 0x1d2126 : color });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.7, 4.4), bodyMat);
  body.position.y = 0.55;
  group.add(body);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.6, 2.2),
    new THREE.MeshLambertMaterial({ color: police ? 0xf2f2f2 : 0x20262e }),
  );
  cabin.position.set(0, 1.15, -0.2);
  group.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 8);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x141414 });
  const wheels = [];
  for (const [wx, wz] of [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.45], [0.95, -1.45]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(wx, 0.38, wz);
    group.add(wheel);
    wheels.push(wheel);
  }
  let lightbar = null;
  if (police) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 0.5), new THREE.MeshLambertMaterial({ color: 0x30343a }));
    bar.position.set(0, 1.55, -0.2);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.24, 0.52), new THREE.MeshLambertMaterial({ color: 0xff2a2a, emissive: 0xff2a2a, emissiveIntensity: 0 }));
    red.position.set(-0.35, 1.55, -0.2);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.24, 0.52), new THREE.MeshLambertMaterial({ color: 0x2a6bff, emissive: 0x2a6bff, emissiveIntensity: 0 }));
    blue.position.set(0.35, 1.55, -0.2);
    group.add(bar, red, blue);
    lightbar = { red, blue };
  }
  return { group, wheels, lightbar };
}

export function createCar(scene, { x = 0, z = 0, heading = 0, color = 0xc94c4c, police = false, maxSpeed = CAR.maxSpeed } = {}) {
  const { group, wheels, lightbar } = makeCarMesh(color, police);
  group.position.set(x, 0, z);
  group.rotation.y = heading;
  scene.add(group);
  const car = {
    mesh: group,
    wheels,
    lightbar,
    x,
    z,
    heading,
    speed: 0,
    maxSpeed,
    police,
    radius: CAR.radius,
    // Arcade drive step. throttle -1..1, steer -1..1. collide(x,z,r) is the
    // city's push-out; it returns the corrected position.
    drive(dt, throttle, steer, collide) {
      const speedFactor = 1 - (CAR.steerAuthority * Math.min(1, Math.abs(this.speed) / this.maxSpeed));
      const yawRate = steer * 2.2 * speedFactor * Math.sign(this.speed || 1);
      this.heading += THREE.MathUtils.clamp(yawRate, -CAR.maxYawRate, CAR.maxYawRate) * dt * (this.speed >= 0 ? 1 : -1);
      if (throttle > 0) this.speed += CAR.accel * throttle * dt;
      else if (throttle < 0) this.speed += (this.speed > 0.5 ? -CAR.brake : CAR.accel * 0.6) * dt;
      else this.speed -= Math.sign(this.speed) * Math.min(Math.abs(this.speed), 8 * dt);
      const top = this.speed >= 0 ? this.maxSpeed : CAR.reverseMax;
      this.speed = THREE.MathUtils.clamp(this.speed, -CAR.reverseMax, top);
      const nx = this.x + Math.sin(this.heading) * this.speed * dt;
      const nz = this.z + Math.cos(this.heading) * this.speed * dt;
      if (collide) {
        const fixed = collide(nx, nz, this.radius);
        // A wall hit costs speed once, not twice.
        if (Math.abs(fixed.x - nx) > 0.01 || Math.abs(fixed.z - nz) > 0.01) this.speed *= 0.55;
        this.x = fixed.x;
        this.z = fixed.z;
      } else {
        this.x = nx;
        this.z = nz;
      }
      group.position.set(this.x, 0, this.z);
      group.rotation.y = this.heading;
      for (const wheel of wheels) wheel.rotation.x += this.speed * dt * 2;
    },
    setPose(x, z, heading) {
      this.x = x;
      this.z = z;
      this.heading = heading;
      this.speed = 0;
      group.position.set(x, 0, z);
      group.rotation.y = heading;
    },
    remove() {
      scene.remove(group);
    },
  };
  return car;
}

// Traffic: each car chases a random intersection, moving axis-aligned so it
// stays on roads, then picks the next one. No avoidance — the city is busy
// enough that near-misses read as traffic.
export function createTraffic(scene, rng, city, count = 14) {
  const cars = [];
  for (let i = 0; i < count; i++) {
    const start = city.randomStreetPoint(rng);
    const car = createCar(scene, {
      x: start.x, z: start.z, heading: rng.range(0, Math.PI * 2),
      color: rng.pick(TRAFFIC_COLORS), maxSpeed: rng.range(7, 11),
    });
    car.target = city.randomStreetPoint(rng);
    cars.push(car);
  }
  return {
    cars,
    update(dt) {
      for (const car of cars) {
        const dx = car.target.x - car.x;
        const dz = car.target.z - car.z;
        if (Math.hypot(dx, dz) < 4) {
          car.target = city.randomStreetPoint(rng);
          continue;
        }
        // Manhattan steps: finish the x leg before turning onto the z leg.
        const targetHeading = Math.abs(dx) > 3 ? (dx > 0 ? Math.PI / 2 : -Math.PI / 2) : (dz > 0 ? 0 : Math.PI);
        let diff = targetHeading - car.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        car.heading += THREE.MathUtils.clamp(diff, -1.4 * dt, 1.4 * dt);
        car.speed = car.maxSpeed;
        car.x += Math.sin(car.heading) * car.speed * dt;
        car.z += Math.cos(car.heading) * car.speed * dt;
        car.mesh.position.set(car.x, 0, car.z);
        car.mesh.rotation.y = car.heading;
      }
    },
  };
}

export function createParked(scene, rng, city, count = 26) {
  const cars = [];
  for (let i = 0; i < count; i++) {
    const street = rng.pick(STREETS);
    const along = rng.range(-140, 140);
    const side = rng.chance(0.5) ? 1 : -1;
    const onXStreet = rng.chance(0.5);
    const x = onXStreet ? along : street + side * 6.5;
    const z = onXStreet ? street + side * 6.5 : along;
    const heading = onXStreet ? (side > 0 ? Math.PI / 2 : -Math.PI / 2) : (side > 0 ? 0 : Math.PI);
    cars.push(createCar(scene, { x, z, heading, color: rng.pick(TRAFFIC_COLORS) }));
  }
  return cars;
}

// Circle-vs-circle push for car-to-car bumps: shove both apart, cut speed,
// return true when a bump happened (the caller adds shake + a thud).
export function bumpCars(a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const min = a.radius + b.radius;
  const d2 = dx * dx + dz * dz;
  if (d2 >= min * min || d2 < 0.0001) return false;
  const d = Math.sqrt(d2);
  const push = (min - d) / 2;
  const nx = dx / d;
  const nz = dz / d;
  a.x -= nx * push;
  a.z -= nz * push;
  b.x += nx * push;
  b.z += nz * push;
  a.speed *= 0.7;
  b.speed *= 0.7;
  return true;
}
