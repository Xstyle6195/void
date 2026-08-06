import { areneParId } from "./arenas"
import type {
  BookedMatch,
  Difficulte,
  DivisionInstance,
  FederationState,
  MatchResult,
  ShowResult,
  Wrestler,
} from "./types"
import { generateWrestler } from "./wrestlers"

const FRAIS_SALLE = 2200

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

const BONUS_STIPULATION: Record<BookedMatch["stipulation"], number> = {
  normal: 0,
  titre: 10,
  "no-dq": 5,
  échelles: 8,
}

const RISQUE_STIPULATION: Record<BookedMatch["stipulation"], number> = {
  normal: 0.04,
  titre: 0.05,
  "no-dq": 0.09,
  échelles: 0.13,
}

function simulerMatch(
  match: BookedMatch,
  roster: Wrestler[],
  mainEvent: boolean,
): MatchResult {
  const participants = match.participantIds
    .map((id) => roster.find((w) => w.id === id))
    .filter((w): w is Wrestler => Boolean(w))

  const stylesUniques = new Set(participants.map((w) => w.style)).size
  const qualiteBase =
    participants.reduce(
      (acc, w) => acc + w.charisme * 0.35 + w.technique * 0.4 + w.force * 0.25,
      0,
    ) / participants.length

  const formeMoyenne =
    participants.reduce((acc, w) => acc + w.forme, 0) / participants.length

  const bonusVariete = (stylesUniques - 1) * 3
  const bonusMainEvent = mainEvent ? 6 : 0
  const bonusStip = BONUS_STIPULATION[match.stipulation]
  const penaliteForme = (100 - formeMoyenne) * 0.15
  const alea = randInt(-8, 8)

  const note = clamp(
    Math.round(
      qualiteBase * 0.6 +
        bonusVariete +
        bonusMainEvent +
        bonusStip +
        alea -
        penaliteForme,
    ),
  )

  const poids = participants.map(
    (w) => w.technique + w.force + w.charisme + w.popularite * 0.5 + randInt(0, 20),
  )
  const totalPoids = poids.reduce((a, b) => a + b, 0)
  let tirage = Math.random() * totalPoids
  let winnerId = participants[0]?.id ?? ""
  for (let i = 0; i < participants.length; i += 1) {
    tirage -= poids[i]
    if (tirage <= 0) {
      winnerId = participants[i].id
      break
    }
  }

  let blesseId: string | null = null
  const risqueBase = RISQUE_STIPULATION[match.stipulation]
  for (const w of participants) {
    const risque = risqueBase + (100 - w.forme) * 0.0015
    if (Math.random() < risque) {
      blesseId = w.id
      break
    }
  }

  return { match, winnerId, note, blesseId }
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
): ResultatDivisionSemaine {
  const roster = division.roster.map((w) => ({ ...w }))
  const titles = division.titles.map((t) => ({ ...t }))
  const salaires = roster.reduce((acc, w) => acc + w.salaire, 0)

  if (division.card.length === 0) {
    const rosterApresSemaine = tickRoster(roster)
    return {
      division: { ...division, roster: rosterApresSemaine, titles, card: [] },
      aJoue: false,
      revenus: 0,
      depenses: salaires,
      note: 0,
    }
  }

  const resultats: MatchResult[] = division.card.map((match, index) =>
    simulerMatch(match, roster, index === division.card.length - 1),
  )

  for (const resultat of resultats) {
    const { match, winnerId, note, blesseId } = resultat
    for (const pid of match.participantIds) {
      const w = roster.find((r) => r.id === pid)
      if (!w) continue
      const gagnant = pid === winnerId
      w.popularite = clamp(
        w.popularite + (gagnant ? note * 0.12 : note * 0.04) + randInt(-1, 1),
      )
      w.moral = clamp(w.moral + (gagnant ? 3 : -2))
      const usure = match.stipulation === "normal" ? 6 : match.stipulation === "titre" ? 8 : 12
      w.forme = clamp(w.forme - usure)
      if (blesseId === pid) {
        const dureeBase =
          match.stipulation === "échelles" ? randInt(3, 8) : randInt(1, 5)
        w.blessureSemaines = Math.max(w.blessureSemaines, dureeBase)
        w.forme = clamp(w.forme - 20)
        w.moral = clamp(w.moral - 5)
      }
    }

    if (match.stipulation === "titre" && match.titleId) {
      const titre = titles.find((t) => t.id === match.titleId)
      if (titre && titre.championId !== winnerId) {
        if (titre.championId) {
          const ancien = roster.find((r) => r.id === titre.championId)
          if (ancien) ancien.titreId = null
        }
        titre.championId = winnerId
        const nouveau = roster.find((r) => r.id === winnerId)
        if (nouveau) {
          nouveau.titreId = titre.id
          nouveau.popularite = clamp(nouveau.popularite + 15)
        }
      }
    }
  }

  const poidsMainEvent = 1.5
  const sommePoids = resultats.length - 1 + poidsMainEvent
  const sommeNotes = resultats.reduce(
    (acc, r, i) => acc + r.note * (i === resultats.length - 1 ? poidsMainEvent : 1),
    0,
  )
  const noteShow = Math.round(sommeNotes / sommePoids)

  const arene = areneParId(division.areneId)
  const spectateursBruts = Math.round(
    150 + populariteFederation * 9 + noteShow * 6 + randInt(-50, 50),
  )
  const spectateurs = Math.max(0, Math.min(arene.capacite, spectateursBruts))
  const revenus = Math.round(spectateurs * arene.prixBillet + populariteFederation * 25)
  const depenses = salaires + FRAIS_SALLE
  const nouveauxFans = Math.max(0, Math.round(spectateurs * 0.6))

  const resultatShow: ShowResult = {
    semaine,
    matches: resultats,
    note: noteShow,
    spectateurs,
    revenus,
    depenses,
    nouveauxFans,
  }

  const rosterApresSemaine = tickRoster(roster)

  return {
    division: {
      ...division,
      roster: rosterApresSemaine,
      titles,
      card: [],
      dernierResultat: resultatShow,
      historique: [resultatShow, ...division.historique].slice(0, 20),
    },
    aJoue: true,
    revenus,
    depenses,
    note: noteShow,
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
  const resultatsDivisions = state.divisions.map((division) =>
    jouerDivision(division, semaineEcoulee, state.popularite),
  )

  const divisions = resultatsDivisions.map((r) => r.division)
  const divisionsAyantJoue = resultatsDivisions.filter((r) => r.aJoue)

  const revenusTotaux = resultatsDivisions.reduce((acc, r) => acc + r.revenus, 0)
  const depensesTotales = resultatsDivisions.reduce((acc, r) => acc + r.depenses, 0)

  const noteMoyenne = divisionsAyantJoue.length
    ? Math.round(
        divisionsAyantJoue.reduce((acc, r) => acc + r.note, 0) / divisionsAyantJoue.length,
      )
    : state.popularite

  const popularite = divisionsAyantJoue.length
    ? clamp(Math.round(state.popularite + (noteMoyenne - state.popularite) * 0.18))
    : state.popularite

  const fansGagnes = divisions.reduce(
    (acc, d) => acc + (d.dernierResultat?.semaine === semaineEcoulee ? d.dernierResultat.nouveauxFans : 0),
    0,
  )

  let freeAgents = state.freeAgents
  if (state.semaine % 3 === 0) {
    freeAgents = [...state.freeAgents.slice(-4), generateWrestler(), generateWrestler()]
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
    gameOver,
  }
}
