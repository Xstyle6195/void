import type { Wrestler } from "./types"

export type TriMarche = "aucun" | "sexe" | "niveau" | "specialite" | "alignment"

export const OPTIONS_TRI: { value: TriMarche; label: string }[] = [
  { value: "aucun", label: "Par défaut" },
  { value: "niveau", label: "Niveau" },
  { value: "sexe", label: "Sexe" },
  { value: "specialite", label: "Spécialité" },
  { value: "alignment", label: "Heel / Face" },
]

function niveauLutteur(w: Wrestler): number {
  return (w.charisme + w.technique + w.force) / 3
}

export function trierLutteurs(lutteurs: Wrestler[], tri: TriMarche): Wrestler[] {
  const copie = [...lutteurs]
  switch (tri) {
    case "niveau":
      return copie.sort((a, b) => niveauLutteur(b) - niveauLutteur(a))
    case "sexe":
      return copie.sort((a, b) => a.genre.localeCompare(b.genre))
    case "specialite":
      return copie.sort((a, b) => a.style.localeCompare(b.style))
    case "alignment":
      return copie.sort((a, b) => a.alignment.localeCompare(b.alignment))
    default:
      return copie
  }
}
