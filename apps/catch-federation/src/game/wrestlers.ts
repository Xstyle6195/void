import type { CategorieRecrutement, Genre, TypeContrat, Wrestler } from "./types"

const PRENOMS_HOMMES = [
  "Marcus", "Dante", "Ivan", "Kaito", "Bruno", "Silas", "Rex", "Theo",
  "Rocco", "Diego", "Magnus", "Otis", "Leon", "Jax", "Kane", "Viktor",
  "Boris",
]

const PRENOMS_FEMMES = [
  "Nova", "Zara", "Talia", "Amara", "Selene", "Raya", "Storm",
  "Freya", "Ines", "Lyra", "Mila", "Nadia", "Ondine", "Sasha", "Vera",
  "Yara", "Zoe",
]

const NOMS = [
  "Volkov", "Cruz", "Steele", "Diamond", "Savage", "Vance", "Reyes",
  "Blackwood", "Sterling", "Cole", "Rourke", "Vega", "Slade", "Marchetti",
  "Duval", "Kross", "Voss", "Ryder", "Falcone", "Wolfe", "Hex", "Stone",
]

const STYLES = ["technique", "puissance", "aérien", "hardcore", "catch-mental"] as const

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(items: T[]): T {
  return items[randInt(0, items.length - 1)]
}

const SEUIL_FANS_PROGRESSION = 15000

// 0 = fédération tout juste lancée (petites stars locales), 1 = fédération installée (vedettes confirmées)
export function progressionDepuisFans(fans: number): number {
  return Math.max(0, Math.min(1, fans / SEUIL_FANS_PROGRESSION))
}

export const TAILLE_MARCHE_PAR_CATEGORIE = 10
export const SEMAINES_PAR_CONTRAT_PERMANENT = 156 // 3 ans

const DUREES_TEMPORAIRES = [1, 3, 6] as const
const SEMAINES_PAR_MOIS = 4
const COUT_SIGNATURE_TEMPORAIRE: Record<number, number> = { 1: 900, 3: 650, 6: 500 }
const COUT_SIGNATURE_PERMANENT = 300
const COUT_SIGNATURE_JOBBEUR = 100

interface OptionsGeneration {
  progression?: number
  categorie?: CategorieRecrutement
  typeContrat?: TypeContrat
}

export function generateWrestler(options: OptionsGeneration = {}): Wrestler {
  const { progression = 0, categorie = "officiel", typeContrat = "permanent" } = options
  const p = Math.max(0, Math.min(1, progression))
  const genre: Genre = Math.random() < 0.5 ? "homme" : "femme"
  const nom = `${pick(genre === "homme" ? PRENOMS_HOMMES : PRENOMS_FEMMES)} ${pick(NOMS)}`
  const alignment = Math.random() < 0.5 ? "face" : "heel"
  const style = pick([...STYLES])
  const debutant = categorie === "officiel" && typeContrat === "permanent" && Math.random() < 0.15

  let min: number
  let max: number
  let populariteMax: number
  if (categorie === "jobbeur") {
    ;[min, max] = [5, 25]
    populariteMax = 8
  } else {
    const [baseMin, baseMax] = debutant
      ? [Math.round(10 + p * 10), Math.round(35 + p * 25)]
      : [Math.round(15 + p * 20), Math.round(45 + p * 50)]
    const bonus = typeContrat === "temporaire" ? 20 : 0
    min = Math.min(95, baseMin + bonus)
    max = Math.min(100, baseMax + bonus)
    populariteMax =
      (debutant ? Math.round(5 + p * 15) : Math.round(15 + p * 40)) + (typeContrat === "temporaire" ? 20 : 0)
  }

  const charisme = randInt(min, max)
  const technique = randInt(min, max)
  const force = randInt(min, max)
  const moyenne = (charisme + technique + force) / 3

  const salaireBase = categorie === "jobbeur" ? 60 : debutant ? 80 : 200
  const salaireMultiplicateur = categorie === "jobbeur" ? 2 : debutant ? 3 : 8
  const salairePremium = typeContrat === "temporaire" ? 1.6 : 1
  const salaire = Math.round((salaireBase + moyenne * salaireMultiplicateur) * salairePremium)

  const dureeMoisContrat = typeContrat === "temporaire" ? pick([...DUREES_TEMPORAIRES]) : null
  const contratSemaines =
    typeContrat === "temporaire" && dureeMoisContrat
      ? dureeMoisContrat * SEMAINES_PAR_MOIS
      : SEMAINES_PAR_CONTRAT_PERMANENT
  const coutSignature =
    categorie === "jobbeur"
      ? COUT_SIGNATURE_JOBBEUR
      : typeContrat === "temporaire" && dureeMoisContrat
        ? COUT_SIGNATURE_TEMPORAIRE[dureeMoisContrat]
        : COUT_SIGNATURE_PERMANENT

  return {
    id: nextId("w"),
    name: nom,
    genre,
    debutant,
    alignment,
    style,
    categorie,
    typeContrat,
    dureeMoisContrat,
    coutSignature,
    charisme,
    technique,
    force,
    popularite: randInt(5, Math.max(6, populariteMax)),
    moral: randInt(50, 80),
    forme: 100,
    age: debutant ? randInt(18, 24) : randInt(20, 40),
    salaire,
    contratSemaines,
    blessureSemaines: 0,
    titreId: null,
  }
}

export function genererOfficiels(taille: number, progression = 0): Wrestler[] {
  return Array.from({ length: taille }, () =>
    generateWrestler({
      progression,
      categorie: "officiel",
      typeContrat: Math.random() < 0.3 ? "temporaire" : "permanent",
    }),
  )
}

export function genererJobbeurs(taille: number): Wrestler[] {
  return Array.from({ length: taille }, () => generateWrestler({ categorie: "jobbeur" }))
}

export function creerMarcheTransferts(
  tailleParCategorie: number = TAILLE_MARCHE_PAR_CATEGORIE,
  progression = 0,
): Wrestler[] {
  return [...genererOfficiels(tailleParCategorie, progression), ...genererJobbeurs(tailleParCategorie)]
}
