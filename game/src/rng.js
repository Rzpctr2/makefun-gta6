// Seeded randomness for the world. One compact generator (mulberry32) plus
// a handful of draw helpers, so a given seed always rebuilds the same city,
// the same traffic colours and the same pedestrian outfits. Live gameplay
// still reaches for Math.random wherever it wants a surprise.
export function mulberry32(seed) {
  let state = seed >>> 0;
  const STEP = 0x6d2b79f5;
  const SCALE = 4294967296;
  return function () {
    state |= 0;
    state = (state + STEP) | 0;
    // First scramble: multiply the state by itself shifted, keyed on its
    // own low bit, then fold the product back into itself.
    const scrambled = Math.imul(state ^ (state >>> 15), 1 | state);
    const folded =
      (scrambled + Math.imul(scrambled ^ (scrambled >>> 7), 61 | scrambled)) ^
      scrambled;
    return ((folded ^ (folded >>> 14)) >>> 0) / SCALE;
  };
}

// A float in [min, max): one draw from the generator.
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

// An integer in [min, max], both ends included: one draw.
export function rangeInt(rng, min, max) {
  return Math.floor(range(rng, min, max + 1));
}

// One element of a list, chosen by a single draw.
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

// Fisher-Yates, driven by the same seeded generator, in place.
export function shuffle(rng, list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const held = list[i];
    list[i] = list[j];
    list[j] = held;
  }
  return list;
}
