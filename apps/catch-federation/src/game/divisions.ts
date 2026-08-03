import type { Division } from "./types"

export interface DivisionInfo {
  id: Division
  label: string
  description: string
  cout: number
  fansMinimum: number
  debloqueeParDefaut: boolean
}

export const DIVISIONS_INFO: DivisionInfo[] = [
  {
    id: "masculine",
    label: "Division Masculine",
    description: "Le roster principal masculin de la fédération.",
    cout: 0,
    fansMinimum: 0,
    debloqueeParDefaut: true,
  },
  {
    id: "feminine",
    label: "Division Féminine",
    description: "Le roster principal féminin de la fédération.",
    cout: 0,
    fansMinimum: 0,
    debloqueeParDefaut: true,
  },
  {
    id: "equipe",
    label: "Division par Équipes",
    description: "Des duos qui s'affrontent en tag team.",
    cout: 4000,
    fansMinimum: 6000,
    debloqueeParDefaut: false,
  },
  {
    id: "jeune_talent",
    label: "Division Jeune Talent",
    description: "Des espoirs à faire progresser avant de les intégrer au roster principal.",
    cout: 3000,
    fansMinimum: 3000,
    debloqueeParDefaut: false,
  },
]

export function infoDivision(division: Division): DivisionInfo {
  const info = DIVISIONS_INFO.find((d) => d.id === division)
  if (!info) throw new Error(`Division inconnue : ${division}`)
  return info
}

export function labelDivision(division: Division): string {
  return infoDivision(division).label
}

export const DIVISIONS_DEBLOCABLES: Division[] = DIVISIONS_INFO.filter(
  (d) => !d.debloqueeParDefaut,
).map((d) => d.id)
