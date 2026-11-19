// Missions: data-driven. 8 story missions, one small runner, 5 stage types:
// talk / reach / hold / combat / escape. Talk stages are hidden from the HUD
// stage count. Fail is never game over: toast, restart from stage 0.
import * as THREE from 'three';
import { Car } from './vehicles.js';
const wrapA = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
export const RACE = { name: 'Palma Verde Grand Loop', reward: 1000, par: 75, cps: [
  { x: 22, z: -152 }, { x: 138, z: -152 }, { x: 138, z: 138 }, { x: -94, z: 138 },
  { x: -94, z: -36 }, { x: 22, z: -36 }, { x: 22, z: 22 } ] };
export const MISSIONS = [
  { name: 'Selamat Datang di Palma Verde', giver: 'Nadia', reward: 300, par: 150, stages: [
    { t: 'talk', lines: [{ who: 'Nadia', text: 'Leo. Baru sampai, sudah lapar? Palma Verde tidak memberi makan gratis.' }, { who: 'Nadia', text: 'Jalan dulu ke plaza. Mobil merah itu punyamu — bawa ke persimpangan utara, cepat.' }] },
    { t: 'reach', x: 0, z: 10, r: 6, label: 'Walk to the plaza' },
    { t: 'reach', x: -36, z: -94, r: 8, drive: true, label: 'Drive to the north junction' } ] },
  { name: 'Paket Panas', giver: 'Nadia', reward: 500, par: 90, stages: [
    { t: 'reach', x: -94, z: 138, r: 8, drive: true, timer: 75, label: 'Deliver the package — fast' },
    { t: 'reach', x: 80, z: 22, r: 8, drive: true, label: 'Drop it at the boulevard' } ] },
  { name: 'Tukar Guling', giver: 'Kiko', reward: 700, par: 240, stages: [
    { t: 'talk', lines: [{ who: 'Kiko', text: 'Coupe sport itu terparkir di avenue. Ambil, jangan dilihat orang.' }] },
    { t: 'reach', x: -36, z: 80, r: 6, label: 'Steal the sport coupe', heat: 1 },
    { t: 'escape', x: 0, z: 8, r: 8, label: 'Lose the heat at the safehouse' } ] },
  { name: 'Sarang di Menara', giver: 'Nadia', reward: 1200, par: 240, stages: [
    { t: 'reach', x: 138, z: 138, r: 8, label: 'Reach the tower' },
    { t: 'combat', n: 4, label: 'Clear the rooftop crew' },
    { t: 'escape', x: 0, z: 8, r: 8, label: 'Escape to the safehouse' } ] },
  { name: 'Kasir Kosong', giver: 'Ilsa', reward: 1500, par: 150, stages: [
    { t: 'reach', x: 80, z: -152, r: 8, label: 'Reach the shop' },
    { t: 'hold', x: 80, z: -152, r: 8, t: 12, label: 'Hold the till until the safe opens' },
    { t: 'escape', x: 0, z: 8, r: 8, label: 'Escape to the safehouse' } ] },
  { name: 'Sopir Pelarian', giver: 'Ilsa', reward: 2000, par: 240, stages: [
    { t: 'talk', lines: [{ who: 'Ilsa', text: 'Aku yang menembak, kau yang menyetir. Jangan berhenti.' }] },
    { t: 'escape', x: -152, z: -36, r: 10, drive: true, label: 'Outrun them to the west road' },
    { t: 'reach', x: 0, z: 8, r: 8, label: 'Return to the safehouse' } ] },
  { name: 'Jembatan Terbakar', giver: 'Nadia', reward: 2500, par: 240, stages: [
    { t: 'combat', n: 3, label: 'Smash the 3 convoy cars' },
    { t: 'escape', x: 0, z: 8, r: 8, label: 'Escape before the helicopter arrives' } ] },
  { name: 'Bank Solmarina', giver: 'Nadia', reward: 5000, par: 240, stages: [
    { t: 'talk', lines: [{ who: 'Nadia', text: 'Ini dia, Leo. Bank Solmarina. Setelah ini, Palma Verde milik kita.' }] },
    { t: 'hold', x: 196, z: 80, r: 10, t: 15, label: 'Hold the vault' },
    { t: 'combat', n: 5, label: 'Fight your way out' },
    { t: 'escape', x: 0, z: 8, r: 8, label: 'Escape — become a legend' } ] },
];
const BEACON_GEO = new THREE.CylinderGeometry(1.1, 1.1, 34, 10, 1, true);
const BEACON_MAT = new THREE.MeshBasicMaterial({ color: 0xf2c94c, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
const RING_GEO = new THREE.RingGeometry(3.4, 4.4, 24);
const RING_MAT = new THREE.MeshBasicMaterial({ color: 0xf2c94c, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
export class Missions {
  constructor(scene, api) {
    this.scene = scene; this.api = api; this.idx = 0; this.stage = 0; this.active = false; this.done = false;
    this.stageTimer = 0; this.totalTimer = 0; this.holdTimer = 0; this.escTimer = 0;
    this.talkStarted = false; this.nextTimer = 0; this.failTimer = 0; this.lastHud = '';
    this.raceActive = false; this.raceCp = 0; this.raceTimer = 0; this.saved = null;
    this.rivals = [new Car(scene, 0x4fc3f7, 600, 600, 0), new Car(scene, 0xff8a65, 600, 600, 0)];
    this.rivals[0].maxSpeed = 30; this.rivals[1].maxSpeed = 28;
    for (const r of this.rivals) { r.mesh.visible = false; r.cp = 0; }
    this.beacon = new THREE.Group();
    const pillar = new THREE.Mesh(BEACON_GEO, BEACON_MAT); pillar.position.y = 17;
    const ring = new THREE.Mesh(RING_GEO, RING_MAT); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.15;
    this.beacon.add(pillar); this.beacon.add(ring); this.beacon.visible = false; scene.add(this.beacon);
  }
  get mission() { return MISSIONS[this.idx]; }
  get stageDef() { return this.mission ? this.mission.stages[this.stage] : null; }
  facedStages() { return this.mission.stages.filter((s) => s.t !== 'talk'); }
  stageNo() { const f = this.facedStages(); return Math.max(1, f.indexOf(this.stageDef) + 1); }
  start(i) {
    this.idx = Math.max(0, Math.min(MISSIONS.length - 1, i || 0));
    this.stage = 0; this.active = true; this.done = false;
    this.stageTimer = 0; this.totalTimer = 0; this.holdTimer = 0; this.escTimer = 0; this.talkStarted = false;
    this.api.hud.showToast(`Mission ${this.idx + 1}/8 — ${this.mission.name}`, 3.5);
    this.api.radio.sfx('blip');
  }
  // --- street race (side job, repeatable, §10) ---------------------------
  raceTarget() { return this.raceActive ? RACE.cps[this.raceCp] : null; }
  startRace(pos) {
    if (this.raceActive) return true;
    if (!this.api.state.driving) return false;
    this.saved = { idx: this.idx, stage: this.stage, active: this.active };
    this.active = false; this.raceActive = true; this.raceCp = 0; this.raceTimer = 0;
    BEACON_MAT.color.setHex(0x4fc3f7); RING_MAT.color.setHex(0x4fc3f7);
    const first = RACE.cps[0], yaw = Math.atan2(first.x - pos.x, first.z - pos.z);
    this.rivals.forEach((r, i) => {
      r.cp = 0; r.pos.set(pos.x + (i ? 4.5 : -4.5), 0, pos.z + 3); r.yaw = yaw;
      r.speed = 0; r.mesh.visible = true; r.mesh.rotation.y = yaw;
    });
    this.api.hud.showToast(`RACE — ${RACE.name} · first to the finish wins $${RACE.reward.toLocaleString('en-US')}`, 4);
    this.api.radio.sfx('blip');
    return true;
  }
  endRace(won) {
    this.raceActive = false; this.beacon.visible = false;
    BEACON_MAT.color.setHex(0xf2c94c); RING_MAT.color.setHex(0xf2c94c);
    for (const r of this.rivals) { r.mesh.visible = false; r.speed = 0; }
    const s = this.api.state;
    if (won) {
      const bonus = this.raceTimer <= RACE.par ? 250 : 0;
      s.cash += RACE.reward + bonus; s.raceWins = (s.raceWins || 0) + 1; s.raceWon = true;
      if (!s.raceBest || this.raceTimer < s.raceBest) s.raceBest = Math.round(this.raceTimer);
      this.api.hud.showToast(`RACE WON — +$${(RACE.reward + bonus).toLocaleString('en-US')} in ${Math.round(this.raceTimer)}s${bonus ? ' (par bonus!)' : ''}`, 4);
      this.api.radio.sfx('sting');
    } else {
      this.api.hud.showToast('RACE LOST — a rival finished first · pause to retry', 4);
      this.api.radio.sfx('busted');
    }
    if (this.saved) { this.idx = this.saved.idx; this.stage = this.saved.stage; this.active = this.saved.active; this.saved = null; }
  }
  updateRace(dt, ctx) {
    this.raceTimer += dt;
    const cp = RACE.cps[this.raceCp];
    if (Math.hypot(ctx.pos.x - cp.x, ctx.pos.z - cp.z) < 10) {
      this.raceCp++; this.api.radio.sfx('blip');
      if (this.raceCp >= RACE.cps.length) { this.endRace(true); return; }
    }
    for (const r of this.rivals) {
      const t = RACE.cps[r.cp];
      if (Math.hypot(r.pos.x - t.x, r.pos.z - t.z) < 10) {
        r.cp++;
        if (r.cp >= RACE.cps.length) { this.endRace(false); return; }
      }
      const want = Math.atan2(t.x - r.pos.x, t.z - r.pos.z);
      const steer = Math.max(-1, Math.min(1, wrapA(want - r.yaw) * 2));
      r.drive(0.92, steer, dt, this.api.city);
    }
    const o = this.raceTarget();
    if (o) {
      this.beacon.visible = true; this.beacon.position.set(o.x, 0, o.z);
      const p = 1 + Math.sin(this.raceTimer * 3) * 0.12; this.beacon.scale.set(p, 1, p);
    }
  }
  objective() { const r = this.raceTarget(); if (r) return r; const s = this.stageDef; return s && s.x !== undefined ? { x: s.x, z: s.z } : null; }
  distTo(pos) { const o = this.objective(); return o ? Math.hypot(pos.x - o.x, pos.z - o.z) : 0; }
  completeStage() {
    const s = this.stageDef;
    if (s && s.heat) { if (this.api.police) this.api.police.addHeat(s.heat * 20); else this.api.state.wanted = Math.max(this.api.state.wanted, s.heat); this.api.radio.sfx('wanted'); }
    this.stage++; this.stageTimer = 0; this.holdTimer = 0; this.escTimer = 0; this.talkStarted = false;
    if (this.stage >= this.mission.stages.length) this.completeMission();
    else this.api.radio.sfx('blip');
  }
  completeMission() {
    const m = this.mission, bonus = this.totalTimer <= m.par ? 250 : 0;
    this.api.state.cash += m.reward + bonus; this.api.state.rep = (this.api.state.rep || 0) + 1;
    this.api.state.completed = (this.api.state.completed || 0) + 1;
    this.api.hud.showToast(`MISSION PASSED — ${m.name}  +$${(m.reward + bonus).toLocaleString('en-US')}${bonus ? ' (par bonus!)' : ''}`, 4);
    this.api.radio.sfx('sting'); this.active = false; this.done = true; this.beacon.visible = false;
    if (this.api.onMissionComplete) this.api.onMissionComplete(this.idx);
    if (this.idx + 1 < MISSIONS.length) { this.nextTimer = 2.5; } else this.api.hud.showToast('LEO MARIN — LEGENDA PALMA VERDE', 6);
  }
  failMission(reason) {
    this.api.hud.showToast(`${reason} — mission failed, try again`, 3);
    this.api.radio.sfx('busted'); this.failTimer = 3; this.active = false;
  }
  update(dt, ctx) {
    if (this.nextTimer > 0) { this.nextTimer -= dt; if (this.nextTimer <= 0) this.start(this.idx + 1); return; }
    if (this.failTimer > 0) { this.failTimer -= dt; if (this.failTimer <= 0) this.start(this.idx); return; }
    if (this.raceActive) { if (!this.api.dialog.active) this.updateRace(dt, ctx); return; }
    if (!this.active) { this.beacon.visible = false; return; }
    if (this.api.dialog.active) return;
    const s = this.stageDef; if (!s) return;
    this.totalTimer += dt; this.stageTimer += dt;
    if (s.timer && this.stageTimer > s.timer) { this.failMission('Too slow'); return; }
    if (s.t === 'talk') {
      if (!this.talkStarted) { this.talkStarted = true; this.api.radio.duck(true); this.api.dialog.show(s.lines, () => { this.api.radio.duck(false); this.completeStage(); }); }
      return;
    }
    const d = this.distTo(ctx.pos);
    if (s.t === 'reach') {
      if (s.drive && !ctx.driving) { /* need a car */ }
      else if (d < s.r) this.completeStage();
    } else if (s.t === 'hold') {
      if (d < s.r) { this.holdTimer += dt; if (this.holdTimer >= s.t) this.completeStage(); } else this.holdTimer = 0;
    } else if (s.t === 'combat') {
      if ((ctx.kills || 0) >= s.n) this.completeStage();
    } else if (s.t === 'escape') {
      if (d < s.r) {
        this.escTimer += dt;
        if (this.escTimer > 4) { this.api.state.wanted = 0; this.completeStage(); }
      } else this.escTimer = 0;
    } else if (s.t === 'wanted') {
      if ((ctx.wanted || 0) >= s.n) this.completeStage();
    }
    const o = this.objective();
    if (o) {
      this.beacon.visible = true; this.beacon.position.set(o.x, 0, o.z);
      const p = 1 + Math.sin(this.totalTimer * 3) * 0.12; this.beacon.scale.set(p, 1, p);
    } else this.beacon.visible = false;
  }
  hudText(pos) {
    if (this.raceActive) {
      const cp = RACE.cps[this.raceCp];
      const d = pos ? Math.round(Math.hypot(pos.x - cp.x, pos.z - cp.z)) : 0;
      return `RACE — ${RACE.name} · checkpoint ${this.raceCp + 1}/${RACE.cps.length} · ${Math.round(this.raceTimer)}s · ${d}m · $${RACE.reward.toLocaleString('en-US')}`;
    }
    if (!this.mission) return '';
    const s = this.stageDef, f = this.facedStages();
    if (!this.active) return this.done ? `MISSION ${this.idx + 1}/8 — ${this.mission.name} · PASSED` : '';
    const d = pos ? Math.round(this.distTo(pos)) : 0;
    const label = s.label || (s.t === 'talk' ? `Talk to ${s.lines[0].who}` : this.mission.name);
    let extra = '';
    if (s.t === 'hold') extra = ` · ${Math.max(0, Math.ceil(s.t - this.holdTimer))}s`;
    if (s.t === 'escape' && this.escTimer > 0) extra = ` · laying low ${Math.ceil(this.escTimer)}/4s`;
    if (s.timer) extra += ` · ${Math.max(0, Math.ceil(s.timer - this.stageTimer))}s left`;
    const nx = f[this.stageNo()];
    if (nx) extra += ` · NEXT: ${nx.label || nx.t}`;
    return `MISSION ${this.idx + 1}/8 — ${this.mission.name} · ${this.stageNo()}/${f.length} · ${label}${d ? ` — ${d}m` : ''}${extra}`;
  }
  objectiveText() {
    if (!this.active || !this.stageDef) return null;
    return this.stageDef.label || this.mission.name;
  }
}
