export type FormatMatch = "1v1" | "2v2" | "triple-menace" | "a-4" | "battle-royal"

export const LIMITES_FORMAT: Record<FormatMatch, { min: number; max: number }> = {
  "1v1": { min: 2, max: 2 },
  "2v2": { min: 2, max: 2 },
  "triple-menace": { min: 3, max: 3 },
  "a-4": { min: 4, max: 4 },
  "battle-royal": { min: 4, max: 10 },
}

export type MatchStipulation =
  | "normal"
  | "no-dq"
  | "echelles"
  | "cage-acier"
  | "hell-in-a-cell"
  | "falls-count-anywhere"
  | "last-man-standing"
  | "soumission"
  | "trois-tombes"
  | "first-blood"
  | "hardcore"
  | "table"
  | "casket"
  | "i-quit"
  | "loser-leaves-town"
  | "tag-classique"
  | "tag-no-dq"
  | "tornado-tag"
  | "elimination-tag"
  | "cage-acier-tag"
  | "table-tag"
  | "falls-count-anywhere-tag"
  | "echelles-tag"
  | "hardcore-tag"
  | "loser-leaves-town-tag"
  | "triple-classique"
  | "triple-no-dq"
  | "triple-cage"
  | "triple-falls-anywhere"
  | "triple-hardcore"
  | "triple-table"
  | "triple-elimination"
  | "triple-echelles"
  | "a4-classique"
  | "a4-no-dq"
  | "a4-cage"
  | "a4-falls-anywhere"
  | "a4-hardcore"
  | "a4-table"
  | "a4-elimination"
  | "a4-echelles"
  | "battle-royal"

export interface StipulationInfo {
  id: MatchStipulation
  format: FormatMatch
  nom: string
  description: string
  bonusNote: number
  risqueBlessure: number
  usure: number
  cout: number
}

