import type { Wrestler } from "./types"
import { generateWrestler } from "./wrestlers"

export type PalierRivale = "locale" | "regionale" | "nationale" | "mondiale"

export interface FederationRivale {
  id: string
  nom: string
  palier: PalierRivale
  fans: number
  popularite: number
  argent: number
  force: number
  roster: Wrestler[]
  titreChampionId: string | null
}

export interface Article {
  id: string
  semaine: number
  titre: string
  corps: string
  rivaleId: string | null
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

// Sert à la fois à la croissance hebdomadaire et à générer des catcheurs dont le niveau
// correspond au standing de la fédération rivale (une mondiale recrute mieux qu'une locale).
export const PROGRESSION_PAR_PALIER: Record<PalierRivale, number> = {
  locale: 0.1,
  regionale: 0.35,
  nationale: 0.65,
  mondiale: 0.9,
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

const TAILLE_ROSTER_RIVALE = 5
const MULTIPLICATEUR_DEBAUCHAGE = 2.5

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(items: T[]): T {
  return items[randInt(0, items.length - 1)]
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, value)))
}

function idRivale(nom: string, index: number): string {
  return `riv-${index}-${nom.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
}

function idArticle(): string {
  return `art-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

function genererRosterRival(palier: PalierRivale): Wrestler[] {
  return Array.from({ length: TAILLE_ROSTER_RIVALE }, () =>
    generateWrestler({ progression: PROGRESSION_PAR_PALIER[palier] }),
  )
}

export function creerRivales(): FederationRivale[] {
  return MODELES.map((m, index) => {
    const roster = genererRosterRival(m.palier)
    const champion = pick(roster)
    return {
      id: idRivale(m.nom, index),
      nom: m.nom,
      palier: m.palier,
      fans: randInt(...m.fans),
      popularite: randInt(...m.popularite),
      argent: randInt(...m.argent),
      force: randInt(...m.force),
      roster,
      titreChampionId: champion.id,
    }
  })
}

export function palierPourFans(fans: number): PalierRivale {
  let resultat: PalierRivale = "locale"
  for (const palier of ORDRE_PALIERS) {
    if (fans >= SEUIL_PALIER[palier]) resultat = palier
  }
  return resultat
}

// Prix pour débaucher un catcheur d'une fédération rivale : plus cher qu'une signature
// classique, puisqu'il faut le convaincre de rompre son contrat en cours.
export function coutRecrutementRival(lutteur: Wrestler): number {
  return Math.round(lutteur.coutSignature * MULTIPLICATEUR_DEBAUCHAGE)
}

interface ResultatEvenementsRoster {
  roster: Wrestler[]
  titreChampionId: string | null
  articles: Article[]
}

// Simule les à-côtés de la fédération rivale cette semaine : titre défendu, perdu ou remis en jeu,
// blessure, retour de blessure, retraite (remplacée par un nouveau venu), révélation d'un jeune
// espoir, ou simplement un show qui marque les esprits (en bien ou en mal).
function evenementsRosterRival(rivale: FederationRivale, semaine: number): ResultatEvenementsRoster {
  let roster = rivale.roster.map((w) => ({ ...w }))
  let titreChampionId = rivale.titreChampionId
  const articles: Article[] = []

  const article = (titre: string, corps: string) => {
    articles.push({ id: idArticle(), semaine, titre, corps, rivaleId: rivale.id })
  }

  const actifs = roster.filter((w) => w.blessureSemaines === 0)
  const rouleau = Math.random()

  if (rouleau < 0.1 && titreChampionId && actifs.filter((w) => w.id !== titreChampionId).length > 0) {
    const champion = roster.find((w) => w.id === titreChampionId)
    const challenger = pick(actifs.filter((w) => w.id !== titreChampionId))
    if (champion) {
      if (Math.random() < 0.65) {
        article(
          `${champion.name} conserve son titre chez ${rivale.nom}`,
          `${champion.name} a défendu victorieusement son titre face à ${challenger.name} lors du dernier show de ${rivale.nom}.`,
        )
        roster = roster.map((w) => (w.id === champion.id ? { ...w, popularite: clamp(w.popularite + 3) } : w))
      } else {
        titreChampionId = challenger.id
        article(
          `Séisme chez ${rivale.nom} : ${challenger.name} devient champion`,
          `Coup de tonnerre : ${challenger.name} a détrôné ${champion.name} et remporte le titre principal de ${rivale.nom}.`,
        )
        roster = roster.map((w) => (w.id === challenger.id ? { ...w, popularite: clamp(w.popularite + 12) } : w))
      }
    }
  } else if (rouleau < 0.16 && !titreChampionId && actifs.length > 0) {
    const nouveauChampion = pick(actifs)
    titreChampionId = nouveauChampion.id
    roster = roster.map((w) => (w.id === nouveauChampion.id ? { ...w, popularite: clamp(w.popularite + 12) } : w))
    article(
      `${nouveauChampion.name} remporte le titre vacant de ${rivale.nom}`,
      `Le titre laissé vacant chez ${rivale.nom} a trouvé preneur : ${nouveauChampion.name} devient le nouveau champion.`,
    )
  } else if (rouleau < 0.28 && actifs.length > 0) {
    const victime = pick(actifs)
    roster = roster.map((w) => (w.id === victime.id ? { ...w, blessureSemaines: randInt(2, 8) } : w))
    article(
      `${victime.name} blessé chez ${rivale.nom}`,
      `${victime.name} s'est gravement blessé cette semaine et sera absent des rings de ${rivale.nom} pour un moment.`,
    )
  } else if (rouleau < 0.36) {
    const blesses = roster.filter((w) => w.blessureSemaines > 0)
    if (blesses.length > 0) {
      const retour = pick(blesses)
      roster = roster.map((w) => (w.id === retour.id ? { ...w, blessureSemaines: 0 } : w))
      article(
        `${retour.name} de retour chez ${rivale.nom}`,
        `Après plusieurs semaines d'absence, ${retour.name} fait son retour sur les rings de ${rivale.nom}.`,
      )
    }
  } else if (rouleau < 0.42 && actifs.filter((w) => w.id !== titreChampionId).length > 0) {
    const partant = pick(actifs.filter((w) => w.id !== titreChampionId))
    roster = roster.filter((w) => w.id !== partant.id)
    const nouveau = generateWrestler({ progression: PROGRESSION_PAR_PALIER[rivale.palier] })
    roster.push(nouveau)
    article(
      `${partant.name} prend sa retraite`,
      `${partant.name} annonce la fin de sa carrière après des années passées chez ${rivale.nom}.`,
    )
    article(
      `${nouveau.name} rejoint ${rivale.nom}`,
      `${rivale.nom} annonce la signature d'un nouveau catcheur : ${nouveau.name}.`,
    )
  } else if (rouleau < 0.54) {
    const espoirs = actifs.filter((w) => w.popularite < 40)
    if (espoirs.length > 0) {
      const espoir = pick(espoirs)
      roster = roster.map((w) => (w.id === espoir.id ? { ...w, popularite: clamp(w.popularite + 15) } : w))
      article(
        `${espoir.name}, la nouvelle sensation de ${rivale.nom}`,
        `${espoir.name} enchaîne les bonnes performances et commence à se faire un nom chez ${rivale.nom}.`,
      )
    }
  } else if (rouleau < 0.64) {
    const succes = Math.random() < 0.4 + rivale.force / 200
    if (succes) {
      article(
        `Show acclamé pour ${rivale.nom}`,
        `Le dernier show de ${rivale.nom} a conquis le public, entre bons matchs et moments marquants.`,
      )
    } else {
      article(
        `Soirée compliquée pour ${rivale.nom}`,
        `Le public n'a pas été convaincu par le dernier show de ${rivale.nom}, entre matchs poussifs et longueurs.`,
      )
    }
  }

  return { roster, titreChampionId, articles }
}

export function evoluerRivales(
  rivales: FederationRivale[],
  semaine: number,
): { rivales: FederationRivale[]; articles: Article[] } {
  const articles: Article[] = []
  const nouvellesRivales = rivales.map((r) => {
    const [tauxMin, tauxMax] = TAUX_CROISSANCE[r.palier]
    const taux = tauxMin + Math.random() * (tauxMax - tauxMin)
    const nouveauxFans = Math.round(r.fans * taux) + randInt(-10, 30)
    const fans = Math.max(0, r.fans + nouveauxFans)
    const popularite = Math.round(Math.max(0, Math.min(100, r.popularite + randInt(-2, 3))))
    const argent = Math.max(0, r.argent + Math.round(r.argent * (taux * 0.6)) + randInt(-500, 1500))

    const evenements = evenementsRosterRival(r, semaine)
    articles.push(...evenements.articles)

    return {
      ...r,
      fans,
      popularite,
      argent,
      palier: palierPourFans(fans),
      roster: evenements.roster,
      titreChampionId: evenements.titreChampionId,
    }
  })
  return { rivales: nouvellesRivales, articles }
}

export function valorisationRivale(rivale: FederationRivale): number {
  return Math.round(rivale.fans * 2 + rivale.argent * 0.5)
}

export function forceMoyenneRivalesActives(rivales: FederationRivale[]): number {
  if (rivales.length === 0) return 0
  return rivales.reduce((acc, r) => acc + r.force, 0) / rivales.length
}
