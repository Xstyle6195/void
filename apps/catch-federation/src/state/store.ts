import { create } from "zustand"
import { areneSuivante } from "../game/arenas"
import { coutNouvelleDivision } from "../game/divisions"
import { jouerSemaine } from "../game/engine"
import { CAMPAGNES_MARKETING } from "../game/marketing"
import { candidatParId } from "../game/officials"
import type {
  BookedMatch,
  Difficulte,
  DivisionInstance,
  FederationState,
  FormatMatch,
  MatchStipulation,
  Screen,
  Wrestler,
} from "../game/types"
import { creerMarcheTransferts, creerRosterInitial } from "../game/wrestlers"

const COUT_RENOUVELLEMENT = 500
const BONUS_SIGNATURE = 300
const INDEMNITE_LIBERATION = 400

const PARAMETRES_DIFFICULTE: Record<Difficulte, { argent: number; popularite: number }> = {
  facile: { argent: 25000, popularite: 30 },
  normal: { argent: 15000, popularite: 20 },
  difficile: { argent: 8000, popularite: 10 },
}

function idMatch(): string {
  return `m-${Date.now()}-${Math.round(Math.random() * 10000)}`
}

function idDivision(): string {
  return `div-${Date.now()}-${Math.round(Math.random() * 10000)}`
}

function nouvelleDivision(nom: string, roster: Wrestler[], titres: { name: string; prestige: number }[]): DivisionInstance {
  const id = idDivision()
  return {
    id,
    nom,
    areneId: "rue",
    roster,
    titles: titres.map((t, i) => ({
      id: `${id}-t${i}`,
      name: t.name,
      prestige: t.prestige,
      championIds: [],
    })),
    card: [],
    dernierResultat: null,
    historique: [],
  }
}

function etatInitial(nom: string, difficulte: Difficulte): FederationState {
  const roster = creerRosterInitial(12)
  const { argent, popularite } = PARAMETRES_DIFFICULTE[difficulte]
  const divisionPrincipale = nouvelleDivision("Division Principale", roster, [
    { name: "Championnat du Monde", prestige: 100 },
    { name: "Championnat Intercontinental", prestige: 60 },
  ])
  return {
    nom,
    difficulte,
    semaine: 1,
    argent,
    popularite,
    fans: 0,
    divisions: [divisionPrincipale],
    freeAgents: creerMarcheTransferts(6),
    derniereCampagne: {},
    officiels: { marketing: null, artistique: null, adjoint: null },
    gameOver: false,
  }
}

function clampPourcentage(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)))
}

type Phase = "accueil" | "jeu"

interface Store {
  phase: Phase
  ecran: Screen
  federation: FederationState | null
  divisionActiveId: string | null
  demarrerFederation: (nom: string, difficulte: Difficulte) => void
  setEcran: (ecran: Screen) => void
  setDivisionActive: (id: string) => void
  creerDivision: (nom: string) => void
  ameliorerArene: (divisionId: string) => void
  transfererLutteur: (wrestlerId: string, versDivisionId: string) => void
  ajouterMatch: () => void
  supprimerMatch: (matchId: string) => void
  toggleParticipant: (matchId: string, wrestlerId: string) => void
  definirFormatMatch: (matchId: string, format: FormatMatch) => void
  toggleParticipantEquipe: (matchId: string, equipe: "A" | "B", wrestlerId: string) => void
  definirStipulation: (matchId: string, stipulation: MatchStipulation) => void
  definirTitre: (matchId: string, titleId: string | null) => void
  definirEstTitre: (matchId: string, estTitre: boolean) => void
  lancerSemaine: () => void
  signerAgentLibre: (id: string, versDivisionId: string) => void
  libererLutteur: (id: string) => void
  renouvelerContrat: (id: string) => void
  lancerCampagne: (campagneId: string) => void
  recruterOfficiel: (candidatId: string) => void
  licencierOfficiel: (role: "marketing" | "artistique" | "adjoint") => void
  recommencer: () => void
}

function trouverDivisionDuLutteur(federation: FederationState, wrestlerId: string): DivisionInstance | undefined {
  return federation.divisions.find((d) => d.roster.some((w) => w.id === wrestlerId))
}

