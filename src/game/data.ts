import type { BuildingType, Trait, TraitId } from "./types";

export const TRAITS: Record<TraitId, Trait> = {
  brave: {
    id: "brave",
    name: "Brave",
    description: "Ne recule devant aucun combat.",
    effects: { martial: 3 },
  },
  cowardly: {
    id: "cowardly",
    name: "Lâche",
    description: "Fuit le danger, au grand dam de sa cour.",
    effects: { martial: -3 },
  },
  wise: {
    id: "wise",
    name: "Sage",
    description: "Voit loin et juge avec discernement.",
    effects: { stewardship: 2, diplomacy: 2 },
  },
  foolish: {
    id: "foolish",
    name: "Sot",
    description: "Prend des décisions hâtives.",
    effects: { stewardship: -2, diplomacy: -2 },
  },
  just: {
    id: "just",
    name: "Juste",
    description: "Le peuple respecte son sens de la justice.",
    effects: { diplomacy: 2, stewardship: 1 },
  },
  cruel: {
    id: "cruel",
    name: "Cruel",
    description: "Gouverne par la peur.",
    effects: { martial: 2, diplomacy: -3 },
  },
  generous: {
    id: "generous",
    name: "Généreux",
    description: "Sa cour et son peuple lui sont loyaux.",
    effects: { diplomacy: 2 },
  },
  greedy: {
    id: "greedy",
    name: "Avide",
    description: "Amasse plus qu'il ne redistribue.",
    effects: { stewardship: 2, diplomacy: -2 },
  },
  pious: {
    id: "pious",
    name: "Pieux",
    description: "La foi du peuple grandit sous son règne.",
    effects: { piety: 3 },
  },
  impious: {
    id: "impious",
    name: "Impie",
    description: "Se soucie peu des dieux.",
    effects: { piety: -3 },
  },
  charismatic: {
    id: "charismatic",
    name: "Charismatique",
    description: "Rassemble les foules par sa seule présence.",
    effects: { diplomacy: 3 },
  },
  frail: {
    id: "frail",
    name: "Fragile",
    description: "Sa santé décline plus vite que la normale.",
    effects: {},
  },
  hale: {
    id: "hale",
    name: "Robuste",
    description: "Un corps fait pour endurer les années.",
    effects: {},
  },
  ambitious: {
    id: "ambitious",
    name: "Ambitieux",
    description: "Ne se satisfait jamais de ce qu'il possède.",
    effects: { martial: 1, stewardship: 1 },
  },
};

