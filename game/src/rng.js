// Seeded random numbers for Palma Verde. Every deterministic choice in the
// city — building heights, traffic colours, pedestrian routes — flows from
// one seed, so `?seed=7` always builds the same town and the four staged
// screenshots stay reproducible. Nothing here touches Math.random.

export function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A small toolbox around one seeded stream. Modules take the stream they
// need and never share global random state, so reordering systems cannot
// change the city layout.
export function makeRng(seed) {
  const next = mulberry32(typeof seed === 'string' ? hashSeed(seed) : seed);
  return {
    next,
    range(min, max) {
      return min + next() * (max - min);
    },
    int(min, max) {
      return Math.floor(min + next() * (max - min + 1));
    },
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
    chance(p) {
      return next() < p;
    },
    // A child stream derived from this one, for a subsystem that wants its
    // own repeatable sequence without draining the parent.
    fork(salt) {
      return makeRng((next() * 0xffffffff) ^ hashSeed(salt));
    },
  };
}
