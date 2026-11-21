// Combat: hitscan by ray-to-point (no Raycaster allocations), lock-on
// assist inside a 15-degree cone, a pool of tracer lines, three weapons.
// The SMG stays locked until mission 5 pays out. Shooting is a crime —
// the caller adds the heat; this file only resolves the shot.

import * as THREE from 'three';
import { WEAPONS } from './config.js';

const LOCK_CONE = (15 * Math.PI) / 180;
const HIT_CONE = (3 * Math.PI) / 180;

export function createCombat(scene) {
  // Tracer pool: six thin lines, each alive 60 ms.
  const tracers = [];
  for (let i = 0; i < 6; i++) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0 }));
    scene.add(line);
    tracers.push({ line, life: 0 });
  }
  let tracerCursor = 0;

  const state = {
    current: 'fists',
    ammo: { pistol: WEAPONS.pistol.mag, smg: WEAPONS.smg.mag },
    reloading: 0,
    cooldown: 0,
    unlocked: { fists: true, pistol: false, smg: false },
  };

  function fireTracer(from, to) {
    const t = tracers[tracerCursor];
    tracerCursor = (tracerCursor + 1) % tracers.length;
    const pos = t.line.geometry.attributes.position;
    pos.setXYZ(0, from.x, from.y, from.z);
    pos.setXYZ(1, to.x, to.y, to.z);
    pos.needsUpdate = true;
    t.line.material.opacity = 0.9;
    t.life = 0.06;
  }

  function angleTo(origin, dir, target) {
    const dx = target.x - origin.x;
    const dz = target.z - origin.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.001) return { angle: 0, dist };
    const dot = (dx * dir.x + dz * dir.z) / dist;
    return { angle: Math.acos(THREE.MathUtils.clamp(dot, -1, 1)), dist };
  }

  return {
    ...state,
    get weapon() {
      return WEAPONS[state.current];
    },
    select(slot) {
      const order = ['fists', 'pistol', 'smg'];
      const want = order[slot];
      if (want && state.unlocked[want]) state.current = want;
    },
    unlock(name) {
      state.unlocked[name] = true;
      if (name === 'pistol') state.ammo.pistol = WEAPONS.pistol.mag;
      if (name === 'smg') state.ammo.smg = WEAPONS.smg.mag;
    },
    reload() {
      const w = WEAPONS[state.current];
      if (state.reloading > 0 || w.mag === Infinity) return;
      if (state.ammo[state.current] === w.mag) return;
      state.reloading = w.reload;
    },
    // Best target inside the lock-on cone, for the crosshair + aim snap.
    lockTarget(origin, dir, targets) {
      let best = null;
      let bestAngle = LOCK_CONE;
      for (const t of targets) {
        if (!t.alive) continue;
        const { angle, dist } = angleTo(origin, dir, t);
        if (dist > WEAPONS[state.current].range) continue;
        if (angle < bestAngle) { best = t; bestAngle = angle; }
      }
      return best;
    },
    // Resolve one trigger pull. Returns {hit, killed, end} or null when the
    // weapon cannot fire yet (cooldown / reloading / empty mag).
    shoot(origin, dir, targets) {
      const w = WEAPONS[state.current];
      if (state.cooldown > 0 || state.reloading > 0) return null;
      if (w.mag !== Infinity && state.ammo[state.current] <= 0) {
        state.reloading = w.reload;
        return null;
      }
      state.cooldown = 1 / w.rate;
      if (w.mag !== Infinity) state.ammo[state.current]--;
      const muzzle = { x: origin.x, y: origin.y, z: origin.z };
      if (state.current === 'fists') {
        let hit = null;
        for (const t of targets) {
          if (!t.alive) continue;
          const d = Math.hypot(t.x - origin.x, t.z - origin.z);
          if (d <= w.range) { hit = t; break; }
        }
        if (hit) {
          hit.hp -= w.damage;
          if (hit.hp <= 0) { hit.alive = false; return { hit, killed: true, end: hit }; }
          return { hit, killed: false, end: hit };
        }
        return { hit: null, killed: false, end: { x: origin.x + dir.x * w.range, y: 1.2, z: origin.z + dir.z * w.range } };
      }
      const locked = this.lockTarget(origin, dir, targets);
      const aim = locked
        ? { x: locked.x - origin.x, z: locked.z - origin.z }
        : { x: dir.x, z: dir.z };
      const aimLen = Math.hypot(aim.x, aim.z) || 1;
      const aimDir = { x: aim.x / aimLen, z: aim.z / aimLen };
      let best = null;
      let bestDist = w.range;
      for (const t of targets) {
        if (!t.alive) continue;
        const { angle, dist } = angleTo(origin, aimDir, t);
        if (dist > w.range) continue;
        if (angle < HIT_CONE && dist < bestDist) { best = t; bestDist = dist; }
      }
      const end = best
        ? { x: best.x, y: 1.2, z: best.z }
        : { x: origin.x + aimDir.x * w.range, y: 1.2, z: origin.z + aimDir.z * w.range };
      fireTracer(muzzle, end);
      if (best) {
        best.hp -= w.damage;
        if (best.hp <= 0) {
          best.alive = false;
          return { hit: best, killed: true, end };
        }
        return { hit: best, killed: false, end };
      }
      return { hit: null, killed: false, end };
    },
    update(dt) {
      state.cooldown = Math.max(0, state.cooldown - dt);
      if (state.reloading > 0) {
        state.reloading -= dt;
        if (state.reloading <= 0) {
          const w = WEAPONS[state.current];
          if (w.mag !== Infinity) state.ammo[state.current] = w.mag;
        }
      }
      for (const t of tracers) {
        if (t.life > 0) {
          t.life -= dt;
          if (t.life <= 0) t.line.material.opacity = 0;
        }
      }
    },
    ammoLabel() {
      const w = WEAPONS[state.current];
      if (state.reloading > 0) return `${w.name} · reloading…`;
      if (w.mag === Infinity) return `${w.name} · ∞`;
      return `${w.name} · ${state.ammo[state.current]}/${w.mag}`;
    },
  };
}
