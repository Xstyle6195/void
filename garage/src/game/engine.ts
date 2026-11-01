import {
  BASE_HOURS,
  BAY_COSTS,
  CHANNELS,
  FIRST_NAMES,
  INSPECT_HOURS,
  LAST_NAMES,
  MAX_MECHANICS,
  MECHANIC_HIRE_COST,
  MECHANIC_HOURS,
  MECHANIC_SALARY,
  MODELS,
  MODEL_BY_ID,
  PARTS,
  PROFILE_LABELS,
  RENT,
  REP_TITLES,
  SELLERS,
  SWAP_BY_ID,
  UPGRADES,
  VARIANT_BY_ID,
} from "./data";
import {
  CURRENT_YEAR,
  carLabels,
  carName,
  computeStats,
  isCollectible,
  marketValue,
  modelOf,
  oemCost,
  oemHours,
  restoreCap,
  restoreCost,
  restoreHours,
  swapCost,
  variantCost,
} from "./car";
import type {
  BuyerProfile,
  Car,
  CarModel,
  ClientOrder,
  GameState,
  MarketListing,
  Offer,
  OrderCriteria,
  PartId,
  PartState,
  SaleChannel,
  UpgradeId,
} from "./types";
import { clamp, pick, rand, randInt, round10, roundTo, weightedPick } from "./utils";

const MARKET_SIZE = 8;

// ——— Utilitaires d'état ———

function clone(state: GameState): GameState {
  return structuredClone(state);
}

function uid(state: GameState, prefix: string): string {
  state.nextId += 1;
  return `${prefix}${state.nextId}`;
}

function log(state: GameState, text: string, tone?: "good" | "bad" | "info"): void {
  state.log.unshift({ week: state.week, text, tone });
  if (state.log.length > 120) state.log.length = 120;
}

function personName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

export function repTitle(rep: number): string {
  let title = REP_TITLES[0].title;
  for (const t of REP_TITLES) if (rep >= t.min) title = t.title;
  return title;
}

export function weeklyHours(state: GameState): number {
  return BASE_HOURS + state.mechanics * MECHANIC_HOURS;
}

export function weeklyCosts(state: GameState): number {
  return RENT + state.mechanics * MECHANIC_SALARY + (state.bays - 2) * 150;
}

export function occupiedBays(state: GameState): number {
  return state.cars.filter((c) => c.status !== "collection").length;
}

export function freeBays(state: GameState): number {
  return state.bays - occupiedBays(state);
}

// ——— Génération de voitures ———

function makeCar(state: GameState, model: CarModel, quality: number, isNew: boolean): Car {
  const color = pick(model.colors);
  const parts = {} as Record<PartId, PartState>;
  const collectible = isCollectible(model);
  for (const def of PARTS) {
    if (isNew) {
      parts[def.id] = { condition: 100, origin: "original" };
      continue;
    }
    const condition = Math.round(clamp(quality * 100 + rand(-28, 22), 3, 97));
    let origin: PartState["origin"] = "original";
    const r = Math.random();
    if (collectible && r < 0.14) origin = "aftermarket";
    else if (r < 0.3) origin = "oem";
    parts[def.id] = { condition, origin };
  }
  const age = Math.max(0, CURRENT_YEAR - model.year);
  const km = isNew ? randInt(5, 50) : roundTo(age * rand(5000, 16000) * (1.3 - quality * 0.6), 100);
  return {
    id: uid(state, "car"),
    modelId: model.id,
    km,
    color,
    originalColor: color,
    parts,
    purchasePrice: 0,
    invested: 0,
    boughtWeek: state.week,
    status: "atelier",
    offers: [],
    history: [],
  };
}

function averageCondition(car: Car): number {
  return computeStats(car).condition;
}

function generateListing(state: GameState): MarketListing {
  const pool = MODELS.filter((m) => m.repRequired <= state.reputation + 20);
  const model = weightedPick(pool, (m) => {
    const dup = state.market.filter((l) => l.car.modelId === m.id).length;
    const base = 7 - m.rarity + (m.repRequired > state.reputation ? -2 : 0) - (m.year === CURRENT_YEAR ? 2 : 0);
    return base / (1 + dup * 3);
  });
  const isNew = model.year === CURRENT_YEAR;
  let tag: MarketListing["tag"];
  let quality = rand(0.25, 0.85);
  if (isNew) tag = "neuve";
  else if (isCollectible(model) && Math.random() < 0.15) {
    tag = "sortie-de-grange";
    quality = rand(0.08, 0.3);
  }
  const car = makeCar(state, model, quality, isNew);
  const value = marketValue(car);
  let price: number;
  let seller = pick(SELLERS.filter((s) => s !== "Concession officielle" && s !== "Agriculteur (grange)"));
  if (isNew) {
    price = round10(model.refValue * rand(0.95, 1.0));
    seller = "Concession officielle";
  } else if (tag === "sortie-de-grange") {
    price = round10(value * rand(0.75, 0.95));
    seller = "Agriculteur (grange)";
  } else if (Math.random() < 0.15) {
    tag = "bonne-affaire";
    price = round10(value * rand(0.68, 0.8));
  } else {
    price = round10(value * rand(0.92, 1.18));
  }
  price = Math.max(price, 500);
  const actual = averageCondition(car);
  const claimed = isNew ? 100 : clamp(Math.round(actual + rand(0, 18)), 0, 100);
  return {
    id: uid(state, "lst"),
    car,
    price,
    claimedCondition: claimed,
    inspected: isNew,
    week: state.week,
    tag,
    seller,
  };
}

