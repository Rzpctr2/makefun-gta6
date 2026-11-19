// Palma Verde — entry point. Boots the renderer, the city, the player, the
// traffic and the HUD, then runs the loop: menu -> playing -> paused.
// Also owns the camera, entering/exiting cars, autosave and staged shots.
import { Radio } from './radio.js';
import { Dialog } from './dialog.js';
import { Missions } from './missions.js';
import { Police } from './police.js';
import { Combat } from './combat.js';
import { districtAt, Landmarks } from './districts.js';
import { Lighting } from './lighting.js';
import * as THREE from 'three';
import { CONFIG, NAMES, PALETTE } from './config.js';
import { City } from './city.js';
import { Player } from './player.js';
import { Car, Traffic, buildParkedCars, CAR_COLORS } from './vehicles.js';
import { Pedestrians } from './peds.js';
import { Minimap } from './minimap.js';
import { HUD } from './hud.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { createInput, ACTION_ENTER, ACTION_PAUSE, ACTION_CONFIRM, ACTION_RADIO, ACTION_MUTE } from './input.js';
import { getShot, autopilotInput } from './shots.js';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || CONFIG.seed);
const shotName = params.get('shot');
const shot = shotName ? getShot(shotName) : null;

// Surface load errors where a headless check can see them.
window.addEventListener('error', (event) => {
  document.title = `ERROR: ${event.message}`;
  const el = document.getElementById('load-error');
  if (el) el.textContent = `Error: ${event.message}`;
});

// --- renderer / scene -------------------------------------------------------
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.sky);
scene.fog = new THREE.Fog(PALETTE.fog, 140, 560);
const camera = new THREE.PerspectiveCamera(CONFIG.fovBase, window.innerWidth / window.innerHeight, 0.1, 1200);

const sun = new THREE.DirectionalLight(PALETTE.sun, 2.2);
sun.position.set(140, 200, 80);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -160;
sun.shadow.camera.right = 160;
sun.shadow.camera.top = 160;
sun.shadow.camera.bottom = -160;
sun.shadow.camera.far = 600;
sun.shadow.bias = -0.0004;
scene.add(sun);
const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x8a7a5a, 1.1);
scene.add(hemi);

// --- world ------------------------------------------------------------------
const city = new City(scene, seed);
const player = new Player(scene);
const traffic = new Traffic(scene, city, seed + 31);
const parkedCars = buildParkedCars(scene, city, seed + 17);
const peds = new Pedestrians(scene, city, seed + 7);
// The player's own car: a red coupe parked by the central plaza.
const myCar = new Car(scene, 0xd23c2e, 6, 14, Math.PI / 2);
parkedCars.push(myCar);

// --- HUD / input ------------------------------------------------------------
const hud = new HUD(document.getElementById('hud'));
const minimap = new Minimap(document.getElementById('minimap'), city);
const pauseMap = new Minimap(document.getElementById('pause-map'), city);
const input = createInput(canvas);

