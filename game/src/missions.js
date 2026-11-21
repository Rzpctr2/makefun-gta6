// Missions: data-driven. Eight story missions and one repeatable street
// race share one small runner and five stage types — talk / reach / hold /
// combat / escape. Talk and scripted wanted stages stay out of the HUD
// stage count. Failing is never game over: a toast, then retry from stage
// zero. A par time pays a $250 bonus on top of the reward.

import * as THREE from 'three';
import { createCar } from './vehicles.js';

export const MISSIONS = [
  {
    id: 1, title: 'Selamat Datang di Palma Verde', reward: 300, rep: 1, par: 120,
    stages: [
      { type: 'talk', who: 'nadia', lines: [
        { who: 'nadia', text: 'Leo Marin. Baru turun dari feri, sudah sok jagoan? Kota ini bukan tempat buat pendatang yang lambat.' },
        { who: 'leo', text: 'Aku cepat belajar. Kasih aku kerjaan, Nadia.' },
        { who: 'nadia', text: 'Gampang. Jalan ke pojok boulevard — mobil di sana, kuncinya di dalam. Bawa balik ke sini.' },
      ] },
      { type: 'reach', x: 36, z: -36, r: 5, label: 'Reach the corner car' },
      { type: 'reach', x: 18, z: 18, r: 5, label: 'Bring it back to the plaza' },
    ],
  },
  {
    id: 2, title: 'Paket Panas', reward: 500, rep: 1, par: 75,
    stages: [
      { type: 'talk', who: 'nadia', lines: [
        { who: 'nadia', text: 'Paket di ujung utara. Polisi lagi patroli — jangan sampai mereka lihat mukamu. Cepat.' },
      ] },
      { type: 'reach', x: 144, z: -144, r: 5, label: 'Pick up the package', timer: 75 },
      { type: 'reach', x: 36, z: 36, r: 5, label: 'Deliver it to the boulevard' },
    ],
  },
  {
    id: 3, title: 'Tukar Guling', reward: 700, rep: 1, par: 150,
    stages: [
      { type: 'talk', who: 'kiko', lines: [
        { who: 'kiko', text: 'Sport di parkiran La Rosa itu kencang, Leo. Ambil diam-diam. Jangan ada saksi.' },
      ] },
      { type: 'reach', x: 108, z: 72, r: 5, label: 'Steal the sports car' },
      { type: 'reach', x: 36, z: 36, r: 5, label: 'Lose the heat, then bring it in' },
      { type: 'escape', label: 'Lose the cops' },
    ],
  },
  {
    id: 4, title: 'Sarang di Menara', reward: 1200, rep: 2, par: 180, unlock: 'pistol',
    stages: [
      { type: 'talk', who: 'ilsa', lines: [
        { who: 'ilsa', text: 'Tiga orang jaga menara jam. Mereka bersenjata. Kau juga — mulai sekarang.' },
      ] },
      { type: 'reach', x: 108, z: 18, r: 8, label: 'Reach the clock tower' },
      { type: 'combat', count: 3, label: 'Clear the tower crew', foes: 3 },
      { type: 'escape', label: 'Lose the cops' },
    ],
  },
  {
    id: 5, title: 'Kasir Kosong', reward: 1500, rep: 2, par: 150, unlock: 'smg',
    stages: [
      { type: 'talk', who: 'nadia', lines: [
        { who: 'nadia', text: 'Brankas pasar butuh 20 detik. Tahan di dalam sampai bunyi klik. Alarm akan bunyi — itu sudah diperhitungkan.' },
      ] },
      { type: 'reach', x: 0, z: 126, r: 8, label: 'Reach the market safe' },
      { type: 'hold', seconds: 20, x: 0, z: 126, r: 8, label: 'Hold the safe room' },
      { type: 'escape', label: 'Lose the cops' },
    ],
  },
  {
    id: 6, title: 'Sopir Pelarian', reward: 2000, rep: 2, par: 150,
    stages: [
      { type: 'talk', who: 'ilsa', lines: [
        { who: 'ilsa', text: 'Aku yang nembak dari jendela, kau yang nyetir. Empat bintang, Leo. Jangan berhenti.' },
      ] },
      { type: 'wanted', min: 4, label: 'The chase is on' },
      { type: 'escape', label: 'Outrun them all' },
      { type: 'reach', x: 18, z: 18, r: 5, label: 'Get back to the plaza' },
    ],
  },
  {
    id: 7, title: 'Jembatan Terbakar', reward: 2500, rep: 3, par: 210,
    stages: [
      { type: 'talk', who: 'kiko', lines: [
        { who: 'kiko', text: 'Konvoi lewat ujung barat. Tiga mobil. Hancurkan semuanya, lalu hilang sebelum heli datang.' },
      ] },
      { type: 'reach', x: -108, z: -108, r: 8, label: 'Ambush the convoy' },
      { type: 'combatCars', count: 3, label: 'Destroy 3 convoy cars' },
      { type: 'escape', label: 'Lose the cops' },
    ],
  },
  {
    id: 8, title: 'Bank Solmarina', reward: 5000, rep: 3, par: 240,
    stages: [
      { type: 'talk', who: 'nadia', lines: [
        { who: 'nadia', text: 'Ini dia, Leo. Bank Solmarina. Semua yang kita bangun menuju ke sini. Lima bintang menunggu di luar.' },
      ] },
      { type: 'reach', x: -72, z: -72, r: 8, label: 'Reach Bank Solmarina' },
      { type: 'hold', seconds: 25, x: -72, z: -72, r: 8, label: 'Crack the vault' },
      { type: 'combat', count: 4, label: 'Hold off the guards', foes: 4 },
      { type: 'escape', label: 'Disappear' },
    ],
  },
];

