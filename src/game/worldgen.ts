export type Biome =
  | "ocean"
  | "coast"
  | "plains"
  | "forest"
  | "mountain"
  | "desert"
  | "badlands"
  | "frozen";

export interface WorldMap {
  width: number;
  height: number;
  tiles: Biome[][]; // [y][x]
}

export const WORLD_WIDTH = 288;
export const WORLD_HEIGHT = 168;
export const ORION_SEED = 133742;
// scale factor relative to the original 96x56 baseline, used to keep
// distance-based gameplay constants (exploration radii, expedition range,
// neighbor placement) proportionate when the world grid size changes
export const WORLD_SCALE = WORLD_WIDTH / 96;

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

function maxInfluence(x: number, y: number, blobs: Blob[]): number {
  let mask = 0;
  for (const b of blobs) mask = Math.max(mask, blobInfluence(x, y, b));
  return mask;
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

interface ContinentDef {
  // silhouette blobs making up the landmass shape
  body: Blob[];
  // smaller, stronger blobs that push elevation into mountain range (spines/peaks)
  peaks: Blob[];
  // reference point used for the west(moist)/east(dry) climate gradient of this landmass
  centerX: number;
  // which dry biome this continent uses on its rain-shadow (east) side
  dryBiome: "desert" | "badlands";
}

function jitterBlob(b: Blob, rng: () => number, amount: number): Blob {
  return {
    ...b,
    rx: b.rx * (1 - amount / 2 + rng() * amount),
    ry: b.ry * (1 - amount / 2 + rng() * amount),
    rot: b.rot + (rng() - 0.5) * 0.3,
  };
}

function buildContinents(W: number, H: number, rng: () => number): ContinentDef[] {
  const jitter = (b: Blob) => jitterBlob(b, rng, 0.14);

  // --- Continent A: north-west "horn" -- icy peak tapering into forest, plains, desert ---
  const aBody: Blob[] = [
    { cx: 0.23 * W, cy: 0.43 * H, rx: 0.2 * W, ry: 0.3 * H, rot: 0.25, strength: 1 },
    { cx: 0.09 * W, cy: 0.3 * H, rx: 0.11 * W, ry: 0.17 * H, rot: -0.2, strength: 1 },
    { cx: 0.17 * W, cy: 0.62 * H, rx: 0.11 * W, ry: 0.12 * H, rot: 0.1, strength: 1 },
    { cx: 0.24 * W, cy: 0.1 * H, rx: 0.12 * W, ry: 0.14 * H, rot: 0.1, strength: 1 },
    { cx: 0.235 * W, cy: 0.24 * H, rx: 0.1 * W, ry: 0.14 * H, rot: 0.1, strength: 1 },
  ].map(jitter);
  const aPeaks: Blob[] = [
    { cx: 0.24 * W, cy: 0.15 * H, rx: 0.045 * W, ry: 0.11 * H, rot: 0.15, strength: 1 },
    { cx: 0.2 * W, cy: 0.3 * H, rx: 0.04 * W, ry: 0.1 * H, rot: 0.0, strength: 1 },
  ].map(jitter);

  // --- Continent B: north-east "horn", mirrored copy of A ---
  const mirrorX = (x: number) => W - 1 - x;
  const mirrorBlob = (b: Blob): Blob => ({ ...b, cx: mirrorX(b.cx), rot: -b.rot });
  const bBody = aBody.map(mirrorBlob);
  const bPeaks = aPeaks.map(mirrorBlob);

  // --- Continent C: southern landmass with forested west and rocky badlands east ---
  const cBody: Blob[] = [
    { cx: 0.53 * W, cy: 0.73 * H, rx: 0.16 * W, ry: 0.18 * H, rot: 0.05, strength: 1 },
    { cx: 0.62 * W, cy: 0.7 * H, rx: 0.1 * W, ry: 0.11 * H, rot: -0.1, strength: 1 },
    { cx: 0.44 * W, cy: 0.76 * H, rx: 0.1 * W, ry: 0.11 * H, rot: 0.1, strength: 1 },
  ].map(jitter);
  const cPeaks: Blob[] = [
    { cx: 0.51 * W, cy: 0.63 * H, rx: 0.045 * W, ry: 0.08 * H, rot: -0.1, strength: 1 },
  ].map(jitter);

  return [
    { body: aBody, peaks: aPeaks, centerX: 0.23 * W, dryBiome: "desert" },
    { body: bBody, peaks: bPeaks, centerX: mirrorX(0.23 * W), dryBiome: "desert" },
    { body: cBody, peaks: cPeaks, centerX: 0.53 * W, dryBiome: "badlands" },
  ];
}

function buildIslands(
  W: number,
  H: number,
  rng: () => number,
  continents: ContinentDef[],
): Blob[] {
  const islands: Blob[] = [];
  const centers = continents.map((c) => ({ cx: c.centerX, cy: 0.5 * H }));

  const addIsland = (cx: number, cy: number, minR: number, maxR: number) => {
    islands.push({
      cx,
      cy,
      rx: minR + rng() * (maxR - minR),
      ry: minR + rng() * (maxR - minR),
      rot: rng() * Math.PI,
      strength: 0.92,
    });
  };

  // scattered open-ocean islands, kept clear of the continents themselves
  let scattered = 0;
  for (let attempt = 0; attempt < 1200 && scattered < 46; attempt++) {
    const cx = 3 + rng() * (W - 6);
    const cy = 3 + rng() * (H - 6);
    const tooClose = centers.some((c) => Math.hypot(c.cx - cx, c.cy - cy) < Math.min(W, H) * 0.16);
    if (tooClose) continue;
    addIsland(cx, cy, 1.1 * WORLD_SCALE, 2.6 * WORLD_SCALE);
    scattered += 1;
  }

  // small archipelago in the strait between the two northern horns
  for (let i = 0; i < 14; i++) {
    addIsland(
      0.4 * W + rng() * 0.2 * W,
      0.04 * H + rng() * 0.2 * H,
      0.9 * WORLD_SCALE,
      1.8 * WORLD_SCALE,
    );
  }
  // tiny clusters near the bottom-left and bottom-right corners
  for (let i = 0; i < 9; i++) {
    addIsland(
      0.03 * W + rng() * 0.12 * W,
      0.78 * H + rng() * 0.18 * H,
      0.9 * WORLD_SCALE,
      1.7 * WORLD_SCALE,
    );
  }
  for (let i = 0; i < 9; i++) {
    addIsland(
      0.9 * W + rng() * 0.08 * W,
      0.1 * H + rng() * 0.15 * H,
      0.9 * WORLD_SCALE,
      1.7 * WORLD_SCALE,
    );
  }

  return islands;
}

export function generateWorld(seed: number = ORION_SEED): WorldMap {
  const rng = mulberry32(seed);
  const W = WORLD_WIDTH;
  const H = WORLD_HEIGHT;

  const continents = buildContinents(W, H, rng);
  const islands = buildIslands(W, H, rng, continents);
  const landBlobs = [...continents.flatMap((c) => c.body), ...islands];
  const peakBlobs = continents.flatMap((c) => c.peaks);

  const SEA_LEVEL = 0.3;
  const MOUNTAIN_LEVEL = 0.75;
  const LAND_MULT = 0.62;
  const PEAK_MULT = 0.6;
  const DETAIL_MULT = 0.18;

  const elevation: number[][] = [];
  for (let y = 0; y < H; y++) {
    const row: number[] = [];
    for (let x = 0; x < W; x++) {
      const landMask = maxInfluence(x, y, landBlobs);
      const peakMask = maxInfluence(x, y, peakBlobs);
      const edgeFalloff = landMask > 0 ? smoothstep(Math.min(1, landMask)) : 0;
      const peakFalloff = peakMask > 0 ? smoothstep(Math.min(1, peakMask)) : 0;
      const detail = fbm(x, y, seed + 11, 5, 0.5, 0.05) - 0.5;
      // extra high-frequency jitter concentrated right at the coastline to break
      // it up into the fractal capes, inlets and skerries seen along real coasts
      const fineDetail = fbm(x, y, seed + 977, 4, 0.55, 0.16) - 0.5;
      const coastJitterWeight = 4 * edgeFalloff * (1 - edgeFalloff);
      row.push(
        edgeFalloff * LAND_MULT +
          peakFalloff * PEAK_MULT +
          detail * DETAIL_MULT * edgeFalloff +
          fineDetail * 0.24 * coastJitterWeight,
      );
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

  // only the top of the map carries arctic cold; the southern landmass stays temperate.
  // a noise term is mixed in so the snowline meanders instead of forming a ruler-straight edge
  const coldnessAt = (x: number, y: number) => {
    const base = Math.max(0, 1 - y / (H * 0.62));
    const wobble = fbm(x, y, seed + 777, 3, 0.5, 0.045) - 0.5;
    return base + wobble * 0.22;
  };
  const FROZEN_THRESH = 0.5;
  const SNOW_PEAK_THRESH = 0.38;
  const MOIST_BIAS_RANGE = 0.3 * W;

  const nearestContinentIdx = (x: number): number => {
    let best = 0;
    let bestDist = Infinity;
    continents.forEach((c, i) => {
      const d = Math.abs(x - c.centerX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  };

  const tiles: Biome[][] = [];
  for (let y = 0; y < H; y++) {
    const row: Biome[] = [];
    for (let x = 0; x < W; x++) {
      const coldness = coldnessAt(x, y);
      const elev = elevation[y][x];
      if (elev <= SEA_LEVEL) {
        row.push("ocean");
        continue;
      }
      if (elev >= MOUNTAIN_LEVEL) {
        row.push(coldness > SNOW_PEAK_THRESH ? "frozen" : "mountain");
        continue;
      }
      if (coldness > FROZEN_THRESH) {
        row.push("frozen");
        continue;
      }
      const idx = nearestContinentIdx(x);
      const continent = continents[idx];
      const bias = -((x - continent.centerX) / MOIST_BIAS_RANGE) * 0.3;
      const moist = clampNum(moisture[y][x] + bias, 0, 1);
      if (moist < 0.32) {
        row.push(continent.dryBiome);
      } else if (moist > 0.56) {
        row.push("forest");
      } else {
        row.push("plains");
      }
    }
    tiles.push(row);
  }

  // a handful of small interior lakes per continent, for extra visual variety
  for (const c of continents) {
    const lakeCount = 3 + Math.floor(rng() * 4);
    for (let i = 0; i < lakeCount; i++) {
      const anchor = c.body[0];
      for (let attempt = 0; attempt < 50; attempt++) {
        const cx = Math.round(anchor.cx + (rng() - 0.5) * anchor.rx * 1.3);
        const cy = Math.round(anchor.cy + (rng() - 0.5) * anchor.ry * 1.3);
        if (cx < 2 || cy < 2 || cx >= W - 2 || cy >= H - 2) continue;
        const centerBiome = tiles[cy][cx];
        if (centerBiome === "ocean" || centerBiome === "mountain" || centerBiome === "frozen") {
          continue;
        }
        const r = Math.round((1 + Math.floor(rng() * 2)) * WORLD_SCALE * 0.4);
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy > r * r + 0.5) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const b = tiles[ny][nx];
            if (b !== "mountain" && b !== "frozen") tiles[ny][nx] = "ocean";
          }
        }
        break;
      }
    }
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

function clampNum(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
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
  return biome === "plains" || biome === "forest" || biome === "desert" || biome === "badlands";
}
