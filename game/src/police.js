// Wanted + police. Heat 0-100, stars = floor(heat/20). Crimes only raise
// heat when witnessed (ped in 30m, police in 520m, or already wanted).
// Pool of 8 units, deterministic call signs, intercept pursuit on Car.drive.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Car, repaintCar } from './vehicles.js';
export const CRIMES = { steal: 25, hitPed: 20, shoot: 30, kill: 40, killCop: 50, explosion: 30 };
const NAMES = ['IBIS', 'TARPON', 'HERON', 'PELICAN', 'EGRET', 'OSPREY'];
const UNITS_BY_STARS = [0, 2, 3, 4, 6, 8];
const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export class Police {
  constructor(scene, city, api) {
    this.scene = scene; this.city = city; this.api = api;
    this.heat = 0; this.evadeTimer = 0; this.bustedTimer = 0; this.lastLevel = 0; this.wasWanted = false;
    this.zone = { x: 0, z: 0, r: 260 };
    this.units = [];
    for (let i = 0; i < 8; i++) {
      const car = new Car(scene, 0x16232e, 600, 600, 0);
      car.maxSpeed = 37.4; car.steerAuthority = 0.8; car.mesh.visible = false;
      const barGeo = new THREE.BoxGeometry(0.5, 0.16, 0.3);
      const red = new THREE.MeshLambertMaterial({ color: 0xff2a2a, emissive: 0xff2a2a, emissiveIntensity: 1 });
      const blue = new THREE.MeshLambertMaterial({ color: 0x2a6aff, emissive: 0x2a6aff, emissiveIntensity: 1 });
      const r = new THREE.Mesh(barGeo, red); r.position.set(-0.32, 1.42, -0.2);
      const b = new THREE.Mesh(barGeo, blue); b.position.set(0.32, 1.42, -0.2);
      car.mesh.add(r); car.mesh.add(b);
      const off = new THREE.Group();
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.28), new THREE.MeshLambertMaterial({ color: 0x16232e }));
      torso.position.y = 1.05; const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.3), new THREE.MeshLambertMaterial({ color: 0xe8b48a }));
      head.position.y = 1.55; off.add(torso); off.add(head); off.visible = false; scene.add(off);
      this.units.push({ car, red, blue, officer: off, active: false, wrecked: false, callsign: `${NAMES[i % 6]}-${10 + i * 7}`, stuck: 0, reversing: 0 });
    }
    // Heli visual: 1 group, hover 40 m, spotlight = cone mesh (no real light).
    const hg = new THREE.Group();
    const hm = new THREE.MeshLambertMaterial({ color: 0x16232e });
    const hbody = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.1, 1.6), hm);
    hbody.position.y = 0.5; hg.add(hbody);
    const htail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 2.6), hm);
    htail.position.set(0, 0.6, -2.4); hg.add(htail);
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.08, 0.4), new THREE.MeshLambertMaterial({ color: 0x20262e }));
    rotor.position.y = 1.25; hg.add(rotor);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(5, 40, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
    cone.position.y = -20; hg.add(cone);
    hg.visible = false; scene.add(hg);
    this.heli = { group: hg, rotor, on: false };
    // Roadblock: 2 parked police cars, placed across the road ahead.
    this.blocks = [];
    for (let i = 0; i < 2; i++) { const c = new Car(scene, 0x16232e, 600, 600, 0); c.mesh.visible = false; this.blocks.push(c); }
    this.blockOn = false; this.blockAt = { x: 0, z: 0 };
    // Respray bay "Fresh Coat" ($150): teal ring + pillar at (80, -36).
    const ring = new THREE.Mesh(new THREE.RingGeometry(5, 6.6, 28),
      new THREE.MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(80, 0.15, -36); scene.add(ring);
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.4, 12, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }));
    pil.position.set(80, 6, -36); scene.add(pil);
    this.respray = { x: 80, z: -36, r: 7 }; this.inBay = false; this.bayHint = false;
  }
  get level() { return Math.floor(this.heat / 20); }
  addHeat(n) { this.heat = clamp(this.heat + n, 0, 100); }
  addCrime(type, pos, peds) {
    const n = CRIMES[type] || 10;
    let seen = this.level > 0;
    if (!seen && peds) for (const p of peds) if (Math.hypot(p.pos.x - pos.x, p.pos.z - pos.z) < 30) { seen = true; break; }
    if (!seen) for (const u of this.units) if (u.active && Math.hypot(u.car.pos.x - pos.x, u.car.pos.z - pos.z) < 520) { seen = true; break; }
    if (seen) { this.addHeat(n); this.zone.x = pos.x; this.zone.z = pos.z; if (type === 'shoot' || type === 'kill') this.api.radio.sfx('wanted'); }
    return seen;
  }
  spawn(u, ctx) {
    const behind = ctx.yaw + Math.PI, rx = (Math.random() - 0.5) * 40;
    const x = ctx.pos.x + Math.sin(behind) * 80 + Math.cos(behind) * rx;
    const z = ctx.pos.z + Math.cos(behind) * 80 - Math.sin(behind) * rx;
    u.car.pos.set(x, 0, z); this.city.clampToLand(u.car.pos); this.city.collideCircle(u.car.pos, 2.1);
    u.car.yaw = Math.atan2(ctx.pos.x - x, ctx.pos.z - z); u.car.speed = 18;
    u.car.mesh.visible = true; u.active = true; u.wrecked = false; u.stuck = 0; u.reversing = 0;
  }
  despawn(u) { u.active = false; u.car.mesh.visible = false; u.officer.visible = false; u.car.speed = 0; }
  resetHeat() { this.heat = 0; this.wasWanted = false; this.evadeTimer = 0; this.bustedTimer = 0; for (const u of this.units) this.despawn(u); this.heli.on = false; this.heli.group.visible = false; this.hideBlock(); }
  hideBlock() { this.blockOn = false; for (const b of this.blocks) b.mesh.visible = false; }
  hitsBlock(pos) { if (!this.blockOn) return false; return this.blocks.some((b) => Math.hypot(b.pos.x - pos.x, b.pos.z - pos.z) < 3); }
  update(dt, ctx) {
    const level = this.level; this.api.state.wanted = level;
    if (level > 0) this.wasWanted = true;
    else if (this.wasWanted && this.heat <= 0) {
      this.wasWanted = false; const s = this.api.state; s.escapes = (s.escapes || 0) + 1;
      this.api.hud.showToast(`You lost the cops — escape ${Math.min(s.escapes, 5)}/5`, 3);
    }
    if (level !== this.lastLevel) { if (level > this.lastLevel) this.api.radio.sfx('wanted'); this.lastLevel = level; }
    const want = UNITS_BY_STARS[level];
    let active = this.units.filter((u) => u.active && !u.wrecked).length;
    for (const u of this.units) {
      if (!u.active) continue;
      const d = Math.hypot(u.car.pos.x - ctx.pos.x, u.car.pos.z - ctx.pos.z);
      if (d > 220) { this.despawn(u); active--; }
    }
    if (active < want) for (const u of this.units) { if (active >= want) break; if (!u.active) { this.spawn(u, ctx); active++; } }
    let seen = false;
    for (const u of this.units) {
      if (!u.active || u.wrecked) continue;
      const dx = ctx.pos.x - u.car.pos.x, dz = ctx.pos.z - u.car.pos.z, d = Math.hypot(dx, dz);
      const flash = Math.sin(performance.now() / 120) > 0;
      u.red.emissiveIntensity = flash ? 1.6 : 0.15; u.blue.emissiveIntensity = flash ? 0.15 : 1.6;
      if (d < 80) { seen = true; this.zone.x = ctx.pos.x; this.zone.z = ctx.pos.z; }
      if (!ctx.driving && d < 150) {
        u.car.speed = Math.max(0, u.car.speed - 20 * dt);
        const o = u.officer; o.visible = true;
        if (!u.officerOut) { o.position.set(u.car.pos.x, 0, u.car.pos.z); u.officerOut = true; }
        const odx = ctx.pos.x - o.position.x, odz = ctx.pos.z - o.position.z, od = Math.hypot(odx, odz);
        if (od > 0.5) { o.position.x += (odx / od) * 5 * dt; o.position.z += (odz / od) * 5 * dt; o.rotation.y = Math.atan2(odx, odz); }
        if (od < 2.5 && (ctx.playerSpeed || 0) < 1 && level <= 2) { this.bustedTimer += dt; if (this.bustedTimer > 1.6) { this.bustedTimer = 0; this.api.onBusted(); } }
        else this.bustedTimer = 0;
        continue;
      }
      u.officer.visible = false; u.officerOut = false;
      if (u.reversing > 0) { u.reversing -= dt; u.car.drive(-0.7, -u.lastSteer || 0, dt, this.city); continue; }
      const ix = ctx.pos.x + (ctx.vel ? ctx.vel.x * 0.6 : 0), iz = ctx.pos.z + (ctx.vel ? ctx.vel.z * 0.6 : 0);
      const wantYaw = Math.atan2(ix - u.car.pos.x, iz - u.car.pos.z);
      const steer = clamp(wrap(wantYaw - u.car.yaw) * 2, -1, 1); u.lastSteer = steer;
      u.car.drive(1, steer, dt, this.city);
      if (Math.abs(u.car.speed) < 2.5) { u.stuck += dt; if (u.stuck > 1.1) { u.stuck = 0; u.reversing = 0.9; } } else u.stuck = 0;
    }
    if (level > 0 && !seen) {
      this.evadeTimer += dt;
      if (this.evadeTimer > 5 + level * 1.8) this.heat = Math.max(0, this.heat - 2.5 * dt);
    } else this.evadeTimer = 0;
    // Heli (from 3 stars, §5b.4) + roadblock (from 3 stars, 80 m ahead).
    const t = this.api.state.elapsed || 0;
    if (level >= 3) {
      if (!this.heli.on) { this.heli.on = true; this.heli.group.visible = true; this.api.hud.showToast('POLICE HELICOPTER — spotlight on you', 3); }
      const a = t * 0.25;
      const hfx = Math.sin(ctx.yaw), hfz = Math.cos(ctx.yaw);
      this.heli.group.position.set(ctx.pos.x + hfx * 26 + Math.sin(a) * 4, 40, ctx.pos.z + hfz * 26 + Math.cos(a) * 4);
      this.heli.rotor.rotation.y += dt * 18;
      if (!this.blockOn) {
        const fx = Math.sin(ctx.yaw), fz = Math.cos(ctx.yaw), px = Math.cos(ctx.yaw), pz = -Math.sin(ctx.yaw);
        const cx = ctx.pos.x + fx * 80, cz = ctx.pos.z + fz * 80;
        this.blockAt = { x: cx, z: cz };
        this.blocks[0].pos.set(cx + px * 3.4, 0, cz + pz * 3.4);
        this.blocks[1].pos.set(cx - px * 3.4, 0, cz - pz * 3.4);
        this.city.clampToLand(this.blocks[0].pos); this.city.clampToLand(this.blocks[1].pos);
        for (const b of this.blocks) { b.yaw = ctx.yaw + Math.PI / 2; b.mesh.rotation.y = b.yaw; b.mesh.visible = true; }
        this.blockOn = true; this.api.hud.showToast('ROADBLOCK AHEAD — find the gap', 3);
      }
    } else {
      if (this.heli.on) { this.heli.on = false; this.heli.group.visible = false; }
      if (this.blockOn) this.hideBlock();
    }
    if (this.blockOn && Math.hypot(ctx.pos.x - this.blockAt.x, ctx.pos.z - this.blockAt.z) < 14) this.hideBlock();
    // Respray: drive into the bay with wanted > 0 and $150 -> wanted 0.
    const bd = Math.hypot(ctx.pos.x - this.respray.x, ctx.pos.z - this.respray.z);
    if (ctx.driving && level > 0 && bd < this.respray.r && !this.inBay) {
      this.inBay = true;
      if (this.api.state.cash >= 150) {
        this.api.state.cash -= 150; this.resetHeat();
        if (ctx.car) repaintCar(ctx.car, 0xf2c94c);
        this.api.hud.showToast('FRESH COAT — $150 · wanted cleared', 3); this.api.radio.sfx('unlock');
      } else if (!this.bayHint) { this.bayHint = true; this.api.hud.showToast('Fresh Coat needs $150', 2.5); }
    } else if (bd > 10) { this.inBay = false; this.bayHint = false; }
    this.zone.r = 260 + level * 90;
  }
  describe() {
    const list = this.units.filter((u) => u.active && !u.wrecked)
      .map((u) => ({ name: u.callsign, d: Math.round(Math.hypot(u.car.pos.x - this.zone.x, u.car.pos.z - this.zone.z)), status: 0 }))
      .sort((a, b) => a.d - b.d).slice(0, 3);
    for (const u of list) u.status = u.d < 6 ? 'RAMMING' : u.d < 25 ? 'BOXING IN' : 'PURSUIT';
    if (this.heli.on) list.unshift({ name: 'HELI-1', d: Math.round(Math.hypot(this.heli.group.position.x - this.zone.x, this.heli.group.position.z - this.zone.z)), status: 'SPOTLIGHT' });
    if (this.blockOn) list.push({ name: 'ROADBLOCK', d: Math.round(Math.hypot(this.blockAt.x - this.zone.x, this.blockAt.z - this.zone.z)), status: 'ROADBLOCK' });
    return list.slice(0, 5);
  }
  activeUnits() { return this.units.filter((u) => u.active); }
}
