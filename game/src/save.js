// Save games live in localStorage under one key. The shape is versioned so
// a future build can migrate instead of crashing on an old slot; a corrupt
// slot is treated as no save at all, never as an error screen.

import { SAVE_KEY } from './config.js';

export function blankSave() {
  return {
    version: 1,
    cash: 250,
    rep: 0,
    day: 1,
    minutes: 9 * 60,
    missionsDone: [],
    unlocked: { pistol: false, smg: false, sport: false },
    stats: { kills: 0, takedowns: 0, escapes: 0, raceWins: 0, raceBest: null },
    player: { x: 22, z: 22, heading: 0 },
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return null;
    const save = blankSave();
    return {
      ...save,
      ...parsed,
      unlocked: { ...save.unlocked, ...(parsed.unlocked ?? {}) },
      stats: { ...save.stats, ...(parsed.stats ?? {}) },
      player: { ...save.player, ...(parsed.player ?? {}) },
    };
  } catch {
    return null;
  }
}

export function writeSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...save, version: 1 }));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage may be unavailable (private mode); the game plays on regardless.
  }
}

// One line for the Continue button: "Mission 3/8 · $1,250 · REP 2 · 24%".
export function describeSave(save, percentComplete) {
  const missions = save.missionsDone.length;
  const clock = `${String(Math.floor(save.minutes / 60)).padStart(2, '0')}:${String(save.minutes % 60).padStart(2, '0')}`;
  return `Mission ${missions}/8 · $${save.cash.toLocaleString('en-US')} · REP ${save.rep} · ${percentComplete}% · Day ${save.day}, ${clock}`;
}
