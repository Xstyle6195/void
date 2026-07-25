import { create } from "zustand";
import {
  acknowledgeSuccession,
  answerEvent,
  buildBuilding,
  createInitialState,
  declareWar,
  formAlliance,
  foundProvince,
  processTurn,
  proposeMarriage,
  sendGift,
  sueForPeace,
} from "../game/engine";
import type { BuildingId, GameState } from "../game/types";

const SAVE_KEY = "dynastie-save-v1";

function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

function persist(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable, ignore
  }
}

interface Store {
  game: GameState;
  nextTurn: () => void;
  answerCurrentEvent: (choiceId: string) => void;
  confirmSuccession: () => void;
  buildAt: (provinceId: string, buildingId: BuildingId) => void;
  expandKingdom: () => void;
  giftNeighbor: (neighborId: string) => void;
  warNeighbor: (neighborId: string) => void;
  peaceNeighbor: (neighborId: string) => void;
  allyNeighbor: (neighborId: string) => void;
  marryOff: (personId: string, neighborId: string) => void;
  restart: () => void;
}

export const useGameStore = create<Store>((set, get) => ({
  game: loadSave() ?? createInitialState(),
  nextTurn: () => {
    const updated = processTurn(get().game);
    persist(updated);
    set({ game: updated });
  },
  answerCurrentEvent: (choiceId) => {
    const updated = answerEvent(get().game, choiceId);
    persist(updated);
    set({ game: updated });
  },
  confirmSuccession: () => {
    const updated = acknowledgeSuccession(get().game);
    persist(updated);
    set({ game: updated });
  },
  buildAt: (provinceId, buildingId) => {
    const updated = buildBuilding(get().game, provinceId, buildingId);
    persist(updated);
    set({ game: updated });
  },
  expandKingdom: () => {
    const updated = foundProvince(get().game);
    persist(updated);
    set({ game: updated });
  },
  giftNeighbor: (neighborId) => {
    const updated = sendGift(get().game, neighborId);
    persist(updated);
    set({ game: updated });
  },
  warNeighbor: (neighborId) => {
    const updated = declareWar(get().game, neighborId);
    persist(updated);
    set({ game: updated });
  },
  peaceNeighbor: (neighborId) => {
    const updated = sueForPeace(get().game, neighborId);
    persist(updated);
    set({ game: updated });
  },
  allyNeighbor: (neighborId) => {
    const updated = formAlliance(get().game, neighborId);
    persist(updated);
    set({ game: updated });
  },
  marryOff: (personId, neighborId) => {
    const updated = proposeMarriage(get().game, personId, neighborId);
    persist(updated);
    set({ game: updated });
  },
  restart: () => {
    const fresh = createInitialState();
    persist(fresh);
    set({ game: fresh });
  },
}));
