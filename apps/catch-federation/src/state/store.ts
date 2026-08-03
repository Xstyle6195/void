import { create } from "zustand"
import { jouerSemaine } from "../game/engine"
import type {
  BookedMatch,
  Difficulte,
  FederationState,
  MatchStipulation,
  Screen,
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

function etatInitial(nom: string, difficulte: Difficulte): FederationState {
  const roster = creerRosterInitial(10)
  const titles = [
    { id: "t-monde", name: "Championnat du Monde", prestige: 100, championId: null },
    { id: "t-inter", name: "Championnat Intercontinental", prestige: 60, championId: null },
  ]
  const { argent, popularite } = PARAMETRES_DIFFICULTE[difficulte]
  return {
    nom,
    difficulte,
    semaine: 1,
    argent,
    popularite,
    roster,
    freeAgents: creerMarcheTransferts(6),
    titles,
    card: [],
    dernierResultat: null,
    historique: [],
    gameOver: false,
  }
}

type Phase = "accueil" | "jeu"

interface Store {
  phase: Phase
  ecran: Screen
  federation: FederationState | null
  demarrerFederation: (nom: string, difficulte: Difficulte) => void
  setEcran: (ecran: Screen) => void
  ajouterMatch: () => void
  supprimerMatch: (matchId: string) => void
  toggleParticipant: (matchId: string, wrestlerId: string) => void
  definirStipulation: (matchId: string, stipulation: MatchStipulation) => void
  definirTitre: (matchId: string, titleId: string | null) => void
  lancerShow: () => void
  signerAgentLibre: (id: string) => void
  libererLutteur: (id: string) => void
  renouvelerContrat: (id: string) => void
  recommencer: () => void
}

export const useStore = create<Store>((set) => ({
  phase: "accueil",
  ecran: "effectif",
  federation: null,

  demarrerFederation: (nom, difficulte) =>
    set({
      federation: etatInitial(nom.trim() || "Fédération", difficulte),
      phase: "jeu",
      ecran: "effectif",
    }),

  setEcran: (ecran) => set({ ecran }),

  ajouterMatch: () =>
    set((state) => {
      if (!state.federation) return state
      if (state.federation.card.length >= 5) return state
      const nouveauMatch: BookedMatch = {
        id: idMatch(),
        participantIds: [],
        stipulation: "normal",
        titleId: null,
      }
      return {
        federation: { ...state.federation, card: [...state.federation.card, nouveauMatch] },
      }
    }),

  supprimerMatch: (matchId) =>
    set((state) => {
      if (!state.federation) return state
      return {
        federation: {
          ...state.federation,
          card: state.federation.card.filter((m) => m.id !== matchId),
        },
      }
    }),

  toggleParticipant: (matchId, wrestlerId) =>
    set((state) => {
      if (!state.federation) return state
      const matchCible = state.federation.card.find((m) => m.id === matchId)
      const dejaPresent = matchCible?.participantIds.includes(wrestlerId) ?? false
      return {
        federation: {
          ...state.federation,
          card: state.federation.card.map((m) => {
            if (m.id !== matchId) {
              return { ...m, participantIds: m.participantIds.filter((id) => id !== wrestlerId) }
            }
            if (dejaPresent) {
              return { ...m, participantIds: m.participantIds.filter((id) => id !== wrestlerId) }
            }
            if (m.participantIds.length >= 4) return m
            return { ...m, participantIds: [...m.participantIds, wrestlerId] }
          }),
        },
      }
    }),

  definirStipulation: (matchId, stipulation) =>
    set((state) => {
      if (!state.federation) return state
      return {
        federation: {
          ...state.federation,
          card: state.federation.card.map((m) =>
            m.id === matchId ? { ...m, stipulation } : m,
          ),
        },
      }
    }),

  definirTitre: (matchId, titleId) =>
    set((state) => {
      if (!state.federation) return state
      return {
        federation: {
          ...state.federation,
          card: state.federation.card.map((m) => (m.id === matchId ? { ...m, titleId } : m)),
        },
      }
    }),

  lancerShow: () =>
    set((state) => {
      if (!state.federation) return state
      const carteValide = state.federation.card.filter((m) => m.participantIds.length >= 2)
      const federationAvecCarte = { ...state.federation, card: carteValide }
      return {
        federation: jouerSemaine(federationAvecCarte),
        ecran: "resultats",
      }
    }),

  signerAgentLibre: (id) =>
    set((state) => {
      if (!state.federation) return state
      const agent = state.federation.freeAgents.find((w) => w.id === id)
      if (!agent || state.federation.argent < BONUS_SIGNATURE) return state
      return {
        federation: {
          ...state.federation,
          argent: state.federation.argent - BONUS_SIGNATURE,
          roster: [...state.federation.roster, agent],
          freeAgents: state.federation.freeAgents.filter((w) => w.id !== id),
        },
      }
    }),

  libererLutteur: (id) =>
    set((state) => {
      if (!state.federation) return state
      if (state.federation.argent < INDEMNITE_LIBERATION) return state
      return {
        federation: {
          ...state.federation,
          argent: state.federation.argent - INDEMNITE_LIBERATION,
          roster: state.federation.roster.filter((w) => w.id !== id),
          titles: state.federation.titles.map((t) =>
            t.championId === id ? { ...t, championId: null } : t,
          ),
        },
      }
    }),

  renouvelerContrat: (id) =>
    set((state) => {
      if (!state.federation) return state
      if (state.federation.argent < COUT_RENOUVELLEMENT) return state
      return {
        federation: {
          ...state.federation,
          argent: state.federation.argent - COUT_RENOUVELLEMENT,
          roster: state.federation.roster.map((w) =>
            w.id === id ? { ...w, contratSemaines: w.contratSemaines + 12 } : w,
          ),
        },
      }
    }),

  recommencer: () => set({ federation: null, phase: "accueil" }),
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

export function useEcran(): [Screen, (e: Screen) => void] {
  const ecran = useStore((s) => s.ecran)
  const setEcran = useStore((s) => s.setEcran)
  return [ecran, setEcran]
}
