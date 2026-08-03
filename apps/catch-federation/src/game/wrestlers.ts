import type { Division, Wrestler } from "./types"

const PRENOMS_HOMMES = [
  "Marcus", "Dante", "Ivan", "Kaito", "Bruno", "Silas", "Rex", "Theo",
  "Rocco", "Diego", "Magnus", "Otis", "Leon", "Jax", "Kane", "Viktor",
  "Boris",
]

const PRENOMS_FEMMES = [
  "Nova", "Zara", "Talia", "Amara", "Selene", "Raya", "Storm", "Freya",
  "Ines", "Lyra", "Mila", "Nadia", "Ondine", "Sasha", "Vera", "Yara",
  "Zoe",
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

function nomPourDivision(division: Division): string {
  const prenoms =
    division === "feminine"
      ? PRENOMS_FEMMES
      : division === "masculine"
        ? PRENOMS_HOMMES
        : Math.random() < 0.5
          ? PRENOMS_HOMMES
          : PRENOMS_FEMMES
  return `${pick(prenoms)} ${pick(NOMS)}`
}

export function generateWrestler(division: Division): Wrestler {
  const nom = nomPourDivision(division)
  const alignment = Math.random() < 0.5 ? "face" : "heel"
  const style = pick([...STYLES])
  const debutant = division === "jeune_talent"
  const [min, max] = debutant ? [15, 55] : [30, 90]
  const charisme = randInt(min, max)
  const technique = randInt(min, max)
  const force = randInt(min, max)
  const moyenne = (charisme + technique + force) / 3
  return {
    id: nextId("w"),
    name: nom,
    division,
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

export function genererAgentLibre(): Wrestler {
  return generateWrestler(Math.random() < 0.5 ? "masculine" : "feminine")
}

export function creerRosterInitial(): Wrestler[] {
  const masculins = Array.from({ length: 6 }, () => generateWrestler("masculine"))
  const feminins = Array.from({ length: 6 }, () => generateWrestler("feminine"))
  return [...masculins, ...feminins]
}

export function creerMarcheTransferts(taille: number): Wrestler[] {
  return Array.from({ length: taille }, genererAgentLibre)
}

export function creerDivision(division: Division, taille: number): Wrestler[] {
  return Array.from({ length: taille }, () => generateWrestler(division))
}
