export type PalierRivale = "locale" | "regionale" | "nationale" | "mondiale"

export interface FederationRivale {
  id: string
  nom: string
  palier: PalierRivale
  fans: number
  popularite: number
  argent: number
  force: number
}

export const SEUIL_PALIER: Record<PalierRivale, number> = {
  locale: 0,
  regionale: 4000,
  nationale: 25000,
  mondiale: 120000,
}

const ORDRE_PALIERS: PalierRivale[] = ["locale", "regionale", "nationale", "mondiale"]

export const LABEL_PALIER: Record<PalierRivale, string> = {
  locale: "Locale",
  regionale: "Régionale",
  nationale: "Nationale",
  mondiale: "Mondiale",
}

const TAUX_CROISSANCE: Record<PalierRivale, [number, number]> = {
  locale: [0.02, 0.08],
  regionale: [0.015, 0.05],
  nationale: [0.01, 0.03],
  mondiale: [0.005, 0.02],
}

interface ModeleRivale {
  nom: string
  palier: PalierRivale
  fans: [number, number]
  popularite: [number, number]
  argent: [number, number]
  force: [number, number]
}

const MODELES: ModeleRivale[] = [
  { nom: "Backyard Wrestling Alliance", palier: "locale", fans: [500, 2000], popularite: [10, 20], argent: [3000, 10000], force: [20, 35] },
  { nom: "Choc Régional du Vendredi", palier: "locale", fans: [800, 2800], popularite: [12, 22], argent: [4000, 12000], force: [22, 38] },
  { nom: "Underground Grapple Club", palier: "locale", fans: [400, 1800], popularite: [8, 18], argent: [2500, 9000], force: [18, 32] },

  { nom: "Pro Wrestling Circuit", palier: "regionale", fans: [4500, 15000], popularite: [25, 40], argent: [20000, 70000], force: [40, 55] },
  { nom: "Alliance du Sud", palier: "regionale", fans: [5000, 18000], popularite: [28, 42], argent: [25000, 80000], force: [42, 58] },
  { nom: "Coastal Championship Wrestling", palier: "regionale", fans: [4000, 14000], popularite: [24, 38], argent: [18000, 65000], force: [38, 52] },

  { nom: "National Wrestling Federation", palier: "nationale", fans: [28000, 70000], popularite: [45, 62], argent: [150000, 400000], force: [60, 75] },
  { nom: "Elite Grappling Alliance", palier: "nationale", fans: [26000, 65000], popularite: [43, 60], argent: [130000, 380000], force: [58, 73] },

  { nom: "World Championship Catch", palier: "mondiale", fans: [110000, 280000], popularite: [70, 88], argent: [800000, 2500000], force: [80, 95] },
  { nom: "Global Wrestling Empire", palier: "mondiale", fans: [130000, 320000], popularite: [72, 92], argent: [900000, 3000000], force: [82, 98] },
]

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function idRivale(nom: string, index: number): string {
  return `riv-${index}-${nom.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
}

export function creerRivales(): FederationRivale[] {
  return MODELES.map((m, index) => ({
    id: idRivale(m.nom, index),
    nom: m.nom,
    palier: m.palier,
    fans: randInt(...m.fans),
    popularite: randInt(...m.popularite),
    argent: randInt(...m.argent),
    force: randInt(...m.force),
  }))
}

export function palierPourFans(fans: number): PalierRivale {
  let resultat: PalierRivale = "locale"
  for (const palier of ORDRE_PALIERS) {
    if (fans >= SEUIL_PALIER[palier]) resultat = palier
  }
  return resultat
}

export function evoluerRivales(rivales: FederationRivale[]): FederationRivale[] {
  return rivales.map((r) => {
    const [tauxMin, tauxMax] = TAUX_CROISSANCE[r.palier]
    const taux = tauxMin + Math.random() * (tauxMax - tauxMin)
    const nouveauxFans = Math.round(r.fans * taux) + randInt(-10, 30)
    const fans = Math.max(0, r.fans + nouveauxFans)
    const popularite = Math.round(Math.max(0, Math.min(100, r.popularite + randInt(-2, 3))))
    const argent = Math.max(0, r.argent + Math.round(r.argent * (taux * 0.6)) + randInt(-500, 1500))
    return { ...r, fans, popularite, argent, palier: palierPourFans(fans) }
  })
}

export function valorisationRivale(rivale: FederationRivale): number {
  return Math.round(rivale.fans * 2 + rivale.argent * 0.5)
}

export function forceMoyenneRivalesActives(rivales: FederationRivale[]): number {
  if (rivales.length === 0) return 0
  return rivales.reduce((acc, r) => acc + r.force, 0) / rivales.length
}
