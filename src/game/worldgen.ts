export type Biome =
  | "ocean"
  | "coast"
  | "plains"
  | "forest"
  | "mountain"
  | "desert"
  | "frozen";

export interface WorldMap {
  width: number;
  height: number;
  tiles: Biome[][]; // [y][x]
}

export const WORLD_WIDTH = 96;
export const WORLD_HEIGHT = 56;
export const ORION_SEED = 133742;

function hash2(x: number, y: number, seed: number): number {
  let h = seed;
  h = Math.imul(h ^ x, 374761393);
  h = Math.imul(h ^ y, 668265263);
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function valueNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const sx = smoothstep(x - x0);
  const sy = smoothstep(y - y0);
  const n00 = hash2(x0, y0, seed);
  const n10 = hash2(x0 + 1, y0, seed);
  const n01 = hash2(x0, y0 + 1, seed);
  const n11 = hash2(x0 + 1, y0 + 1, seed);
  const ix0 = lerp(n00, n10, sx);
  const ix1 = lerp(n01, n11, sx);
  return lerp(ix0, ix1, sy);
}

function fbm(
  x: number,
  y: number,
  seed: number,
  octaves: number,
  persistence: number,
  scale: number,
): number {
  let total = 0;
  let amp = 1;
  let maxAmp = 0;
  let freq = scale;
  for (let i = 0; i < octaves; i++) {
    total += valueNoise(x * freq, y * freq, seed + i * 977) * amp;
    maxAmp += amp;
    amp *= persistence;
    freq *= 2;
  }
  return total / maxAmp;
}

interface Blob {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot: number;
  strength: number;
}

function blobInfluence(x: number, y: number, blob: Blob): number {
  const dx = x - blob.cx;
  const dy = y - blob.cy;
  const cos = Math.cos(blob.rot);
  const sin = Math.sin(blob.rot);
  const rx = dx * cos + dy * sin;
  const ry = -dx * sin + dy * cos;
  const d = Math.sqrt((rx / blob.rx) ** 2 + (ry / blob.ry) ** 2);
  return Math.max(0, blob.strength * (1 - d));
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateWorld(seed: number = ORION_SEED): WorldMap {
  const rng = mulberry32(seed);
  const W = WORLD_WIDTH;
  const H = WORLD_HEIGHT;

  const continentCenters = [
    { cx: W * 0.18, cy: H * 0.24 },
    { cx: W * 0.52, cy: H * 0.55 },
    { cx: W * 0.82, cy: H * 0.78 },
  ];

  const blobs: Blob[] = continentCenters.map(({ cx, cy }) => ({
    cx,
    cy,
    rx: W * (0.17 + rng() * 0.06),
    ry: H * (0.2 + rng() * 0.08),
    rot: rng() * Math.PI,
    strength: 1,
  }));

  const islandCount = 12;
  for (let i = 0; i < islandCount; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 30 && !placed; attempt++) {
      const cx = 4 + rng() * (W - 8);
      const cy = 4 + rng() * (H - 8);
      const tooClose = continentCenters.some(
        (c) => Math.hypot(c.cx - cx, c.cy - cy) < Math.min(W, H) * 0.22,
      );
      if (tooClose) continue;
      blobs.push({
        cx,
        cy,
        rx: 1.2 + rng() * 2.2,
        ry: 1.2 + rng() * 2.2,
        rot: rng() * Math.PI,
        strength: 0.9,
      });
      placed = true;
    }
  }

  const elevation: number[][] = [];
  for (let y = 0; y < H; y++) {
    const row: number[] = [];
    for (let x = 0; x < W; x++) {
      let mask = 0;
      for (const b of blobs) mask = Math.max(mask, blobInfluence(x, y, b));
      const detail = fbm(x, y, seed + 11, 5, 0.5, 0.045) - 0.5;
      const edgeFalloff = mask > 0 ? smoothstep(Math.min(1, mask)) : 0;
      row.push(edgeFalloff + detail * 0.55 * edgeFalloff + detail * 0.06);
    }
    elevation.push(row);
  }

  const moisture: number[][] = [];
  for (let y = 0; y < H; y++) {
    const row: number[] = [];
    for (let x = 0; x < W; x++) {
      row.push(fbm(x, y, seed + 4242, 4, 0.5, 0.07));
    }
    moisture.push(row);
  }

  const SEA_LEVEL = 0.3;
  const MOUNTAIN_LEVEL = 0.76;

  const tiles: Biome[][] = [];
  for (let y = 0; y < H; y++) {
    const row: Biome[] = [];
    for (let x = 0; x < W; x++) {
      const elev = elevation[y][x];
      if (elev <= SEA_LEVEL) {
        row.push("ocean");
        continue;
      }
      if (elev >= MOUNTAIN_LEVEL) {
        row.push("mountain");
        continue;
      }
      const latNorm = y / (H - 1);
      const coldness = Math.abs(latNorm - 0.5) * 2;
      const moist = moisture[y][x];
      if (coldness > 0.7) {
        row.push("frozen");
      } else if (coldness < 0.32 && moist < 0.4) {
        row.push("desert");
      } else if (moist > 0.58) {
        row.push("forest");
      } else {
        row.push("plains");
      }
    }
    tiles.push(row);
  }

  const wasOcean = tiles.map((row) => row.map((b) => b === "ocean"));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!wasOcean[y][x]) continue;
      const neighborsLand = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ].some(([nx, ny]) => {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) return false;
        return !wasOcean[ny][nx];
      });
      if (neighborsLand) tiles[y][x] = "coast";
    }
  }

  return { width: W, height: H, tiles };
}

let cachedWorld: WorldMap | null = null;
export function getOrionWorld(): WorldMap {
  if (!cachedWorld) cachedWorld = generateWorld(ORION_SEED);
  return cachedWorld;
}

export function isLand(biome: Biome): boolean {
  return biome !== "ocean" && biome !== "coast";
}

export function isSettleable(biome: Biome): boolean {
  return biome === "plains" || biome === "forest" || biome === "desert";
}
