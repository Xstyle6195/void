import { BUILDINGS, UNIT_TYPES } from "./data";
import type { Age, BuildingType, GameState, UnitTypeDef } from "./types";
import { log } from "./utils";

export interface Technology {
  id: string;
  name: string;
  description: string;
  age: Age;
  cost: number;
  requires: string[];
  // si présent, achever cette recherche fait entrer Orion dans cette époque
  setsAge?: Age;
}

export const TECHS: Technology[] = [
  // --- Ère de la Vapeur ---
  {
    id: "steam_dawn",
    name: "Les Balbutiements de la Vapeur",
    description: "La machine à vapeur ouvre l'ère de l'industrie.",
    age: "steam",
    cost: 40,
    requires: [],
    setsAge: "steam",
  },
  {
    id: "steam_metallurgy",
    name: "Métallurgie industrielle",
    description: "Des forges plus puissantes arment le royaume d'artillerie.",
    age: "steam",
    cost: 55,
    requires: ["steam_dawn"],
  },
  {
    id: "steam_naval",
    name: "Coques blindées",
    description: "Le blindage des navires transforme la guerre navale.",
    age: "steam",
    cost: 55,
    requires: ["steam_dawn"],
  },
  {
    id: "steam_academia",
    name: "Académies savantes",
    description: "Universités, théâtres et chambres industrielles structurent le savoir du royaume.",
    age: "steam",
    cost: 50,
    requires: ["steam_dawn"],
  },

  // --- Ère Moderne ---
  {
    id: "modern_dawn",
    name: "L'Aube de la Modernité",
    description: "La médecine moderne et les grandes administrations changent le visage du royaume.",
    age: "modern",
    cost: 80,
    requires: ["steam_metallurgy", "steam_naval", "steam_academia"],
    setsAge: "modern",
  },
  {
    id: "modern_aviation",
    name: "L'Aviation militaire",
    description: "Le royaume conquiert enfin le ciel d'Orion.",
    age: "modern",
    cost: 100,
    requires: ["modern_dawn"],
  },
  {
    id: "modern_armor",
    name: "Blindés modernes",
    description: "Les chars de combat percent n'importe quel front.",
    age: "modern",
    cost: 85,
    requires: ["modern_dawn"],
  },
  {
    id: "modern_governance",
    name: "Institutions modernes",
    description: "Recherche, culture et administration entrent dans une ère nouvelle.",
    age: "modern",
    cost: 80,
    requires: ["modern_dawn"],
  },

  // --- Ère Future ---
  {
    id: "future_dawn",
    name: "Le Seuil du Futur",
    description: "La fusion nucléaire ouvre une ère d'abondance énergétique.",
    age: "future",
    cost: 130,
    requires: ["modern_aviation", "modern_armor", "modern_governance"],
    setsAge: "future",
  },
  {
    id: "future_orbital",
    name: "Conquête orbitale",
    description: "Le royaume projette sa puissance jusque dans l'orbite d'Orion.",
    age: "future",
    cost: 150,
    requires: ["future_dawn"],
  },
  {
    id: "future_robotics",
    name: "Robotique de combat",
    description: "Mécas et sous-marins autonomes redéfinissent la guerre.",
    age: "future",
    cost: 140,
    requires: ["future_dawn"],
  },
  {
    id: "future_institutions",
    name: "Intelligence artificielle gouvernementale",
    description: "Recherche spatiale, mémoire numérique et gouvernance assistée par IA.",
    age: "future",
    cost: 140,
    requires: ["future_dawn"],
  },
];

export function isResearched(state: GameState, techId: string): boolean {
  return state.researchedTechs.includes(techId);
}

export function canResearch(state: GameState, techId: string): boolean {
  const tech = TECHS.find((t) => t.id === techId);
  if (!tech) return false;
  if (isResearched(state, techId)) return false;
  if (state.resources.research < tech.cost) return false;
  return tech.requires.every((r) => isResearched(state, r));
}

export function researchTech(state: GameState, techId: string): GameState {
  const s = structuredClone(state);
  const tech = TECHS.find((t) => t.id === techId);
  if (!tech || !canResearch(s, techId)) return s;
  s.resources.research -= tech.cost;
  s.researchedTechs.push(techId);
  if (tech.setsAge) s.age = tech.setsAge;
  log(s, tech.setsAge ? "age" : "tech", `Recherche achevée : ${tech.name}. ${tech.description}`);
  return s;
}

export function techUnlocks(techId: string): { buildings: BuildingType[]; units: UnitTypeDef[] } {
  return {
    buildings: Object.values(BUILDINGS).filter((b) => b.requiresTech === techId),
    units: UNIT_TYPES.filter((u) => u.requiresTech === techId),
  };
}
