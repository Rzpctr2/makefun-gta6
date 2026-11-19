// Palma Verde — shared tuning constants for the whole game.
// One place for the city layout, physics feel and look, so every module
// agrees on the same numbers.
export const CONFIG = {
  seed: 7,
  // City layout: a grid of square blocks separated by roads.
  blocks: 9, // blocks per side (odd, so a plaza sits at the centre)
  blockSize: 44, // metres of buildings per block
  roadWidth: 14, // metres of asphalt between blocks
  // Derived: pitch = blockSize + roadWidth; city spans blocks*pitch metres.
  get pitch() {
    return this.blockSize + this.roadWidth;
  },
  get citySize() {
    return this.blocks * this.pitch;
  },
  // The beach + sea sit on the east edge (positive x).
  beachWidth: 46,
  seaWidth: 220,
  // Buildings: heights in metres, taller toward the centre and the beach.
  buildingMinH: 10,
  buildingMaxH: 58,
  buildingGap: 3, // inset from the block edge
  // Player on foot.
  walkSpeed: 6,
  runSpeed: 10.5,
  // Cars.
  carAccel: 16,
  carBrake: 30,
  carMaxSpeed: 34,
  carReverseMax: 9,
  carSteer: 0.55, // radians of wheel angle at full lock
  trafficSpeed: 9,
  trafficCount: 14,
  parkedCount: 26,
  pedCount: 22,
  // Camera.
  camDistanceFoot: 7.5,
  camDistanceCar: 11,
  camHeight: 3.2,
};

export const PALETTE = {
  sky: 0x8ec9e8,
  fog: 0xcfe4ef,
  sun: 0xfff2d8,
  asphalt: 0x3a3f46,
  sidewalk: 0xcfc8b8,
  sand: 0xe8d49a,
  sea: 0x2e7fa8,
  seaDeep: 0x1d5f86,
  grass: 0x7fae62,
  plaza: 0xd8cdb4,
};

// Fictional names — nothing borrowed from any commercial game.
export const NAMES = {
  city: 'Palma Verde',
  player: 'Leo Marin',
  currency: '$',
};
