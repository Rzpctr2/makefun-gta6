// Palma Verde — entry point. Boots the renderer, the city, the player, the
// traffic and the HUD, then runs the loop: menu -> playing -> paused.
// Also owns the camera, entering/exiting cars, autosave and staged shots.
import * as THREE from 'three';
import { CONFIG, NAMES, PALETTE } from './config.js';
import { City } from './city.js';
import { Player } from './player.js';
import { Car, Traffic, buildParkedCars, CAR_COLORS } from './vehicles.js';
import { Pedestrians } from './peds.js';
import { Minimap } from './minimap.js';
import { HUD } from './hud.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { createInput, ACTION_ENTER, ACTION_PAUSE, ACTION_CONFIRM } from './input.js';
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
scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x8a7a5a, 1.1));

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
const input = createInput(canvas);

// --- game state -------------------------------------------------------------
const state = {
  mode: 'menu', // menu | playing | paused
  driving: false,
  car: null, // the Car the player is driving
  cash: 250,
  clock: 9 * 3600, // 09:00
  seconds: 0,
  wanted: 0, // Phase 1: no police yet — the stars stay empty.
  saveTimer: 0,
  camYaw: Math.PI,
  camPitch: 0.24,
  camDistance: CONFIG.camDistanceFoot,
  elapsed: 0,
};

function objectiveText() {
  if (state.driving) return 'Cruising Palma Verde — free roam. Missions arrive soon.';
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
  hud.setObjective(objectiveText());
  hud.setHint(hintText());
  hud.showToast(`Welcome to ${NAMES.city}`, 3);
}

function pauseGame() {
  if (state.mode !== 'playing') return;
  state.mode = 'paused';
  document.getElementById('pause-screen').classList.remove('hidden');
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

// --- camera -----------------------------------------------------------------
const camTarget = new THREE.Vector3();
const camPos = new THREE.Vector3();
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1200);

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
  hud.setObjective(objectiveText());
  hud.setHint(hintText());
}

// --- main loop ----------------------------------------------------------------
let lastTime = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  state.frames = (state.frames || 0) + 1;
  const dt = Math.min(0.05, (now - lastTime) / 1000);
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
  if (actions & ACTION_ENTER) {
    if (state.driving) exitCar();
    else {
      const car = nearestEnterableCar();
      if (car) enterCar(car);
      else hud.showToast('No car close enough — walk up to one', 2);
    }
  }

  const auto = shot ? autopilotInput(shot, state.elapsed, state.car) : null;
  if (state.driving && state.car) {
    const drive = auto ?? input.driveVector();
    state.car.drive(drive.throttle, drive.steer, dt, city);
    player.pos.copy(state.car.pos);
    player.yaw = state.car.yaw;
    hud.showSpeed(true);
    hud.setSpeed(Math.abs(state.car.speed) * 3.6);
  } else {
    const move = auto ?? input.moveVector();
    player.update(move, state.camYaw, dt, city);
    hud.showSpeed(false);
  }

  traffic.update(dt, state.driving ? state.car : null);
  peds.update(dt);
  city.update(dt);

  // Clock + autosave.
  state.clock += dt * 30; // 1 real second = 30 game seconds
  state.seconds += dt;
  state.elapsed += dt;
  state.saveTimer += dt;
  if (state.saveTimer > 20) {
    state.saveTimer = 0;
    doSave();
  }

  hud.setCash(state.cash);
  hud.setClock(state.clock % 86400);
  hud.setWanted(state.wanted);
  hud.update(dt);
  const focusPos = state.driving && state.car ? state.car.pos : player.pos;
  const focusYaw = state.driving && state.car ? state.car.yaw : player.yaw;
  minimap.draw(focusPos, focusYaw, traffic.cars, peds.peds, null);
  updateCamera(dt);
  renderer.render(scene, camera);
}

// --- boot ---------------------------------------------------------------------
if (shot) {
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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.__game = { state, player, city, traffic, camera, myCar, camTarget };

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
      });
    }
  }, 500);
}
requestAnimationFrame(frame);
