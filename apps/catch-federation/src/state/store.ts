import { create } from "zustand"
import { jouerSemaine } from "../game/engine"
import { infoDivision } from "../game/divisions"
import type {
  BookedMatch,
  Difficulte,
  Division,
  FederationState,
  MatchStipulation,
  Screen,
  Title,
} from "../game/types"
import { creerDivision, creerMarcheTransferts, creerRosterInitial } from "../game/wrestlers"

const COUT_RENOUVELLEMENT = 500
const BONUS_SIGNATURE = 300
const INDEMNITE_LIBERATION = 400

const PARAMETRES_DIFFICULTE: Record<Difficulte, { argent: number; popularite: number }> = {
  facile: { argent: 25000, popularite: 30 },
  normal: { argent: 15000, popularite: 20 },
  difficile: { argent: 8000, popularite: 10 },
}

const TAILLE_NOUVELLE_DIVISION = 6

function idMatch(): string {
  return `m-${Date.now()}-${Math.round(Math.random() * 10000)}`
}

function nouveauTitre(division: Division, name: string, prestige: number): Title {
  return { id: `t-${division}-${Date.now()}`, name, division, prestige, championId: null }
}

function etatInitial(nom: string, difficulte: Difficulte): FederationState {
  const roster = creerRosterInitial()
  const titles = [
    nouveauTitre("masculine", "Championnat du Monde", 100),
    nouveauTitre("feminine", "Championnat Mondial Féminin", 100),
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
    divisionsDebloquees: ["masculine", "feminine"],
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
  definirDivisionMatch: (matchId: string, division: Division) => void
  debloquerDivision: (division: Division) => void
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
        division: state.federation.divisionsDebloquees[0] ?? "masculine",
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

  definirDivisionMatch: (matchId, division) =>
    set((state) => {
      if (!state.federation) return state
      return {
        federation: {
          ...state.federation,
          card: state.federation.card.map((m) =>
            m.id === matchId ? { ...m, division, participantIds: [], titleId: null } : m,
          ),
        },
      }
    }),

  debloquerDivision: (division) =>
    set((state) => {
      if (!state.federation) return state
      const info = infoDivision(division)
      if (state.federation.divisionsDebloquees.includes(division)) return state
      if (state.federation.argent < info.cout) return state
      if (state.federation.semaine < info.semaineMinimum) return state
      const nouveauxLutteurs = creerDivision(division, TAILLE_NOUVELLE_DIVISION)
      const titre =
        division === "equipe"
          ? nouveauTitre("equipe", "Championnat par Équipes", 80)
          : nouveauTitre("jeune_talent", "Championnat Jeune Talent", 40)
      return {
        federation: {
          ...state.federation,
          argent: state.federation.argent - info.cout,
          divisionsDebloquees: [...state.federation.divisionsDebloquees, division],
          roster: [...state.federation.roster, ...nouveauxLutteurs],
          titles: [...state.federation.titles, titre],
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