function refreshMarket(state: GameState): void {
  state.market = state.market.filter((l) => state.week - l.week < 3 && Math.random() > 0.25);
  while (state.market.length < MARKET_SIZE) state.market.push(generateListing(state));
}

// ——— Création de partie ———

export function createInitialState(): GameState {
  const state: GameState = {
    week: 1,
    money: 15000,
    reputation: 0,
    hoursLeft: BASE_HOURS,
    mechanics: 0,
    bays: 2,
    upgrades: [],
    cars: [],
    market: [],
    orders: [],
    sold: [],
    log: [],
    debtWeeks: 0,
    gameOver: false,
    nextId: 0,
  };
  refreshMarket(state);
  // Garantit une première voiture abordable sur le marché.
  const starter = makeCar(state, MODEL_BY_ID["rollin-petale-98"], rand(0.35, 0.55), false);
  const starterValue = marketValue(starter);
  state.market[0] = {
    id: uid(state, "lst"),
    car: starter,
    price: round10(starterValue * 0.9),
    claimedCondition: clamp(averageCondition(starter) + 10, 0, 100),
    inspected: false,
    week: 1,
    seller: "Particulier",
    tag: "bonne-affaire",
  };
  generateOrders(state, 2);
  log(state, "Vous ouvrez votre atelier de préparation avec 15 000 € en poche. À vous de bâtir votre légende !", "info");
  return state;
}

// ——— Marché (achat) ———

export function inspectListing(prev: GameState, listingId: string): GameState {
  const state = clone(prev);
  const l = state.market.find((x) => x.id === listingId);
  if (!l || l.inspected || state.hoursLeft < INSPECT_HOURS) return prev;
  state.hoursLeft -= INSPECT_HOURS;
  l.inspected = true;
  const real = averageCondition(l.car);
  const gap = l.claimedCondition - real;
  log(
    state,
    `Inspection de la ${carName(l.car)} : état réel ${real} %${gap >= 8 ? ` (le vendeur annonçait ${l.claimedCondition} %…)` : ""}.`,
    gap >= 8 ? "bad" : "info",
  );
  return state;
}

export function buyBlockReason(state: GameState, l: MarketListing): string | null {
  const m = modelOf(l.car);
  if (m.repRequired > state.reputation) return `Réputation ${m.repRequired} requise`;
  if (freeBays(state) <= 0) return "Aucune place libre à l'atelier";
  if (state.money < l.price) return "Fonds insuffisants";
  return null;
}

export function buyListing(prev: GameState, listingId: string): GameState {
  const l = prev.market.find((x) => x.id === listingId);
  if (!l || buyBlockReason(prev, l)) return prev;
  const state = clone(prev);
  const listing = state.market.find((x) => x.id === listingId)!;
  state.market = state.market.filter((x) => x.id !== listingId);
  state.money -= listing.price;
  const car = listing.car;
  car.purchasePrice = listing.price;
  car.boughtWeek = state.week;
  car.history.push(`S${state.week} — Achat (${listing.seller}) pour ${listing.price.toLocaleString("fr-FR")} €`);
  state.cars.push(car);
  log(state, `Achat de la ${carName(car)} ${modelOf(car).year} pour ${listing.price.toLocaleString("fr-FR")} €.`);
  return state;
}

// ——— Conception (atelier) ———

function editableCar(state: GameState, carId: string): Car | undefined {
  const car = state.cars.find((c) => c.id === carId);
  if (!car || car.status !== "atelier") return undefined;
  return car;
}

export interface OpCheck {
  cost: number;
  hours: number;
  reason: string | null;
}