export const BUILDINGS: Record<string, BuildingType> = {
  // --- Militaire : unités (puissance offensive) et défenses ---
  barracks: {
    id: "barracks",
    name: "Caserne",
    category: "military",
    cost: 80,
    description: "Entraîne des troupes et renforce la puissance militaire.",
    effects: { martial: 4 },
  },
  arsenal: {
    id: "arsenal",
    name: "Arsenal",
    category: "military",
    cost: 170,
    description: "Arme des troupes d'élite pour des campagnes offensives.",
    effects: { martial: 9 },
  },
  walls: {
    id: "walls",
    name: "Murailles",
    category: "military",
    cost: 100,
    description: "Protège la province des invasions.",
    effects: { martial: 2, stability: 2, defense: 15 },
  },
  garrison: {
    id: "garrison",
    name: "Garnison",
    category: "military",
    cost: 130,
    description: "Une garnison permanente qui défend la ville en cas de siège.",
    effects: { defense: 20, stability: 1 },
  },

  // --- Civil : habitations et production ---
  housing: {
    id: "housing",
    name: "Quartiers d'habitation",
    category: "civil",
    cost: 75,
    description: "Loge davantage d'habitants et accélère la croissance.",
    effects: { populationGrowth: 0.015 },
  },
  farm: {
    id: "farm",
    name: "Champs cultivés",
    category: "civil",
    cost: 40,
    description: "Augmente la production de nourriture.",
    effects: { food: 6 },
  },
  mine: {
    id: "mine",
    name: "Mine",
    category: "civil",
    cost: 120,
    description: "Extrait des minerais précieux, source d'or régulière.",
    effects: { gold: 11 },
  },
  market: {
    id: "market",
    name: "Marché",
    category: "civil",
    cost: 60,
    description: "Augmente les revenus en or.",
    effects: { gold: 5 },
  },
  factory: {
    id: "factory",
    name: "Manufacture",
    category: "civil",
    cost: 210,
    description: "Produit en masse, au prix d'un peu de mécontentement.",
    effects: { gold: 20, stability: -1 },
  },

  // --- Scientifique : savoir et innovation ---
  school: {
    id: "school",
    name: "École",
    category: "scientific",
    cost: 95,
    description: "Instruit la population et stimule son développement.",
    effects: { populationGrowth: 0.01, gold: 3 },
  },
  laboratory: {
    id: "laboratory",
    name: "Laboratoire",
    category: "scientific",
    cost: 190,
    description: "Fait progresser les connaissances et l'artisanat.",
    effects: { gold: 9, prestige: 3 },
  },
  observatory: {
    id: "observatory",
    name: "Observatoire",
    category: "scientific",
    cost: 150,
    description: "Étudie les astres, source de prestige savant.",
    effects: { prestige: 4, stability: 1 },
  },

  // --- Culturel : foi, mémoire et grandeur ---
  temple: {
    id: "temple",
    name: "Temple",
    category: "cultural",
    cost: 70,
    description: "Améliore la stabilité et la piété du royaume.",
    effects: { stability: 4, prestige: 1 },
  },
  museum: {
    id: "museum",
    name: "Musée",
    category: "cultural",
    cost: 130,
    description: "Expose les trésors du royaume, source de prestige.",
    effects: { prestige: 6 },
  },
  monument: {
    id: "monument",
    name: "Monument",
    category: "cultural",
    cost: 210,
    description: "Un monument grandiose célébrant la dynastie.",
    effects: { prestige: 9, stability: 2 },
  },

  // --- Politique : pouvoir et diplomatie ---
  hall: {
    id: "hall",
    name: "Grande Halle",
    category: "political",
    cost: 90,
    description: "Un lieu de pouvoir qui accroît le prestige.",
    effects: { prestige: 3, stability: 1 },
  },
  parliament: {
    id: "parliament",
    name: "Parlement",
    category: "political",
    cost: 180,
    description: "Une assemblée qui stabilise la gouvernance du royaume.",
    effects: { stability: 9 },
  },
  embassy: {
    id: "embassy",
    name: "Ambassade",
    category: "political",
    cost: 145,
    description: "Entretient des relations suivies avec tous les royaumes voisins.",
    effects: { relationBonus: 1 },
  },
  palace: {
    id: "palace",
    name: "Palais royal",
    category: "political",
    cost: 260,
    description: "Le siège éclatant du pouvoir dynastique.",
    effects: { prestige: 11, stability: 3 },
  },
};

export const MALE_NAMES = [
  "Aldric", "Baldwin", "Cedric", "Dagobert", "Edric", "Fenwick", "Gareth",
  "Halvard", "Ivor", "Joran", "Kendrick", "Leofric", "Magnus", "Norbert",
  "Osric", "Perceval", "Quentin", "Roderic", "Sigurd", "Théobald", "Ulric",
  "Vidar", "Wilfrid", "Yorick", "Alaric", "Brannor",
];

export const FEMALE_NAMES = [
  "Adelinde", "Bertha", "Clothilde", "Dagny", "Elswyth", "Freya", "Gisela",
  "Hilda", "Iseult", "Jorunn", "Kunigunde", "Liuba", "Mahaut", "Nissa",
  "Odile", "Petronille", "Ragnhild", "Sunniva", "Théodora", "Ursule",
  "Valdis", "Winifred", "Ysolde", "Aveline", "Berengère",
];

export const NEIGHBOR_NAME_POOL = [
  "Varnheim", "Castelmoor", "Thornwatch", "Ravensholt", "Duskvale",
  "Ostmark", "Brackenfeld", "Sylvamont", "Grimhold", "Aldenreach",
];

export const KINGDOM_NAME_ADJ = [
  "Val", "Mont", "Brise", "Roche", "Champs", "Bois", "Source", "Rive",
];
export const KINGDOM_NAME_SUFFIX = [
  "fort", "brise", "combe", "garde", "haven", "roche", "val", "terre",
];

export const EXPLORER_TITLES_MALE = [
  "Capitaine", "Éclaireur", "Navigateur", "Cartographe", "Baroudeur",
];
export const EXPLORER_TITLES_FEMALE = [
  "Capitaine", "Éclaireuse", "Navigatrice", "Cartographe", "Baroudeuse",
];
export const MERCHANT_TITLES_MALE = ["Négociant", "Marchand", "Facteur"];
export const MERCHANT_TITLES_FEMALE = ["Négociante", "Marchande", "Factrice"];
export const PROSPECTOR_TITLES_MALE = ["Prospecteur", "Mineur", "Arpenteur"];
export const PROSPECTOR_TITLES_FEMALE = ["Prospectrice", "Mineuse", "Arpenteuse"];
