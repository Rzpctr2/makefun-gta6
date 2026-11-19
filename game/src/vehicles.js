// Cars: a low-poly box-built car, arcade driving, traffic AI that follows
// the road grid, and parked cars along the curbs. One class serves the
// player's car, the traffic and the parked rows.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { mulberry32, range, rangeInt, pick } from './rng.js';

const CAR_COLORS = [0xd23c2e, 0x2e86c1, 0xf2c94c, 0x7fb069, 0xe8e4d8, 0x2c313a, 0x8e44ad, 0xff8a65, 0x4fc3f7];

function box(w, h, d, color, x = 0, y = 0, z = 0, emissive = 0) {
  const mat = new THREE.MeshLambertMaterial({ color, emissive });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

// Build one car mesh. Length ~4.4 m along local +Z (forward), width ~1.9 m.
export function buildCarMesh(color) {
  const car = new THREE.Group();
  car.add(box(1.9, 0.55, 4.4, color, 0, 0.55, 0)); // body
  car.add(box(1.7, 0.5, 2.2, 0x1d2733, 0, 1.05, -0.2)); // cabin glass
  car.add(box(1.72, 0.14, 2.24, color, 0, 1.32, -0.2)); // roof
  // Headlights + taillights.
  car.add(box(0.34, 0.14, 0.06, 0xfff6c8, -0.62, 0.62, 2.21, 0xffedb0));
  car.add(box(0.34, 0.14, 0.06, 0xfff6c8, 0.62, 0.62, 2.21, 0xffedb0));
  car.add(box(0.34, 0.14, 0.06, 0xd23c2e, -0.62, 0.62, -2.21, 0x8a1a10));
  car.add(box(0.34, 0.14, 0.06, 0xd23c2e, 0.62, 0.62, -2.21, 0x8a1a10));
  // Wheels.
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x14161a });
  const wheelSpots = [
    [-0.85, 0.36, 1.45], [0.85, 0.36, 1.45], [-0.85, 0.36, -1.45], [0.85, 0.36, -1.45],
  ];
  car.userData.wheels = [];
  for (const [x, y, z] of wheelSpots) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    car.add(wheel);
    car.userData.wheels.push(wheel);
  }
  return car;
}

export function repaintCar(car, color) { car.mesh.children[0].material.color.set(color); car.color = color; }

export class Car {
  constructor(scene, color, x, z, yaw) {
    this.mesh = buildCarMesh(color);
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.y = yaw;
    scene.add(this.mesh);
    this.pos = this.mesh.position;
    this.yaw = yaw;
    this.speed = 0;
    this.steer = 0;
    this.color = color;
    this.maxSpeed = CONFIG.carMaxSpeed;
    this.steerAuthority = 1;
  }

  // Arcade driving: throttle -1..1 (reverse allowed), steer -1..1.
  drive(throttle, steerInput, dt, city) {
    // Steering retune (§5c): full lock at parking speed, half authority
    // at top speed, yaw rate capped at 2.2 rad/s — no more go-kart turns.
    const auth = this.steerAuthority * (1 - 0.5 * Math.min(1, Math.abs(this.speed) / this.maxSpeed));
    const targetSteer = steerInput * CONFIG.carSteer * auth;
    this.steer += (targetSteer - this.steer) * Math.min(1, dt * 8);
    if (throttle > 0) this.speed += CONFIG.carAccel * throttle * dt;
    else if (throttle < 0) {
      if (this.speed > 0.5) this.speed -= CONFIG.carBrake * dt; // brake first
      else this.speed -= CONFIG.carAccel * 0.6 * dt; // then reverse
    } else {
      // Rolling drag.
      this.speed -= Math.sign(this.speed) * Math.min(Math.abs(this.speed), 8 * dt);
    }
    this.speed = Math.max(-CONFIG.carReverseMax, Math.min(this.maxSpeed, this.speed));
    if (Math.abs(this.speed) > 0.05) {
      // Bicycle-ish turn: yaw rate grows with steering and speed.
      const dir = Math.sign(this.speed);
      let dy = (this.steer * this.speed * 0.055 * dir) * dt * 3.2;
      const cap = 2.2 * dt;
      this.yaw += Math.max(-cap, Math.min(cap, dy));
    }
    const fx = Math.sin(this.yaw);
    const fz = Math.cos(this.yaw);
    this.pos.x += fx * this.speed * dt;
    this.pos.z += fz * this.speed * dt;
    // Wall hit (§5c bug fix): the old code called collideCircle twice —
    // the first call already pushed the car out, so the speed cut in the
    // second call almost never fired. One call, cut on its return.
    const speedBefore = this.speed;
    const hit = city.collideCircle(this.pos, 2.1);
    city.clampToLand(this.pos);
    if (hit) this.speed *= 0.55;
    this.mesh.rotation.y = this.yaw;
    // Wheel spin + front-wheel steer visuals.
    const spin = (this.speed * dt) / 0.36;
    for (const w of this.mesh.userData.wheels) w.rotation.x += spin;
    this.mesh.userData.wheels[0].rotation.y = this.steer * 0.5;
    this.mesh.userData.wheels[1].rotation.y = this.steer * 0.5;
    return { hit, impact: Math.abs(speedBefore) };
  }
}