export function checkRestore(state: GameState, car: Car, partId: PartId): OpCheck {
  const p = car.parts[partId];
  const m = modelOf(car);
  const cost = restoreCost(m, partId, p.condition);
  const hours = restoreHours(state, partId, p.condition);
  let reason: string | null = null;
  if (p.condition < 15) reason = "Irrécupérable : à remplacer";
  else if (p.condition >= restoreCap(state, partId)) reason = "Déjà restauré au maximum";
  else if (state.hoursLeft < hours) reason = "Pas assez d'heures cette semaine";
  else if (state.money < cost) reason = "Fonds insuffisants";
  return { cost, hours, reason };
}

export function checkOem(state: GameState, car: Car, partId: PartId): OpCheck {
  const p = car.parts[partId];
  const cost = oemCost(modelOf(car), partId);
  const hours = oemHours(partId);
  let reason: string | null = null;
  if (p.origin === "oem" && p.condition >= 100) reason = "Déjà neuve";
  else if (state.hoursLeft < hours) reason = "Pas assez d'heures cette semaine";
  else if (state.money < cost) reason = "Fonds insuffisants";
  return { cost, hours, reason };
}

export function checkVariant(state: GameState, car: Car, variantId: string): OpCheck {
  const v = VARIANT_BY_ID[variantId];
  const cost = variantCost(modelOf(car), v);
  const hours = v.hours;
  const p = car.parts[v.part];
  let reason: string | null = null;
  if (v.requires && !state.upgrades.includes(v.requires)) {
    reason = `Nécessite : ${UPGRADES.find((u) => u.id === v.requires)?.label}`;
  } else if (v.repRequired && state.reputation < v.repRequired) reason = `Réputation ${v.repRequired} requise`;
  else if (p.variantId === variantId && p.condition >= 100 && !v.customColor) reason = "Déjà installé";
  else if (state.hoursLeft < hours) reason = "Pas assez d'heures cette semaine";
  else if (state.money < cost) reason = "Fonds insuffisants";
  return { cost, hours, reason };
}

export function checkSwap(state: GameState, car: Car, swapId: string): OpCheck {
  const s = SWAP_BY_ID[swapId];
  const m = modelOf(car);
  const cost = swapCost(m, s);
  const hours = s.hours;
  let reason: string | null = null;
  if (!state.upgrades.includes("bancMoteur")) reason = "Nécessite : Banc moteur";
  else if (!s.sizes.includes(m.engineSize)) reason = "Incompatible avec ce compartiment moteur";
  else if (state.reputation < s.repRequired) reason = `Réputation ${s.repRequired} requise`;
  else if (car.parts.moteur.variantId === swapId) reason = "Déjà installé";
  else if (state.hoursLeft < hours) reason = "Pas assez d'heures cette semaine";
  else if (state.money < cost) reason = "Fonds insuffisants";
  return { cost, hours, reason };
}

function spend(state: GameState, car: Car, cost: number, hours: number, note: string): void {
  state.money -= cost;
  state.hoursLeft -= hours;
  car.invested += cost;
  car.history.push(`S${state.week} — ${note}`);
}

export function restorePart(prev: GameState, carId: string, partId: PartId): GameState {
  const pc = prev.cars.find((c) => c.id === carId);
  if (!pc || pc.status !== "atelier") return prev;
  const check = checkRestore(prev, pc, partId);
  if (check.reason) return prev;
  const state = clone(prev);
  const car = editableCar(state, carId)!;
  const cap = restoreCap(state, partId);
  const p = car.parts[partId];
  p.condition = Math.round(clamp(cap - rand(0, 4), p.condition, 100));
  const label = PARTS.find((d) => d.id === partId)!.label;
  spend(state, car, check.cost, check.hours, `Restauration : ${label} (${p.condition} %)`);
  return state;
}

export function replaceOem(prev: GameState, carId: string, partId: PartId): GameState {
  const pc = prev.cars.find((c) => c.id === carId);
  if (!pc || pc.status !== "atelier") return prev;
  const check = checkOem(prev, pc, partId);
  if (check.reason) return prev;
  const state = clone(prev);
  const car = editableCar(state, carId)!;
  car.parts[partId] = { condition: 100, origin: "oem" };
  if (partId === "peinture") car.color = car.originalColor;
  const label = PARTS.find((d) => d.id === partId)!.label;
  spend(state, car, check.cost, check.hours, `Pièce d'origine neuve : ${label}`);
  return state;
}

export function installVariant(
  prev: GameState,
  carId: string,
  variantId: string,
  color?: { name: string; hex: string },
): GameState {
  const pc = prev.cars.find((c) => c.id === carId);
  if (!pc || pc.status !== "atelier") return prev;
  const check = checkVariant(prev, pc, variantId);
  if (check.reason) return prev;
  const state = clone(prev);
  const car = editableCar(state, carId)!;
  const v = VARIANT_BY_ID[variantId];
  car.parts[v.part] = { condition: 100, origin: "aftermarket", variantId };
  if (v.customColor && color) car.color = color;
  spend(state, car, check.cost, check.hours, `${v.label}${v.customColor && color ? ` (${color.name})` : ""}`);
  return state;
}

