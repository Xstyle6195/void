import type { Alignment, MoveStyle, Wrestler } from "./types"

const PRENOMS = [
  "Marcus", "Dante", "Ivan", "Kaito", "Bruno", "Silas", "Rex", "Theo",
  "Nova", "Zara", "Talia", "Rocco", "Diego", "Magnus", "Otis", "Leon",
  "Jax", "Kane", "Viktor", "Boris", "Amara", "Selene", "Raya", "Storm",
]

const NOMS = [
  "Volkov", "Cruz", "Steele", "Diamond", "Savage", "Vance", "Reyes",
  "Blackwood", "Sterling", "Cole", "Rourke", "Vega", "Slade", "Marchetti",
  "Duval", "Kross", "Voss", "Ryder", "Falcone", "Wolfe", "Hex", "Stone",
]

const STYLES: MoveStyle[] = ["technique", "puissance", "aérien", "hardcore", "catch-mental"]

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
  const alignment: Alignment = Math.random() < 0.5 ? "face" : "heel"
  const style = pick(STYLES)
  const charisme = randInt(30, 90)
  const technique = randInt(30, 90)
  const force = randInt(30, 90)
  const moyenne = (charisme + technique + force) / 3
  return {
    id: nextId("w"),
    name: nom,
    alignment,
    style,
    charisme,
    technique,
    force,
    popularite: randInt(10, 40),
    moral: randInt(50, 80),
    forme: 100,
    age: randInt(20, 40),
    salaire: Math.round(200 + moyenne * 8),
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
