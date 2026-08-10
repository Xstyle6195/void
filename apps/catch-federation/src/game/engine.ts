import { areneParId } from "./arenas"
import { candidatParId } from "./officials"
import { infoPromo } from "./promos"
import { evoluerRivales, forceMoyenneRivalesActives, palierPourFans } from "./rivals"
import { BONUS_TITRE, infoStipulation, LIMITES_FORMAT, RISQUE_TITRE, USURE_TITRE } from "./stipulations"
import type {
  BookedMatch,
  BookedPromo,
  Difficulte,
  DivisionInstance,
  FederationState,
  MatchResult,
  PromoResultat,
  ShowResult,
  Title,
  Wrestler,
} from "./types"
import {
  genererJobbeurs,
  genererOfficiels,
  progressionDepuisFans,
  TAILLE_MARCHE_PAR_CATEGORIE,
} from "./wrestlers"

const FRAIS_SALLE = 2200
const BONUS_NOTE_INTERFERENCE = 6
const RISQUE_BLESSURE_INTERFERENCE = 0.05
const BONUS_POPULARITE_INTERFERENCE = 8
const COUT_INTERFERENCE = 200
const RISQUE_DEBAUCHAGE_BASE = 0.02
const RISQUE_DEBAUCHAGE_AGENT_LIBRE = 0.05

const SEUIL_FAILLITE_PAR_DIFFICULTE: Record<Difficulte, number> = {
  facile: -14000,
  normal: -8000,
  difficile: -4000,
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, value)))
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function campsDuMatch(match: BookedMatch): string[][] {
  if (match.format === "2v2") return [match.equipeA, match.equipeB]
  return match.participantIds.map((id) => [id])
}

function matchEstComplet(match: BookedMatch): boolean {
  if (match.format === "2v2") return match.equipeA.length === 2 && match.equipeB.length === 2
  return match.participantIds.length >= LIMITES_FORMAT[match.format].min
}

function promoEstComplete(promo: BookedPromo): boolean {
  const info = infoPromo(promo.type)
  return promo.participantIds.length >= info.participantsMin && promo.participantIds.length <= info.participantsMax
}

interface ResultatPromos {
  roster: Wrestler[]
  resultats: PromoResultat[]
  coutTotal: number
  bonusNoteTotal: number
}

function resoudrePromos(promos: BookedPromo[], roster: Wrestler[]): ResultatPromos {
  const promosValides = promos.filter(promoEstComplete)
  let rosterCourant = roster.map((w) => ({ ...w }))
  let coutTotal = 0
  let bonusNoteTotal = 0
  const resultats: PromoResultat[] = []

  for (const promo of promosValides) {
    const info = infoPromo(promo.type)
    coutTotal += info.cout
    bonusNoteTotal += info.bonusNote
    const participantNoms: string[] = []
    for (const pid of promo.participantIds) {
      const w = rosterCourant.find((r) => r.id === pid)
      if (!w) continue
      w.popularite = clamp(w.popularite + info.bonusPopularite + randInt(-2, 2))
      w.moral = clamp(w.moral + info.bonusMoral)
      participantNoms.push(w.name)
    }
    if (participantNoms.length > 0) {
      resultats.push({ type: promo.type, participantNoms })
    }
  }

  return { roster: rosterCourant, resultats, coutTotal, bonusNoteTotal }
}

const STIPULATIONS_ECHELLES = new Set(["echelles", "echelles-tag", "triple-echelles", "a4-echelles"])
const STIPULATIONS_LOSER_LEAVES_TOWN = new Set(["loser-leaves-town", "loser-leaves-town-tag"])