export function installSwap(prev: GameState, carId: string, swapId: string): GameState {
  const pc = prev.cars.find((c) => c.id === carId);
  if (!pc || pc.status !== "atelier") return prev;
  const check = checkSwap(prev, pc, swapId);
  if (check.reason) return prev;
  const state = clone(prev);
  const car = editableCar(state, carId)!;
  const s = SWAP_BY_ID[swapId];
  car.parts.moteur = { condition: 100, origin: "aftermarket", variantId: swapId };
  spend(state, car, check.cost, check.hours, `Swap moteur : ${s.label}`);
  log(state, `Swap moteur sur la ${carName(car)} : ${s.label} (${s.power} ch) !`, "good");
  return state;
}

// ——— Vente ———

function offerMultiplier(car: Car, profile: BuyerProfile): number {
  const stats = computeStats(car);
  const m = modelOf(car);
  const labels = carLabels(car, stats);
  switch (profile) {
    case "collectionneur": {
      if (!isCollectible(m)) return 0.8;
      let mult = 0.7 + 0.45 * (stats.originality / 100);
      if (labels.includes("Pièce de collection")) mult += 0.15;
      return mult;
    }
    case "performance": {
      let mult = 0.86 + clamp((stats.perf - stats.base.perf) / 40, -0.15, 0.55);
      if (labels.includes("Restomod")) mult += 0.08;
      return mult;
    }
    case "luxe":
      return 0.86 + clamp((stats.luxe - stats.base.luxe) / 45 + (stats.style - stats.base.style) / 90, -0.15, 0.5);
    case "particulier":
      return 0.9;
  }
}

function makeOffer(state: GameState, car: Car, profile: BuyerProfile, channel: SaleChannel): Offer | null {
  const value = marketValue(car);
  const showroom = state.upgrades.includes("showroom") ? 0.05 : 0;
  const repBonus = Math.min(state.reputation, 200) / 600;
  let amount = value * offerMultiplier(car, profile) * (1 + CHANNELS[channel].bonus + showroom + repBonus) * rand(0.85, 1.1);
  if (profile === "particulier") {
    const budget = rand(6000, 45000);
    if (amount > budget) {
      if (budget < value * 0.7) return null;
      amount = budget;
    }
  }
  return { id: uid(state, "off"), buyer: personName(), profile, amount: round10(amount), week: state.week };
}

function generateOffers(state: GameState, car: Car): void {
  if (!car.listing) return;
  const ch = CHANNELS[car.listing.channel];
  const count = ch.buyers + (state.upgrades.includes("showroom") ? 1 : 0) + randInt(-1, 0);
  for (let i = 0; i < count; i++) {
    const profile = weightedPick(Object.keys(ch.weights) as BuyerProfile[], (p) => ch.weights[p]);
    const offer = makeOffer(state, car, profile, car.listing.channel);
    if (offer) car.offers.push(offer);
  }
  car.offers.sort((a, b) => b.amount - a.amount);
}

export function listBlockReason(state: GameState, car: Car, channel: SaleChannel): string | null {
  const ch = CHANNELS[channel];
  if (car.clientOrderId) return "Voiture d'un client";
  if (car.status !== "atelier") return "Indisponible";
  if (state.reputation < ch.repRequired) return `Réputation ${ch.repRequired} requise`;
  if (state.money < ch.cost) return "Fonds insuffisants";
  return null;
}

export function listForSale(prev: GameState, carId: string, channel: SaleChannel): GameState {
  const pc = prev.cars.find((c) => c.id === carId);
  if (!pc || listBlockReason(prev, pc, channel)) return prev;
  const state = clone(prev);
  const car = state.cars.find((c) => c.id === carId)!;
  const ch = CHANNELS[channel];
  state.money -= ch.cost;
  car.invested += ch.cost;
  car.status = "vente";
  car.listing = { channel, week: state.week };
  car.offers = [];
  if (channel !== "encheres") generateOffers(state, car);
  log(
    state,
    channel === "encheres"
      ? `La ${carName(car)} est inscrite à la vente aux enchères de fin de semaine.`
      : `La ${carName(car)} est mise en vente (${ch.label}).`,
  );
  return state;
}

