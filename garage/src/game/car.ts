import { MODEL_BY_ID, PARTS, PART_BY_ID, SWAP_BY_ID, VARIANT_BY_ID } from "./data";
import type { Car, CarModel, Domain, EngineSwapDef, GameState, PartId, PartState, VariantDef } from "./types";
import { clamp, round10 } from "./utils";

export const CURRENT_YEAR = 2026;

export function modelOf(car: Car): CarModel {
  return MODEL_BY_ID[car.modelId];
}

export function carName(car: Car): string {
  const m = modelOf(car);
  return `${m.brand} ${m.name}`;
}

export function isCollectible(model: CarModel): boolean {
  return model.year <= 2000 && model.rarity >= 2;
}

export function costFactor(model: CarModel): number {
  return clamp(Math.pow(model.refValue / 25000, 0.6), 0.6, 5);
}

export function partOriginality(p: PartState): number {
  return p.origin === "original" ? 100 : p.origin === "oem" ? 85 : 0;
}

export interface CarStats {
  power: number;
  handling: number;
  luxe: number;
  style: number;
  condition: number;
  originality: number;
  perf: number;
  base: { power: number; handling: number; luxe: number; style: number; perf: number };
  domainCondition: Record<Domain, number>;
}

function perfScore(power: number, weight: number, handling: number): number {
  const pw = (power / weight) * 1000;
  return clamp(Math.round(0.55 * Math.min(100, pw / 5) + 0.45 * handling), 0, 100);
}

function avgCondition(car: Car, ids: PartId[]): number {
  let total = 0;
  let w = 0;
  for (const id of ids) {
    const def = PART_BY_ID[id];
    total += car.parts[id].condition * def.weight;
    w += def.weight;
  }
  return w ? total / w : 0;
}

export function computeStats(car: Car): CarStats {
  const m = modelOf(car);
  let powerPct = 0;
  let handling = 0;
  let luxe = 0;
  let style = 0;
  for (const def of PARTS) {
    const p = car.parts[def.id];
    if (!p.variantId) continue;
    const v = VARIANT_BY_ID[p.variantId];
    if (!v) continue;
    powerPct += v.effects.powerPct ?? 0;
    handling += v.effects.handling ?? 0;
    luxe += v.effects.luxe ?? 0;
    style += v.effects.style ?? 0;
  }
  const engine = car.parts.moteur;
  const swap = engine.variantId ? SWAP_BY_ID[engine.variantId] : undefined;
  const basePowerNow = swap ? swap.power : m.basePower;
  const motorFactor = 0.55 + 0.45 * Math.min(1, engine.condition / 75);
  const gearFactor = 0.9 + 0.1 * Math.min(1, car.parts.transmission.condition / 60);
  const power = Math.round(basePowerNow * (1 + powerPct) * motorFactor * gearFactor);

  const chassisCond = avgCondition(car, ["suspension", "freins", "jantes"]);
  const handlingVal = clamp(Math.round((m.baseHandling + handling) * (0.6 + 0.4 * Math.min(1, chassisCond / 70))), 0, 100);

  const interiorCond = avgCondition(car, ["sieges", "tableau", "sellerie", "electronique"]);
  const luxeVal = clamp(Math.round((m.baseLuxe + luxe) * (0.4 + 0.6 * (interiorCond / 100))), 0, 100);

  const bodyCond = avgCondition(car, ["caisse", "peinture", "boucliers", "optiques"]);
  const styleVal = clamp(Math.round((m.baseStyle + style) * (0.35 + 0.65 * Math.min(1, bodyCond / 90))), 0, 100);

  let condTotal = 0;
  let origTotal = 0;
  let wTotal = 0;
  const domainAcc: Record<Domain, { t: number; w: number }> = {
    mecanique: { t: 0, w: 0 },
    carrosserie: { t: 0, w: 0 },
    interieur: { t: 0, w: 0 },
  };
  for (const def of PARTS) {
    const p = car.parts[def.id];
    condTotal += p.condition * def.weight;
    origTotal += partOriginality(p) * def.weight;
    wTotal += def.weight;
    domainAcc[def.domain].t += p.condition * def.weight;
    domainAcc[def.domain].w += def.weight;
  }

  return {
    power,
    handling: handlingVal,
    luxe: luxeVal,
    style: styleVal,
    condition: Math.round(condTotal / wTotal),
    originality: Math.round(origTotal / wTotal),
    perf: perfScore(power, m.weight, handlingVal),
    base: {
      power: m.basePower,
      handling: m.baseHandling,
      luxe: m.baseLuxe,
      style: m.baseStyle,
      perf: perfScore(m.basePower, m.weight, m.baseHandling),
    },
    domainCondition: {
      mecanique: Math.round(domainAcc.mecanique.t / domainAcc.mecanique.w),
      carrosserie: Math.round(domainAcc.carrosserie.t / domainAcc.carrosserie.w),
      interieur: Math.round(domainAcc.interieur.t / domainAcc.interieur.w),
    },
  };
}

