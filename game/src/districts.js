// Six named districts tile the whole map, plus the landmarks that make the
// skyline readable from far away. districtAt() is a pure position lookup;
// the HUD banner fires once per entry. Nothing here builds meshes — city.js
// reads LANDMARKS and places the geometry.

export const DISTRICTS = [
  {
    id: 'harbor', name: 'Pelabuhan Solmar', blurb: 'pier · lighthouse · fishing boats',
    x0: -162, z0: -162, x1: -72, z1: 72, tint: '#5e8a7b',
  },
  {
    id: 'casco', name: 'Casco Viejo', blurb: 'old town · plaza fountain',
    x0: -72, z0: -162, x1: 36, z1: -36, tint: '#c9a37e',
  },
  {
    id: 'marisol', name: 'Bukit Marisol', blurb: 'hillside villas',
    x0: 36, z0: -162, x1: 162, z1: -36, tint: '#d8b48a',
  },
  {
    id: 'boulevard', name: 'Boulevard Palma', blurb: 'ferris wheel · palm rows',
    x0: -72, z0: -36, x1: 36, z1: 72, tint: '#f2c94c',
  },
  {
    id: 'larosa', name: 'La Rosa', blurb: 'neon district · clock tower',
    x0: 36, z0: -36, x1: 162, z1: 72, tint: '#ff5a8a',
  },
  {
    id: 'mercado', name: 'Mercado', blurb: 'open-air fish market',
    x0: -162, z0: 72, x1: 162, z1: 162, tint: '#c96f4a',
  },
];

export function districtAt(x, z) {
  for (const d of DISTRICTS) {
    if (x >= d.x0 && x < d.x1 && z >= d.z0 && z < d.z1) return d;
  }
  return DISTRICTS[3];
}

// Landmarks are placed by city.js; each entry names the mesh kind it needs.
export const LANDMARKS = [
  { kind: 'pier', x: -150, z: -100 },
  { kind: 'lighthouse', x: -156, z: -118 },
  { kind: 'fountain', x: -18, z: -99 },
  { kind: 'ferris', x: 0, z: 18 },
  { kind: 'clocktower', x: 108, z: 18 },
  { kind: 'market', x: 0, z: 126 },
  { kind: 'villas', x: 120, z: -120 },
];

export function landmarkNear(x, z, radius = 14) {
  let best = null;
  let bestD = radius;
  for (const mark of LANDMARKS) {
    const d = Math.hypot(mark.x - x, mark.z - z);
    if (d < bestD) { best = mark; bestD = d; }
  }
  return best;
}