function simulerMatch(
  match: BookedMatch,
  roster: Wrestler[],
  mainEvent: boolean,
  bonusArtistique: number,
): MatchResult {
  const camps = campsDuMatch(match)
  const participants = camps
    .flat()
    .map((id) => roster.find((w) => w.id === id))
    .filter((w): w is Wrestler => Boolean(w))

  const stip = infoStipulation(match.stipulation)

  const stylesUniques = new Set(participants.map((w) => w.style)).size
  const qualiteBase =
    participants.reduce(
      (acc, w) => acc + w.charisme * 0.35 + w.technique * 0.4 + w.force * 0.25,
      0,
    ) / participants.length

  const formeMoyenne =
    participants.reduce((acc, w) => acc + w.forme, 0) / participants.length

  const interferant = match.interferenceId ? roster.find((w) => w.id === match.interferenceId) : undefined

  const bonusVariete = (stylesUniques - 1) * 3
  const bonusMainEvent = mainEvent ? 6 : 0
  const bonusStip = stip.bonusNote + (match.estTitre ? BONUS_TITRE : 0)
  const bonusInterference = interferant ? BONUS_NOTE_INTERFERENCE : 0
  const penaliteForme = (100 - formeMoyenne) * 0.15
  const alea = randInt(-8, 8)

  const note = clamp(
    Math.round(
      qualiteBase * 0.6 +
        bonusVariete +
        bonusMainEvent +
        bonusStip +
        bonusArtistique +
        bonusInterference +
        alea -
        penaliteForme,
    ),
  )

  const campImpose =
    match.vainqueurImposeIds.length > 0
      ? camps.find(
          (camp) =>
            camp.length === match.vainqueurImposeIds.length &&
            camp.every((id) => match.vainqueurImposeIds.includes(id)),
        )
      : undefined

  let indexGagnant: number
  if (campImpose) {
    indexGagnant = camps.indexOf(campImpose)
  } else {
    const poidsCamps = camps.map((camp) =>
      camp.reduce((acc, id) => {
        const w = roster.find((r) => r.id === id)
        if (!w) return acc
        return acc + w.technique + w.force + w.charisme + w.popularite * 0.5 + randInt(0, 20)
      }, 0),
    )
    const totalPoids = poidsCamps.reduce((a, b) => a + b, 0)
    let tirage = Math.random() * totalPoids
    indexGagnant = camps.length - 1
    for (let i = 0; i < camps.length; i += 1) {
      tirage -= poidsCamps[i]
      if (tirage <= 0) {
        indexGagnant = i
        break
      }
    }
  }
  const winnerIds = camps[indexGagnant]
  const loserIds = camps.filter((_, i) => i !== indexGagnant).flat()

  let blesseId: string | null = null
  const risqueBase = stip.risqueBlessure + (match.estTitre ? RISQUE_TITRE : 0)
  for (const w of participants) {
    const risque = risqueBase + (100 - w.forme) * 0.0015
    if (Math.random() < risque) {
      blesseId = w.id
      break
    }
  }
  if (!blesseId && interferant && Math.random() < RISQUE_BLESSURE_INTERFERENCE) {
    blesseId = interferant.id
  }

  let partisNoms: string[] = []
  if (STIPULATIONS_LOSER_LEAVES_TOWN.has(match.stipulation)) {
    partisNoms = loserIds
      .map((id) => participants.find((p) => p.id === id)?.name)
      .filter((n): n is string => Boolean(n))
  }

  return { match, winnerIds, note, blesseId, partisNoms, interferenceNom: interferant?.name ?? null }
}

interface ResultatDivisionSemaine {
  division: DivisionInstance
  aJoue: boolean
  revenus: number
  depenses: number
  note: number
}

