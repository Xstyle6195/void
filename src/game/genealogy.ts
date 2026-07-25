import type { GameState, Person } from "./types";

export function computeGenerations(members: Person[]): Map<string, number> {
  const gen = new Map<string, number>();
  if (members.length === 0) return gen;
  const founder = members[0];
  gen.set(founder.id, 0);
  const queue: string[] = [founder.id];
  while (queue.length > 0) {
    const id = queue.shift() as string;
    const g = gen.get(id) as number;
    for (const p of members) {
      if ((p.fatherId === id || p.motherId === id) && !gen.has(p.id)) {
        gen.set(p.id, g + 1);
        queue.push(p.id);
      }
    }
  }
  for (const p of members) {
    if (!gen.has(p.id) && p.spouseId && gen.has(p.spouseId)) {
      gen.set(p.id, gen.get(p.spouseId) as number);
    }
  }
  for (const p of members) {
    if (!gen.has(p.id)) gen.set(p.id, 0);
  }
  return gen;
}

export function reignOrder(state: GameState): Map<string, number> {
  const order = new Map<string, number>();
  state.deceased.forEach((p, i) => order.set(p.id, i + 1));
  order.set(state.ruler.id, state.deceased.length + 1);
  return order;
}

export function buildCoupleGroups(
  members: Person[],
  byId: Map<string, Person>,
): Person[][] {
  const memberIds = new Set(members.map((p) => p.id));
  const shown = new Set<string>();
  const groups: Person[][] = [];
  for (const p of members) {
    if (shown.has(p.id)) continue;
    const spouse = p.spouseId ? byId.get(p.spouseId) : undefined;
    if (spouse && memberIds.has(spouse.id) && !shown.has(spouse.id)) {
      groups.push(p.sex === "M" ? [p, spouse] : [spouse, p]);
      shown.add(p.id);
      shown.add(spouse.id);
    } else {
      groups.push([p]);
      shown.add(p.id);
    }
  }
  return groups;
}