// --- game state -------------------------------------------------------------
const state = {
  mode: 'menu', // menu | playing | paused
  driving: false,
  car: null, // the Car the player is driving
  cash: 250,
  clock: 9 * 3600, // 09:00
  seconds: 0,
  wanted: 0, // Phase 2: heat rises on crime, falls when laying low.
  rep: 0,
  completed: 0,
  kills: 0,
  raceWon: false,
  raceWins: 0,
  raceBest: 0,
  escapes: 0,
  smg: false,
  has_pistol: false,
  has_smg: false,
  saveTimer: 0,
  dispatchTimer: 0,
  camYaw: Math.PI,
  camPitch: 0.24,
  camDistance: CONFIG.camDistanceFoot,
  trauma: 0, // trauma shake 0–1 (§5d); traumaPeak keeps the max for ?debug=1
  traumaPeak: 0,
  lastAmmo: Infinity,
  lastKills: 0,
  lastCrash: -9,
  elapsed: 0,
};
const radio = new Radio();
const dialog = new Dialog(document.getElementById('dialog'));
const missions = new Missions(scene, { hud, dialog, radio, state, city, onMissionComplete });
const police = new Police(scene, city, { state, hud, radio, onBusted: handleBusted });
missions.api.police = police;
const combat = new Combat(scene, camera, { state, hud, radio, police });
const lighting = new Lighting(scene, sun, hemi);
const landmarks = new Landmarks(scene);
let currentDistrict = null;
let lastLightHour = -1;
function onMissionComplete(idx) {
  if (idx === 3) { state.has_pistol = true; hud.showToast('Pistol unlocked — press 2', 3); radio.sfx('unlock'); }
  if (idx === 4) { state.has_smg = true; state.smg = true; hud.showToast('SMG unlocked — press 3', 3); radio.sfx('unlock'); }
}
function handleBusted() {
  state.cash = Math.max(0, state.cash - 100);
  police.resetHeat();
  player.place(0, 8, Math.PI / 4);
  state.camYaw = Math.PI / 4;
  hud.showToast('BUSTED — $100 fine, back at the safehouse', 3.5);
  radio.sfx('busted');
}

function objectiveText() {
  const m = missions.objectiveText();
  if (m) return m;
  if (state.driving) return 'Cruising Palma Verde — free roam.';
  return 'Explore Palma Verde — walk up to a car and press E to drive it.';
}

function hintText() {
  return state.driving
    ? 'W A S D — drive · E — get out · Esc — pause'
    : 'W A S D — walk · Shift — run · E — enter car · drag mouse — look · Esc — pause';
}

function startGame(fromSave) {
  const saved = fromSave ? loadGame() : null;
  if (saved) {
    player.place(saved.x, saved.z, saved.yaw);
    state.cash = saved.cash ?? 250;
    state.rep = saved.rep ?? 0;
    state.completed = saved.completed ?? 0;
    state.raceWon = saved.raceWon ?? false;
    state.raceWins = saved.raceWins ?? 0;
    state.raceBest = saved.raceBest ?? 0;
    state.escapes = saved.escapes ?? 0;
    state.kills = saved.kills ?? 0;
    state.has_pistol = saved.has_pistol ?? false;
    state.has_smg = saved.has_smg ?? false;
    state.clock = 9 * 3600 + (saved.seconds ?? 0);
    state.camYaw = saved.yaw;
    if (saved.inCar) {
      // Put the car where the player left it, then put the player back in.
      // NOTE: Vector3.set takes (x, y, z) — the y is 0, the z is the saved z.
      myCar.pos.set(saved.x, 0, saved.z);
      myCar.yaw = saved.yaw;
      enterCar(myCar);
    }
  } else {
    // Spawn on the plaza, facing the red coupe parked at (6, 14).
    player.place(0, 8, Math.PI / 4);
    state.camYaw = Math.PI / 4;
  }
  state.mode = 'playing';
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('pause-screen').classList.add('hidden');
  radio.ensure();
  hud.setRadio(radio.trackName());
  missions.start(saved ? (saved.mission || 0) : 0);
  hud.setObjective(objectiveText());
  hud.setHint(hintText());
  hud.showToast(`Welcome to ${NAMES.city}`, 3);
}

function pauseGame() {
  if (state.mode !== 'playing') return;
  state.mode = 'paused';
  document.getElementById('pause-screen').classList.remove('hidden');
  const pct = Math.min(100, (state.completed || 0) * 10 + (state.raceWon ? 10 : 0) + Math.min(state.escapes || 0, 5) * 2);
  const mm = Math.floor(state.seconds / 60), ss = String(Math.floor(state.seconds % 60)).padStart(2, '0');
  hud.setPause({
    pct, completed: state.completed || 0, cash: state.cash, rep: state.rep, kills: state.kills,
    escapes: state.escapes || 0, time: `${mm}:${ss}`, raceWon: state.raceWon, raceWins: state.raceWins || 0,
    raceBest: state.raceBest || 0, district: currentDistrict || 'Palma Verde',
    clock: document.getElementById('clock').textContent, weapon: combat.hudText(),
  });
  const fp = state.driving && state.car ? state.car.pos : player.pos;
  const fy = state.driving && state.car ? state.car.yaw : player.yaw;
  pauseMap.draw(fp, fy, traffic.cars, peds.peds, missions.objective(), police);
  doSave();
}

