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
  // multiplicateur sur la croissance démographique
  populationGrowthMult: number;
  // multiplicateur sur la puissance militaire totale
  militaryPowerMult: number;
  // multiplicateur sur le coût de fondation d'une nouvelle province
  provinceCostMult: number;
  // multiplicateur sur les revenus tirés du commerce (alliances, routes commerciales)
  tradeGoldMult: number;
  // multiplicateur sur les points de recherche produits
  researchMult: number;
  // multiplicateur sur le risque de sécession/révolution (< 1 = plus stable)
  unrestResistanceMult: number;
  // si vrai, le peuple ne peut jamais atteindre le palier de satisfaction "Ravi"
  capHappiness: boolean;
}

export const GOVERNMENT_MODIFIERS: Record<GovernmentType, GovernmentModifiers> = {
  clan: {
    stabilityDrift: 0,
    prestigeMult: 1,
    relationDrift: 0,
    populationGrowthMult: 1.2,
    militaryPowerMult: 1,
    provinceCostMult: 1,
    tradeGoldMult: 1,
    researchMult: 1,
    unrestResistanceMult: 1,
    capHappiness: false,
  },
  kingdom: {
    stabilityDrift: 0,
    prestigeMult: 1,
    relationDrift: 0,
    populationGrowthMult: 1,
    militaryPowerMult: 1,
    provinceCostMult: 1,
    tradeGoldMult: 1,
    researchMult: 1,
    unrestResistanceMult: 1,
    capHappiness: false,
  },
  empire: {
    stabilityDrift: 0,
    prestigeMult: 1.15,
    relationDrift: -0.3,
    populationGrowthMult: 1,
    militaryPowerMult: 1.15,
    provinceCostMult: 0.85,
    tradeGoldMult: 1,
    researchMult: 1,
    unrestResistanceMult: 1,
    capHappiness: false,
  },
  constitutional_monarchy: {
    stabilityDrift: 0.3,
    prestigeMult: 1,
    relationDrift: 0.2,
    populationGrowthMult: 1,
    militaryPowerMult: 1,
    provinceCostMult: 1,
    tradeGoldMult: 1.15,
    researchMult: 1,
    unrestResistanceMult: 1,
    capHappiness: false,
  },
  republic: {
    stabilityDrift: 0.5,
    prestigeMult: 0.9,
    relationDrift: 0.4,
    populationGrowthMult: 1,
    militaryPowerMult: 1,
    provinceCostMult: 1,
    tradeGoldMult: 1,
    researchMult: 1.25,
    unrestResistanceMult: 1,
    capHappiness: false,
  },
  dictatorship: {
    stabilityDrift: 0.5,
    prestigeMult: 1,
    relationDrift: -0.8,
    populationGrowthMult: 1,
    militaryPowerMult: 1.2,
    provinceCostMult: 1,
    tradeGoldMult: 1,
    researchMult: 1,
    unrestResistanceMult: 0.5,
    capHappiness: true,
  },
};

export const GOVERNMENT_BONUS_LABEL: Record<GovernmentType, string> = {
  clan: "+20% croissance démographique.",
  kingdom: "Régime de référence, sans bonus ni malus particulier.",
  empire: "+15% puissance militaire, -15% coût de fondation de nouvelles provinces.",
  constitutional_monarchy: "+15% or issu du commerce et des routes commerciales.",
  republic: "+25% points de recherche produits.",
  dictatorship:
    "+20% puissance militaire, révoltes deux fois moins fréquentes, mais le peuple ne peut jamais être \"Ravi\".",
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
