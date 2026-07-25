import { randInt } from "./utils";
import { isLand, isSettleable, type WorldMap } from "./worldgen";

export interface TilePos {
  x: number;
  y: number;
}

export function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function revealAround(
  known: Set<string>,
  world: WorldMap,
  cx: number,
  cy: number,
  radius: number,
): void {
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || y < 0 || x >= world.width || y >= world.height) continue;
      known.add(tileKey(x, y));
    }
  }
}

export function findStartingCapital(world: WorldMap): TilePos {
  for (let attempt = 0; attempt < 3000; attempt++) {
    const x = randInt(3, world.width - 4);
    const y = randInt(3, world.height - 4);
    const biome = world.tiles[y][x];
    if (biome !== "plains" && biome !== "forest") continue;
    let landCount = 0;
    for (let ny = y - 1; ny <= y + 1; ny++) {
      for (let nx = x - 1; nx <= x + 1; nx++) {
        if (isLand(world.tiles[ny][nx])) landCount++;
      }
    }
    if (landCount >= 8) return { x, y };
  }
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      if (isSettleable(world.tiles[y][x])) return { x, y };
    }
  }
  return { x: Math.floor(world.width / 2), y: Math.floor(world.height / 2) };
}

export function findNeighborCapital(
  world: WorldMap,
  taken: TilePos[],
  around: TilePos,
  minDist: number,
  maxDist: number,
): TilePos {
  for (let attempt = 0; attempt < 3000; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * (maxDist - minDist);
    const x = Math.round(around.x + Math.cos(angle) * dist);
    const y = Math.round(around.y + Math.sin(angle) * dist);
    if (x < 2 || y < 2 || x >= world.width - 2 || y >= world.height - 2) continue;
    if (!isSettleable(world.tiles[y][x])) continue;
    if (taken.some((t) => Math.hypot(t.x - x, t.y - y) < 3)) continue;
    return { x, y };
  }
  return findStartingCapital(world);
}

export function buildTerritory(
  world: WorldMap,
  capital: TilePos,
  size: number,
): TilePos[] {
  const territory: TilePos[] = [capital];
  const seen = new Set([tileKey(capital.x, capital.y)]);
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (let i = 0; i < size * 8 && territory.length < size; i++) {
    const base = territory[randInt(0, territory.length - 1)];
    const [dx, dy] = dirs[randInt(0, dirs.length - 1)];
    const nx = base.x + dx;
    const ny = base.y + dy;
    if (nx < 0 || ny < 0 || nx >= world.width || ny >= world.height) continue;
    const key = tileKey(nx, ny);
    if (seen.has(key)) continue;
    if (!isLand(world.tiles[ny][nx])) continue;
    seen.add(key);
    territory.push({ x: nx, y: ny });
  }
  return territory;
}

export function findExpeditionTarget(
  world: WorldMap,
  known: Set<string>,
  capital: TilePos,
  minDist: number,
  maxDist: number,
  requireLand: boolean,
): TilePos | null {
  for (let attempt = 0; attempt < 800; attempt++) {
    const x = randInt(0, world.width - 1);
    const y = randInt(0, world.height - 1);
    if (known.has(tileKey(x, y))) continue;
    if (requireLand && !isSettleable(world.tiles[y][x])) continue;
    const d = Math.hypot(x - capital.x, y - capital.y);
    if (d < minDist || d > maxDist) continue;
    return { x, y };
  }
  return null;
}

export function findExpansionTile(
  world: WorldMap,
  owned: TilePos[],
): TilePos | null {
  const ownedSet = new Set(owned.map((o) => tileKey(o.x, o.y)));
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];
  const candidates: TilePos[] = [];
  for (const o of owned) {
    for (const [dx, dy] of dirs) {
      const nx = o.x + dx;
      const ny = o.y + dy;
      if (nx < 0 || ny < 0 || nx >= world.width || ny >= world.height) continue;
      const key = tileKey(nx, ny);
      if (ownedSet.has(key)) continue;
      if (!isSettleable(world.tiles[ny][nx])) continue;
      candidates.push({ x: nx, y: ny });
    }
  }
  if (candidates.length === 0) return null;
  return candidates[randInt(0, candidates.length - 1)];
}