// --- traffic --------------------------------------------------------------
// Cars that cruise the road grid: pick a road, drive its lane, turn or go
// straight at each intersection, slow down for the car ahead.
export class Traffic {
  constructor(scene, city, seed) {
    this.city = city;
    this.rng = mulberry32(seed);
    this.cars = [];
    const xRoads = city.roadCentres('x');
    const zRoads = city.roadCentres('z');
    for (let i = 0; i < CONFIG.trafficCount; i++) {
      const axis = pick(this.rng, ['x', 'z']);
      const road = pick(this.rng, axis === 'x' ? xRoads : zRoads);
      const along = range(this.rng, -CONFIG.citySize / 2, CONFIG.citySize / 2);
      const dir = pick(this.rng, [-1, 1]);
      const lane = 3.2; // right-hand lane offset
      const x = axis === 'x' ? road + (dir > 0 ? lane : -lane) : along;
      const z = axis === 'x' ? along : road + (dir > 0 ? -lane : lane);
      const yaw = axis === 'x' ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : dir > 0 ? 0 : Math.PI;
      const car = new Car(scene, pick(this.rng, CAR_COLORS), x, z, yaw);
      car.speed = range(this.rng, 6, CONFIG.trafficSpeed);
      car.axis = axis;
      car.dir = dir;
      car.road = road;
      car.targetSpeed = car.speed;
      this.cars.push(car);
    }
  }

  update(dt, playerCar) {
    const half = CONFIG.citySize / 2;
    const pitch = CONFIG.pitch;
    for (const car of this.cars) {
      // Slow for the car directly ahead (traffic or the player).
      let ahead = Infinity;
      const all = playerCar ? [...this.cars, playerCar] : this.cars;
      for (const other of all) {
        if (other === car) continue;
        const dx = other.pos.x - car.pos.x;
        const dz = other.pos.z - car.pos.z;
        const fx = Math.sin(car.yaw);
        const fz = Math.cos(car.yaw);
        const forward = dx * fx + dz * fz;
        const side = Math.abs(dx * fz - dz * fx);
        if (forward > 0 && forward < 14 && side < 2.2) ahead = Math.min(ahead, forward);
      }
      const want = ahead < 9 ? 0 : car.targetSpeed;
      car.speed += (want - car.speed) * Math.min(1, dt * 2);
      car.pos.x += Math.sin(car.yaw) * car.speed * dt;
      car.pos.z += Math.cos(car.yaw) * car.speed * dt;
      car.mesh.rotation.y = car.yaw;
      // At an intersection (near a crossing road line), maybe turn.
      const along = car.axis === 'x' ? car.pos.z : car.pos.x;
      const nearest = this.city.nearestRoadCentre(car.axis === 'x' ? 'z' : 'x', along);
      if (Math.abs(along - nearest) < 0.6 && car.speed > 1 && !car.turnedAt?.includes(nearest)) {
        const r = this.rng();
        if (r < 0.3) {
          // Turn left or right onto the crossing road.
          const turn = this.rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
          car.yaw += turn;
          const oldAxis = car.axis;
          car.axis = oldAxis === 'x' ? 'z' : 'x';
          car.dir = Math.sin(car.yaw) > 0.7 || Math.cos(car.yaw) > 0.7 ? 1 : -1;
          car.road = nearest;
        }
        car.turnedAt = car.turnedAt || [];
        car.turnedAt.push(nearest);
        if (car.turnedAt.length > 4) car.turnedAt.shift();
      }
      // Wrap around the city edge instead of despawning.
      if (car.pos.x > half + 4 || car.pos.x < -half - 4 || car.pos.z > half + 4 || car.pos.z < -half - 4) {
        car.pos.x = -car.pos.x * 0.9;
        car.pos.z = -car.pos.z * 0.9;
      }
    }
  }
}

// Parked cars in a neat row along the curbs of one avenue.
export function buildParkedCars(scene, city, seed) {
  const rng = mulberry32(seed + 99);
  const cars = [];
  const avenue = city.roadCentres('x')[Math.floor(CONFIG.blocks / 2)];
  const half = CONFIG.citySize / 2;
  for (let i = 0; i < CONFIG.parkedCount; i++) {
    const z = -half + 24 + i * ((CONFIG.citySize - 48) / CONFIG.parkedCount);
    const side = i % 2 === 0 ? 1 : -1;
    const x = avenue + side * (CONFIG.roadWidth / 2 - 2.4);
    const yaw = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    const car = new Car(scene, pick(rng, CAR_COLORS), x, z, yaw);
    car.speed = 0;
    cars.push(car);
  }
  return cars;
}

export { CAR_COLORS };
