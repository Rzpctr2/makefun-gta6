// Staged screenshots behind ?shot=chase|street|drive|mission.
// Each scene is the real game, not a mock: the world is built from the seed,
// then a small autopilot plays it forward for a few seconds so the frame is
// what a few seconds of real play looks like — and the same seed always
// gives the same frame. The game loop itself runs the autopilot; this module
// only picks the starting pose for each shot.
import { CONFIG } from './config.js';

// Where each shot begins. Coordinates are world metres; the plaza at (0,0)
// is the city centre, the beach is east (+x). Times: chase = sunset 18:52,
// street = golden hour 17:30, drive = neon night 21:00, mission = dawn 06:00.
// mission = story mission index started by applyShot; skipTalk drops the
// opening dialog so the HUD panel shows instead (street keeps it: the
// dialog portrait IS the shot). wanted = stars forced at the start.
export const SHOTS = {
  // COVER: police chase at sunset, mission 6 "Sopir Pelarian" mid-escape,
  // 4 stars + heli + roadblock, dispatch + mission panel + NEXT live.
  chase: {
    mode: 'car',
    carX: -36, carZ: -120, carYaw: 0,
    camYaw: 0, camPitch: 0.28,
    autopilot: 'drive',
    warmup: 6, hour: 18.87, wanted: 4, mission: 5,
  },
  // Golden hour on foot at the plaza, Nadia's dialog portrait open.
  street: {
    mode: 'foot',
    playerX: -6, playerZ: 10, playerYaw: Math.PI * 0.62,
    camYaw: Math.PI * 0.62, camPitch: 0.22,
    autopilot: 'walk',
    warmup: 3, hour: 17.5, mission: 0, skipTalk: false,
  },
  // Neon night drive, mission 2 "Paket Panas" on a timer, heli up (3 stars).
  drive: {
    mode: 'car',
    carX: -36, carZ: -120, carYaw: 0,
    camYaw: 0, camPitch: 0.32,
    autopilot: 'drive',
    warmup: 6, hour: 21, wanted: 3, mission: 1,
  },
  // Dawn climax: Bank Solmarina, mission 8 hold-the-vault, SMG out, 5 stars.
  mission: {
    mode: 'foot',
    playerX: 192, playerZ: 84, playerYaw: 2.0,
    camYaw: 2.0, camPitch: 0.25,
    autopilot: null,
    warmup: 3, hour: 6, wanted: 5, mission: 7, weapon: 'smg',
  },
};

export function getShot(name) {
  return SHOTS[name] || SHOTS.drive;
}

// Autopilot inputs for the staged shots, so the drive shot has a moving car
// and the street shot has a walking player without any human input.
// `focus` is the car (drive) or null; the drive pilot keeps the car on its
// road with a simple lane-keeper instead of a fixed weave.
export function autopilotInput(shot, t, focus) {
  if (shot.autopilot === 'drive' && focus) {
    // Lane-keep on the avenue at x = -36, heading +z: steer against the
    // heading error and the sideways offset, gently.
    const yawErr = focus.yaw; // want 0 (due south, +z)
    const offErr = focus.pos.x - (-36);
    const steer = Math.max(-0.4, Math.min(0.4, -yawErr * 1.2 - offErr * 0.05));
    return { throttle: 1, steer };
  }
  if (shot.autopilot === 'walk') {
    return { x: 0, z: 1, run: false };
  }
  return null;
}