function resumeGame() {
  state.mode = 'playing';
  document.getElementById('pause-screen').classList.add('hidden');
}

function doSave() {
  saveGame({
    x: player.pos.x,
    z: player.pos.z,
    yaw: player.yaw,
    cash: state.cash,
    seconds: Math.floor(state.clock - 9 * 3600),
    inCar: state.driving,
    mission: missions.idx,
    rep: state.rep,
    completed: state.completed,
    raceWon: state.raceWon,
    raceWins: state.raceWins,
    raceBest: state.raceBest,
    escapes: state.escapes,
    kills: state.kills,
    has_pistol: state.has_pistol,
    has_smg: state.has_smg,
  });
}

function nearestEnterableCar() {
  let best = null;
  let bestD = 4.5;
  for (const car of parkedCars) {
    const d = Math.hypot(car.pos.x - player.pos.x, car.pos.z - player.pos.z);
    if (d < bestD) {
      bestD = d;
      best = car;
    }
  }
  return best;
}

function enterCar(car) {
  if (car !== myCar) police.addCrime('steal', car.pos, peds.peds);
  state.driving = true;
  state.car = car;
  player.group.visible = false;
  player.pos.copy(car.pos);
  hud.setObjective(objectiveText());
  hud.setHint(hintText());
  hud.showToast('You are driving — W A S D to drive', 2.5);
}

function exitCar() {
  const car = state.car;
  if (!car) return;
  // Step out on the driver's side.
  const side = new THREE.Vector3(Math.cos(car.yaw), 0, -Math.sin(car.yaw));
  player.place(car.pos.x + side.x * 2.2, car.pos.z + side.z * 2.2, car.yaw);
  player.group.visible = true;
  state.driving = false;
  state.car = null;
  hud.setObjective(objectiveText());
  hud.setHint(hintText());
  doSave();
}

// Trauma shake (§5d): 0–1, offset = trauma² × 0.15 m, decay 1.5/s.
// Forced 0 in staged shots so stills stay clean.
function addTrauma(n) {
  if (shotName) return;
  state.trauma = Math.min(1, state.trauma + n);
  state.traumaPeak = Math.max(state.traumaPeak, state.trauma);
}

// Car-car collision (§5c): the player no longer drives through traffic,
// police, parked cars or race rivals — push apart, cut speed, shake.
function collideCars() {
  if (!state.driving || !state.car) return;
  const mine = state.car;
  const others = [...traffic.cars, ...parkedCars, ...police.activeUnits().map((u) => u.car), ...police.blocks, ...missions.rivals];
  let hit = false;
  for (const o of others) {
    if (o === mine || !o.mesh.visible) continue;
    const dx = mine.pos.x - o.pos.x, dz = mine.pos.z - o.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 4.2 && d > 0.01) {
      const push = (4.2 - d) / d;
      mine.pos.x += dx * push * 0.7; mine.pos.z += dz * push * 0.7;
      o.pos.x -= dx * push * 0.3; o.pos.z -= dz * push * 0.3;
      hit = true;
    }
  }
  if (hit) {
    const imp = Math.abs(mine.speed);
    mine.speed *= 0.7;
    if (imp > 6) {
      addTrauma(Math.min(0.7, (imp / CONFIG.carMaxSpeed) * 0.9 + 0.15));
      if (state.elapsed - state.lastCrash > 0.5) { state.lastCrash = state.elapsed; radio.sfx('thud'); }
    }
  }
}

