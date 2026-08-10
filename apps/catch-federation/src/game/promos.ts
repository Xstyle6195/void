export type TypePromo = "interview" | "confrontation" | "celebration" | "defi"

export interface InfoPromo {
  id: TypePromo
  nom: string
  description: string
  participantsMin: number
  participantsMax: number
  cout: number
  bonusNote: number
  bonusPopularite: number
  bonusMoral: number
}

export const PROMOS: InfoPromo[] = [
  {
    id: "interview",
    nom: "Interview",
    description: "Un catcheur seul face caméra pour développer son personnage.",
    participantsMin: 1,
    participantsMax: 1,
    cout: 100,
    bonusNote: 2,
    bonusPopularite: 4,
    bonusMoral: 2,
  },
  {
    id: "confrontation",
    nom: "Confrontation",
    description: "Deux catcheurs se font face pour attiser une rivalité.",
    participantsMin: 2,
    participantsMax: 2,
    cout: 150,
    bonusNote: 4,
    bonusPopularite: 5,
    bonusMoral: 0,
  },
  {
    id: "celebration",
    nom: "Célébration",
    description: "Un ou deux catcheurs célèbrent une victoire ou un titre devant le public.",
    participantsMin: 1,
    participantsMax: 2,
    cout: 80,
    bonusNote: 2,
    bonusPopularite: 3,
    bonusMoral: 6,
  },
  {
    id: "defi",
    nom: "Défi",
    description: "Un ou deux catcheurs provoquent un adversaire, quitte à diviser le public.",
    participantsMin: 1,
    participantsMax: 2,
    cout: 200,
    bonusNote: 5,
    bonusPopularite: 6,
    bonusMoral: -1,
  },
]

export function infoPromo(id: TypePromo): InfoPromo {
  return PROMOS.find((p) => p.id === id) ?? PROMOS[0]
}
