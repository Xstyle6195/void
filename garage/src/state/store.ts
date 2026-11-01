import { create } from "zustand";
import * as E from "../game/engine";
import type { GameState, PartId, SaleChannel, UpgradeId } from "../game/types";

const SAVE_KEY = "atelier-prepa-save-v1";

function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
}

function persist(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // stockage indisponible : on ignore
  }
}

export type Tab = "atelier" | "marche" | "conception" | "vente" | "commandes" | "equipement" | "collection";

interface Store {
  game: GameState;
  tab: Tab;
  selectedCarId: string | null;
  setTab: (tab: Tab) => void;
  openCar: (carId: string) => void;
  apply: (fn: (g: GameState) => GameState) => void;
  // Raccourcis
  nextWeek: () => void;
  buy: (listingId: string) => void;
  inspect: (listingId: string) => void;
  restore: (carId: string, partId: PartId) => void;
  oem: (carId: string, partId: PartId) => void;
  variant: (carId: string, variantId: string, color?: { name: string; hex: string }) => void;
  swap: (carId: string, swapId: string) => void;
  list: (carId: string, channel: SaleChannel) => void;
  unlist: (carId: string) => void;
  accept: (carId: string, offerId: string) => void;
  decline: (carId: string, offerId: string) => void;
  dealer: (carId: string) => void;
  toCollection: (carId: string) => void;
  fromCollection: (carId: string) => void;
  acceptOrder: (orderId: string) => void;
  declineOrder: (orderId: string) => void;
  deliver: (orderId: string, carId: string) => void;
  upgrade: (id: UpgradeId) => void;
  bay: () => void;
  hire: () => void;
  fire: () => void;
  reset: () => void;
}

export const useStore = create<Store>((set, get) => {
  const apply = (fn: (g: GameState) => GameState) => {
    const next = fn(get().game);
    if (next !== get().game) {
      persist(next);
      set({ game: next });
    }
  };
  return {
    game: loadSave() ?? E.createInitialState(),
    tab: "atelier",
    selectedCarId: null,
    setTab: (tab) => set({ tab }),
    openCar: (carId) => set({ selectedCarId: carId, tab: "conception" }),
    apply,
    nextWeek: () => apply(E.endWeek),
    buy: (id) => {
      const before = get().game.cars.length;
      apply((g) => E.buyListing(g, id));
      const cars = get().game.cars;
      if (cars.length > before) set({ selectedCarId: cars[cars.length - 1].id });
    },
    inspect: (id) => apply((g) => E.inspectListing(g, id)),
    restore: (c, p) => apply((g) => E.restorePart(g, c, p)),
    oem: (c, p) => apply((g) => E.replaceOem(g, c, p)),
    variant: (c, v, color) => apply((g) => E.installVariant(g, c, v, color)),
    swap: (c, s) => apply((g) => E.installSwap(g, c, s)),
    list: (c, ch) => apply((g) => E.listForSale(g, c, ch)),
    unlist: (c) => apply((g) => E.unlist(g, c)),
    accept: (c, o) => apply((g) => E.acceptOffer(g, c, o)),
    decline: (c, o) => apply((g) => E.declineOffer(g, c, o)),
    dealer: (c) => apply((g) => E.sellToDealer(g, c)),
    toCollection: (c) => apply((g) => E.toCollection(g, c)),
    fromCollection: (c) => apply((g) => E.fromCollection(g, c)),
    acceptOrder: (o) => apply((g) => E.acceptOrder(g, o)),
    declineOrder: (o) => apply((g) => E.declineOrder(g, o)),
    deliver: (o, c) => apply((g) => E.deliverOrder(g, o, c)),
    upgrade: (id) => apply((g) => E.buyUpgrade(g, id)),
    bay: () => apply(E.buyBay),
    hire: () => apply(E.hireMechanic),
    fire: () => apply(E.fireMechanic),
    reset: () => {
      const fresh = E.createInitialState();
      persist(fresh);
      set({ game: fresh, tab: "atelier", selectedCarId: null });
    },
  };
});
