// One place for every number the game tunes by. Systems import what they
// need; nothing hard-codes a magic constant twice. Units are metres,
// seconds, and in-game dollars unless a name says otherwise.

export const WORLD = {
  // Streets run every 36 m from -144 to +144 on both axes; the road surface
  // is 12 m wide, so each block is a 24 m square of buildings.
  streetSpacing: 36,
  streetFirst: -144,
  streetCount: 9,
  roadWidth: 12,
  halfSize: 162,
  // The sea eats the west edge. The shoreline wanders with z so the map is
  // a bay and a headland, never a straight grid line.
  shoreBase: -156,
  shoreSwing: 16,
  beachWidth: 10,
};

export const DAY = {
  // One game minute passes every ~2 real seconds; the clock starts at 09:00.
  secondsPerGameMinute: 2,
  startHour: 9,
  // The four staged times of day, in game hours.
  keyframes: [6, 12, 18.87, 21],
};

export const PLAYER = {
  walkSpeed: 5,
  runSpeed: 8.5,
  radius: 0.55,
  health: 100,
  eyeHeight: 1.7,
  startCash: 250,
  startPos: { x: 22, z: 22 },
};

export const CAR = {
  accel: 12,
  brake: 26,
  reverseMax: 10,
  maxSpeed: 34,
  sportMaxSpeed: 38,
  steerAuthority: 0.5,
  maxYawRate: 2.2,
  radius: 1.9,
  // Police are faster on a straight, clumsier in a corner: catchable on
  // straights, escapable in the turns.
  policeMaxSpeed: 37.4,
  policeSteer: 0.8,
};

export const ECONOMY = {
  resprayPrice: 150,
  racePrize: 1000,
  parBonus: 250,
  raceParSeconds: 75,
  smgPrice: 1000,
  bustedFine: 200,
};

export const WANTED = {
  maxHeat: 100,
  heatPerStar: 20,
  decayPerSecond: 2.5,
  evadeBaseSeconds: 5,
  evadePerStar: 1.8,
  // Heat added by each crime, before the witness check.
  crimeHeat: { stealCar: 25, hitPed: 20, shoot: 30, kill: 40, killCop: 50, explosion: 30 },
  // Distance (m) inside which a crime is seen.
  witnessPed: 300,
  witnessPolice: 520,
};

export const WEAPONS = {
  fists: { name: 'Fists', damage: 15, range: 2.5, rate: 2.5, mag: Infinity, reload: 0, auto: false },
  pistol: { name: 'Pistol', damage: 34, range: 60, rate: 3, mag: 12, reload: 1.1, auto: false },
  smg: { name: 'SMG', damage: 18, range: 45, rate: 9, mag: 32, reload: 1.6, auto: true, unlockMission: 5 },
};

export const PALETTE = {
  gold: '#f2c94c',
  teal: '#2e7fa8',
  cream: '#f2e8d5',
  terracotta: '#c96f4a',
  dustyTeal: '#5e8a7b',
  ink: '#0c1218',
  panel: 'rgba(12, 18, 24, 0.55)',
};

export const SAVE_KEY = 'palma-verde-save-v1';
