import { areneParId } from "./arenas"
import { candidatParId } from "./officials"
import { BONUS_TITRE, infoStipulation, RISQUE_TITRE, USURE_TITRE } from "./stipulations"
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

function campsDuMatch(match: BookedMatch): [string[], string[]] {
  if (match.format === "2v2") return [match.equipeA, match.equipeB]
  return [[match.participantIds[0]], [match.participantIds[1]]]
}

function matchEstComplet(match: BookedMatch): boolean {
  if (match.format === "2v2") return match.equipeA.length === 2 && match.equipeB.length === 2
  return match.participantIds.length === 2
}

const STIPULATIONS_ECHELLES = new Set(["echelles", "echelles-tag"])
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

  const bonusVariete = (stylesUniques - 1) * 3
  const bonusMainEvent = mainEvent ? 6 : 0
  const bonusStip = stip.bonusNote + (match.estTitre ? BONUS_TITRE : 0)
  const penaliteForme = (100 - formeMoyenne) * 0.15
  const alea = randInt(-8, 8)

  const note = clamp(
    Math.round(
      qualiteBase * 0.6 +
        bonusVariete +
        bonusMainEvent +
        bonusStip +
        bonusArtistique +
        alea -
        penaliteForme,
    ),
  )

  const poidsCamps = camps.map((camp) =>
    camp.reduce((acc, id) => {
      const w = roster.find((r) => r.id === id)
      if (!w) return acc
      return acc + w.technique + w.force + w.charisme + w.popularite * 0.5 + randInt(0, 20)
    }, 0),
  )
  const totalPoids = poidsCamps[0] + poidsCamps[1]
  const tirage = Math.random() * totalPoids
  const indexGagnant = tirage < poidsCamps[0] ? 0 : 1
  const winnerIds = camps[indexGagnant]
  const loserIds = camps[1 - indexGagnant]

  let blesseId: string | null = null
  const risqueBase = stip.risqueBlessure + (match.estTitre ? RISQUE_TITRE : 0)
  for (const w of participants) {
    const risque = risqueBase + (100 - w.forme) * 0.0015
    if (Math.random() < risque) {
      blesseId = w.id
      break
    }
  }

  let partisNoms: string[] = []
  if (STIPULATIONS_LOSER_LEAVES_TOWN.has(match.stipulation)) {
    partisNoms = loserIds
      .map((id) => participants.find((p) => p.id === id)?.name)
      .filter((n): n is string => Boolean(n))
  }

  return { match, winnerIds, note, blesseId, partisNoms }
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
): ResultatDivisionSemaine {
  let roster = division.roster.map((w) => ({ ...w }))
  const titles = division.titles.map((t) => ({ ...t, championIds: [...t.championIds] }))
  const salaires = roster.reduce((acc, w) => acc + w.salaire, 0)

  const matchesValides = division.card.filter(matchEstComplet)

  if (matchesValides.length === 0) {
    const rosterApresSemaine = tickRoster(roster)
    return {
      division: { ...division, roster: rosterApresSemaine, titles, card: [] },
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
  const coutStipulations = matchesValides.reduce(
    (acc, m) => acc + infoStipulation(m.stipulation).cout,
    0,
  )
  const depenses = Math.round(
    (salaires + FRAIS_SALLE + coutStipulations) * (1 - reductionAdjointPct / 100),
  )
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

  const officielArtistique = state.officiels.artistique ? candidatParId(state.officiels.artistique) : undefined
  const officielAdjoint = state.officiels.adjoint ? candidatParId(state.officiels.adjoint) : undefined
  const bonusArtistique = officielArtistique?.bonus ?? 0
  const reductionAdjointPct = officielAdjoint?.bonus ?? 0

  const resultatsDivisions = state.divisions.map((division) =>
    jouerDivision(division, semaineEcoulee, state.popularite, bonusArtistique, reductionAdjointPct),
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
