import {
  BUILDINGS,
  FEMALE_NAMES,
  KINGDOM_NAME_ADJ,
  KINGDOM_NAME_SUFFIX,
  MALE_NAMES,
  NEIGHBOR_NAME_POOL,
  TRAITS,
} from "./data";
import { EVENTS, pickEvent, resolveChoice } from "./events";
import type {
  BuildingId,
  EventContext,
  GameState,
  Neighbor,
  Person,
  Province,
  Sex,
  Stats,
  TraitId,
} from "./types";
import { chance, clamp, log, nextId, pick, randInt } from "./utils";

const OPPOSITE_TRAITS: Partial<Record<TraitId, TraitId>> = {
  brave: "cowardly",
  cowardly: "brave",
  wise: "foolish",
  foolish: "wise",
  just: "cruel",
  cruel: "just",
  generous: "greedy",
  greedy: "generous",
  pious: "impious",
  impious: "pious",
  frail: "hale",
  hale: "frail",
};

function randomTraits(count: number): TraitId[] {
  const pool = Object.keys(TRAITS) as TraitId[];
  const chosen: TraitId[] = [];
  while (chosen.length < count) {
    const candidate = pick(pool);
    const opposite = OPPOSITE_TRAITS[candidate];
    if (chosen.includes(candidate)) continue;
    if (opposite && chosen.includes(opposite)) continue;
    chosen.push(candidate);
  }
  return chosen;
}

function baseStats(): Stats {
  return {
    martial: randInt(3, 12),
    diplomacy: randInt(3, 12),
    stewardship: randInt(3, 12),
    piety: randInt(3, 12),
  };
}

export function statsWithTraits(person: Person): Stats {
  const s = { ...person.stats };
  for (const t of person.traits) {
    const effects = TRAITS[t].effects;
    s.martial += effects.martial ?? 0;
    s.diplomacy += effects.diplomacy ?? 0;
    s.stewardship += effects.stewardship ?? 0;
    s.piety += effects.piety ?? 0;
  }
  return s;
}

export function createPerson(
  state: GameState,
  sex: Sex,
  birthYear: number,
  parentId: string | null,
): Person {
  const name = sex === "M" ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
  return {
    id: nextId(state, "person"),
    name,
    sex,
    birthYear,
    deathYear: null,
    traits: randomTraits(randInt(1, 3)),
    stats: baseStats(),
    health: randInt(75, 100),
    parentId,
  };
}

function randomKingdomName(): string {
  return `${pick(KINGDOM_NAME_ADJ)}${pick(KINGDOM_NAME_SUFFIX)}`;
}