// --- camera -----------------------------------------------------------------
const camTarget = new THREE.Vector3();
const camPos = new THREE.Vector3();

function updateCamera(dt) {
  const focus = state.driving && state.car ? state.car.pos : player.pos;
  const wantDist = shotName === 'aerial'
    ? 190
    : state.driving ? CONFIG.camDistanceCar : CONFIG.camDistanceFoot;
  state.camDistance += (wantDist - state.camDistance) * Math.min(1, dt * 4);
  const pitch = shotName === 'aerial' ? 0.9 : state.camPitch;
  const yaw = state.camYaw;
  const cx = focus.x - Math.sin(yaw) * Math.cos(pitch) * state.camDistance;
  const cz = focus.z - Math.cos(yaw) * Math.cos(pitch) * state.camDistance;
  const cy = (state.driving ? 2.2 : 1.8) + Math.sin(pitch) * state.camDistance;
  camPos.set(cx, cy, cz);
  // Keep the camera out of the ground and roughly out of buildings.
  camPos.y = Math.max(camPos.y, 1.2);
  camera.position.lerp(camPos, Math.min(1, dt * 10));
  // Speed FOV: 62° cruising → 72° at top speed (driving only).
  const sp = state.driving && state.car ? Math.abs(state.car.speed) : 0;
  const wantFov = CONFIG.fovBase + (CONFIG.fovTop - CONFIG.fovBase) * Math.min(1, sp / CONFIG.carMaxSpeed);
  if (Math.abs(camera.fov - wantFov) > 0.05) {
    camera.fov += (wantFov - camera.fov) * Math.min(1, dt * 4);
    camera.updateProjectionMatrix();
  }
  // Trauma shake, after the lerp so it is not smoothed away.
  const tr = shotName ? 0 : state.trauma;
  const sh = tr * tr * CONFIG.traumaKick;
  if (sh > 0.001) {
    const t = state.elapsed * 47;
    camera.position.x += Math.sin(t * 1.3) * sh;
    camera.position.y += Math.sin(t * 1.7 + 2) * sh;
    camera.position.z += Math.sin(t * 1.1 + 4) * sh;
  }
  camTarget.set(focus.x, focus.y + 1.6, focus.z);
  camera.lookAt(camTarget);
  // The sun's shadow box follows the player so shadows stay crisp.
  sun.position.set(focus.x + 140, 200, focus.z + 80);
  sun.target.position.set(focus.x, 0, focus.z);
  sun.target.updateMatrixWorld();
}

// --- staged shots -------------------------------------------------------------
function applyShot() {
  if (!shot) return;
  if (shot.mode === 'menu') {
    state.mode = 'menu';
    state.camYaw = shot.camYaw;
    state.camPitch = shot.camPitch;
    return;
  }
  if (shot.mode === 'car') {
    player.place(shot.carX, shot.carZ, shot.carYaw);
    enterCar(myCar);
    // NOTE: Vector3.set takes (x, y, z) — y is 0 here, z is the road position.
    myCar.pos.set(shot.carX, 0, shot.carZ);
    myCar.yaw = shot.carYaw;
    myCar.speed = 12;
    state.camYaw = shot.camYaw;
    state.camPitch = shot.camPitch;
  } else if (shot.mode === 'foot') {
    player.place(shot.playerX, shot.playerZ, shot.playerYaw);
    state.camYaw = shot.camYaw;
    state.camPitch = shot.camPitch;
  } else if (shot.mode === 'aerial') {
    player.place(0, 0, 0);
    state.camYaw = shot.camYaw;
    state.camPitch = shot.camPitch;
  }
  state.mode = 'playing';
  document.getElementById('start-screen').classList.add('hidden');
  // Staged state (§12): time of day, wanted level, story mission and weapon
  // are forced from the shot definition so every system is visible. The
  // opening talk stage is skipped (except street, where the dialog portrait
  // IS the shot) so the mission panel shows instead of a dialog box.
  if (shot.hour !== undefined) state.clock = shot.hour * 3600;
  if (shot.wanted) police.addHeat(shot.wanted * 20);
  if (shot.mission !== undefined) {
    missions.start(shot.mission);
    if (shot.skipTalk !== false) while (missions.stageDef && missions.stageDef.t === 'talk') missions.stage++;
  }
  if (shot.weapon) { state.has_pistol = true; state.has_smg = true; state.smg = true; combat.select(shot.weapon); }
  hud.setObjective(objectiveText());
  hud.setHint(hintText());
}

