import type { Alignment, Genre, MoveStyle, TypeContrat, Wrestler } from "./types"

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

export interface FiltresLutteurs {
  genre: Genre | "tous"
  style: MoveStyle | "tous"
  alignment: Alignment | "tous"
  contrat: TypeContrat | "tous"
}

export const FILTRES_PAR_DEFAUT: FiltresLutteurs = {
  genre: "tous",
  style: "tous",
  alignment: "tous",
  contrat: "tous",
}

export const OPTIONS_FILTRE_GENRE: { value: FiltresLutteurs["genre"]; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "homme", label: "Catcheurs (hommes)" },
  { value: "femme", label: "Catcheuses (femmes)" },
]

export const OPTIONS_FILTRE_STYLE: { value: FiltresLutteurs["style"]; label: string }[] = [
  { value: "tous", label: "Toutes" },
  { value: "technique", label: "Technique" },
  { value: "puissance", label: "Puissance" },
  { value: "aérien", label: "Aérien" },
  { value: "hardcore", label: "Hardcore" },
  { value: "catch-mental", label: "Catch-mental" },
]

export const OPTIONS_FILTRE_ALIGNMENT: { value: FiltresLutteurs["alignment"]; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "face", label: "Face" },
  { value: "heel", label: "Heel" },
]

export const OPTIONS_FILTRE_CONTRAT: { value: FiltresLutteurs["contrat"]; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "temporaire", label: "Guest star seulement" },
  { value: "permanent", label: "Contrat permanent seulement" },
]

export function filtresActifs(filtres: FiltresLutteurs): boolean {
  return (
    filtres.genre !== "tous" ||
    filtres.style !== "tous" ||
    filtres.alignment !== "tous" ||
    filtres.contrat !== "tous"
  )
}

export function filtrerLutteurs(lutteurs: Wrestler[], filtres: FiltresLutteurs): Wrestler[] {
  return lutteurs.filter(
    (w) =>
      (filtres.genre === "tous" || w.genre === filtres.genre) &&
      (filtres.style === "tous" || w.style === filtres.style) &&
      (filtres.alignment === "tous" || w.alignment === filtres.alignment) &&
      (filtres.contrat === "tous" || w.typeContrat === filtres.contrat),
  )
}