export function unlist(prev: GameState, carId: string): GameState {
  const state = clone(prev);
  const car = state.cars.find((c) => c.id === carId);
  if (!car || car.status !== "vente") return prev;
  car.status = "atelier";
  car.listing = undefined;
  car.offers = [];
  return state;
}

function completeSale(state: GameState, car: Car, amount: number, buyer: string, profile?: BuyerProfile): void {
  const stats = computeStats(car);
  const labels = carLabels(car, stats);
  const m = modelOf(car);
  const profit = amount - car.purchasePrice - car.invested;
  let rep = 0.5 + stats.condition / 40;
  if (labels.includes("Pièce de collection")) rep += 4 + m.rarity * 2;
  if (labels.includes("Restomod") || labels.includes("Préparation d'exception")) rep += 3;
  if (profit > 0) rep += Math.min(5, profit / 6000);
  else rep -= 1;
  if (stats.condition < 40) rep -= 3;
  rep *= 1 + m.rarity * 0.1;
  rep = Math.round(rep * 10) / 10;
  state.money += amount;
  state.reputation = Math.round(Math.max(0, state.reputation + rep) * 10) / 10;
  state.cars = state.cars.filter((c) => c.id !== car.id);
  state.sold.unshift({
    name: carName(car),
    year: m.year,
    price: amount,
    profit,
    labels,
    week: state.week,
    buyer: profile ? `${buyer} (${PROFILE_LABELS[profile]})` : buyer,
  });
  log(
    state,
    `Vente de la ${carName(car)} à ${buyer} pour ${amount.toLocaleString("fr-FR")} € (${profit >= 0 ? "+" : ""}${Math.round(profit).toLocaleString("fr-FR")} €). Réputation ${rep >= 0 ? "+" : ""}${rep}.${labels.includes("Pièce de collection") ? " Une véritable pièce de collection !" : ""}`,
    profit >= 0 ? "good" : "bad",
  );
}

export function acceptOffer(prev: GameState, carId: string, offerId: string): GameState {
  const state = clone(prev);
  const car = state.cars.find((c) => c.id === carId);
  const offer = car?.offers.find((o) => o.id === offerId);
  if (!car || !offer || car.status !== "vente") return prev;
  completeSale(state, car, offer.amount, offer.buyer, offer.profile);
  return state;
}

export function declineOffer(prev: GameState, carId: string, offerId: string): GameState {
  const state = clone(prev);
  const car = state.cars.find((c) => c.id === carId);
  if (!car) return prev;
  car.offers = car.offers.filter((o) => o.id !== offerId);
  return state;
}

export function dealerPrice(car: Car): number {
  return round10(marketValue(car) * 0.6);
}

export function sellToDealer(prev: GameState, carId: string): GameState {
  const state = clone(prev);
  const car = state.cars.find((c) => c.id === carId);
  if (!car || car.clientOrderId || car.status === "vente") return prev;
  const price = dealerPrice(car);
  state.money += price;
  state.cars = state.cars.filter((c) => c.id !== carId);
  state.sold.unshift({
    name: carName(car),
    year: modelOf(car).year,
    price,
    profit: price - car.purchasePrice - car.invested,
    labels: [],
    week: state.week,
    buyer: "Marchand VO",
  });
  log(state, `La ${carName(car)} est cédée à un marchand pour ${price.toLocaleString("fr-FR")} €.`);
  return state;
}

// ——— Collection personnelle ———

export function toCollection(prev: GameState, carId: string): GameState {
  const state = clone(prev);
  const car = state.cars.find((c) => c.id === carId);
  if (!car || car.status !== "atelier" || car.clientOrderId) return prev;
  car.status = "collection";
  log(state, `La ${carName(car)} rejoint votre collection personnelle.`, "good");
  return state;
}

export function fromCollection(prev: GameState, carId: string): GameState {
  if (freeBays(prev) <= 0) return prev;
  const state = clone(prev);
  const car = state.cars.find((c) => c.id === carId);
  if (!car || car.status !== "collection") return prev;
  car.status = "atelier";
  return state;
}

export function collectionPrestige(car: Car): number {
  const labels = carLabels(car);
  const m = modelOf(car);
  if (labels.includes("Pièce de collection")) return 0.3 * m.rarity;
  if (labels.includes("Restomod") || labels.includes("Préparation d'exception")) return 0.15 * m.rarity;
  return 0;
}

// ——— Commandes clients ———