// --- main loop ----------------------------------------------------------------
let lastTime = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  state.frames = (state.frames || 0) + 1;
  // Clamp dt to [0, 0.05]: headless --virtual-time-budget can hand rAF a
  // timestamp EARLIER than the last frame (dt < 0), which made drag ADD
  // speed, drove the car backwards, and — via the yaw cap — spun it.
  // Real browsers never go negative, but the clamp costs one line.
  const dt = Math.max(0, Math.min(0.05, (now - lastTime) / 1000));
  lastTime = now;
  const actions = input.takeActions();
  const drag = input.takeDrag();
  state.camYaw -= drag.dx * 0.004;
  state.camPitch = Math.max(0.05, Math.min(1.1, state.camPitch + drag.dy * 0.003));

  if (state.mode === 'menu') {
    if (actions & ACTION_CONFIRM) startGame(false);
    // Slow drift behind the title screen; keep the minimap alive too.
    state.camYaw += dt * 0.02;
    hud.showSpeed(false);
    minimap.draw(player.pos, player.yaw, traffic.cars, peds.peds, null);
    updateCamera(dt);
    city.update(dt);
    renderer.render(scene, camera);
    return;
  }
  if (state.mode === 'paused') {
    if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) resumeGame();
    renderer.render(scene, camera);
    return;
  }

  // Playing.
  if (actions & ACTION_PAUSE) {
    pauseGame();
    renderer.render(scene, camera);
    return;
  }
  if (dialog.active && (actions & ACTION_CONFIRM)) dialog.advance();
  if (actions & ACTION_RADIO) { radio.ensure(); radio.nextStation(); hud.setRadio(radio.trackName()); radio.sfx('blip'); }
  if (actions & ACTION_MUTE) { radio.ensure(); hud.showToast(radio.toggleMute() ? 'Audio muted' : 'Audio on', 1.5); }
  if (!dialog.active && (actions & ACTION_ENTER)) {
    if (state.driving) exitCar();
    else {
      const car = nearestEnterableCar();
      if (car) enterCar(car);
      else hud.showToast('No car close enough — walk up to one', 2);
    }
  }

  const auto = shot ? autopilotInput(shot, state.elapsed, state.car) : null;
  // Race demo (?race=1): autopilot steers the player's car to each checkpoint.
  let raceAuto = null;
  if (missions.raceActive && params.get('race')) {
    const cp = missions.raceTarget();
    const fp = state.driving && state.car ? state.car.pos : player.pos;
    const fy = state.driving && state.car ? state.car.yaw : player.yaw;
    const want = Math.atan2(cp.x - fp.x, cp.z - fp.z);
    let w = want - fy; while (w > Math.PI) w -= Math.PI * 2; while (w < -Math.PI) w += Math.PI * 2;
    raceAuto = { throttle: 1, steer: Math.max(-1, Math.min(1, w * 2)) };
  }
  if (dialog.active) {
    hud.showSpeed(false);
  } else if (state.driving && state.car) {
    const drive = auto ?? raceAuto ?? input.driveVector();
    const res = state.car.drive(drive.throttle, drive.steer, dt, city);
    if (res.hit && res.impact > 5) addTrauma(Math.min(0.7, (res.impact / CONFIG.carMaxSpeed) * 0.8));
    collideCars();
    player.pos.copy(state.car.pos);
    player.yaw = state.car.yaw;
    hud.showSpeed(true);
    hud.setSpeed(Math.abs(state.car.speed) * 3.6);
  } else {
    const move = auto ?? input.moveVector();
    player.update(move, state.camYaw, dt, city);
    hud.showSpeed(false);
  }
  dialog.update(dt);
  radio.update(dt, state.driving, state.car ? Math.abs(state.car.speed) / CONFIG.carMaxSpeed : 0);

  traffic.update(dt, state.driving ? state.car : null);
  peds.update(dt);
  city.update(dt);

  // Clock + autosave.
  state.clock += dt * 30; // 1 real second = 30 game seconds
  state.seconds += dt;
  state.elapsed += dt;
  state.trauma = Math.max(0, state.trauma - CONFIG.traumaDecay * dt);
  state.saveTimer += dt;
  if (state.saveTimer > 20) {
    state.saveTimer = 0;
    doSave();
  }

  const focusPos = state.driving && state.car ? state.car.pos : player.pos;
  const focusYaw = state.driving && state.car ? state.car.yaw : player.yaw;
  const speedNow = state.driving && state.car ? state.car.speed : player.speed;
  const vel = { x: Math.sin(focusYaw) * speedNow, z: Math.cos(focusYaw) * speedNow };
  police.update(dt, { pos: focusPos, yaw: focusYaw, driving: state.driving, playerSpeed: Math.abs(speedNow), vel, car: state.car });
  if (police.hitsBlock(focusPos) && state.driving && state.car && Math.abs(state.car.speed) > 1) { state.car.speed *= 0.5; hud.showToast('Roadblock — find the gap!', 2); }
  combat.update(dt, { peds: peds.peds, police: police.activeUnits(), playerPos: focusPos });
  // Gun kick + kill shake (§5d): pistol +0.12, kill +0.25.
  if (combat.weapon !== 'fists' && state.lastAmmo !== Infinity && combat.ammo < state.lastAmmo) addTrauma(0.12);
  state.lastAmmo = combat.ammo;
  if (combat.kills > state.lastKills) { addTrauma(0.25); state.lastKills = combat.kills; }
  const hourNow = (state.clock % 86400) / 3600;
  if (Math.abs(hourNow - lastLightHour) > 0.05) { lastLightHour = hourNow; lighting.setHour(hourNow); }
  const district = districtAt(focusPos.x, focusPos.z);
  if (district && district.name !== currentDistrict) { currentDistrict = district.name; hud.showToast(`— ${district.name} —`, 2.5); }
  missions.update(dt, { pos: focusPos, driving: state.driving, wanted: state.wanted, kills: state.kills });
  hud.setCash(state.cash);
  hud.setClock(state.clock);
  hud.setRep(state.rep);
  hud.setWanted(state.wanted);
  hud.setMission(missions.hudText(focusPos));
  hud.setObjective(objectiveText());
  hud.setWeapon(combat.hudText());
  // Police dispatch: computed 4x/second, DOM written only on change.
  state.dispatchTimer += dt;
  if (state.dispatchTimer > 0.25) { state.dispatchTimer = 0; hud.setDispatch(police.describe()); }
  hud.setCrosshair(!!combat.locked);
  hud.update(dt);
  minimap.draw(focusPos, focusYaw, traffic.cars, peds.peds, missions.objective(), police);
  updateCamera(dt);
  renderer.render(scene, camera);
}