function retirerChampionnat(titles: DivisionInstance["titles"], wrestlerId: string): DivisionInstance["titles"] {
  return titles.map((t) =>
    t.championIds.includes(wrestlerId)
      ? { ...t, championIds: t.championIds.filter((id) => id !== wrestlerId) }
      : t,
  )
}

export const useStore = create<Store>((set) => ({
  phase: "accueil",
  ecran: "effectif",
  federation: null,
  divisionActiveId: null,

  demarrerFederation: (nom, difficulte) => {
    const federation = etatInitial(nom.trim() || "Fédération", difficulte)
    set({
      federation,
      phase: "jeu",
      ecran: "effectif",
      divisionActiveId: federation.divisions[0].id,
    })
  },

  setEcran: (ecran) => set({ ecran }),

  setDivisionActive: (id) => set({ divisionActiveId: id }),

  creerDivision: (nom) =>
    set((state) => {
      if (!state.federation) return state
      const cout = coutNouvelleDivision(state.federation.divisions.length)
      if (state.federation.argent < cout) return state
      const division = nouvelleDivision(nom.trim() || "Nouvelle Division", [], [
        { name: `Championnat ${nom.trim() || "de la division"}`, prestige: 70 },
      ])
      return {
        federation: {
          ...state.federation,
          argent: state.federation.argent - cout,
          divisions: [...state.federation.divisions, division],
        },
        divisionActiveId: division.id,
        ecran: "effectif",
      }
    }),

  ameliorerArene: (divisionId) =>
    set((state) => {
      if (!state.federation) return state
      const division = state.federation.divisions.find((d) => d.id === divisionId)
      if (!division) return state
      const suivante = areneSuivante(division.areneId)
      if (!suivante) return state
      if (state.federation.argent < suivante.coutUpgrade) return state
      if (state.federation.fans < suivante.fansRequis) return state
      return {
        federation: {
          ...state.federation,
          argent: state.federation.argent - suivante.coutUpgrade,
          divisions: state.federation.divisions.map((d) =>
            d.id === divisionId ? { ...d, areneId: suivante.id } : d,
          ),
        },
      }
    }),

  transfererLutteur: (wrestlerId, versDivisionId) =>
    set((state) => {
      if (!state.federation) return state
      const origine = trouverDivisionDuLutteur(state.federation, wrestlerId)
      if (!origine || origine.id === versDivisionId) return state
      const lutteur = origine.roster.find((w) => w.id === wrestlerId)
      if (!lutteur) return state
      const lutteurSansTitre = { ...lutteur, titreId: null }
      return {
        federation: {
          ...state.federation,
          divisions: state.federation.divisions.map((d) => {
            if (d.id === origine.id) {
              return {
                ...d,
                roster: d.roster.filter((w) => w.id !== wrestlerId),
                titles: retirerChampionnat(d.titles, wrestlerId),
              }
            }
            if (d.id === versDivisionId) {
              return { ...d, roster: [...d.roster, lutteurSansTitre] }
            }
            return d
          }),
        },
      }
    }),

  ajouterMatch: () =>
    set((state) => {
      if (!state.federation || !state.divisionActiveId) return state
      const division = state.federation.divisions.find((d) => d.id === state.divisionActiveId)
      if (!division || division.card.length >= 5) return state
      const nouveauMatch: BookedMatch = {
        id: idMatch(),
        format: "1v1",
        participantIds: [],
        equipeA: [],
        equipeB: [],
        stipulation: "normal",
        estTitre: false,
        titleId: null,
      }
      return {
        federation: {
          ...state.federation,
          divisions: state.federation.divisions.map((d) =>
            d.id === division.id ? { ...d, card: [...d.card, nouveauMatch] } : d,
          ),
        },
      }
    }),

  supprimerMatch: (matchId) =>
    set((state) => {
      if (!state.federation || !state.divisionActiveId) return state
      return {
        federation: {
          ...state.federation,
          divisions: state.federation.divisions.map((d) =>
            d.id === state.divisionActiveId
              ? { ...d, card: d.card.filter((m) => m.id !== matchId) }
              : d,
          ),
        },
      }
    }),

  toggleParticipant: (matchId, wrestlerId) =>
    set((state) => {
      if (!state.federation || !state.divisionActiveId) return state
      return {
        federation: {
          ...state.federation,
          divisions: state.federation.divisions.map((d) => {
            if (d.id !== state.divisionActiveId) return d
            const matchCible = d.card.find((m) => m.id === matchId)
            const dejaPresent = matchCible?.participantIds.includes(wrestlerId) ?? false
            return {
              ...d,
              card: d.card.map((m) => {
                if (m.id !== matchId) return m
                if (dejaPresent) {
                  return { ...m, participantIds: m.participantIds.filter((id) => id !== wrestlerId) }
                }
                if (m.participantIds.length >= 2) return m
                return { ...m, participantIds: [...m.participantIds, wrestlerId] }
              }),
            }
          }),
        },
      }
    }),

  definirFormatMatch: (matchId, format) =>
    set((state) => {
      if (!state.federation || !state.divisionActiveId) return state
      return {
        federation: {
          ...state.federation,
          divisions: state.federation.divisions.map((d) =>
            d.id === state.divisionActiveId
              ? {
                  ...d,
                  card: d.card.map((m) =>
                    m.id === matchId
                      ? {
                          ...m,
                          format,
                          participantIds: [],
                          equipeA: [],
                          equipeB: [],
                          stipulation: format === "2v2" ? "tag-classique" : "normal",
                          estTitre: false,
                          titleId: null,
                        }
                      : m,
                  ),
                }
              : d,
          ),
        },
      }
    }),

  toggleParticipantEquipe: (matchId, equipe, wrestlerId) =>
    set((state) => {
      if (!state.federation || !state.divisionActiveId) return state
      return {
        federation: {
          ...state.federation,
          divisions: state.federation.divisions.map((d) => {
            if (d.id !== state.divisionActiveId) return d
            return {
              ...d,
              card: d.card.map((m) => {
                if (m.id !== matchId) return m
                const autreEquipe = equipe === "A" ? m.equipeB : m.equipeA
                if (autreEquipe.includes(wrestlerId)) return m
                const cible = equipe === "A" ? m.equipeA : m.equipeB
                let nouvelleCible: string[]
                if (cible.includes(wrestlerId)) {
                  nouvelleCible = cible.filter((id) => id !== wrestlerId)
                } else if (cible.length >= 2) {
                  nouvelleCible = cible
                } else {
                  nouvelleCible = [...cible, wrestlerId]
                }
                return equipe === "A" ? { ...m, equipeA: nouvelleCible } : { ...m, equipeB: nouvelleCible }
              }),
            }
          }),
        },
      }
    }),

  definirStipulation: (matchId, stipulation) =>
    set((state) => {
      if (!state.federation || !state.divisionActiveId) return state
      return {
        federation: {
          ...state.federation,
          divisions: state.federation.divisions.map((d) =>
            d.id === state.divisionActiveId
              ? { ...d, card: d.card.map((m) => (m.id === matchId ? { ...m, stipulation } : m)) }
              : d,
          ),
        },
      }
    }),

  definirTitre: (matchId, titleId) =>
    set((state) => {
      if (!state.federation || !state.divisionActiveId) return state
      return {
        federation: {
          ...state.federation,
          divisions: state.federation.divisions.map((d) =>
            d.id === state.divisionActiveId
              ? { ...d, card: d.card.map((m) => (m.id === matchId ? { ...m, titleId } : m)) }
              : d,
          ),
        },
      }
    }),

  definirEstTitre: (matchId, estTitre) =>
    set((state) => {
      if (!state.federation || !state.divisionActiveId) return state
      return {
        federation: {
          ...state.federation,
          divisions: state.federation.divisions.map((d) =>
            d.id === state.divisionActiveId
              ? {
                  ...d,
                  card: d.card.map((m) =>
                    m.id === matchId ? { ...m, estTitre, titleId: estTitre ? m.titleId : null } : m,
                  ),
                }
              : d,
          ),
        },
      }
    }),

  lancerSemaine: () =>
    set((state) => {
      if (!state.federation) return state
      return {
        federation: jouerSemaine(state.federation),
        ecran: "resultats",
      }
    }),

  signerAgentLibre: (id, versDivisionId) =>
    set((state) => {
      if (!state.federation) return state
      const agent = state.federation.freeAgents.find((w) => w.id === id)
      if (!agent || state.federation.argent < BONUS_SIGNATURE) return state
      return {
        federation: {
          ...state.federation,
          argent: state.federation.argent - BONUS_SIGNATURE,
          freeAgents: state.federation.freeAgents.filter((w) => w.id !== id),
          divisions: state.federation.divisions.map((d) =>
            d.id === versDivisionId ? { ...d, roster: [...d.roster, agent] } : d,
          ),
        },
      }
    }),

  libererLutteur: (id) =>
    set((state) => {
      if (!state.federation) return state
      if (state.federation.argent < INDEMNITE_LIBERATION) return state
      const origine = trouverDivisionDuLutteur(state.federation, id)
      if (!origine) return state
      return {
        federation: {
          ...state.federation,
          argent: state.federation.argent - INDEMNITE_LIBERATION,
          divisions: state.federation.divisions.map((d) =>
            d.id === origine.id
              ? {
                  ...d,
                  roster: d.roster.filter((w) => w.id !== id),
                  titles: retirerChampionnat(d.titles, id),
                }
              : d,
          ),
        },
      }
    }),

  renouvelerContrat: (id) =>
    set((state) => {
      if (!state.federation) return state
      if (state.federation.argent < COUT_RENOUVELLEMENT) return state
      const origine = trouverDivisionDuLutteur(state.federation, id)
      if (!origine) return state
      return {
        federation: {
          ...state.federation,
          argent: state.federation.argent - COUT_RENOUVELLEMENT,
          divisions: state.federation.divisions.map((d) =>
            d.id === origine.id
              ? {
                  ...d,
                  roster: d.roster.map((w) =>
                    w.id === id ? { ...w, contratSemaines: w.contratSemaines + 12 } : w,
                  ),
                }
              : d,
          ),
        },
      }
    }),

  lancerCampagne: (campagneId) =>
    set((state) => {
      if (!state.federation) return state
      const campagne = CAMPAGNES_MARKETING.find((c) => c.id === campagneId)
      if (!campagne) return state
      const { argent, fans, semaine, derniereCampagne } = state.federation
      if (argent < campagne.cout) return state
      if (fans < campagne.fansRequis) return state
      const derniereUtilisation = derniereCampagne[campagneId]
      if (derniereUtilisation !== undefined && semaine - derniereUtilisation < campagne.cooldownSemaines) {
        return state
      }
      const officielMarketing = state.federation.officiels.marketing
        ? candidatParId(state.federation.officiels.marketing)
        : undefined
      const multiplicateur = 1 + (officielMarketing?.bonus ?? 0) / 100
      return {
        federation: {
          ...state.federation,
          argent: argent - campagne.cout,
          fans: fans + Math.round(campagne.gainFans * multiplicateur),
          popularite: clampPourcentage(
            state.federation.popularite + Math.round(campagne.gainPopularite * multiplicateur),
          ),
          derniereCampagne: { ...derniereCampagne, [campagneId]: semaine },
        },
      }
    }),

  recruterOfficiel: (candidatId) =>
    set((state) => {
      if (!state.federation) return state
      const candidat = candidatParId(candidatId)
      if (!candidat) return state
      if (state.federation.argent < candidat.coutRecrutement) return state
      return {
        federation: {
          ...state.federation,
          argent: state.federation.argent - candidat.coutRecrutement,
          officiels: { ...state.federation.officiels, [candidat.role]: candidat.id },
        },
      }
    }),

  licencierOfficiel: (role) =>
    set((state) => {
      if (!state.federation) return state
      return {
        federation: {
          ...state.federation,
          officiels: { ...state.federation.officiels, [role]: null },
        },
      }
    }),

  recommencer: () => set({ federation: null, phase: "accueil", divisionActiveId: null }),
}))

export function usePhase(): Phase {
  return useStore((s) => s.phase)
}

export function useFederation(): FederationState {
  const federation = useStore((s) => s.federation)
  if (!federation) {
    throw new Error("useFederation appelé avant le démarrage de la fédération")
  }
  return federation
}

export function useDivisionActive(): DivisionInstance {
  const federation = useFederation()
  const divisionActiveId = useStore((s) => s.divisionActiveId)
  const division = federation.divisions.find((d) => d.id === divisionActiveId) ?? federation.divisions[0]
  return division
}

export function useEcran(): [Screen, (e: Screen) => void] {
  const ecran = useStore((s) => s.ecran)
  const setEcran = useStore((s) => s.setEcran)
  return [ecran, setEcran]
}
