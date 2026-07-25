import { create } from "zustand";
import {
  acknowledgeSuccession,
  answerEvent,
  attackNeighbor,
  buildBuilding,
  createInitialState,
  declareWar,
  formAlliance,
  foundProvince,
  joinAllyWar,
  processTurn,
  proposeMarriage,
  sendGift,
  sueForPeace,
} from "../game/engine";
import { conductExercises, equipUnit, recruitMen } from "../game/army";
import { launchExpedition } from "../game/expeditions";
import type { BuildingId, CorpsType, GameState } from "../game/types";

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
  sendExpedition: (offerId: string) => void;
  recruit: (corps: CorpsType, provinceId: string) => void;
  equip: (unitId: string) => void;
  attack: (neighborId: string) => void;
  exercise: () => void;
  joinWar: (allyId: string, enemyId: string) => void;
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
  sendExpedition: (offerId) => {
    const updated = launchExpedition(get().game, offerId);
    persist(updated);
    set({ game: updated });
  },
  recruit: (corps, provinceId) => {
    const updated = recruitMen(get().game, corps, provinceId);
    persist(updated);
    set({ game: updated });
  },
  equip: (unitId) => {
    const updated = equipUnit(get().game, unitId);
    persist(updated);
    set({ game: updated });
  },
  attack: (neighborId) => {
    const updated = attackNeighbor(get().game, neighborId);
    persist(updated);
    set({ game: updated });
  },
  exercise: () => {
    const updated = conductExercises(get().game);
    persist(updated);
    set({ game: updated });
  },
  joinWar: (allyId, enemyId) => {
    const updated = joinAllyWar(get().game, allyId, enemyId);
    persist(updated);
    set({ game: updated });
  },
  restart: () => {
    const fresh = createInitialState();
    persist(fresh);
    set({ game: fresh });
  },
}));
