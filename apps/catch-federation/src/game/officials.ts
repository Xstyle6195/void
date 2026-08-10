export type RoleOfficiel = "marketing" | "artistique" | "adjoint"

export interface CandidatOfficiel {
  id: string
  role: RoleOfficiel
  nom: string
  niveau: "Débutant" | "Confirmé" | "Expert"
  coutRecrutement: number
  salaire: number
  bonus: number
}

export const ROLES_INFO: Record<RoleOfficiel, { label: string; description: string; uniteBonus: string }> = {
  marketing: {
    label: "Directeur Marketing",
    description: "Améliore le rendement des campagnes marketing et conseille sur la prochaine à lancer.",
    uniteBonus: "% de fans en plus par campagne",
  },
  artistique: {
    label: "Directeur Artistique",
    description: "Améliore la qualité des matchs et suggère des rivalités entre lutteurs.",
    uniteBonus: "points de note en plus par match",
  },
  adjoint: {
    label: "Adjoint",
    description: "Optimise les finances et conseille sur le recrutement, les titres et les divisions.",
    uniteBonus: "% de dépenses en moins",
  },
}

export const CANDIDATS_OFFICIELS: CandidatOfficiel[] = [
  { id: "mkt-1", role: "marketing", nom: "Léa Fontaine", niveau: "Débutant", coutRecrutement: 1000, salaire: 150, bonus: 10 },
  { id: "mkt-2", role: "marketing", nom: "Marc Aubry", niveau: "Confirmé", coutRecrutement: 3000, salaire: 350, bonus: 20 },
  { id: "mkt-3", role: "marketing", nom: "Sofia Reyes", niveau: "Expert", coutRecrutement: 7000, salaire: 600, bonus: 35 },

  { id: "art-1", role: "artistique", nom: "Tom Girard", niveau: "Débutant", coutRecrutement: 1000, salaire: 150, bonus: 3 },
  { id: "art-2", role: "artistique", nom: "Elena Cruz", niveau: "Confirmé", coutRecrutement: 3000, salaire: 350, bonus: 6 },
  { id: "art-3", role: "artistique", nom: "Julian Moss", niveau: "Expert", coutRecrutement: 7000, salaire: 600, bonus: 10 },

  { id: "adj-1", role: "adjoint", nom: "Nora Bissette", niveau: "Débutant", coutRecrutement: 1000, salaire: 150, bonus: 8 },
  { id: "adj-2", role: "adjoint", nom: "Hugo Lattes", niveau: "Confirmé", coutRecrutement: 3000, salaire: 350, bonus: 15 },
  { id: "adj-3", role: "adjoint", nom: "Camille Norris", niveau: "Expert", coutRecrutement: 7000, salaire: 600, bonus: 25 },
]

export function candidatParId(id: string): CandidatOfficiel | undefined {
  return CANDIDATS_OFFICIELS.find((c) => c.id === id)
}
