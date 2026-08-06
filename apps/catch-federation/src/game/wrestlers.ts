import type { Wrestler } from "./types"

const PRENOMS = [
  "Marcus", "Dante", "Ivan", "Kaito", "Bruno", "Silas", "Rex", "Theo",
  "Rocco", "Diego", "Magnus", "Otis", "Leon", "Jax", "Kane", "Viktor",
  "Boris", "Nova", "Zara", "Talia", "Amara", "Selene", "Raya", "Storm",
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

export function generateWrestler(): Wrestler {
  const nom = `${pick(PRENOMS)} ${pick(NOMS)}`
  const alignment = Math.random() < 0.5 ? "face" : "heel"
  const style = pick([...STYLES])
  const debutant = Math.random() < 0.15
  const [min, max] = debutant ? [15, 55] : [30, 90]
  const charisme = randInt(min, max)
  const technique = randInt(min, max)
  const force = randInt(min, max)
  const moyenne = (charisme + technique + force) / 3
  return {
    id: nextId("w"),
    name: nom,
    debutant,
    alignment,
    style,
    charisme,
    technique,
    force,
    popularite: randInt(5, debutant ? 15 : 40),
    moral: randInt(50, 80),
    forme: 100,
    age: debutant ? randInt(18, 24) : randInt(20, 40),
    salaire: Math.round((debutant ? 80 : 200) + moyenne * (debutant ? 3 : 8)),
    contratSemaines: randInt(12, 30),
    blessureSemaines: 0,
    titreId: null,
  }
}

export function creerRosterInitial(taille: number): Wrestler[] {
  return Array.from({ length: taille }, generateWrestler)
}

export function creerMarcheTransferts(taille: number): Wrestler[] {
  return Array.from({ length: taille }, generateWrestler)
}