export function checkCriteria(car: Car, c: OrderCriteria): { label: string; ok: boolean }[] {
  const stats = computeStats(car);
  const m = modelOf(car);
  const out: { label: string; ok: boolean }[] = [];
  if (c.modelId) out.push({ label: `Modèle : ${MODEL_BY_ID[c.modelId].brand} ${MODEL_BY_ID[c.modelId].name}`, ok: car.modelId === c.modelId });
  if (c.body) out.push({ label: `Carrosserie : ${c.body}`, ok: m.body === c.body });
  if (c.collectibleOnly) out.push({ label: "Modèle ancien (≤ 2000)", ok: isCollectible(m) });
  if (c.minCondition) out.push({ label: `État ≥ ${c.minCondition} % (${stats.condition})`, ok: stats.condition >= c.minCondition });
  if (c.minOriginality) out.push({ label: `Originalité ≥ ${c.minOriginality} % (${stats.originality})`, ok: stats.originality >= c.minOriginality });
  if (c.minPower) out.push({ label: `Puissance ≥ ${c.minPower} ch (${stats.power})`, ok: stats.power >= c.minPower });
  if (c.minHandling) out.push({ label: `Tenue de route ≥ ${c.minHandling} (${stats.handling})`, ok: stats.handling >= c.minHandling });
  if (c.minLuxe) out.push({ label: `Luxe ≥ ${c.minLuxe} (${stats.luxe})`, ok: stats.luxe >= c.minLuxe });
  if (c.minStyle) out.push({ label: `Style ≥ ${c.minStyle} (${stats.style})`, ok: stats.style >= c.minStyle });
  return out;
}

export function meetsCriteria(car: Car, c: OrderCriteria): boolean {
  return checkCriteria(car, c).every((x) => x.ok);
}

function estimatedRestorationCost(car: Car): number {
  const m = modelOf(car);
  let total = 0;
  for (const def of PARTS) {
    const p = car.parts[def.id];
    total += p.condition < 15 || p.origin === "aftermarket" ? oemCost(m, def.id) : p.condition < 85 ? restoreCost(m, def.id, p.condition) : 0;
  }
  return total;
}

function generateOrder(state: GameState): ClientOrder | null {
  const unlocked = MODELS.filter((m) => m.repRequired <= state.reputation + 5);
  const client = personName();
  const kinds = ["collection", "performance", "luxe", "prepa", "concours"] as const;
  const kind = pick(kinds);
  const base = {
    id: uid(state, "cmd"),
    client,
    createdWeek: state.week,
    status: "disponible" as const,
  };
  if (kind === "collection") {
    const pool = unlocked.filter(isCollectible);
    if (!pool.length) return null;
    const m = pick(pool);
    return {
      ...base,
      kind: "recherche",
      text: `« Je cherche une ${m.brand} ${m.name} en état exceptionnel et la plus d'origine possible. Je paierai le prix. »`,
      criteria: { modelId: m.id, minCondition: 88, minOriginality: 85 },
      reward: round10(m.refValue * (1.15 + m.rarity * 0.08)),
      repReward: 4 + m.rarity * 2,
      deadlineWeeks: 8,
    };
  }
  if (kind === "performance") {
    const m = pick(unlocked);
    const minPower = roundTo(m.basePower * rand(1.25, 1.6), 10);
    return {
      ...base,
      kind: "recherche",
      text: `« Il me faut une ${m.brand} ${m.name} qui envoie : au moins ${minPower} ch et en bon état. »`,
      criteria: { modelId: m.id, minPower, minCondition: 75 },
      reward: round10(m.refValue * 0.9 + (minPower - m.basePower) * 90 + 3000),
      repReward: 3 + m.rarity,
      deadlineWeeks: 7,
    };
  }
  if (kind === "luxe") {
    const m = pick(unlocked);
    const minLuxe = clamp(m.baseLuxe + randInt(20, 35), 30, 98);
    return {
      ...base,
      kind: "recherche",
      text: `« Je veux une ${m.brand} ${m.name} au confort royal : un intérieur luxueux (luxe ≥ ${minLuxe}) et impeccable. »`,
      criteria: { modelId: m.id, minLuxe, minCondition: 85 },
      reward: round10(m.refValue * 0.95 + (minLuxe - m.baseLuxe) * 260 + 2500),
      repReward: 3 + m.rarity,
      deadlineWeeks: 7,
    };
  }
  // Préparations sur voiture confiée par le client
  const pool = kind === "concours" ? unlocked.filter(isCollectible) : unlocked.filter((m) => m.year < CURRENT_YEAR);
  if (!pool.length) return null;
  const m = pick(pool);
  const car = makeCar(state, m, rand(0.3, 0.6), false);
  car.clientOrderId = base.id;
  const restoCost = estimatedRestorationCost(car);
  if (kind === "concours") {
    return {
      ...base,
      kind: "preparation",
      text: `« Restaurez ma ${m.brand} ${m.name} pour un concours d'élégance. Tout doit être parfait et conforme à l'origine. »`,
      criteria: { minCondition: 90, minOriginality: 88 },
      reward: round10(restoCost * 1.7 + 2500 + m.refValue * 0.05),
      repReward: 5 + m.rarity * 2,
      deadlineWeeks: 7,
      clientCar: car,
    };
  }
  const goal = pick(["power", "style"] as const);
  const stats = computeStats(car);
  const criteria: OrderCriteria = { minCondition: 80 };
  let goalText: string;
  if (goal === "power") {
    criteria.minPower = roundTo(m.basePower * 1.3, 10);
    goalText = `au moins ${criteria.minPower} ch`;
  } else {
    criteria.minStyle = clamp(stats.base.style + 15, 30, 98);
    goalText = `un look ravageur (style ≥ ${criteria.minStyle})`;
  }
  return {
    ...base,
    kind: "preparation",
    text: `« Voici ma ${m.brand} ${m.name}. Remettez-la en forme (état ≥ 80 %) avec ${goalText}. »`,
    criteria,
    reward: round10(restoCost * 1.5 + 4000 + m.refValue * 0.04),
    repReward: 3 + m.rarity,
    deadlineWeeks: 6,
    clientCar: car,
  };
}