export type CarLabel = "Pièce de collection" | "Restomod" | "Préparation d'exception" | "Épave";

export function carLabels(car: Car, stats = computeStats(car)): CarLabel[] {
  const m = modelOf(car);
  const labels: CarLabel[] = [];
  const perfGain = stats.perf - stats.base.perf;
  const luxeGain = stats.luxe - stats.base.luxe;
  const styleGain = stats.style - stats.base.style;
  if (isCollectible(m)) {
    if (stats.originality >= 85 && stats.condition >= 90) labels.push("Pièce de collection");
    else if (stats.condition >= 85 && stats.originality < 85 && (perfGain >= 15 || luxeGain >= 15)) labels.push("Restomod");
  } else if (stats.condition >= 95 && (perfGain >= 12 || luxeGain >= 12 || styleGain >= 15)) {
    labels.push("Préparation d'exception");
  }
  if (stats.condition < 35) labels.push("Épave");
  return labels;
}

/** Valeur des pièces non d'origine installées (préparations, swap). */
export function upgradesValue(car: Car): number {
  const m = modelOf(car);
  let total = 0;
  for (const def of PARTS) {
    const p = car.parts[def.id];
    if (!p.variantId) continue;
    const v = VARIANT_BY_ID[p.variantId];
    const s = SWAP_BY_ID[p.variantId];
    const cost = v ? variantCost(m, v) : s ? swapCost(m, s) : 0;
    total += cost * (p.condition / 100);
  }
  return total;
}

/** Cote estimée sur le marché. */
export function marketValue(car: Car, stats = computeStats(car)): number {
  const m = modelOf(car);
  const labels = carLabels(car, stats);
  const condFactor = 0.12 + 0.88 * Math.pow(stats.condition / 100, 1.7);
  const collectible = isCollectible(m);
  let origFactor = collectible ? 0.55 + 0.45 * (stats.originality / 100) : 1;
  let upgradeCoef = collectible ? 0.4 : 0.6;
  let bonus = 1;
  if (labels.includes("Pièce de collection")) bonus = 1.15 + 0.07 * m.rarity;
  if (labels.includes("Restomod")) {
    origFactor = Math.max(origFactor, 0.85);
    upgradeCoef = 0.8;
  }
  if (labels.includes("Préparation d'exception")) {
    upgradeCoef = 0.9;
    bonus = 1.08;
  }
  const value = (m.refValue * condFactor * origFactor + upgradesValue(car) * upgradeCoef) * bonus;
  return round10(value);
}

// ——— Coûts des opérations ———

export function restoreCap(state: GameState, partId: PartId): number {
  const pro = state.upgrades.includes("outillagePro");
  if (partId === "peinture") return state.upgrades.includes("cabinePeinture") ? 100 : pro ? 92 : 85;
  return pro ? 98 : 90;
}

export function restoreHours(state: GameState, partId: PartId, condition: number): number {
  const def = PART_BY_ID[partId];
  const pro = state.upgrades.includes("outillagePro") ? 0.75 : 1;
  return Math.max(1, Math.round(def.restoreHours * (0.3 + 0.7 * (1 - condition / 100)) * pro));
}

export function restoreCost(model: CarModel, partId: PartId, condition: number): number {
  const def = PART_BY_ID[partId];
  return round10(def.baseCost * costFactor(model) * 0.22 * (1 - condition / 100) + 20);
}

export function oemCost(model: CarModel, partId: PartId): number {
  const def = PART_BY_ID[partId];
  const rarityMult = isCollectible(model) ? 1 + 0.3 * (model.rarity - 1) : 1;
  return round10(def.baseCost * costFactor(model) * rarityMult);
}

export function oemHours(partId: PartId): number {
  return PART_BY_ID[partId].replaceHours;
}

export function variantCost(model: CarModel, v: VariantDef): number {
  const def = PART_BY_ID[v.part];
  return round10(def.baseCost * v.costMult * Math.sqrt(costFactor(model)));
}

export function swapCost(model: CarModel, s: EngineSwapDef): number {
  return round10(s.cost + 1500 * Math.sqrt(costFactor(model)));
}

export function partStatusLabel(p: PartState): string {
  if (p.origin === "original") return "D'origine";
  if (p.origin === "oem") return "Pièce d'origine neuve";
  if (!p.variantId) return "Pièce adaptable";
  const v = VARIANT_BY_ID[p.variantId];
  if (v) return v.label;
  const s = SWAP_BY_ID[p.variantId];
  if (s) return `Swap : ${s.label}`;
  return "Modifiée";
}