export const RACE = {
  name: 'Palma Verde Grand Loop',
  checkpoints: [[36, -144], [144, -144], [144, 144], [-108, 144], [-108, -36], [36, -36], [36, 36]],
  prize: 1000,
  par: 75,
};

function visibleStages(mission) {
  return mission.stages.filter((s) => s.type !== 'talk' && s.type !== 'wanted');
}

export function createMissions(deps) {
  const { dialog, notify, reward, scene, city, rng } = deps;
  let index = -1;
  let stage = 0;
  let stageT = 0;
  let missionT = 0;
  let snapshot = 0;
  let foes = [];
  let convoy = [];
  let failTimer = 0;
  let nextTimer = 0;
  let race = null;
  let raceRivals = [];

  function clearFoes() {
    for (const foe of foes) scene.remove(foe.mesh);
    foes = [];
    for (const car of convoy) car.remove();
    convoy = [];
  }

  function spawnFoes(n, x, z) {
    clearFoes();
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.9, 0.36), new THREE.MeshLambertMaterial({ color: 0x8a2a2a }));
      body.position.y = 1.08;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), new THREE.MeshLambertMaterial({ color: 0xe8b88a }));
      head.position.y = 1.78;
      g.add(body, head);
      const fx = x + rng.range(-8, 8);
      const fz = z + rng.range(-8, 8);
      g.position.set(fx, 0, fz);
      scene.add(g);
      foes.push({ mesh: g, x: fx, z: fz, hp: 100, alive: true, kind: 'foe', radius: 0.6 });
    }
  }

  function spawnConvoy(x, z) {
    clearFoes();
    for (let i = 0; i < 3; i++) {
      const car = createCar(scene, { x: x + (i - 1) * 8, z: z + rng.range(-4, 4), color: 0x30343a });
      car.hp = 60;
      car.alive = true;
      car.kind = 'car';
      convoy.push(car);
    }
  }

  function enterStage() {
    const mission = MISSIONS[index];
    if (!mission) return;
    const s = mission.stages[stage];
    if (!s) return;
    stageT = 0;
    if (s.type === 'talk') {
      dialog.show(s.lines, () => { advance(); });
    } else if (s.type === 'wanted') {
      deps.setWanted(s.min);
      advance();
    } else if (s.type === 'combat') {
      snapshot = deps.kills();
      spawnFoes(s.foes ?? s.count, deps.playerPos().x, deps.playerPos().z);
      notify(`Take down ${s.count} hostiles`);
    } else if (s.type === 'combatCars') {
      snapshot = deps.carsDestroyed();
      const p = deps.playerPos();
      spawnConvoy(p.x + 20, p.z);
      notify(`Destroy ${s.count} convoy cars`);
    } else if (s.type === 'hold') {
      notify(`Hold position — ${s.seconds}s`);
    }
  }

  function advance() {
    const mission = MISSIONS[index];
    stage++;
    if (stage >= mission.stages.length) {
      completeMission(mission);
      return;
    }
    enterStage();
  }

  function completeMission(mission) {
    clearFoes();
    const underPar = missionT <= mission.par;
    const total = mission.reward + (underPar ? 250 : 0);
    reward({ cash: total, rep: mission.rep, unlock: mission.unlock, missionId: mission.id, underPar });
    notify(`Mission Passed — ${mission.title} · +$${total.toLocaleString('en-US')}${underPar ? ' (par bonus!)' : ''}`);
    if (mission.id === 8) notify('LEO MARIN — LEGENDA PALMA VERDE');
    index = -1;
    nextTimer = 2.5;
    if (deps.onComplete) deps.onComplete(mission);
  }

  function failMission(mission, reason) {
    clearFoes();
    notify(`Mission Failed — ${reason}. Try again.`);
    failTimer = 3;
    if (deps.onFail) deps.onFail(mission);
  }

  return {
    get active() {
      return index >= 0;
    },
    get mission() {
      return index >= 0 ? MISSIONS[index] : null;
    },
    get foes() {
      return foes;
    },
    get convoy() {
      return convoy;
    },
    get race() {
      return race;
    },
    start(i) {
      index = i;
      stage = 0;
      missionT = 0;
      // A fresh start cancels any pending auto-advance or retry, or the
      // previous mission's 2.5 s timer would hijack this one mid-play.
      nextTimer = 0;
      failTimer = 0;
      enterStage();
    },
    abort() {
      clearFoes();
      index = -1;
      race = null;
    },
    // Story state for the HUD: title, visible stage progress, next line,
    // distance to the current reach/hold target.
    hud(world) {
      if (race) {
        const cp = RACE.checkpoints[race.cp];
        const d = Math.round(Math.hypot(cp[0] - world.x, cp[1] - world.z));
        return {
          title: `RACE — ${RACE.name}`,
          stage: `checkpoint ${race.cp + 1}/${RACE.checkpoints.length} · ${Math.round(race.t)}s · ${d}m · $${RACE.prize}`,
          next: race.cp + 1 < RACE.checkpoints.length ? 'Next checkpoint ahead' : 'Finish line!',
          dist: d,
        };
      }
      if (index < 0) return null;
      const mission = MISSIONS[index];
      const shown = visibleStages(mission);
      const current = mission.stages[stage];
      const visibleIndex = shown.indexOf(current);
      const label = current?.label ?? '';
      let dist = null; // only reach/hold stages have a distance to show
      if (current && (current.type === 'reach' || current.type === 'hold')) {
        dist = Math.round(Math.hypot(current.x - world.x, current.z - world.z));
      }
      const next = shown[visibleIndex + 1]?.label ?? 'Finish';
      return {
        title: `${mission.id}/8 · ${mission.title}`,
        stage: visibleIndex >= 0 ? `stage ${visibleIndex + 1}/${shown.length} · ${label}` : label,
        next: `NEXT · ${next}`,
        dist,
      };
    },
    // The current reach/hold target, for the minimap GPS line.
    target() {
      if (race) {
        const cp = RACE.checkpoints[race.cp];
        return { x: cp[0], z: cp[1] };
      }
      if (index < 0) return null;
      const s = MISSIONS[index].stages[stage];
      if (s && (s.type === 'reach' || s.type === 'hold')) return { x: s.x, z: s.z };
      return null;
    },
    startRace(world) {
      if (race) return;
      void world;
      race = { cp: 0, t: 0 };
      raceRivals = [];
      for (let i = 0; i < 2; i++) {
        const rival = createCar(scene, {
          x: 36 + (i - 0.5) * 6, z: -144 + 8, heading: 0,
          color: i === 0 ? 0x4c7dc9 : 0xc94c4c, maxSpeed: i === 0 ? 30 : 28,
        });
        rival.cp = 0;
        rival.finished = false;
        raceRivals.push(rival);
      }
      notify(`Race started — ${RACE.name} · 7 checkpoints · $${RACE.prize}`);
    },
    get rivals() {
      return raceRivals;
    },
    update(dt, world) {
      // Race runs on its own clock; the story waits until it ends.
      if (race) {
        race.t += dt;
        const cp = RACE.checkpoints[race.cp];
        if (Math.hypot(cp[0] - world.x, cp[1] - world.z) < 7) {
          race.cp++;
          if (race.cp >= RACE.checkpoints.length) {
            const underPar = race.t <= RACE.par;
            const total = RACE.prize + (underPar ? 250 : 0);
            reward({ cash: total, rep: 0, raceWin: true, raceTime: race.t, underPar });
            notify(`Race Won — +$${total.toLocaleString('en-US')}${underPar ? ' (par bonus!)' : ''}`);
            for (const r of raceRivals) r.remove();
            raceRivals = [];
            race = null;
            if (deps.onRaceEnd) deps.onRaceEnd(true);
            return;
          }
          notify(`Checkpoint ${race.cp}/${RACE.checkpoints.length}`);
        }
        for (const rival of raceRivals) {
          if (rival.finished) continue;
          const target = RACE.checkpoints[rival.cp];
          const dx = target[0] - rival.x;
          const dz = target[1] - rival.z;
          if (Math.hypot(dx, dz) < 7) {
            rival.cp++;
            if (rival.cp >= RACE.checkpoints.length) {
              rival.finished = true;
              notify('A rival finished the race — you lost this one. Try again from Pause.');
              for (const r of raceRivals) r.remove();
              raceRivals = [];
              race = null;
              if (deps.onRaceEnd) deps.onRaceEnd(false);
              return;
            }
            continue;
          }
          // Rubber-band: rivals speed up when behind, ease off when ahead.
          const gap = Math.hypot(world.x - rival.x, world.z - rival.z);
          const targetSpeed = rival.maxSpeed * (1 + THREE.MathUtils.clamp(gap / 120, -0.12, 0.15));
          const wantHeading = Math.atan2(dx, dz);
          let diff = wantHeading - rival.heading;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          rival.heading += THREE.MathUtils.clamp(diff, -1.6 * dt, 1.6 * dt);
          rival.speed = Math.min(targetSpeed, rival.maxSpeed * 1.05);
          rival.x += Math.sin(rival.heading) * rival.speed * dt;
          rival.z += Math.cos(rival.heading) * rival.speed * dt;
          rival.mesh.position.set(rival.x, 0, rival.z);
          rival.mesh.rotation.y = rival.heading;
        }
        return;
      }

      if (failTimer > 0) {
        failTimer -= dt;
        if (failTimer <= 0 && index >= 0) {
          stage = 0;
          enterStage();
        }
        return;
      }
      if (nextTimer > 0) {
        nextTimer -= dt;
        if (nextTimer <= 0) {
          const next = MISSIONS.findIndex((m) => !deps.isDone(m.id));
          if (next >= 0) this.start(next);
        }
        return;
      }
      if (index < 0) return;
      const mission = MISSIONS[index];
      const s = mission.stages[stage];
      if (!s) return;
      missionT += dt;
      stageT += dt;

      if (s.type === 'talk') return; // completes via the dialog callback
      if (s.type === 'reach') {
        if (s.timer && stageT > s.timer) {
          failMission(mission, 'Out of time');
          return;
        }
        if (Math.hypot(s.x - world.x, s.z - world.z) <= s.r) advance();
      } else if (s.type === 'hold') {
        if (Math.hypot(s.x - world.x, s.z - world.z) > s.r) {
          stageT = 0; // stepping out resets the hold
        } else if (stageT >= s.seconds) {
          advance();
        }
      } else if (s.type === 'combat') {
        // Foes shamble toward the player while the fight lasts.
        for (const foe of foes) {
          if (!foe.alive) continue;
          const dx = world.x - foe.x;
          const dz = world.z - foe.z;
          const d = Math.hypot(dx, dz) || 1;
          foe.x += (dx / d) * 1.5 * dt;
          foe.z += (dz / d) * 1.5 * dt;
          foe.mesh.position.set(foe.x, 0, foe.z);
          foe.mesh.rotation.y = Math.atan2(dx, dz);
        }
        if (deps.kills() - snapshot >= s.count) advance();
      } else if (s.type === 'combatCars') {
        if (deps.carsDestroyed() - snapshot >= s.count) advance();
      } else if (s.type === 'escape') {
        if (world.wanted === 0) advance();
      }
    },
  };
}
