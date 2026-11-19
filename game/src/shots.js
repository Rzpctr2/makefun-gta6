// Staged screenshots behind ?shot=drive|street|aerial|start.
// Each scene is the real game, not a mock: the world is built from the seed,
// then a small autopilot plays it forward for a few seconds so the frame is
// what a few seconds of real play looks like — and the same seed always
// gives the same frame. The game loop itself runs the autopilot; this module
// only picks the starting pose for each shot.
import { CONFIG } from './config.js';

// Where each shot begins. Coordinates are world metres; the plaza at (0,0)
// is the city centre, the beach is east (+x).
export const SHOTS = {
  // Cover: driving south down the avenue at x=-36 (a real road), traffic
  // ahead, HUD + minimap live.
  drive: {
    mode: 'car',
    carX: -36, carZ: -120, carYaw: 0,
    camYaw: 0, camPitch: 0.32,
    autopilot: 'drive',
    warmup: 6,
  },
  // On foot at the plaza, facing the beach towers.
  street: {
    mode: 'foot',
    playerX: -6, playerZ: 10, playerYaw: Math.PI * 0.62,
    camYaw: Math.PI * 0.62, camPitch: 0.22,
    autopilot: 'walk',
    warmup: 3,
  },
  // High view over the city, beach and sea.
  aerial: {
    mode: 'aerial',
    playerX: 0, playerZ: 0, playerYaw: 0,
    camYaw: 0.6, camPitch: 0.9,
    autopilot: null,
    warmup: 1,
  },
  // Title screen over a slow camera drift.
  start: {
    mode: 'menu',
    playerX: 0, playerZ: 0, playerYaw: 0,
    camYaw: 0.4, camPitch: 0.25,
    autopilot: null,
    warmup: 1,
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
