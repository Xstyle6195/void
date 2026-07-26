import { totalArmyPower, totalArmyUpkeep } from "./army";
import {
  BUILDINGS,
  FEMALE_NAMES,
  MALE_NAMES,
  NEIGHBOR_NAME_POOL,
  TRAITS,
} from "./data";
import { EVENTS, pickEvent, resolveChoice } from "./events";
import { resolveExpeditions, topUpExpeditionOffers } from "./expeditions";
import { CITIES_TO_CAPTURE, CLANS_TO_ABSORB, GOVERNMENT_MODIFIERS } from "./government";
import {
  buildTerritory,
  findExpansionTile,
  findNeighborCapital,
  findStartingCapital,
  revealAround,
} from "./mapPlacement";
import {
  checkGoals,
  expireStaleRequests,
  topUpGoals,
  topUpPoliticalRequests,
} from "./politics";
import {
  growthMultiplier,
  productionMultiplier,
  SATISFACTION_START,
  satisfactionTier,
} from "./satisfaction";
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
import { chance, clamp, log, nextId, pick, randInt, randomKingdomName } from "./utils";
import { getOrionWorld, WORLD_SCALE } from "./worldgen";

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
  fatherId: string | null,
  motherId: string | null,
): Person {
  const name = sex === "M" ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
  const person: Person = {
    id: nextId(state, "person"),
    name,
    sex,
    birthYear,
    deathYear: null,
    traits: randomTraits(randInt(1, 3)),
    stats: baseStats(),
    health: randInt(75, 100),
    fatherId,
    motherId,
    spouseId: null,
  };
  state.familyMembers.push(person);
  return person;
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
    familyMembers: [],
    provinces: [],
    resources: { gold: 80, food: 60, stability: 60, prestige: 5, research: 0 },
    neighbors: [],
    log: [],
    pendingEvent: null,
    phase: "playing",
    reignCount: 1,
    nextId: 0,
    knownTiles: [],
    expeditionOffers: [],
    activeExpeditions: [],
    army: {
      recruits: { land: 0, naval: 0, air: 0 },
      units: [],
      readinessBonus: 0,
      readinessExpiresYear: 0,
    },
    goals: [],
    politicalRequests: [],
    age: "medieval",
    researchedTechs: [],
    government: "clan",
    absorbedClans: 0,
    capturedCities: 0,
  };

  const founder = createPerson(state, "M", startYear - randInt(22, 35), null, null);
  state.ruler = founder;
  state.dynastyName = `${founder.name}ides`;
  state.kingdomName = randomKingdomName();

  const world = getOrionWorld();
  const capitalPos = findStartingCapital(world);

  const capital: Province = {
    id: nextId(state, "province"),
    name: state.kingdomName,
    kind: "capital",
    population: 200,
    buildings: ["hall"],
    foundedYear: startYear,
    x: capitalPos.x,
    y: capitalPos.y,
    satisfaction: SATISFACTION_START,
  };
  state.provinces.push(capital);

  const known = new Set<string>();
  revealAround(known, world, capitalPos.x, capitalPos.y, Math.round(4 * WORLD_SCALE));

  const neighborNames = [...NEIGHBOR_NAME_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
  const takenSpots = [capitalPos];
  for (const name of neighborNames) {
    const neighborCapital = findNeighborCapital(
      world,
      takenSpots,
      capitalPos,
      Math.round(6 * WORLD_SCALE),
      Math.round(16 * WORLD_SCALE),
    );
    takenSpots.push(neighborCapital);
    const territory = buildTerritory(
      world,
      neighborCapital,
      randInt(Math.round(3 * WORLD_SCALE), Math.round(6 * WORLD_SCALE)),
    );
    const neighbor: Neighbor = {
      id: nextId(state, "neighbor"),
      name,
      relation: randInt(-20, 30),
      strength: randInt(15, 35),
      atWar: false,
      isVassal: false,
      allied: false,
      tradeRouteLevel: 0,
      capitalX: neighborCapital.x,
      capitalY: neighborCapital.y,
      territory,
      alliesWith: [],
      rivalsWith: [],
      warWith: [],
    };
    state.neighbors.push(neighbor);
    for (const t of territory) revealAround(known, world, t.x, t.y, 1);
  }

  for (let i = 0; i < state.neighbors.length; i++) {
    for (let j = i + 1; j < state.neighbors.length; j++) {
      const a = state.neighbors[i];
      const b = state.neighbors[j];
      const roll = Math.random();
      if (roll < 0.3) {
        a.alliesWith.push(b.id);
        b.alliesWith.push(a.id);
      } else if (roll < 0.6) {
        a.rivalsWith.push(b.id);
        b.rivalsWith.push(a.id);
      }
    }
  }

  state.knownTiles = Array.from(known);
  topUpExpeditionOffers(state);
  topUpGoals(state);

  log(state, "province", `Fondation de ${state.kingdomName} par ${founder.name}, l'an ${startYear}.`);
  return state;
}

