import type { GovernmentType, Sex } from "./types";

// nombre de clans rivaux à absorber entièrement pour passer de Clan à Royaume
export const CLANS_TO_ABSORB = 3;
// nombre de villes à capturer à un royaume rival pour passer de Royaume à Empire
// (nécessite en plus la technologie "Les Balbutiements de la Vapeur")
export const CITIES_TO_CAPTURE = 2;

export const GOVERNMENT_LABEL: Record<GovernmentType, string> = {
  clan: "Clan",
  kingdom: "Royaume",
  empire: "Empire",
  constitutional_monarchy: "Monarchie moderne",
  republic: "République",
  dictatorship: "Dictature",
};

export const GOVERNMENT_DESCRIPTION: Record<GovernmentType, string> = {
  clan: "Un chef mène son clan par la force du lien du sang et de la tradition orale.",
  kingdom: "Le pouvoir se transmet par le sang et se défend par l'épée.",
  empire:
    "Un vaste territoire uni sous une même couronne, porté par le prestige de la conquête.",
  constitutional_monarchy:
    "La couronne règne toujours, mais un parlement élu partage désormais le pouvoir.",
  republic: "Le peuple élit ses représentants, dans la continuité d'une lignée respectée.",
  dictatorship: "Un pouvoir fort et sans partage, maintenu par la poigne d'un seul dirigeant.",
};

interface GovernmentModifiers {
  // bonus/malus de stabilité appliqué chaque tour
  stabilityDrift: number;
  // multiplicateur sur le prestige produit par les bâtiments
  prestigeMult: number;
  // bonus/malus appliqué chaque tour aux relations avec les voisins
  relationDrift: number;
}

export const GOVERNMENT_MODIFIERS: Record<GovernmentType, GovernmentModifiers> = {
  clan: { stabilityDrift: 0, prestigeMult: 1, relationDrift: 0 },
  kingdom: { stabilityDrift: 0, prestigeMult: 1, relationDrift: 0 },
  empire: { stabilityDrift: 0, prestigeMult: 1.15, relationDrift: -0.3 },
  constitutional_monarchy: { stabilityDrift: 0.3, prestigeMult: 1, relationDrift: 0.2 },
  republic: { stabilityDrift: 0.5, prestigeMult: 0.9, relationDrift: 0.4 },
  dictatorship: { stabilityDrift: 0.5, prestigeMult: 1, relationDrift: -0.8 },
};

export function rulerTitle(government: GovernmentType, sex: Sex): string {
  switch (government) {
    case "clan":
      return sex === "M" ? "Chef de clan" : "Cheffe de clan";
    case "kingdom":
      return sex === "M" ? "Roi" : "Reine";
    case "empire":
      return sex === "M" ? "Empereur" : "Impératrice";
    case "constitutional_monarchy":
      return sex === "M" ? "Roi" : "Reine";
    case "republic":
      return sex === "M" ? "Président" : "Présidente";
    case "dictatorship":
      return sex === "M" ? "Dictateur" : "Dictatrice";
  }
}
