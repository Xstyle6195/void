import {
  EXPLORER_TITLES_FEMALE,
  EXPLORER_TITLES_MALE,
  FEMALE_NAMES,
  MALE_NAMES,
  MERCHANT_TITLES_FEMALE,
  MERCHANT_TITLES_MALE,
  PROSPECTOR_TITLES_FEMALE,
  PROSPECTOR_TITLES_MALE,
} from "./data";
import { findExpeditionTarget, revealAround, type TilePos } from "./mapPlacement";
import { SATISFACTION_START } from "./satisfaction";
import type {
  Ambition,
  ActiveExpedition,
  ExpeditionKind,
  ExpeditionOffer,
  GameState,
  Province,
  Sex,
} from "./types";
import { chance, clamp, log, nextId, pick, randInt, randomKingdomName } from "./utils";
import { getOrionWorld, isSettleable } from "./worldgen";

const MAX_OFFERS = 4;
const MAX_ACTIVE = 3;

interface AmbitionConfig {
  label: string;
  costMult: number;
  duration: number;
  successChance: number;
  revealRadius: number;
  minDist: number;
  maxDist: number;
}

const AMBITION_CONFIG: Record<Ambition, AmbitionConfig> = {
  1: {
    label: "Modeste",
    costMult: 1,
    duration: 1,
    successChance: 0.85,
    revealRadius: 3,
    minDist: 3,
    maxDist: 14,
  },
  2: {
    label: "Ambitieuse",
    costMult: 2.2,
    duration: 2,
    successChance: 0.7,
    revealRadius: 5,
    minDist: 10,
    maxDist: 28,
  },
  3: {
    label: "Légendaire",
    costMult: 4,
    duration: 3,
    successChance: 0.5,
    revealRadius: 8,
    minDist: 20,
    maxDist: 48,
  },
};

const BASE_COST: Record<ExpeditionKind, number> = {
  geographic: 50,
  mercantile: 70,
  resource: 55,
};

const COLONIZE_SURCHARGE = 90;
const COLONIZE_CHANCE: Record<Ambition, number> = { 1: 0.2, 2: 0.4, 3: 0.6 };

const DIRECTIONS = [
  "l'est",
  "le sud-est",
  "le sud",
  "le sud-ouest",
  "l'ouest",
  "le nord-ouest",
  "le nord",
  "le nord-est",
];

