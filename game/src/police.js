// Wanted + police. Heat 0–100, stars = floor(heat/20). A crime only raises
// heat when witnessed — a pedestrian or a police unit close enough, or the
// player already wanted. Eight units with deterministic call signs pursue
// by intercept; a helicopter watches from 40 m at 3+ stars; roadblocks
// appear ahead at 3+ stars; the "Fresh Coat" bay wipes the slate for $150.

import * as THREE from 'three';
import { WANTED, ECONOMY, CAR } from './config.js';
import { createCar } from './vehicles.js';

const CALLSIGNS = ['IBIS', 'TARPON', 'HERON', 'PELICAN', 'EGRET', 'OSPREY'];
const UNITS_BY_STARS = [0, 2, 3, 4, 6, 8];
const RESPRAY_BAY = { x: 30, z: 30, r: 6 };

export function createPolice(scene, city, rng, hooks = {}) {
  const units = [];
  for (let i = 0; i < 8; i++) {
    const car = createCar(scene, { x: 0, z: 0, color: 0x1d2126, police: true, maxSpeed: CAR.policeMaxSpeed });
    car.mesh.visible = false;
    car.callsign = `${CALLSIGNS[i % CALLSIGNS.length]}-${10 + i * 7}`;
    car.mode = 'OFF';
    car.stuck = 0;
    units.push(car);
  }

  // Helicopter: body + tail + rotor + a transparent spotlight cone. It is a
  // visual, not a real spotlight — one shadowed light is the budget.
  const heli = new THREE.Group();
  const heliBody = new THREE.Mesh(new THREE.BoxGeometry(3, 1.4, 6), new THREE.MeshLambertMaterial({ color: 0x1d2126 }));
  const heliTail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 4), new THREE.MeshLambertMaterial({ color: 0x1d2126 }));
  heliTail.position.set(0, 0.3, -4.5);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(9, 0.12, 0.7), new THREE.MeshLambertMaterial({ color: 0x30343a }));
  rotor.position.y = 1;
  // Narrow, faint beam: at 0.22 opacity and radius 7 it read as a solid grey
  // lampshade at night instead of light.
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xfff2c8, transparent: true, opacity: 0.14, side: THREE.DoubleSide });
  // ConeGeometry's apex is +Y by default: centered 20 m below the heli it
  // already points apex-up at the heli, base-down at the street — no flip.
  const cone = new THREE.Mesh(new THREE.ConeGeometry(5, 40, 12, 1, true), coneMat);
  cone.position.y = -20;
  heli.add(heliBody, heliTail, rotor, cone);
  heli.visible = false;
  scene.add(heli);

  // Roadblock: two police cars parked across the road ahead, with a gap.
  const blockers = [createCar(scene, { x: 0, z: 0, color: 0x1d2126, police: true }), createCar(scene, { x: 0, z: 0, color: 0x1d2126, police: true })];
  for (const b of blockers) b.mesh.visible = false;

  const state = {
    heat: 0,
    stars: 0,
    zone: null,
    evadeTimer: 0,
    seenTimer: 0,
    bustedTimer: 0,
    strobe: 0,
  };

  function starsFor(heat) {
    return Math.min(5, Math.floor(heat / WANTED.heatPerStar));
  }

  function setHeat(next) {
    const before = state.stars;
    state.heat = THREE.MathUtils.clamp(next, 0, WANTED.maxHeat);
    state.stars = starsFor(state.heat);
    if (state.stars > before && hooks.onStarsUp) hooks.onStarsUp(state.stars);
    if (state.stars < before && hooks.onStarsDown) hooks.onStarsDown(state.stars);
    if (state.stars === 0 && before > 0 && hooks.onEscape) hooks.onEscape(before);
  }

  return {
    get starsNow() {
      return state.stars;
    },
    get heatNow() {
      return state.heat;
    },
    get zone() {
      return state.zone;
    },
    units,
    heli,
    resprayBay: RESPRAY_BAY,
    addHeat(amount) {
      setHeat(state.heat + amount);
    },
    resetHeat() {
      setHeat(0);
      state.zone = null;
      state.evadeTimer = 0;
    },
    // A crime at (x, z) counts only when someone sees it — or when the
    // player is already wanted, in which case everything counts.
    witnessed(x, z, peds) {
      if (state.stars > 0) return true;
      for (const unit of units) {
        if (unit.mode === 'OFF' || unit.mode === 'WRECK') continue;
        if (Math.hypot(unit.x - x, unit.z - z) < WANTED.witnessPolice) return true;
      }
      if (peds && peds.nearest(x, z, WANTED.witnessPed)) return true;
      return false;
    },
    commitCrime(kind, x, z, peds) {
      if (!this.witnessed(x, z, peds)) return false;
      this.addHeat(WANTED.crimeHeat[kind] ?? 10);
      state.zone = { x, z, r: 260 + state.stars * 90 };
      state.evadeTimer = 0;
      return true;
    },
    // On-demand dispatch lines for the HUD: call sign, distance, status.
    describe(player) {
      const lines = [];
      let shown = 0;
      for (const unit of units) {
        if (unit.mode === 'OFF' || unit.mode === 'WRECK' || shown >= 5) continue;
        const d = Math.round(Math.hypot(unit.x - player.x, unit.z - player.z));
        lines.push(`${unit.callsign} · ${d}m · ${unit.mode}`);
        shown++;
      }
      if (state.stars >= 3) lines.push(`HELI-1 · SPOTLIGHT`);
      return lines.join('\n');
    },
    update(dt, ctx) {
      const { x, z, inCar, speed } = ctx;
      const want = UNITS_BY_STARS[state.stars];
      let active = 0;
      for (const unit of units) {
        // Wrecks stay where they fell, as scenery — never reactivated.
        if (unit.mode === 'WRECK') continue;
        if (active < want) {
          if (unit.mode === 'OFF') {
            // Spawn 60–100 m behind the player, on the nearest street, never
            // in front of the camera.
            const behind = Math.atan2(-Math.sin(ctx.heading ?? 0), -Math.cos(ctx.heading ?? 0));
            const dist = rng.range(60, 100);
            const px = x + Math.sin(behind) * dist;
            const pz = z + Math.cos(behind) * dist;
            unit.setPose(px, pz, behind);
            unit.mesh.visible = true;
            unit.mode = 'PURSUIT';
          }
          active++;
        } else if (unit.mode !== 'OFF') {
          unit.mode = 'OFF';
          unit.mesh.visible = false;
        }
        if (unit.mode === 'OFF') continue;
        // Intercept: aim where the player will be in 0.6 s.
        const lead = 0.6;
        const tx = x + Math.sin(ctx.heading ?? 0) * (speed ?? 0) * lead;
        const tz = z + Math.cos(ctx.heading ?? 0) * (speed ?? 0) * lead;
        const dx = tx - unit.x;
        const dz = tz - unit.z;
        const dist = Math.hypot(dx, dz) || 1;
        const wantHeading = Math.atan2(dx, dz);
        let diff = wantHeading - unit.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const steer = THREE.MathUtils.clamp(diff * 2, -1, 1) * CAR.policeSteer;
        unit.drive(dt, 1, steer, city.collide);
        unit.mode = dist < 6 ? 'RAMMING' : dist < 25 ? 'BOXING IN' : 'PURSUIT';
        // Unstick: full throttle but barely moving for over a second means
        // the unit is wedged — back up with reversed steering.
        if (Math.abs(unit.speed) < 2.5) unit.stuck += dt;
        else unit.stuck = 0;
        if (unit.stuck > 1.1) {
          unit.drive(dt, -1, -steer, city.collide);
          if (unit.stuck > 2) unit.stuck = 0;
        }
      }

      // Helicopter at 3+ stars: hover 40 m up, 26 m ahead of the player.
      const heliOn = state.stars >= 3;
      heli.visible = heliOn;
      if (heliOn) {
        const ahead = ctx.heading ?? 0;
        heli.position.set(x + Math.sin(ahead) * 26, 40, z + Math.cos(ahead) * 26);
        rotor.rotation.y += dt * 18;
      }

      // Roadblock at 3+ stars: two units across the road 80 m ahead, a gap
      // in the middle the player can thread — or smash through.
      const blockOn = state.stars >= 3;
      blockers.forEach((b, i) => {
        b.mesh.visible = blockOn;
        if (!blockOn) return;
        const ahead = ctx.heading ?? 0;
        const bx = x + Math.sin(ahead) * 80;
        const bz = z + Math.cos(ahead) * 80;
        const px = Math.cos(ahead);
        const pz = -Math.sin(ahead);
        const off = (i === 0 ? -4.5 : 4.5);
        b.setPose(bx + px * off, bz + pz * off, ahead + Math.PI / 2);
      });

      // Strobo: alternate the light bar red / blue twice a second.
      state.strobe += dt;
      const phase = Math.floor(state.strobe * 4) % 2 === 0;
      for (const unit of units) {
        if (!unit.lightbar || unit.mode === 'OFF') continue;
        unit.lightbar.red.material.emissiveIntensity = phase ? 2.2 : 0.1;
        unit.lightbar.blue.material.emissiveIntensity = phase ? 0.1 : 2.2;
      }

      // Seen? A unit within 60 m with the player in the open counts.
      const nearest = units.reduce((m, u) => (u.mode !== 'OFF' ? Math.min(m, Math.hypot(u.x - x, u.z - z)) : m), Infinity);
      const seen = nearest < 60;
      if (seen) {
        state.seenTimer += dt;
        state.evadeTimer = 0;
        if (state.zone) { state.zone.x = x; state.zone.z = z; }
      } else if (state.stars > 0) {
        state.evadeTimer += dt;
        const need = WANTED.evadeBaseSeconds + state.stars * WANTED.evadePerStar;
        if (state.evadeTimer > need) {
          setHeat(state.heat - WANTED.decayPerSecond * dt * 4);
          if (state.heat <= 0) this.resetHeat();
        }
      } else if (state.heat > 0) {
        setHeat(state.heat - WANTED.decayPerSecond * dt);
      }

      // Busted: on foot, 2 stars or fewer, slow, a unit within 3 m.
      if (!inCar && state.stars > 0 && state.stars <= 2 && Math.abs(speed ?? 0) < 1) {
        const close = nearest < 3;
        state.bustedTimer = close ? state.bustedTimer + dt : 0;
        if (state.bustedTimer > 1.6 && hooks.onBusted) {
          state.bustedTimer = 0;
          hooks.onBusted();
        }
      } else {
        state.bustedTimer = 0;
      }
    },
  };
}
