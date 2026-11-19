// Save / load through localStorage: position, heading, cash, play time and
// whether the player was driving. A save is only a starting point — the city
// itself is rebuilt from the seed every launch.
export const SAVE_KEY = 'palma-verde.save.v1';

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      x: Math.round(state.x * 100) / 100,
      z: Math.round(state.z * 100) / 100,
      yaw: Math.round(state.yaw * 1000) / 1000,
      cash: state.cash,
      seconds: Math.round(state.seconds),
      inCar: !!state.inCar,
      savedAt: Date.now(),
    }));
    return true;
  } catch {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data.x !== 'number' || typeof data.z !== 'number') return null;
    return data;
  } catch {
    return null;
  }
}

export function hasSave() {
  return loadGame() !== null;
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch { /* private mode: ignore */ }
}