export function createInitialState(): GameState {
  const startYear = 850;
  const state: GameState = {
    year: startYear,
    dynastyName: "",
    kingdomName: "",
    foundingYear: startYear,
    ruler: null as unknown as Person,
    heirs: [],
    deceased: [],
    provinces: [],
    resources: { gold: 80, food: 60, stability: 60, prestige: 5 },
    neighbors: [],
    log: [],
    pendingEvent: null,
    phase: "playing",
    reignCount: 1,
    nextId: 0,
  };

  const founder = createPerson(state, "M", startYear - randInt(22, 35), null);
  state.ruler = founder;
  state.dynastyName = `${founder.name}ides`;
  state.kingdomName = randomKingdomName();

  const capital: Province = {
    id: nextId(state, "province"),
    name: state.kingdomName,
    kind: "capital",
    population: 200,
    buildings: ["hall"],
    foundedYear: startYear,
  };
  state.provinces.push(capital);

  const neighborNames = [...NEIGHBOR_NAME_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
  for (const name of neighborNames) {
    const neighbor: Neighbor = {
      id: nextId(state, "neighbor"),
      name,
      relation: randInt(-20, 30),
      strength: randInt(15, 35),
      atWar: false,
      isVassal: false,
    };
    state.neighbors.push(neighbor);
  }

  log(state, "province", `Fondation de ${state.kingdomName} par ${founder.name}, l'an ${startYear}.`);
  return state;
}

// ---- Player actions ----

export function foundProvince(state: GameState): GameState {
  const s = structuredClone(state);
  const cost = 120 + s.provinces.length * 40;
  if (s.resources.gold < cost) return s;
  s.resources.gold -= cost;
  const kind = s.provinces.length < 2 ? "town" : "frontier";
  const province: Province = {
    id: nextId(s, "province"),
    name: randomKingdomName(),
    kind,
    population: 40,
    buildings: [],
    foundedYear: s.year,
  };
  s.provinces.push(province);
  log(s, "province", `Une nouvelle province, ${province.name}, rejoint le royaume.`);
  return s;
}

export function buildBuilding(
  state: GameState,
  provinceId: string,
  buildingId: BuildingId,
): GameState {
  const s = structuredClone(state);
  const province = s.provinces.find((p) => p.id === provinceId);
  const buildingType = BUILDINGS[buildingId];
  if (!province || !buildingType) return s;
  if (province.buildings.includes(buildingId)) return s;
  if (s.resources.gold < buildingType.cost) return s;
  s.resources.gold -= buildingType.cost;
  province.buildings.push(buildingId);
  log(s, "building", `${buildingType.name} construit à ${province.name}.`);
  return s;
}

export function sendGift(state: GameState, neighborId: string): GameState {
  const s = structuredClone(state);
  const neighbor = s.neighbors.find((n) => n.id === neighborId);
  if (!neighbor || s.resources.gold < 25) return s;
  s.resources.gold -= 25;
  neighbor.relation = clamp(neighbor.relation + 15, -100, 100);
  log(s, "diplomacy", `Un présent est envoyé à ${neighbor.name}, améliorant les relations.`);
  return s;
}

export function declareWar(state: GameState, neighborId: string): GameState {
  const s = structuredClone(state);
  const neighbor = s.neighbors.find((n) => n.id === neighborId);
  if (!neighbor || neighbor.atWar) return s;
  neighbor.atWar = true;
  neighbor.relation = clamp(neighbor.relation - 30, -100, 100);
  log(s, "war", `Guerre déclarée contre ${neighbor.name} !`);
  return s;
}

export function sueForPeace(state: GameState, neighborId: string): GameState {
  const s = structuredClone(state);
  const neighbor = s.neighbors.find((n) => n.id === neighborId);
  if (!neighbor || !neighbor.atWar) return s;
  neighbor.atWar = false;
  neighbor.relation = clamp(neighbor.relation + 5, -100, 100);
  log(s, "peace", `La paix est signée avec ${neighbor.name}.`);
  return s;
}

// ---- Event resolution ----

export function answerEvent(state: GameState, choiceId: string): GameState {
  const s = structuredClone(state);
  if (!s.pendingEvent) return s;
  const event = EVENTS.find((e) => e.id === s.pendingEvent!.eventId);
  s.pendingEvent = null;
  if (!event) return s;
  const ctx: EventContext = { state: s };
  resolveChoice(ctx, event, choiceId);
  return s;
}

export function acknowledgeSuccession(state: GameState): GameState {
  const s = structuredClone(state);
  if (s.phase === "succession") s.phase = "playing";
  return s;
}

// ---- Turn processing ----

function totalMilitary(state: GameState): number {
  const rulerStats = statsWithTraits(state.ruler);
  let military = rulerStats.martial * 2;
  for (const p of state.provinces) {
    if (p.buildings.includes("barracks")) military += 6;
    if (p.buildings.includes("walls")) military += 3;
    military += Math.floor(p.population / 50);
  }
  return military;
}

function handleProduction(state: GameState): void {
  let food = 10;
  let gold = 10;
  for (const p of state.provinces) {
    food += Math.floor(p.population / 20);
    gold += Math.floor(p.population / 30);
    for (const b of p.buildings) {
      const effects = BUILDINGS[b].effects;
      food += effects.food ?? 0;
      gold += effects.gold ?? 0;
      state.resources.stability = clamp(
        state.resources.stability + (effects.stability ?? 0) * 0.1,
        0,
        100,
      );
      state.resources.prestige += (effects.prestige ?? 0) * 0.1;
    }
    p.population += Math.max(1, Math.floor(p.population * 0.03));
  }
  const upkeep = Math.floor(state.provinces.length * 5 + state.resources.food * 0.15);
  state.resources.food = Math.max(0, state.resources.food + food - upkeep);
  state.resources.gold = Math.max(0, state.resources.gold + gold);
  if (state.resources.food === 0) {
    state.resources.stability = clamp(state.resources.stability - 5, 0, 100);
  }
}

function handleWars(state: GameState): void {
  const myMilitary = totalMilitary(state);
  for (const neighbor of state.neighbors) {
    if (!neighbor.atWar) {
      if (
        neighbor.relation < -40 &&
        neighbor.strength > myMilitary * 1.3 &&
        chance(0.15)
      ) {
        neighbor.atWar = true;
        log(state, "war", `${neighbor.name} vous déclare la guerre !`);
      }
      continue;
    }
    const roll = myMilitary + randInt(-10, 10) - (neighbor.strength + randInt(-10, 10));
    if (roll > 8) {
      state.resources.prestige += 3;
      state.resources.gold += 20;
      neighbor.strength = Math.max(5, neighbor.strength - 3);
      log(state, "war", `Victoire contre ${neighbor.name} ! Butin et prestige gagnés.`);
      if (chance(0.2)) {
        neighbor.atWar = false;
        neighbor.relation = -20;
        log(state, "peace", `${neighbor.name} capitule et demande la paix.`);
      }
    } else if (roll < -8) {
      state.resources.stability = clamp(state.resources.stability - 6, 0, 100);
      state.resources.gold = Math.max(0, state.resources.gold - 15);
      const target = state.provinces.find((p) => p.kind === "frontier");
      if (target && chance(0.15)) {
        state.provinces = state.provinces.filter((p) => p.id !== target.id);
        log(state, "war", `${neighbor.name} s'empare de la province de ${target.name} !`);
      } else {
        log(state, "war", `Défaite face à ${neighbor.name}. Le moral en pâtit.`);
      }
    } else {
      log(state, "war", `Aucun camp ne prend l'avantage face à ${neighbor.name}.`);
    }
    neighbor.strength += randInt(0, 3);
  }
}

function deathChance(person: Person, age: number): number {
  let base = 0;
  if (age > 75) base = 0.35;
  else if (age > 60) base = 0.06 + (age - 60) * 0.02;
  else if (age > 40) base = 0.01 + (age - 40) * 0.005;
  else base = 0.002;
  if (person.traits.includes("frail")) base *= 1.6;
  if (person.traits.includes("hale")) base *= 0.6;
  if (person.health < 30) base += 0.1;
  return clamp(base, 0, 0.9);
}

function handleSuccession(state: GameState): void {
  state.ruler.deathYear = state.year;
  state.deceased.push(state.ruler);
  log(state, "death", `${state.ruler.name} s'éteint à l'âge de ${state.year - state.ruler.birthYear} ans.`);

  if (state.heirs.length === 0) {
    state.phase = "gameover";
    log(state, "gameover", `La lignée des ${state.dynastyName} s'éteint faute d'héritier. Le royaume de ${state.kingdomName} tombe.`);
    return;
  }

  const sorted = [...state.heirs].sort((a, b) => a.birthYear - b.birthYear);
  const successor = sorted[0];
  state.heirs = state.heirs.filter((h) => h.id !== successor.id);
  state.ruler = successor;
  state.reignCount += 1;
  state.phase = "succession";
  log(
    state,
    "succession",
    `${successor.name} monte sur le trône de ${state.kingdomName}, ${state.reignCount}e souverain de la lignée des ${state.dynastyName}.`,
  );
}

function handleBirths(state: GameState): void {
  const age = state.year - state.ruler.birthYear;
  if (age < 16 || age > 50) return;
  if (state.heirs.length >= 5) return;
  if (!chance(0.12)) return;
  const child = createPerson(state, chance(0.5) ? "M" : "F", state.year, state.ruler.id);
  state.heirs.push(child);
  log(state, "birth", `Naissance de ${child.name}, enfant de ${state.ruler.name}.`);
}

export function processTurn(state: GameState): GameState {
  if (state.pendingEvent || state.phase !== "playing") return state;
  const s = structuredClone(state);

  s.year += 1;
  handleProduction(s);
  handleWars(s);

  const age = s.year - s.ruler.birthYear;
  if (chance(deathChance(s.ruler, age))) {
    handleSuccession(s);
    return s;
  }

  handleBirths(s);

  for (const neighbor of s.neighbors) {
    neighbor.relation = clamp(neighbor.relation + randInt(-2, 2), -100, 100);
  }

  const ctx: EventContext = { state: s };
  if (chance(0.5)) {
    const event = pickEvent(ctx);
    if (event) s.pendingEvent = { eventId: event.id };
  }

  return s;
}
