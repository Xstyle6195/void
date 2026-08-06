export type FormatMatch = "1v1" | "2v2"

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
