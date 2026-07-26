import { BUILDINGS } from "./data";
import { productionMultiplier, satisfactionTier } from "./satisfaction";
import type { Age, GameState } from "./types";
import { log } from "./utils";

// L'Âge de pierre précède la fondation de la dynastie : il n'est jamais
// joué, mais il complète la frise historique du monde d'Orion.
export const AGE_ORDER: Age[] = ["stone", "medieval", "steam", "modern", "future"];

export const AGE_LABEL: Record<Age, string> = {
  stone: "Âge de pierre",
  medieval: "Moyen Âge",
  steam: "Ère de la Vapeur",
  modern: "Ère Moderne",
  future: "Ère Future",
};

export const AGE_DESCRIPTION: Record<Age, string> = {
  stone:
    "Les premiers peuples d'Orion vivaient de chasse et de cueillette, bien avant la fondation de votre dynastie.",
  medieval:
    "Châteaux, chevalerie et royaumes féodaux : le pouvoir se transmet par le sang et se défend par l'épée.",
  steam:
    "Les machines à vapeur transforment l'industrie et la guerre. Usines, arsenals et chemins de fer redessinent le royaume.",
  modern:
    "L'aviation, la recherche scientifique et les grandes institutions politiques bouleversent la gouvernance du royaume.",
  future:
    "Fusion, conquête orbitale et gouvernance assistée par l'intelligence artificielle : Orion écrit son dernier âge.",
};

// points de progrès technologique nécessaires pour passer à l'époque suivante
export const AGE_THRESHOLD: Partial<Record<Age, number>> = {
  medieval: 140,
  steam: 240,
  modern: 380,
};

export function nextAge(age: Age): Age | null {
  const idx = AGE_ORDER.indexOf(age);
  if (idx < 0 || idx >= AGE_ORDER.length - 1) return null;
  return AGE_ORDER[idx + 1];
}

export function ageAtLeast(current: Age, required: Age): boolean {
  return AGE_ORDER.indexOf(current) >= AGE_ORDER.indexOf(required);
}

export function techGainPerTurn(state: GameState): number {
  const sciBuildings = state.provinces.reduce(
    (sum, p) => sum + p.buildings.filter((b) => BUILDINGS[b].category === "scientific").length,
    0,
  );
  const totalPopulation = state.provinces.reduce((sum, p) => sum + p.population, 0);
  const tier = satisfactionTier(state.resources.stability);
  const mult = productionMultiplier(tier);
  return (0.5 + sciBuildings * 1.3 + totalPopulation / 4000) * mult;
}

export function handleAgeProgress(state: GameState): void {
  const threshold = AGE_THRESHOLD[state.age];
  if (threshold == null) return;
  state.techProgress += techGainPerTurn(state);
  if (state.techProgress < threshold) return;
  const upcoming = nextAge(state.age);
  if (!upcoming) return;
  state.techProgress -= threshold;
  state.age = upcoming;
  log(
    state,
    "age",
    `Orion entre dans une nouvelle époque : ${AGE_LABEL[upcoming]}. ${AGE_DESCRIPTION[upcoming]}`,
  );
}