function generateOrders(state: GameState, count: number): void {
  for (let i = 0; i < count; i++) {
    const o = generateOrder(state);
    if (o) state.orders.push(o);
  }
}

export function acceptBlockReason(state: GameState, order: ClientOrder): string | null {
  if (order.kind === "preparation" && freeBays(state) <= 0) return "Libérez une place à l'atelier";
  return null;
}

export function acceptOrder(prev: GameState, orderId: string): GameState {
  const o = prev.orders.find((x) => x.id === orderId);
  if (!o || o.status !== "disponible" || acceptBlockReason(prev, o)) return prev;
  const state = clone(prev);
  const order = state.orders.find((x) => x.id === orderId)!;
  order.status = "acceptee";
  order.acceptedWeek = state.week;
  if (order.clientCar) {
    const car = order.clientCar;
    car.history.push(`S${state.week} — Confiée par ${order.client}`);
    state.cars.push(car);
    order.clientCar = undefined;
  }
  log(state, `Commande acceptée : ${order.client}. Délai ${order.deadlineWeeks} semaines.`, "info");
  return state;
}

export function declineOrder(prev: GameState, orderId: string): GameState {
  const state = clone(prev);
  const order = state.orders.find((x) => x.id === orderId);
  if (!order || order.status !== "disponible") return prev;
  state.orders = state.orders.filter((x) => x.id !== orderId);
  return state;
}

export function eligibleCarsForOrder(state: GameState, order: ClientOrder): Car[] {
  if (order.kind === "preparation") return state.cars.filter((c) => c.clientOrderId === order.id);
  return state.cars.filter((c) => c.status === "atelier" && !c.clientOrderId);
}

export function deliverOrder(prev: GameState, orderId: string, carId: string): GameState {
  const o = prev.orders.find((x) => x.id === orderId);
  const c = prev.cars.find((x) => x.id === carId);
  if (!o || !c || o.status !== "acceptee") return prev;
  if (!eligibleCarsForOrder(prev, o).some((x) => x.id === carId)) return prev;
  if (!meetsCriteria(c, o.criteria)) return prev;
  const state = clone(prev);
  const order = state.orders.find((x) => x.id === orderId)!;
  const car = state.cars.find((x) => x.id === carId)!;
  state.orders = state.orders.filter((x) => x.id !== orderId);
  if (order.kind === "preparation") {
    state.money += order.reward;
    state.reputation += order.repReward;
    state.cars = state.cars.filter((x) => x.id !== carId);
    state.sold.unshift({
      name: carName(car),
      year: modelOf(car).year,
      price: order.reward,
      profit: order.reward - car.invested,
      labels: ["Commande client", ...carLabels(car)],
      week: state.week,
      buyer: order.client,
    });
    log(state, `${order.client} récupère sa ${carName(car)}, ravi ! +${order.reward.toLocaleString("fr-FR")} €, réputation +${order.repReward}.`, "good");
  } else {
    completeSale(state, car, order.reward, order.client);
    state.reputation += order.repReward;
    state.sold[0].labels.unshift("Commande client");
    log(state, `Commande honorée pour ${order.client} : réputation +${order.repReward} supplémentaire.`, "good");
  }
  return state;
}

// ——— Développement de l'atelier ———

export function buyUpgrade(prev: GameState, id: UpgradeId): GameState {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u || prev.upgrades.includes(id) || prev.money < u.cost || prev.reputation < u.repRequired) return prev;
  const state = clone(prev);
  state.money -= u.cost;
  state.upgrades.push(id);
  log(state, `Nouvel équipement : ${u.label} !`, "good");
  return state;
}