function jouerDivision(
  division: DivisionInstance,
  semaine: number,
  populariteFederation: number,
  bonusArtistique: number,
  reductionAdjointPct: number,
  forceRivales: number,
): ResultatDivisionSemaine {
  let roster = division.roster.map((w) => ({ ...w }))
  const titles = division.titles.map((t) => ({ ...t, championIds: [...t.championIds] }))
  const salaires = roster.reduce((acc, w) => acc + w.salaire, 0)

  const matchesValides = division.card.filter(matchEstComplet)
  const promosValides = division.promos.filter(promoEstComplete)

  if (matchesValides.length === 0 && promosValides.length === 0) {
    const rosterApresSemaine = tickRoster(roster)
    return {
      division: { ...division, roster: rosterApresSemaine, titles, card: [], promos: [] },
      aJoue: false,
      revenus: 0,
      depenses: Math.round(salaires * (1 - reductionAdjointPct / 100)),
      note: 0,
    }
  }

  const resultats: MatchResult[] = matchesValides.map((match, index) =>
    simulerMatch(match, roster, index === matchesValides.length - 1, bonusArtistique),
  )

  for (const resultat of resultats) {
    const { match, winnerIds, note, blesseId } = resultat
    const stip = infoStipulation(match.stipulation)
    const participantsIds = campsDuMatch(match).flat()

    for (const pid of participantsIds) {
      const w = roster.find((r) => r.id === pid)
      if (!w) continue
      const gagnant = winnerIds.includes(pid)
      w.popularite = clamp(
        w.popularite + (gagnant ? note * 0.12 : note * 0.04) + randInt(-1, 1),
      )
      w.moral = clamp(w.moral + (gagnant ? 3 : -2))
      const usure = stip.usure + (match.estTitre ? USURE_TITRE : 0)
      w.forme = clamp(w.forme - usure)
      if (blesseId === pid) {
        const dureeBase = STIPULATIONS_ECHELLES.has(match.stipulation) ? randInt(3, 8) : randInt(1, 5)
        w.blessureSemaines = Math.max(w.blessureSemaines, dureeBase)
        w.forme = clamp(w.forme - 20)
        w.moral = clamp(w.moral - 5)
      }
    }

    if (match.interferenceId) {
      const interferant = roster.find((r) => r.id === match.interferenceId)
      if (interferant) {
        interferant.popularite = clamp(interferant.popularite + BONUS_POPULARITE_INTERFERENCE)
        interferant.moral = clamp(interferant.moral + 2)
        if (blesseId === interferant.id) {
          interferant.blessureSemaines = Math.max(interferant.blessureSemaines, randInt(1, 4))
          interferant.forme = clamp(interferant.forme - 15)
          interferant.moral = clamp(interferant.moral - 3)
        }
      }
    }

    if (match.estTitre && match.titleId) {
      const titre = titles.find((t) => t.id === match.titleId)
      if (titre) {
        const memeChampions =
          titre.championIds.length === winnerIds.length &&
          titre.championIds.every((id) => winnerIds.includes(id))
        if (!memeChampions) {
          for (const ancienId of titre.championIds) {
            const ancien = roster.find((r) => r.id === ancienId)
            if (ancien) ancien.titreId = null
          }
          titre.championIds = winnerIds
          for (const nouveauId of winnerIds) {
            const nouveau = roster.find((r) => r.id === nouveauId)
            if (nouveau) {
              nouveau.titreId = titre.id
              nouveau.popularite = clamp(nouveau.popularite + 15)
            }
          }
        }
      }
    }

    if (STIPULATIONS_LOSER_LEAVES_TOWN.has(match.stipulation)) {
      const perdantIds = campsDuMatch(match)
        .flat()
        .filter((id) => !winnerIds.includes(id))
      for (const perdantId of perdantIds) {
        const perdant = roster.find((r) => r.id === perdantId)
        if (perdant?.titreId) {
          const titrePerdu = titles.find((t) => t.id === perdant.titreId)
          if (titrePerdu) titrePerdu.championIds = titrePerdu.championIds.filter((id) => id !== perdantId)
        }
      }
      roster = roster.filter((r) => !perdantIds.includes(r.id))
    }
  }

  const resultatPromos = resoudrePromos(division.promos, roster)
  roster = resultatPromos.roster

  const poidsMainEvent = 1.5
  const sommePoids = resultats.length - 1 + poidsMainEvent
  const sommeNotes = resultats.reduce(
    (acc, r, i) => acc + r.note * (i === resultats.length - 1 ? poidsMainEvent : 1),
    0,
  )
  const noteMatches = sommeNotes / sommePoids
  const noteShow = clamp(Math.round(noteMatches + resultatPromos.bonusNoteTotal))

  const arene = areneParId(division.areneId)
  const spectateursBruts = Math.round(
    150 + populariteFederation * 9 + noteShow * 6 + randInt(-50, 50),
  )
  const spectateurs = Math.max(0, Math.min(arene.capacite, spectateursBruts))
  const revenus = Math.round(spectateurs * arene.prixBillet + populariteFederation * 25)
  const coutStipulations = matchesValides.reduce(
    (acc, m) => acc + infoStipulation(m.stipulation).cout + (m.interferenceId ? COUT_INTERFERENCE : 0),
    0,
  )
  const facteurReduction = 1 - reductionAdjointPct / 100
  const detailDepenses = {
    salaires: Math.round(salaires * facteurReduction),
    frais: Math.round(FRAIS_SALLE * facteurReduction),
    stipulations: Math.round(coutStipulations * facteurReduction),
    promos: Math.round(resultatPromos.coutTotal * facteurReduction),
  }
  const depenses =
    detailDepenses.salaires + detailDepenses.frais + detailDepenses.stipulations + detailDepenses.promos
  const nouveauxFans = Math.max(0, Math.round(spectateurs * 0.6))

  const apresDebauchage = appliquerDebauchage(roster, titles, forceRivales)

  const resultatShow: ShowResult = {
    semaine,
    matches: resultats,
    promos: resultatPromos.resultats,
    note: noteShow,
    spectateurs,
    revenus,
    depenses,
    detailDepenses,
    nouveauxFans,
    debauchesNoms: apresDebauchage.debauchesNoms,
  }

  const rosterApresSemaine = tickRoster(apresDebauchage.roster)

  return {
    division: {
      ...division,
      roster: rosterApresSemaine,
      titles: apresDebauchage.titles,
      card: [],
      promos: [],
      dernierResultat: resultatShow,
      historique: [resultatShow, ...division.historique].slice(0, 20),
    },
    aJoue: true,
    revenus,
    depenses,
    note: noteShow,
  }
}

