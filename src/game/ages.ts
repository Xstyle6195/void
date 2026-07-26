import type { Age } from "./types";

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

export function ageAtLeast(current: Age, required: Age): boolean {
  return AGE_ORDER.indexOf(current) >= AGE_ORDER.indexOf(required);
}