function directionFrom(capital: TilePos, target: TilePos): string {
  const angle = Math.atan2(target.y - capital.y, target.x - capital.x);
  const idx = (((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8);
  return DIRECTIONS[idx];
}

function playerCapital(state: GameState): TilePos {
  const capital = state.provinces.find((p) => p.kind === "capital");
  return capital ?? state.provinces[0] ?? { x: 0, y: 0 };
}

function explorerName(kind: ExpeditionKind): string {
  const sex: Sex = chance(0.5) ? "M" : "F";
  const name = sex === "M" ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
  let titles: string[];
  if (kind === "mercantile") titles = sex === "M" ? MERCHANT_TITLES_MALE : MERCHANT_TITLES_FEMALE;
  else if (kind === "resource")
    titles = sex === "M" ? PROSPECTOR_TITLES_MALE : PROSPECTOR_TITLES_FEMALE;
  else titles = sex === "M" ? EXPLORER_TITLES_MALE : EXPLORER_TITLES_FEMALE;
  return `${pick(titles)} ${name}`;
}

function buildGeographicOffer(state: GameState, id: string): ExpeditionOffer | null {
  const world = getOrionWorld();
  const ambition = (randInt(1, 3) as Ambition);
  const cfg = AMBITION_CONFIG[ambition];
  const known = new Set(state.knownTiles);
  const capital = playerCapital(state);
  const colonize = chance(COLONIZE_CHANCE[ambition]);
  const target = findExpeditionTarget(
    world,
    known,
    capital,
    cfg.minDist,
    cfg.maxDist,
    colonize,
  );
  if (!target) return null;
  const dir = directionFrom(capital, target);
  const cost = Math.round(BASE_COST.geographic * cfg.costMult) + (colonize ? COLONIZE_SURCHARGE : 0);
  return {
    id,
    kind: "geographic",
    explorerName: explorerName("geographic"),
    title: colonize ? `Expédition de colonisation vers ${dir}` : `Cartographier ${dir}`,
    description: colonize
      ? `Explorer les terres inconnues vers ${dir} et y fonder une colonie si elles se prêtent à l'installation.`
      : `Repousser les frontières de la carte connue vers ${dir} : montagnes, îles ou nouveaux rivages.`,
    cost,
    duration: cfg.duration,
    ambition,
    successChance: cfg.successChance,
    colonize,
    expiresYear: state.year + randInt(3, 5),
    targetX: target.x,
    targetY: target.y,
    neighborId: null,
    tradeLevel: 0,
    rewardGold: 0,
    rewardFood: 0,
    rewardPrestige: 2 * ambition,
  };
}

function buildMercantileOffer(state: GameState, id: string): ExpeditionOffer | null {
  const candidates = state.neighbors.filter((n) => !n.atWar && n.tradeRouteLevel < 3);
  if (candidates.length === 0) return null;
  const neighbor = pick(candidates);
  const ambition = (randInt(1, 3) as Ambition);
  const cfg = AMBITION_CONFIG[ambition];
  const cost = Math.round(BASE_COST.mercantile * cfg.costMult);
  return {
    id,
    kind: "mercantile",
    explorerName: explorerName("mercantile"),
    title: `Route commerciale avec ${neighbor.name}`,
    description: `Négocier et sécuriser une route commerciale ${cfg.label.toLowerCase()} avec ${neighbor.name}, source de revenus réguliers.`,
    cost,
    duration: cfg.duration,
    ambition,
    successChance: cfg.successChance,
    colonize: false,
    expiresYear: state.year + randInt(3, 5),
    targetX: neighbor.capitalX,
    targetY: neighbor.capitalY,
    neighborId: neighbor.id,
    tradeLevel: ambition,
    rewardGold: 0,
    rewardFood: 0,
    rewardPrestige: ambition,
  };
}

function buildResourceOffer(state: GameState, id: string): ExpeditionOffer | null {
  const world = getOrionWorld();
  const ambition = (randInt(1, 3) as Ambition);
  const cfg = AMBITION_CONFIG[ambition];
  const known = new Set(state.knownTiles);
  const capital = playerCapital(state);
  const colonize = chance(COLONIZE_CHANCE[ambition]);
  const target = findExpeditionTarget(
    world,
    known,
    capital,
    cfg.minDist,
    cfg.maxDist,
    true,
  );
  if (!target) return null;
  const dir = directionFrom(capital, target);
  const cost = Math.round(BASE_COST.resource * cfg.costMult) + (colonize ? COLONIZE_SURCHARGE : 0);
  return {
    id,
    kind: "resource",
    explorerName: explorerName("resource"),
    title: colonize ? `Exploiter des richesses vers ${dir}` : `Prospection vers ${dir}`,
    description: colonize
      ? `Fonder une colonie pour exploiter durablement un site riche en ressources vers ${dir}.`
      : `Ramener une cargaison de vivres et de richesses découvertes vers ${dir}.`,
    cost,
    duration: cfg.duration,
    ambition,
    successChance: cfg.successChance,
    colonize,
    expiresYear: state.year + randInt(3, 5),
    targetX: target.x,
    targetY: target.y,
    neighborId: null,
    tradeLevel: 0,
    rewardGold: colonize ? 0 : 30 * ambition + randInt(0, 20),
    rewardFood: colonize ? 0 : 20 * ambition + randInt(0, 15),
    rewardPrestige: ambition,
  };
}

function buildOffer(state: GameState, kind: ExpeditionKind, id: string): ExpeditionOffer | null {
  if (kind === "geographic") return buildGeographicOffer(state, id);
  if (kind === "mercantile") return buildMercantileOffer(state, id);
  return buildResourceOffer(state, id);
}

export function topUpExpeditionOffers(state: GameState): void {
  state.expeditionOffers = state.expeditionOffers.filter((o) => o.expiresYear > state.year);
  const kinds: ExpeditionKind[] = ["geographic", "mercantile", "resource"];
  let guard = 0;
  while (state.expeditionOffers.length < MAX_OFFERS && guard < 10) {
    guard += 1;
    const kind = pick(kinds);
    const offer = buildOffer(state, kind, nextId(state, "expedition"));
    if (offer) state.expeditionOffers.push(offer);
  }
}

export function launchExpedition(state: GameState, offerId: string): GameState {
  const s = structuredClone(state);
  if (s.activeExpeditions.length >= MAX_ACTIVE) return s;
  const offer = s.expeditionOffers.find((o) => o.id === offerId);
  if (!offer || s.resources.gold < offer.cost) return s;
  s.resources.gold -= offer.cost;
  s.expeditionOffers = s.expeditionOffers.filter((o) => o.id !== offerId);
  const active: ActiveExpedition = {
    id: nextId(s, "activeexp"),
    offer,
    departureYear: s.year,
    returnYear: s.year + offer.duration,
  };
  s.activeExpeditions.push(active);
  log(
    s,
    "expedition",
    `${offer.explorerName} part en expédition : ${offer.title.toLowerCase()}.`,
  );
  return s;
}

function resolveGeographic(s: GameState, offer: ExpeditionOffer): string {
  const world = getOrionWorld();
  const known = new Set(s.knownTiles);
  revealAround(known, world, offer.targetX, offer.targetY, AMBITION_CONFIG[offer.ambition].revealRadius);
  s.resources.prestige += offer.rewardPrestige;
  let text = `${offer.explorerName} revient triomphant : de nouvelles terres sont cartographiées.`;
  if (offer.colonize && isSettleable(world.tiles[offer.targetY][offer.targetX])) {
    const province: Province = {
      id: nextId(s, "province"),
      name: randomKingdomName(),
      kind: "colony",
      population: 30,
      buildings: [],
      foundedYear: s.year,
      x: offer.targetX,
      y: offer.targetY,
      satisfaction: SATISFACTION_START,
    };
    s.provinces.push(province);
    revealAround(known, world, offer.targetX, offer.targetY, 3);
    text += ` Une colonie est fondée : ${province.name}.`;
  }
  s.knownTiles = Array.from(known);
  return text;
}

function resolveMercantile(s: GameState, offer: ExpeditionOffer): string {
  const neighbor = s.neighbors.find((n) => n.id === offer.neighborId);
  if (!neighbor) return `${offer.explorerName} ne retrouve aucun partenaire commercial.`;
  neighbor.tradeRouteLevel = Math.max(neighbor.tradeRouteLevel, offer.tradeLevel);
  neighbor.relation = clamp(neighbor.relation + 10, -100, 100);
  s.resources.prestige += offer.rewardPrestige;
  return `${offer.explorerName} établit une route commerciale avec ${neighbor.name} (niveau ${neighbor.tradeRouteLevel}/3).`;
}

function resolveResource(s: GameState, offer: ExpeditionOffer): string {
  const world = getOrionWorld();
  const known = new Set(s.knownTiles);
  revealAround(known, world, offer.targetX, offer.targetY, 2);
  s.knownTiles = Array.from(known);
  s.resources.prestige += offer.rewardPrestige;
  if (offer.colonize && isSettleable(world.tiles[offer.targetY][offer.targetX])) {
    const province: Province = {
      id: nextId(s, "province"),
      name: randomKingdomName(),
      kind: "colony",
      population: 25,
      buildings: [],
      foundedYear: s.year,
      x: offer.targetX,
      y: offer.targetY,
      bonusGold: 3 * offer.ambition,
      bonusFood: 2 * offer.ambition,
      satisfaction: SATISFACTION_START,
    };
    s.provinces.push(province);
    return `${offer.explorerName} fonde une colonie d'exploitation : ${province.name}.`;
  }
  s.resources.gold += offer.rewardGold;
  s.resources.food += offer.rewardFood;
  return `${offer.explorerName} rapporte ${offer.rewardGold} or et ${offer.rewardFood} vivres.`;
}

export function resolveExpeditions(state: GameState): void {
  const due = state.activeExpeditions.filter((e) => e.returnYear <= state.year);
  if (due.length === 0) return;
  state.activeExpeditions = state.activeExpeditions.filter((e) => e.returnYear > state.year);
  for (const exp of due) {
    const offer = exp.offer;
    if (!chance(offer.successChance)) {
      log(
        state,
        "expedition",
        `${offer.explorerName} rentre bredouille : l'expédition a échoué.`,
      );
      continue;
    }
    let text: string;
    if (offer.kind === "geographic") text = resolveGeographic(state, offer);
    else if (offer.kind === "mercantile") text = resolveMercantile(state, offer);
    else text = resolveResource(state, offer);
    log(state, "expedition", text);
  }
}