function appliquerDebauchage(
  roster: Wrestler[],
  titles: Title[],
  forceRivales: number,
): { roster: Wrestler[]; titles: Title[]; debauchesNoms: string[] } {
  const facteur = 0.5 + forceRivales / 100
  const debauchesNoms: string[] = []
  const debauchesIds = new Set<string>()
  for (const w of roster) {
    if (w.contratSemaines > 0 && w.contratSemaines <= 3) {
      if (Math.random() < RISQUE_DEBAUCHAGE_BASE * facteur) {
        debauchesNoms.push(w.name)
        debauchesIds.add(w.id)
      }
    }
  }
  if (debauchesIds.size === 0) return { roster, titles, debauchesNoms }
  return {
    roster: roster.filter((w) => !debauchesIds.has(w.id)),
    titles: titles.map((t) => ({
      ...t,
      championIds: t.championIds.filter((id) => !debauchesIds.has(id)),
    })),
    debauchesNoms,
  }
}

function tickRoster(roster: Wrestler[]): Wrestler[] {
  return roster
    .map((w) => {
      const contratSemaines = w.contratSemaines - 1
      const blessureSemaines = Math.max(0, w.blessureSemaines - 1)
      const forme = blessureSemaines > 0 ? w.forme : clamp(w.forme + 8)
      return { ...w, contratSemaines, blessureSemaines, forme }
    })
    .filter((w) => w.contratSemaines > 0)
}

export function jouerSemaine(state: FederationState): FederationState {
  const semaineEcoulee = state.semaine

  const officielArtistique = state.officiels.artistique ? candidatParId(state.officiels.artistique) : undefined
  const officielAdjoint = state.officiels.adjoint ? candidatParId(state.officiels.adjoint) : undefined
  const bonusArtistique = officielArtistique?.bonus ?? 0
  const reductionAdjointPct = officielAdjoint?.bonus ?? 0
  const forceRivales = forceMoyenneRivalesActives(state.rivales)

  const resultatsDivisions = state.divisions.map((division) =>
    jouerDivision(
      division,
      semaineEcoulee,
      state.popularite,
      bonusArtistique,
      reductionAdjointPct,
      forceRivales,
    ),
  )

  const divisions = resultatsDivisions.map((r) => r.division)
  const divisionsAyantJoue = resultatsDivisions.filter((r) => r.aJoue)

  const salairesOfficiels = (["marketing", "artistique", "adjoint"] as const).reduce((acc, role) => {
    const id = state.officiels[role]
    const candidat = id ? candidatParId(id) : undefined
    return acc + (candidat?.salaire ?? 0)
  }, 0)

  const revenusTotaux = resultatsDivisions.reduce((acc, r) => acc + r.revenus, 0)
  const depensesTotales = resultatsDivisions.reduce((acc, r) => acc + r.depenses, 0) + salairesOfficiels

  const noteMoyenne = divisionsAyantJoue.length
    ? Math.round(
        divisionsAyantJoue.reduce((acc, r) => acc + r.note, 0) / divisionsAyantJoue.length,
      )
    : state.popularite

  const popularite = divisionsAyantJoue.length
    ? clamp(Math.round(state.popularite + (noteMoyenne - state.popularite) * 0.18))
    : state.popularite

  const fansGagnesBruts = divisions.reduce(
    (acc, d) => acc + (d.dernierResultat?.semaine === semaineEcoulee ? d.dernierResultat.nouveauxFans : 0),
    0,
  )

  const rivales = evoluerRivales(state.rivales)

  const palierJoueur = palierPourFans(state.fans)
  const fansRivalesMemePalier = rivales
    .filter((r) => r.palier === palierJoueur)
    .reduce((acc, r) => acc + r.fans, 0)
  const pressionConcurrentielle =
    fansRivalesMemePalier > 0
      ? fansRivalesMemePalier / (fansRivalesMemePalier + state.fans + 1)
      : 0
  const fansGagnes = Math.round(fansGagnesBruts * (1 - pressionConcurrentielle * 0.2))

  const progression = progressionDepuisFans(state.fans)
  let freeAgents = state.freeAgents.filter(() => Math.random() >= RISQUE_DEBAUCHAGE_AGENT_LIBRE)
  if (state.semaine % 3 === 0) {
    const officiels = freeAgents.filter((w) => w.categorie === "officiel").slice(-7)
    const jobbeurs = freeAgents.filter((w) => w.categorie === "jobbeur").slice(-7)
    freeAgents = [
      ...officiels,
      ...genererOfficiels(TAILLE_MARCHE_PAR_CATEGORIE - officiels.length, progression),
      ...jobbeurs,
      ...genererJobbeurs(TAILLE_MARCHE_PAR_CATEGORIE - jobbeurs.length),
    ]
  }

  const argent = state.argent + revenusTotaux - depensesTotales
  const gameOver = argent < SEUIL_FAILLITE_PAR_DIFFICULTE[state.difficulte]

  return {
    ...state,
    semaine: state.semaine + 1,
    argent,
    popularite,
    fans: state.fans + fansGagnes,
    divisions,
    freeAgents,
    rivales,
    gameOver,
  }
}
