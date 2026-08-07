import type { Genre, Wrestler } from "./types"

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

export function generateWrestler(progression = 0): Wrestler {
  const p = Math.max(0, Math.min(1, progression))
  const genre: Genre = Math.random() < 0.5 ? "homme" : "femme"
  const nom = `${pick(genre === "homme" ? PRENOMS_HOMMES : PRENOMS_FEMMES)} ${pick(NOMS)}`
  const alignment = Math.random() < 0.5 ? "face" : "heel"
  const style = pick([...STYLES])
  const debutant = Math.random() < 0.15
  const [min, max] = debutant
    ? [Math.round(10 + p * 10), Math.round(35 + p * 25)]
    : [Math.round(15 + p * 20), Math.round(45 + p * 50)]
  const charisme = randInt(min, max)
  const technique = randInt(min, max)
  const force = randInt(min, max)
  const moyenne = (charisme + technique + force) / 3
  const populariteMax = debutant ? Math.round(5 + p * 15) : Math.round(15 + p * 40)
  return {
    id: nextId("w"),
    name: nom,
    genre,
    debutant,
    alignment,
    style,
    charisme,
    technique,
    force,
    popularite: randInt(5, Math.max(6, populariteMax)),
    moral: randInt(50, 80),
    forme: 100,
    age: debutant ? randInt(18, 24) : randInt(20, 40),
    salaire: Math.round((debutant ? 80 : 200) + moyenne * (debutant ? 3 : 8)),
    contratSemaines: randInt(12, 30),
    blessureSemaines: 0,
    titreId: null,
  }
}

export function creerMarcheTransferts(taille: number, progression = 0): Wrestler[] {
  return Array.from({ length: taille }, () => generateWrestler(progression))
}