export function nextBayCost(state: GameState): number | null {
  const idx = state.bays - 2;
  return idx < BAY_COSTS.length ? BAY_COSTS[idx] : null;
}

export function buyBay(prev: GameState): GameState {
  const cost = nextBayCost(prev);
  if (cost === null || prev.money < cost) return prev;
  const state = clone(prev);
  state.money -= cost;
  state.bays += 1;
  log(state, `L'atelier s'agrandit : ${state.bays} places.`, "good");
  return state;
}

export function hireMechanic(prev: GameState): GameState {
  if (prev.mechanics >= MAX_MECHANICS || prev.money < MECHANIC_HIRE_COST) return prev;
  const state = clone(prev);
  state.money -= MECHANIC_HIRE_COST;
  state.mechanics += 1;
  state.hoursLeft += MECHANIC_HOURS;
  log(state, `Vous embauchez ${personName()}, mécanicien (+${MECHANIC_HOURS} h/semaine).`, "good");
  return state;
}

export function fireMechanic(prev: GameState): GameState {
  if (prev.mechanics <= 0) return prev;
  const state = clone(prev);
  state.mechanics -= 1;
  state.hoursLeft = Math.max(0, state.hoursLeft - MECHANIC_HOURS);
  log(state, "Un mécanicien quitte l'atelier.");
  return state;
}

// ——— Fin de semaine ———

export function endWeek(prev: GameState): GameState {
  if (prev.gameOver) return prev;
  const state = clone(prev);

  // Enchères et offres
  for (const car of [...state.cars]) {
    if (car.status !== "vente" || !car.listing) continue;
    if (car.listing.channel === "encheres") {
      generateOffers(state, car);
      const best = car.offers[0];
      if (best) {
        const hammer = round10(best.amount * rand(1.0, 1.2));
        const net = round10(hammer * 0.92);
        log(state, `Coup de marteau ! La ${carName(car)} est adjugée ${hammer.toLocaleString("fr-FR")} € (net ${net.toLocaleString("fr-FR")} €).`, "good");
        completeSale(state, car, net, best.buyer, best.profile);
      } else {
        car.status = "atelier";
        car.listing = undefined;
        log(state, `Aucune enchère pour la ${carName(car)}. Elle revient à l'atelier.`, "bad");
      }
      continue;
    }
    car.offers = car.offers.filter((o) => state.week - o.week < 1);
    generateOffers(state, car);
  }

  // Prestige de la collection
  const prestige = state.cars.filter((c) => c.status === "collection").reduce((s, c) => s + collectionPrestige(c), 0);
  if (prestige > 0) state.reputation += Math.round(prestige * 10) / 10;

  // Charges
  const costs = weeklyCosts(state);
  state.money -= costs;

  // Commandes
  for (const o of [...state.orders]) {
    if (o.status === "disponible" && state.week - o.createdWeek >= 2) {
      state.orders = state.orders.filter((x) => x.id !== o.id);
    } else if (o.status === "acceptee" && o.acceptedWeek !== undefined && state.week - o.acceptedWeek >= o.deadlineWeeks) {
      state.orders = state.orders.filter((x) => x.id !== o.id);
      const penalty = 4 + Math.round(o.repReward / 2);
      state.reputation = Math.max(0, state.reputation - penalty);
      if (o.kind === "preparation") state.cars = state.cars.filter((c) => c.clientOrderId !== o.id);
      log(state, `Délai dépassé pour la commande de ${o.client}. Réputation -${penalty}.`, "bad");
    }
  }

  state.week += 1;
  state.hoursLeft = weeklyHours(state);
  state.reputation = Math.round(state.reputation * 10) / 10;

  const available = state.orders.filter((o) => o.status === "disponible").length;
  if (available < 4) generateOrders(state, Math.random() < 0.6 ? 1 : 2);
  refreshMarket(state);

  log(state, `Semaine ${state.week} : loyer et salaires (${costs.toLocaleString("fr-FR")} €) payés.${prestige > 0 ? ` Votre collection rayonne : réputation +${Math.round(prestige * 10) / 10}.` : ""}`, "info");

  if (state.money < 0) {
    state.debtWeeks += 1;
    if (state.debtWeeks >= 4) {
      state.gameOver = true;
      log(state, "Après un mois dans le rouge, la banque ferme votre atelier.", "bad");
    } else {
      log(state, `Compte à découvert ! Encore ${4 - state.debtWeeks} semaine(s) avant la faillite.`, "bad");
    }
  } else {
    state.debtWeeks = 0;
  }
  return state;
}