// ---- Player actions ----

export function provinceFoundingCost(state: GameState): number {
  return Math.round(
    (120 + state.provinces.length * 40) * GOVERNMENT_MODIFIERS[state.government].provinceCostMult,
  );
}

export function foundProvince(state: GameState): GameState {
  const s = structuredClone(state);
  const cost = provinceFoundingCost(s);
  if (s.resources.gold < cost) return s;
  const world = getOrionWorld();
  const spot = findExpansionTile(
    world,
    s.provinces.map((p) => ({ x: p.x, y: p.y })),
  );
  if (!spot) return s;
  s.resources.gold -= cost;
  const kind = s.provinces.length < 2 ? "town" : "frontier";
  const province: Province = {
    id: nextId(s, "province"),
    name: randomKingdomName(),
    kind,
    population: 40,
    buildings: [],
    foundedYear: s.year,
    x: spot.x,
    y: spot.y,
    satisfaction: SATISFACTION_START,
  };
  s.provinces.push(province);
  const known = new Set(s.knownTiles);
  revealAround(known, world, spot.x, spot.y, Math.round(3 * WORLD_SCALE));
  s.knownTiles = Array.from(known);
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
  if (buildingType.requiresTech && !s.researchedTechs.includes(buildingType.requiresTech)) {
    return s;
  }
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

const CONSEQUENCE_SHIFT = 15;

function propagateWarConsequences(state: GameState, target: Neighbor): void {
  for (const n of state.neighbors) {
    if (n.id === target.id) continue;
    if (target.alliesWith.includes(n.id)) {
      n.relation = clamp(n.relation - CONSEQUENCE_SHIFT, -100, 100);
      log(state, "diplomacy", `${n.name}, allié de ${target.name}, se méfie désormais de vous.`);
    } else if (target.rivalsWith.includes(n.id)) {
      n.relation = clamp(n.relation + CONSEQUENCE_SHIFT, -100, 100);
      log(state, "diplomacy", `${n.name}, rival de ${target.name}, se réjouit de votre offensive.`);
    }
  }
}

export function declareWar(state: GameState, neighborId: string): GameState {
  const s = structuredClone(state);
  const neighbor = s.neighbors.find((n) => n.id === neighborId);
  if (!neighbor || neighbor.atWar) return s;
  if (neighbor.allied) {
    neighbor.allied = false;
    log(s, "diplomacy", `L'alliance avec ${neighbor.name} est rompue par cette agression.`);
  }
  neighbor.atWar = true;
  neighbor.relation = clamp(neighbor.relation - 30, -100, 100);
  log(s, "war", `Guerre déclarée contre ${neighbor.name} !`);
  propagateWarConsequences(s, neighbor);
  return s;
}

const ATTACK_COST = 40;
const ATTACK_SURPRISE_BONUS = 10;

export function attackNeighbor(state: GameState, neighborId: string): GameState {
  const s = structuredClone(state);
  const neighbor = s.neighbors.find((n) => n.id === neighborId);
  if (!neighbor || neighbor.atWar) return s;
  if (totalArmyPower(s) <= 0 || s.resources.gold < ATTACK_COST) return s;
  s.resources.gold -= ATTACK_COST;
  if (neighbor.allied) {
    neighbor.allied = false;
    log(s, "diplomacy", `L'alliance avec ${neighbor.name} est rompue par cette agression.`);
  }
  neighbor.atWar = true;
  neighbor.relation = clamp(neighbor.relation - 30, -100, 100);
  log(s, "war", `${s.kingdomName} lance une offensive contre ${neighbor.name} !`);
  propagateWarConsequences(s, neighbor);
  resolveBattleRound(s, neighbor, totalMilitary(s), ATTACK_SURPRISE_BONUS);
  return s;
}

export function joinAllyWar(
  state: GameState,
  allyId: string,
  enemyId: string,
): GameState {
  const s = structuredClone(state);
  const ally = s.neighbors.find((n) => n.id === allyId);
  const enemy = s.neighbors.find((n) => n.id === enemyId);
  if (!ally || !enemy || !ally.allied || enemy.atWar) return s;
  if (!enemy.warWith.includes(ally.id)) return s;
  enemy.atWar = true;
  enemy.relation = clamp(enemy.relation - 25, -100, 100);
  ally.relation = clamp(ally.relation + 20, -100, 100);
  log(
    s,
    "war",
    `${s.kingdomName} rejoint ${ally.name} dans sa guerre contre ${enemy.name} !`,
  );
  propagateWarConsequences(s, enemy);
  return s;
}

export function formAlliance(state: GameState, neighborId: string): GameState {
  const s = structuredClone(state);
  const neighbor = s.neighbors.find((n) => n.id === neighborId);
  if (!neighbor || neighbor.atWar || neighbor.allied || neighbor.relation < 40) return s;
  neighbor.allied = true;
  neighbor.relation = clamp(neighbor.relation + 10, -100, 100);
  log(
    s,
    "diplomacy",
    `Une alliance est scellée avec ${neighbor.name} : libre passage et soutien mutuel.`,
  );
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

const MARRIAGE_COST = 50;
const DOWRY_CHANCE = 0.35;
export const MIN_MARRIAGE_AGE = 18;

function findMarriageable(state: GameState, personId: string): Person | null {
  if (state.ruler.id === personId) return state.ruler;
  return state.heirs.find((h) => h.id === personId) ?? null;
}

function tryDowryLand(s: GameState, neighbor: Neighbor): string | null {
  const giftable = neighbor.territory.filter(
    (t) => !(t.x === neighbor.capitalX && t.y === neighbor.capitalY),
  );
  if (giftable.length === 0) return null;
  const tile = giftable[randInt(0, giftable.length - 1)];
  neighbor.territory = neighbor.territory.filter((t) => t !== tile);
  const province: Province = {
    id: nextId(s, "province"),
    name: randomKingdomName(),
    kind: "frontier",
    population: 35,
    buildings: [],
    foundedYear: s.year,
    x: tile.x,
    y: tile.y,
    satisfaction: SATISFACTION_START,
  };
  s.provinces.push(province);
  const known = new Set(s.knownTiles);
  revealAround(known, getOrionWorld(), tile.x, tile.y, Math.round(2 * WORLD_SCALE));
  s.knownTiles = Array.from(known);
  return province.name;
}

export function proposeMarriage(
  state: GameState,
  personId: string,
  neighborId: string,
): GameState {
  const s = structuredClone(state);
  const neighbor = s.neighbors.find((n) => n.id === neighborId);
  if (!neighbor || neighbor.atWar || neighbor.relation < -20) return s;
  const person = findMarriageable(s, personId);
  if (!person || person.spouseId) return s;
  if (s.year - person.birthYear < MIN_MARRIAGE_AGE) return s;
  if (s.resources.gold < MARRIAGE_COST) return s;
  s.resources.gold -= MARRIAGE_COST;

  const spouseSex: Sex = person.sex === "M" ? "F" : "M";
  const spouse = createPerson(s, spouseSex, s.year - randInt(MIN_MARRIAGE_AGE, 32), null, null);
  spouse.spouseId = person.id;
  person.spouseId = spouse.id;

  const wasAllied = neighbor.allied;
  neighbor.allied = true;
  neighbor.relation = clamp(neighbor.relation + 40, -100, 100);
  s.resources.prestige += 8;

  let text = `${person.name} épouse ${spouse.name} de la maison de ${neighbor.name}, scellant une alliance${wasAllied ? "" : " nouvelle"}.`;
  if (chance(DOWRY_CHANCE)) {
    const landName = tryDowryLand(s, neighbor);
    if (landName) {
      text += ` En dot, ${neighbor.name} cède les terres de ${landName}.`;
    }
  }
  log(s, "marriage", text);
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

function provinceDefense(province: Province): number {
  return province.buildings.reduce((sum, b) => sum + (BUILDINGS[b].effects.defense ?? 0), 0);
}

function totalMilitary(state: GameState): number {
  const rulerStats = statsWithTraits(state.ruler);
  let military = rulerStats.martial * 2;
  for (const p of state.provinces) {
    if (p.buildings.includes("barracks")) military += 6;
    if (p.buildings.includes("walls")) military += 3;
    military += Math.floor(p.population / 50);
  }
  for (const n of state.neighbors) {
    if (n.allied && !n.atWar) military += Math.round(n.strength * 0.15);
  }
  military += totalArmyPower(state);
  return Math.round(military * GOVERNMENT_MODIFIERS[state.government].militaryPowerMult);
}

function handleProduction(state: GameState): void {
  let food = 10;
  let gold = 10;
  let research = 0;
  const govMods = GOVERNMENT_MODIFIERS[state.government];
  for (const p of state.provinces) {
    let pFood = Math.floor(p.population / 20) + (p.bonusFood ?? 0);
    let pGold = Math.floor(p.population / 30) + (p.bonusGold ?? 0);
    let pResearch = 0;
    let growthRate = 0.03;
    let localStabilityEffect = 0;
    for (const b of p.buildings) {
      const effects = BUILDINGS[b].effects;
      pFood += effects.food ?? 0;
      pGold += effects.gold ?? 0;
      pResearch += effects.research ?? 0;
      growthRate += effects.populationGrowth ?? 0;
      localStabilityEffect += effects.stability ?? 0;
      state.resources.stability = clamp(
        state.resources.stability + (effects.stability ?? 0) * 0.1,
        0,
        100,
      );
      state.resources.prestige += (effects.prestige ?? 0) * 0.1 * govMods.prestigeMult;
    }

    const rawTier = satisfactionTier(p.satisfaction);
    const tier = govMods.capHappiness && rawTier === "delighted" ? "content" : rawTier;
    food += Math.round(pFood * productionMultiplier(tier));
    gold += Math.round(pGold * productionMultiplier(tier));
    research += Math.round(pResearch * productionMultiplier(tier) * govMods.researchMult);
    p.population += Math.max(
      1,
      Math.floor(p.population * growthRate * growthMultiplier(tier) * govMods.populationGrowthMult),
    );

    p.satisfaction = clamp(
      p.satisfaction +
        (state.resources.stability - p.satisfaction) * 0.06 +
        localStabilityEffect * 0.15 +
        randInt(-1, 1),
      0,
      100,
    );
  }
  const upkeep = Math.floor(state.provinces.length * 5 + state.resources.food * 0.15);
  state.resources.food = Math.max(0, state.resources.food + food - upkeep);
  const tradeBonus = Math.round(state.neighbors.filter((n) => n.allied).length * 8 * govMods.tradeGoldMult);
  const routeBonus = Math.round(
    state.neighbors
      .filter((n) => !n.atWar)
      .reduce((sum, n) => sum + n.tradeRouteLevel * 6, 0) * govMods.tradeGoldMult,
  );
  const armyUpkeep = totalArmyUpkeep(state);
  state.resources.gold = Math.max(
    0,
    state.resources.gold + gold + tradeBonus + routeBonus - armyUpkeep,
  );
  if (state.resources.food === 0) {
    state.resources.stability = clamp(state.resources.stability - 5, 0, 100);
  }
  state.resources.stability = clamp(state.resources.stability + govMods.stabilityDrift, 0, 100);
  state.resources.research = Math.max(0, state.resources.research + research);
}

function resolveBattleRound(
  state: GameState,
  neighbor: Neighbor,
  myMilitary: number,
  bonus: number,
): void {
  const roll = myMilitary + bonus + randInt(-10, 10) - (neighbor.strength + randInt(-10, 10));
  if (roll > 8) {
    state.resources.prestige += 3;
    state.resources.gold += 20;
    neighbor.strength = Math.max(5, neighbor.strength - 3);
    log(state, "war", `Victoire contre ${neighbor.name} ! Butin et prestige gagnés.`);

    // les cases hors capitale sont prises en priorité ; la capitale ne tombe
    // qu'en dernier, scellant l'absorption complète du voisin
    const outskirts = neighbor.territory.filter(
      (t) => !(t.x === neighbor.capitalX && t.y === neighbor.capitalY),
    );
    const capturable = outskirts.length > 0 ? outskirts : neighbor.territory;
    if (capturable.length > 0 && chance(0.3)) {
      const tile = pick(capturable);
      neighbor.territory = neighbor.territory.filter((t) => t !== tile);
      const province: Province = {
        id: nextId(state, "province"),
        name: randomKingdomName(),
        kind: "frontier",
        population: 35,
        buildings: [],
        foundedYear: state.year,
        x: tile.x,
        y: tile.y,
        satisfaction: SATISFACTION_START,
      };
      state.provinces.push(province);
      state.capturedCities += 1;
      log(
        state,
        "war",
        `${state.kingdomName} s'empare d'une ville de ${neighbor.name} : ${province.name} rejoint le royaume !`,
      );
      if (neighbor.territory.length === 0) {
        state.absorbedClans += 1;
        state.neighbors = state.neighbors.filter((n) => n.id !== neighbor.id);
        log(state, "war", `${neighbor.name} est entièrement absorbé par ${state.kingdomName} !`);
        return;
      }
    }

    if (chance(0.2)) {
      neighbor.atWar = false;
      neighbor.relation = -20;
      log(state, "peace", `${neighbor.name} capitule et demande la paix.`);
    }
  } else if (roll < -8) {
    state.resources.stability = clamp(state.resources.stability - 6, 0, 100);
    state.resources.gold = Math.max(0, state.resources.gold - 15);
    const vulnerable = state.provinces.filter((p) => p.kind !== "capital");
    const target = vulnerable.length > 0 ? pick(vulnerable) : null;
    const captureChance = target ? clamp(0.22 - provinceDefense(target) * 0.006, 0.02, 0.22) : 0;
    if (target && chance(captureChance)) {
      state.provinces = state.provinces.filter((p) => p.id !== target.id);
      log(state, "war", `${neighbor.name} s'empare de la province de ${target.name} !`);
    } else {
      log(state, "war", `Défaite face à ${neighbor.name}. Les défenses tiennent bon.`);
    }
  } else {
    log(state, "war", `Aucun camp ne prend l'avantage face à ${neighbor.name}.`);
  }
  neighbor.strength += randInt(0, 3);
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
    resolveBattleRound(state, neighbor, myMilitary, 0);
  }
}

function handleGovernmentProgress(state: GameState): void {
  if (state.government === "clan" && state.absorbedClans >= CLANS_TO_ABSORB) {
    state.government = "kingdom";
    log(
      state,
      "politics",
      `${state.kingdomName} unifie les clans conquis sous une seule bannière : le royaume est proclamé !`,
    );
  }
  if (
    state.government === "kingdom" &&
    state.researchedTechs.includes("steam_dawn") &&
    state.capturedCities >= CITIES_TO_CAPTURE
  ) {
    state.government = "empire";
    log(
      state,
      "politics",
      `Fort de ses conquêtes et de son industrie naissante, ${state.kingdomName} devient un Empire !`,
    );
  }
}

function handleNeighborPolitics(state: GameState): void {
  for (let i = 0; i < state.neighbors.length; i++) {
    for (let j = i + 1; j < state.neighbors.length; j++) {
      const a = state.neighbors[i];
      const b = state.neighbors[j];
      if (a.warWith.includes(b.id)) {
        if (chance(0.15)) {
          a.warWith = a.warWith.filter((id) => id !== b.id);
          b.warWith = b.warWith.filter((id) => id !== a.id);
          log(state, "peace", `${a.name} et ${b.name} signent la paix.`);
        }
      } else if (a.rivalsWith.includes(b.id) && chance(0.05)) {
        a.warWith.push(b.id);
        b.warWith.push(a.id);
        log(state, "war", `${a.name} déclare la guerre à ${b.name} !`);
      }
    }
  }
}

const SECESSION_CHANCE = 0.08;
const REVOLUTION_CHANCE = 0.05;

function handleUnrest(state: GameState): boolean {
  const unrestResistance = GOVERNMENT_MODIFIERS[state.government].unrestResistanceMult;
  for (const p of [...state.provinces]) {
    if (p.kind === "capital") continue;
    if (satisfactionTier(p.satisfaction) !== "furious") continue;
    if (!chance(SECESSION_CHANCE * unrestResistance)) continue;
    state.provinces = state.provinces.filter((x) => x.id !== p.id);
    if (state.neighbors.length > 0 && chance(0.5)) {
      const neighbor = pick(state.neighbors);
      neighbor.territory.push({ x: p.x, y: p.y });
      log(state, "revolt", `${p.name} se soulève et rallie le royaume de ${neighbor.name} !`);
    } else {
      log(state, "revolt", `${p.name} se soulève et proclame son indépendance !`);
    }
  }

  if (
    satisfactionTier(state.resources.stability) === "furious" &&
    chance(REVOLUTION_CHANCE * unrestResistance)
  ) {
    log(state, "revolt", "Le mécontentement général dégénère en révolte ouverte !");
    handleSuccession(
      state,
      `${state.ruler.name} est renversé(e) par la colère du peuple après ${state.year - state.ruler.birthYear} ans de règne.`,
    );
    return true;
  }
  return false;
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

function handleSuccession(
  state: GameState,
  departureText?: string,
): void {
  state.ruler.deathYear = state.year;
  state.deceased.push(state.ruler);
  log(
    state,
    "death",
    departureText ??
      `${state.ruler.name} s'éteint à l'âge de ${state.year - state.ruler.birthYear} ans.`,
  );

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
  if (!state.ruler.spouseId) return;
  if (state.heirs.length >= 5) return;
  if (!chance(0.18)) return;
  const fatherId = state.ruler.sex === "M" ? state.ruler.id : state.ruler.spouseId;
  const motherId = state.ruler.sex === "F" ? state.ruler.id : state.ruler.spouseId;
  const child = createPerson(state, chance(0.5) ? "M" : "F", state.year, fatherId, motherId);
  state.heirs.push(child);
  log(state, "birth", `Naissance de ${child.name}, enfant de ${state.ruler.name}.`);
}

export function processTurn(state: GameState): GameState {
  if (state.pendingEvent || state.phase !== "playing") return state;
  const s = structuredClone(state);

  s.year += 1;
  handleProduction(s);
  handleWars(s);
  handleGovernmentProgress(s);
  handleNeighborPolitics(s);
  resolveExpeditions(s);
  topUpExpeditionOffers(s);
  checkGoals(s);
  topUpPoliticalRequests(s);
  expireStaleRequests(s);

  if (handleUnrest(s)) {
    return s;
  }

  const age = s.year - s.ruler.birthYear;
  if (chance(deathChance(s.ruler, age))) {
    handleSuccession(s);
    return s;
  }

  handleBirths(s);

  const embassyBonus = s.provinces.reduce(
    (sum, p) => sum + p.buildings.reduce((s2, b) => s2 + (BUILDINGS[b].effects.relationBonus ?? 0), 0),
    0,
  );
  const rulerDiplomacyDrift = Math.round((statsWithTraits(s.ruler).diplomacy - 10) / 4);
  const governmentRelationDrift = GOVERNMENT_MODIFIERS[s.government].relationDrift;
  for (const neighbor of s.neighbors) {
    neighbor.relation = clamp(
      neighbor.relation + randInt(-2, 2) + embassyBonus + rulerDiplomacyDrift + governmentRelationDrift,
      -100,
      100,
    );
  }

  const ctx: EventContext = { state: s };
  if (chance(0.5)) {
    const event = pickEvent(ctx);
    if (event) s.pendingEvent = { eventId: event.id };
  }

  return s;
}
