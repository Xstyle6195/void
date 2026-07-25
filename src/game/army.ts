import { RECRUIT_BATCH, RECRUIT_COST_PER_MAN, UNIT_TYPES } from "./data";
import type { CorpsType, GameState } from "./types";
import { log } from "./utils";

export const CORPS_BUILDING: Record<CorpsType, "barracks" | "shipyard" | null> = {
  land: "barracks",
  naval: "shipyard",
  air: null,
};

export const CORPS_LABEL: Record<CorpsType, string> = {
  land: "Corps terrestre",
  naval: "Corps marin",
  air: "Corps aérien",
};

export function unitsForCorps(corps: CorpsType) {
  return UNIT_TYPES.filter((u) => u.corps === corps);
}

export function totalArmyPower(state: GameState): number {
  let power = 0;
  for (const stack of state.army.units) {
    const def = UNIT_TYPES.find((u) => u.id === stack.unitId);
    if (def) power += def.power * stack.count;
  }
  return power;
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
