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

export interface StipulationInfo {
  id: MatchStipulation
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
    nom: "Match Normal",
    description: "Pas de règle particulière.",
    bonusNote: 0,
    risqueBlessure: 0.04,
    usure: 6,
    cout: 0,
  },
  {
    id: "no-dq",
    nom: "No Disqualification",
    description: "Aucune disqualification possible.",
    bonusNote: 5,
    risqueBlessure: 0.09,
    usure: 10,
    cout: 300,
  },
  {
    id: "echelles",
    nom: "Match à Échelles",
    description: "Un objet est suspendu au-dessus du ring.",
    bonusNote: 8,
    risqueBlessure: 0.13,
    usure: 12,
    cout: 800,
  },
  {
    id: "cage-acier",
    nom: "Cage d'Acier",
    description: "Combat enfermé dans une cage : victoire par soumission, KO ou sortie de cage.",
    bonusNote: 10,
    risqueBlessure: 0.12,
    usure: 12,
    cout: 1000,
  },
  {
    id: "hell-in-a-cell",
    nom: "Hell in a Cell",
    description: "La version géante et grillagée de la cage, très violente.",
    bonusNote: 16,
    risqueBlessure: 0.2,
    usure: 18,
    cout: 3000,
  },
  {
    id: "falls-count-anywhere",
    nom: "Falls Count Anywhere",
    description: "Le combat peut se terminer n'importe où dans la salle.",
    bonusNote: 7,
    risqueBlessure: 0.1,
    usure: 10,
    cout: 500,
  },
  {
    id: "last-man-standing",
    nom: "Last Man Standing",
    description: "Victoire seulement si l'adversaire ne se relève pas avant 10.",
    bonusNote: 9,
    risqueBlessure: 0.14,
    usure: 14,
    cout: 700,
  },
  {
    id: "soumission",
    nom: "Match de Soumission",
    description: "Seule une soumission peut y mettre fin.",
    bonusNote: 6,
    risqueBlessure: 0.06,
    usure: 8,
    cout: 400,
  },
  {
    id: "trois-tombes",
    nom: "2 sur 3 Tombés",
    description: "Le premier à obtenir deux tombés gagne.",
    bonusNote: 11,
    risqueBlessure: 0.08,
    usure: 14,
    cout: 600,
  },
  {
    id: "first-blood",
    nom: "First Blood",
    description: "Le premier qui saigne perd.",
    bonusNote: 8,
    risqueBlessure: 0.15,
    usure: 10,
    cout: 600,
  },
  {
    id: "hardcore",
    nom: "Hardcore Match",
    description: "Armes autorisées, pas de disqualification.",
    bonusNote: 10,
    risqueBlessure: 0.18,
    usure: 16,
    cout: 900,
  },
  {
    id: "table",
    nom: "Table Match",
    description: "Il faut passer l'adversaire à travers une table pour gagner.",
    bonusNote: 9,
    risqueBlessure: 0.16,
    usure: 12,
    cout: 800,
  },
  {
    id: "casket",
    nom: "Casket Match",
    description: "Victoire en enfermant l'adversaire dans un cercueil.",
    bonusNote: 12,
    risqueBlessure: 0.15,
    usure: 12,
    cout: 1500,
  },
  {
    id: "i-quit",
    nom: "I Quit Match",
    description: "L'adversaire doit dire « j'abandonne » pour perdre.",
    bonusNote: 7,
    risqueBlessure: 0.1,
    usure: 10,
    cout: 500,
  },
  {
    id: "loser-leaves-town",
    nom: "Loser Leaves Town",
    description: "Le perdant est contraint de quitter la fédération. Idéal pour clore une rivalité.",
    bonusNote: 14,
    risqueBlessure: 0.05,
    usure: 8,
    cout: 2000,
  },
]

export function infoStipulation(id: MatchStipulation): StipulationInfo {
  return STIPULATIONS.find((s) => s.id === id) ?? STIPULATIONS[0]
}

export const BONUS_TITRE = 10
export const RISQUE_TITRE = 0.02
export const USURE_TITRE = 2
