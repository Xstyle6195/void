import { create } from "zustand"
import { coutNouvelleDivision } from "../game/divisions"
import { jouerSemaine } from "../game/engine"
import type {
  BookedMatch,
  Difficulte,
  DivisionInstance,
  FederationState,
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
    roster,
    titles: titres.map((t, i) => ({
      id: `${id}-t${i}`,
      name: t.name,
      prestige: t.prestige,
      championId: null,
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
    gameOver: false,
  }
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
  transfererLutteur: (wrestlerId: string, versDivisionId: string) => void
  ajouterMatch: () => void
  supprimerMatch: (matchId: string) => void
  toggleParticipant: (matchId: string, wrestlerId: string) => void
  definirStipulation: (matchId: string, stipulation: MatchStipulation) => void
  definirTitre: (matchId: string, titleId: string | null) => void
  lancerSemaine: () => void
  signerAgentLibre: (id: string, versDivisionId: string) => void
  libererLutteur: (id: string) => void
  renouvelerContrat: (id: string) => void
  recommencer: () => void
}

function trouverDivisionDuLutteur(federation: FederationState, wrestlerId: string): DivisionInstance | undefined {
  return federation.divisions.find((d) => d.roster.some((w) => w.id === wrestlerId))
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
                titles: d.titles.map((t) =>
                  t.championId === wrestlerId ? { ...t, championId: null } : t,
                ),
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
        participantIds: [],
        stipulation: "normal",
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
                if (m.participantIds.length >= 4) return m
                return { ...m, participantIds: [...m.participantIds, wrestlerId] }
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
                  titles: d.titles.map((t) =>
                    t.championId === id ? { ...t, championId: null } : t,
                  ),
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