export const STIPULATIONS: StipulationInfo[] = [
  {
    id: "normal",
    format: "1v1",
    nom: "Match Normal",
    description: "Pas de règle particulière.",
    bonusNote: 0,
    risqueBlessure: 0.04,
    usure: 6,
    cout: 0,
  },
  {
    id: "no-dq",
    format: "1v1",
    nom: "No Disqualification",
    description: "Aucune disqualification possible.",
    bonusNote: 5,
    risqueBlessure: 0.09,
    usure: 10,
    cout: 300,
  },
  {
    id: "echelles",
    format: "1v1",
    nom: "Match à Échelles",
    description: "Un objet est suspendu au-dessus du ring.",
    bonusNote: 8,
    risqueBlessure: 0.13,
    usure: 12,
    cout: 800,
  },
  {
    id: "cage-acier",
    format: "1v1",
    nom: "Cage d'Acier",
    description: "Combat enfermé dans une cage : victoire par soumission, KO ou sortie de cage.",
    bonusNote: 10,
    risqueBlessure: 0.12,
    usure: 12,
    cout: 1000,
  },
  {
    id: "hell-in-a-cell",
    format: "1v1",
    nom: "Hell in a Cell",
    description: "La version géante et grillagée de la cage, très violente.",
    bonusNote: 16,
    risqueBlessure: 0.2,
    usure: 18,
    cout: 3000,
  },
  {
    id: "falls-count-anywhere",
    format: "1v1",
    nom: "Falls Count Anywhere",
    description: "Le combat peut se terminer n'importe où dans la salle.",
    bonusNote: 7,
    risqueBlessure: 0.1,
    usure: 10,
    cout: 500,
  },
  {
    id: "last-man-standing",
    format: "1v1",
    nom: "Last Man Standing",
    description: "Victoire seulement si l'adversaire ne se relève pas avant 10.",
    bonusNote: 9,
    risqueBlessure: 0.14,
    usure: 14,
    cout: 700,
  },
  {
    id: "soumission",
    format: "1v1",
    nom: "Match de Soumission",
    description: "Seule une soumission peut y mettre fin.",
    bonusNote: 6,
    risqueBlessure: 0.06,
    usure: 8,
    cout: 400,
  },
  {
    id: "trois-tombes",
    format: "1v1",
    nom: "2 sur 3 Tombés",
    description: "Le premier à obtenir deux tombés gagne.",
    bonusNote: 11,
    risqueBlessure: 0.08,
    usure: 14,
    cout: 600,
  },
  {
    id: "first-blood",
    format: "1v1",
    nom: "First Blood",
    description: "Le premier qui saigne perd.",
    bonusNote: 8,
    risqueBlessure: 0.15,
    usure: 10,
    cout: 600,
  },
  {
    id: "hardcore",
    format: "1v1",
    nom: "Hardcore Match",
    description: "Armes autorisées, pas de disqualification.",
    bonusNote: 10,
    risqueBlessure: 0.18,
    usure: 16,
    cout: 900,
  },
  {
    id: "table",
    format: "1v1",
    nom: "Table Match",
    description: "Il faut passer l'adversaire à travers une table pour gagner.",
    bonusNote: 9,
    risqueBlessure: 0.16,
    usure: 12,
    cout: 800,
  },
  {
    id: "casket",
    format: "1v1",
    nom: "Casket Match",
    description: "Victoire en enfermant l'adversaire dans un cercueil.",
    bonusNote: 12,
    risqueBlessure: 0.15,
    usure: 12,
    cout: 1500,
  },
  {
    id: "i-quit",
    format: "1v1",
    nom: "I Quit Match",
    description: "L'adversaire doit dire « j'abandonne » pour perdre.",
    bonusNote: 7,
    risqueBlessure: 0.1,
    usure: 10,
    cout: 500,
  },
  {
    id: "loser-leaves-town",
    format: "1v1",
    nom: "Loser Leaves Town",
    description: "Le perdant est contraint de quitter la fédération. Idéal pour clore une rivalité.",
    bonusNote: 14,
    risqueBlessure: 0.05,
    usure: 8,
    cout: 2000,
  },

  // Stipulations 2v2
  {
    id: "tag-classique",
    format: "2v2",
    nom: "Tag Team Classique",
    description: "Un seul catcheur légal par équipe à la fois, il faut taguer son partenaire.",
    bonusNote: 4,
    risqueBlessure: 0.05,
    usure: 8,
    cout: 300,
  },
  {
    id: "tag-no-dq",
    format: "2v2",
    nom: "No Disqualification par Équipes",
    description: "Aucune disqualification possible, à quatre.",
    bonusNote: 8,
    risqueBlessure: 0.1,
    usure: 12,
    cout: 500,
  },
  {
    id: "tornado-tag",
    format: "2v2",
    nom: "Tornado Tag",
    description: "Les quatre catcheurs sont légaux en même temps, pas besoin de taguer.",
    bonusNote: 10,
    risqueBlessure: 0.11,
    usure: 12,
    cout: 600,
  },
  {
    id: "elimination-tag",
    format: "2v2",
    nom: "Match à Élimination",
    description: "Chaque catcheur éliminé un par un, jusqu'à la dernière équipe debout.",
    bonusNote: 12,
    risqueBlessure: 0.09,
    usure: 12,
    cout: 700,
  },
  {
    id: "cage-acier-tag",
    format: "2v2",
    nom: "Cage d'Acier par Équipes",
    description: "Combat à quatre enfermé dans une cage d'acier.",
    bonusNote: 13,
    risqueBlessure: 0.14,
    usure: 14,
    cout: 1400,
  },
  {
    id: "table-tag",
    format: "2v2",
    nom: "Table Match par Équipes",
    description: "Il faut passer les deux adversaires à travers une table pour gagner.",
    bonusNote: 11,
    risqueBlessure: 0.17,
    usure: 14,
    cout: 1000,
  },
  {
    id: "falls-count-anywhere-tag",
    format: "2v2",
    nom: "Falls Count Anywhere par Équipes",
    description: "Le combat à quatre peut se terminer n'importe où dans la salle.",
    bonusNote: 9,
    risqueBlessure: 0.11,
    usure: 12,
    cout: 700,
  },
  {
    id: "echelles-tag",
    format: "2v2",
    nom: "Match à Échelles par Équipes",
    description: "Un titre par équipes est suspendu au-dessus du ring.",
    bonusNote: 10,
    risqueBlessure: 0.14,
    usure: 14,
    cout: 1200,
  },
  {
    id: "hardcore-tag",
    format: "2v2",
    nom: "Hardcore Tag Team Match",
    description: "Armes autorisées, pas de disqualification, à quatre.",
    bonusNote: 12,
    risqueBlessure: 0.19,
    usure: 18,
    cout: 1300,
  },
  {
    id: "loser-leaves-town-tag",
    format: "2v2",
    nom: "Loser Leaves Town par Équipes",
    description: "Toute l'équipe perdante quitte la fédération. L'enjeu ultime pour clore une rivalité à quatre.",
    bonusNote: 16,
    risqueBlessure: 0.05,
    usure: 8,
    cout: 3500,
  },
  // Stipulations Triple Menace
  {
    id: "triple-classique",
    format: "triple-menace",
    nom: "Triple Menace Classique",
    description: "Trois catcheurs, chacun pour soi. N'importe qui peut gagner en tombé.",
    bonusNote: 6,
    risqueBlessure: 0.06,
    usure: 8,
    cout: 400,
  },
  {
    id: "triple-no-dq",
    format: "triple-menace",
    nom: "No Disqualification à Trois",
    description: "Aucune disqualification possible.",
    bonusNote: 9,
    risqueBlessure: 0.11,
    usure: 12,
    cout: 600,
  },
  {
    id: "triple-cage",
    format: "triple-menace",
    nom: "Cage d'Acier à Trois",
    description: "Trois catcheurs enfermés dans la même cage.",
    bonusNote: 12,
    risqueBlessure: 0.14,
    usure: 14,
    cout: 1200,
  },
  {
    id: "triple-falls-anywhere",
    format: "triple-menace",
    nom: "Falls Count Anywhere à Trois",
    description: "Le combat à trois peut se terminer n'importe où dans la salle.",
    bonusNote: 9,
    risqueBlessure: 0.12,
    usure: 12,
    cout: 700,
  },
  {
    id: "triple-hardcore",
    format: "triple-menace",
    nom: "Hardcore à Trois",
    description: "Armes autorisées, pas de disqualification.",
    bonusNote: 11,
    risqueBlessure: 0.19,
    usure: 16,
    cout: 1000,
  },
  {
    id: "triple-table",
    format: "triple-menace",
    nom: "Table Match à Trois",
    description: "Passer un adversaire à travers une table permet de gagner.",
    bonusNote: 10,
    risqueBlessure: 0.17,
    usure: 13,
    cout: 900,
  },
  {
    id: "triple-elimination",
    format: "triple-menace",
    nom: "Match à Élimination à Trois",
    description: "Chaque catcheur éliminé un par un, jusqu'au dernier debout.",
    bonusNote: 13,
    risqueBlessure: 0.1,
    usure: 14,
    cout: 800,
  },
  {
    id: "triple-echelles",
    format: "triple-menace",
    nom: "Match à Échelles à Trois",
    description: "Un objet est suspendu au-dessus du ring, trois prétendants.",
    bonusNote: 11,
    risqueBlessure: 0.15,
    usure: 14,
    cout: 1100,
  },

  // Stipulations Fatal 4-Way
  {
    id: "a4-classique",
    format: "a-4",
    nom: "Fatal 4-Way Classique",
    description: "Quatre catcheurs, chacun pour soi. N'importe qui peut gagner en tombé.",
    bonusNote: 8,
    risqueBlessure: 0.07,
    usure: 9,
    cout: 500,
  },
  {
    id: "a4-no-dq",
    format: "a-4",
    nom: "No Disqualification à Quatre",
    description: "Aucune disqualification possible.",
    bonusNote: 11,
    risqueBlessure: 0.12,
    usure: 13,
    cout: 700,
  },
  {
    id: "a4-cage",
    format: "a-4",
    nom: "Cage d'Acier à Quatre",
    description: "Quatre catcheurs enfermés dans la même cage.",
    bonusNote: 14,
    risqueBlessure: 0.15,
    usure: 15,
    cout: 1500,
  },
  {
    id: "a4-falls-anywhere",
    format: "a-4",
    nom: "Falls Count Anywhere à Quatre",
    description: "Le combat à quatre peut se terminer n'importe où dans la salle.",
    bonusNote: 10,
    risqueBlessure: 0.13,
    usure: 13,
    cout: 800,
  },
  {
    id: "a4-hardcore",
    format: "a-4",
    nom: "Hardcore à Quatre",
    description: "Armes autorisées, pas de disqualification.",
    bonusNote: 12,
    risqueBlessure: 0.2,
    usure: 17,
    cout: 1200,
  },
  {
    id: "a4-table",
    format: "a-4",
    nom: "Table Match à Quatre",
    description: "Passer un adversaire à travers une table permet de gagner.",
    bonusNote: 11,
    risqueBlessure: 0.18,
    usure: 14,
    cout: 1000,
  },
  {
    id: "a4-elimination",
    format: "a-4",
    nom: "Match à Élimination à Quatre",
    description: "Chaque catcheur éliminé un par un, jusqu'au dernier debout.",
    bonusNote: 15,
    risqueBlessure: 0.11,
    usure: 15,
    cout: 1000,
  },
  {
    id: "a4-echelles",
    format: "a-4",
    nom: "Match à Échelles à Quatre",
    description: "Un objet est suspendu au-dessus du ring, quatre prétendants.",
    bonusNote: 12,
    risqueBlessure: 0.16,
    usure: 15,
    cout: 1300,
  },

  // Battle Royal
  {
    id: "battle-royal",
    format: "battle-royal",
    nom: "Battle Royal",
    description: "Tous les catcheurs sur le ring en même temps, éliminés jusqu'au dernier debout.",
    bonusNote: 15,
    risqueBlessure: 0.1,
    usure: 10,
    cout: 1500,
  },
]

export function infoStipulation(id: MatchStipulation): StipulationInfo {
  return STIPULATIONS.find((s) => s.id === id) ?? STIPULATIONS[0]
}

export function stipulationsPourFormat(format: FormatMatch): StipulationInfo[] {
  return STIPULATIONS.filter((s) => s.format === format)
}

export const BONUS_TITRE = 10
export const RISQUE_TITRE = 0.02
export const USURE_TITRE = 2
