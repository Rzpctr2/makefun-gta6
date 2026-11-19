// Combat minimal: hitscan by ray-to-point (no Raycaster allocs), lock-on
// assist in a 15-degree cone, tracer pool, 3 weapons. SMG locked to mission 5.
import * as THREE from 'three';
export const WEAPONS = {
  fists: { name: 'Fists', dmg: 15, range: 2.5, rate: 2.5, mag: Infinity, reload: 0, auto: false },
  pistol: { name: 'Pistol', dmg: 34, range: 60, rate: 3, mag: 12, reload: 1.1, auto: false },
  smg: { name: 'SMG', dmg: 18, range: 45, rate: 9, mag: 32, reload: 1.6, auto: true, locked: true },
};
export class Combat {
  constructor(scene, camera, api) {
    this.scene = scene; this.camera = camera; this.api = api;
    this.weapon = 'fists'; this.ammo = Infinity; this.cool = 0; this.reloadT = 0; this.kills = 0;
    this.shootQueued = false; this.locked = null; this.flash = 0;
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.tracers = [];
    for (let i = 0; i < 6; i++) {
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0 }));
      line.visible = false; scene.add(line); this.tracers.push({ line, t: 0 });
    }
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Digit1') this.select('fists');
      if (e.code === 'Digit2') this.select('pistol');
      if (e.code === 'Digit3') this.select('smg');
      if (e.code === 'KeyR') this.reload();
      if (e.code === 'KeyF') this.shootQueued = true;
    });
    window.addEventListener('pointerup', (e) => { if (e.target && e.target.id === 'game-canvas') this.shootQueued = true; });
  }
  select(name) {
    const w = WEAPONS[name]; if (!w) return;
    if (name === 'pistol' && !this.api.state.has_pistol) { this.api.hud.showToast('Pistol locked — finish mission 4', 2); return; }
    if (name === 'smg' && !this.api.state.has_smg) { this.api.hud.showToast('SMG locked — finish mission 5', 2); return; }
    this.weapon = name; this.ammo = w.mag; this.reloadT = 0; this.api.radio.sfx('click');
  }
  reload() { const w = WEAPONS[this.weapon]; if (w.mag === Infinity || this.ammo === w.mag || this.reloadT > 0) return; this.reloadT = w.reload; this.api.radio.sfx('click'); }
  targets(ctx) {
    const list = [];
    for (const p of ctx.peds || []) if (!p.dead) list.push({ pos: p.pos, hp: p, kind: 'ped' });
    for (const u of ctx.police || []) if (u.active && !u.wrecked) list.push({ pos: u.car.pos, hp: u, kind: 'cop' });
    return list;
  }
  aim(ctx) {
    const dir = new THREE.Vector3(); this.camera.getWorldDirection(dir);
    const origin = this.camera.position; let best = null, bestScore = Infinity;
    for (const t of this.targets(ctx)) {
      const to = new THREE.Vector3(t.pos.x - origin.x, 1.2 - origin.y, t.pos.z - origin.z);
      const dist = to.length(); if (dist > WEAPONS[this.weapon].range || dist < 0.5) continue;
      const ang = dir.angleTo(to.normalize());
      if (ang < 0.26 && dist < bestScore) { bestScore = dist; best = { t, dist, ang }; }
    }
    this.locked = best ? best.t : null;
    return best;
  }
  shoot(ctx) {
    const w = WEAPONS[this.weapon];
    if (this.cool > 0 || this.reloadT > 0) return;
    if (w.mag !== Infinity && this.ammo <= 0) { this.reload(); return; }
    this.cool = 1 / w.rate; if (w.mag !== Infinity) this.ammo--;
    const origin = this.camera.position.clone(); origin.y = Math.max(origin.y, 1.4);
    const dir = new THREE.Vector3(); this.camera.getWorldDirection(dir);
    let hit = this.aim(ctx), end;
    if (hit) {
      const t = hit.t, dmg = w.dmg;
      if (t.kind === 'ped') {
        t.hp.hp = (t.hp.hp || 100) - dmg;
        if (t.hp.hp <= 0 && !t.hp.dead) { t.hp.dead = true; t.hp.group.visible = false; this.kills++; this.api.state.kills = this.kills; this.api.police.addCrime('kill', t.pos, ctx.peds); this.api.radio.sfx('thud'); }
        else this.api.police.addCrime('shoot', t.pos, ctx.peds);
      } else {
        t.hp.hp = (t.hp.hp || 120) - dmg;
        if (t.hp.hp <= 0 && !t.hp.wrecked) { t.hp.wrecked = true; t.hp.car.speed = 0; this.kills++; this.api.state.kills = this.kills; this.api.police.addCrime('killCop', t.pos, ctx.peds); }
        else this.api.police.addCrime('shoot', t.pos, ctx.peds);
      }
      end = new THREE.Vector3(t.pos.x, 1.2, t.pos.z);
    } else {
      end = origin.clone().add(dir.multiplyScalar(w.range));
      if (this.weapon !== 'fists') this.api.police.addCrime('shoot', ctx.playerPos || end, ctx.peds);
    }
    if (this.weapon === 'fists') { this.api.radio.sfx('thud'); }
    else {
      this.api.radio.sfx('shot');
      const tr = this.tracers.find((x) => x.t <= 0) || this.tracers[0];
      const start = new THREE.Vector3(ctx.playerPos ? ctx.playerPos.x : origin.x, 1.4, ctx.playerPos ? ctx.playerPos.z : origin.z);
      tr.line.geometry.setFromPoints([start, end]); tr.line.material.opacity = 0.9; tr.line.visible = true; tr.t = 0.06;
    }
  }
  update(dt, ctx) {
    this.cool = Math.max(0, this.cool - dt);
    if (this.reloadT > 0) { this.reloadT -= dt; if (this.reloadT <= 0) { this.ammo = WEAPONS[this.weapon].mag; this.api.radio.sfx('blip'); } }
    for (const tr of this.tracers) if (tr.t > 0) { tr.t -= dt; if (tr.t <= 0) tr.line.visible = false; }
    this.aim(ctx);
    if (this.shootQueued) { this.shootQueued = false; this.shoot(ctx); }
    else if (WEAPONS[this.weapon].auto && this.api.mouseDown) this.shoot(ctx);
  }
  hudText() {
    const w = WEAPONS[this.weapon];
    const ammo = w.mag === Infinity ? '∞' : `${this.ammo}/${w.mag}${this.reloadT > 0 ? ' …' : ''}`;
    return `${w.name} · ${ammo}${this.weapon === 'smg' && WEAPONS.smg.locked && !this.api.state.smg ? ' · SMG LOCKED' : ''}`;
  }
}