// --- boot ---------------------------------------------------------------------
if (params.get('autostart')) startGame(false);
else if (shot) {
  applyShot();
} else {
  // Normal launch: show the title screen; offer Continue when a save exists.
  document.getElementById('start-screen').classList.remove('hidden');
  const continueBtn = document.getElementById('continue-btn');
  if (hasSave()) {
    continueBtn.classList.remove('hidden');
    continueBtn.addEventListener('click', () => startGame(true));
  }
  document.getElementById('start-btn').addEventListener('click', () => startGame(false));
  document.getElementById('resume-btn').addEventListener('click', resumeGame);
  document.getElementById('race-btn').addEventListener('click', () => {
    resumeGame();
    const pos = state.driving && state.car ? state.car.pos : player.pos;
    if (!missions.startRace(pos)) hud.showToast('Get in a car first — then pause → race', 3);
  });
  document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('pause-screen').classList.add('hidden');
    player.place(0, 8, Math.PI / 4);
    state.camYaw = Math.PI / 4;
    state.mode = 'playing';
  });
  // Start on click anywhere on the title (keyboard Enter works too).
  document.getElementById('start-screen').addEventListener('click', (e) => {
    if (e.target.id === 'start-screen') startGame(false);
  });
}

// Test hooks (?wanted=3, ?hour=18.87): force a wanted level / time of day
// for staged screenshots; harmless in normal play (no params = no effect).
if (params.get('wanted')) police.addHeat(Number(params.get('wanted')) * 20);
if (params.get('hour')) state.clock = Number(params.get('hour')) * 3600;
if (params.get('bay')) { myCar.pos.set(80, 0, -36); myCar.yaw = 0; }
if (params.get('race')) {
  if (state.mode === 'menu') startGame(false);
  myCar.pos.set(22, 0, 30); myCar.yaw = Math.PI;
  player.place(22, 30, Math.PI); enterCar(myCar);
  missions.startRace(player.pos);
}
if (params.get('pause')) { if (state.mode === 'menu') startGame(false); pauseGame(); }
if (params.get('crash')) {
  // Feel-test hook: car at 20 m/s straight into a traffic car then the
  // block wall east of the x = -36 avenue; headless check reads
  // traumaPeak from ?debug=1.
  if (state.mode === 'menu') startGame(false);
  myCar.pos.set(-36, 0, -100); myCar.yaw = Math.PI / 2;
  player.place(-36, -100, Math.PI / 2); enterCar(myCar);
  myCar.speed = 20;
  const t0 = traffic.cars[0];
  t0.pos.set(-32, 0, -100); t0.yaw = Math.PI / 2; t0.speed = 0;
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.__game = { state, player, city, traffic, camera, myCar, camTarget, radio, dialog, missions, police, combat, lighting };

// Debug hook for headless verification: ?debug=1 writes the camera/car
// position into the page every half second so --dump-dom can read it.
if (params.get('debug')) {
  setInterval(() => {
    const el = document.getElementById('load-error');
    if (el) {
      el.textContent = JSON.stringify({
        cam: camera.position.toArray().map((v) => +v.toFixed(1)),
        car: state.car ? [state.car.pos.x, state.car.pos.z, +state.car.speed.toFixed(1), +state.car.yaw.toFixed(2)] : null,
        player: [+player.pos.x.toFixed(1), +player.pos.z.toFixed(1)],
        mode: state.mode,
        driving: state.driving,
        frames: state.frames,
        elapsed: +state.elapsed.toFixed(2),
        mission: [missions.idx, missions.stage, missions.active, dialog.active],
        cash: state.cash, wanted: state.wanted,
        race: [missions.raceActive, missions.raceCp, +missions.raceTimer.toFixed(1)],
        raceWon: state.raceWon, escapes: state.escapes,
        pct: Math.min(100, (state.completed || 0) * 10 + (state.raceWon ? 10 : 0) + Math.min(state.escapes || 0, 5) * 2),
        rivals: missions.rivals.map((r) => [+r.pos.x.toFixed(1), +r.pos.z.toFixed(1), r.cp]),
        heli: police.heli.on, block: police.blockOn, respray: [police.respray.x, police.respray.z],
        fov: +camera.fov.toFixed(1), trauma: +state.trauma.toFixed(2), traumaPeak: +state.traumaPeak.toFixed(2),
      });
    }
  }, 500);
}
requestAnimationFrame(frame);
