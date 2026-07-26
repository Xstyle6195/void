import { ageAtLeast } from "./ages";
import { RECRUIT_BATCH, RECRUIT_COST_PER_MAN, UNIT_TYPES } from "./data";
import type { CorpsType, GameState } from "./types";
import { log } from "./utils";

export const CORPS_BUILDING: Record<CorpsType, "barracks" | "shipyard" | "aeroport" | null> = {
  land: "barracks",
  naval: "shipyard",
  air: "aeroport",
};

export const CORPS_LABEL: Record<CorpsType, string> = {
  land: "Corps terrestre",
  naval: "Corps marin",
  air: "Corps aérien",
};

export function unitsForCorps(corps: CorpsType) {
  return UNIT_TYPES.filter((u) => u.corps === corps);
}

export const EXERCISE_COST_PER_UNIT = 1.5;
export const EXERCISE_BONUS = 0.15;
export const EXERCISE_MAX_BONUS = 0.45;
export const EXERCISE_DURATION = 5;

export function totalArmyUnits(state: GameState): number {
  return state.army.units.reduce((sum, u) => sum + u.count, 0);
}

export function activeReadinessBonus(state: GameState): number {
  return state.year <= state.army.readinessExpiresYear ? state.army.readinessBonus : 0;
}

export function totalArmyPower(state: GameState): number {
  let power = 0;
  for (const stack of state.army.units) {
    const def = UNIT_TYPES.find((u) => u.id === stack.unitId);
    if (def) power += def.power * stack.count;
  }
  return power * (1 + activeReadinessBonus(state));
}

export function conductExercises(state: GameState): GameState {
  const s = structuredClone(state);
  const totalUnits = totalArmyUnits(s);
  if (totalUnits <= 0) return s;
  const cost = Math.round(totalUnits * EXERCISE_COST_PER_UNIT);
  if (s.resources.gold < cost) return s;
  s.resources.gold -= cost;
  const currentBonus = activeReadinessBonus(s);
  s.army.readinessBonus = Math.min(EXERCISE_MAX_BONUS, currentBonus + EXERCISE_BONUS);
  s.army.readinessExpiresYear = s.year + EXERCISE_DURATION;
  log(
    s,
    "army",
    `Les troupes s'exercent : préparation militaire à ${Math.round(s.army.readinessBonus * 100)}% jusqu'en ${s.army.readinessExpiresYear}.`,
  );
  return s;
}

export function totalArmyUpkeep(state: GameState): number {
  let upkeep = 0;
  for (const stack of state.army.units) {
    const def = UNIT_TYPES.find((u) => u.id === stack.unitId);
    if (def) upkeep += def.upkeepPerMan * stack.count;
  }
  return upkeep;
}

export function recruitMen(
  state: GameState,
  corps: CorpsType,
  provinceId: string,
): GameState {
  const s = structuredClone(state);
  const building = CORPS_BUILDING[corps];
  if (!building) return s;
  const province = s.provinces.find((p) => p.id === provinceId);
  if (!province || !province.buildings.includes(building)) return s;
  const cost = RECRUIT_BATCH * RECRUIT_COST_PER_MAN;
  if (s.resources.gold < cost || province.population < RECRUIT_BATCH) return s;
  s.resources.gold -= cost;
  province.population -= RECRUIT_BATCH;
  s.army.recruits[corps] += RECRUIT_BATCH;
  log(
    s,
    "army",
    `${RECRUIT_BATCH} hommes sont levés à ${province.name} pour ${CORPS_LABEL[corps].toLowerCase()}.`,
  );
  return s;
}

export function equipUnit(state: GameState, unitId: string): GameState {
  const s = structuredClone(state);
  const def = UNIT_TYPES.find((u) => u.id === unitId);
  if (!def) return s;
  if (!ageAtLeast(s.age, def.age)) return s;
  const available = s.army.recruits[def.corps];
  const amount = Math.min(RECRUIT_BATCH, available);
  if (amount <= 0) return s;
  const cost = Math.round(amount * def.equipCostPerMan);
  if (s.resources.gold < cost) return s;
  s.resources.gold -= cost;
  s.army.recruits[def.corps] -= amount;
  const stack = s.army.units.find((u) => u.unitId === unitId);
  if (stack) stack.count += amount;
  else s.army.units.push({ unitId, count: amount });
  log(s, "army", `${amount} recrues sont équipées en ${def.name.toLowerCase()}.`);
  return s;
}
