export type Sex = "M" | "F";

export type TraitId =
  | "brave"
  | "cowardly"
  | "wise"
  | "foolish"
  | "just"
  | "cruel"
  | "generous"
  | "greedy"
  | "pious"
  | "impious"
  | "charismatic"
  | "frail"
  | "hale"
  | "ambitious";

export interface Trait {
  id: TraitId;
  name: string;
  description: string;
  effects: Partial<Stats>;
}

export interface Stats {
  martial: number;
  diplomacy: number;
  stewardship: number;
  piety: number;
}

export interface Person {
  id: string;
  name: string;
  sex: Sex;
  birthYear: number;
  deathYear: number | null;
  traits: TraitId[];
  stats: Stats;
  health: number; // 0-100
  fatherId: string | null;
  motherId: string | null;
  spouseId: string | null;
}

export type BuildingId =
  | "farm"
  | "market"
  | "barracks"
  | "temple"
  | "walls"
  | "hall";

export interface BuildingType {
  id: BuildingId;
  name: string;
  cost: number;
  description: string;
  effects: {
    food?: number;
    gold?: number;
    stability?: number;
    martial?: number;
    prestige?: number;
  };
}

export type ProvinceKind = "capital" | "town" | "village" | "frontier" | "colony";

export interface Province {
  id: string;
  name: string;
  kind: ProvinceKind;
  population: number;
  buildings: BuildingId[];
  foundedYear: number;
  x: number;
  y: number;
  bonusGold?: number;
  bonusFood?: number;
}

export interface Neighbor {
  id: string;
  name: string;
  relation: number; // -100..100
  strength: number; // relative military power
  atWar: boolean;
  isVassal: boolean;
  allied: boolean;
  tradeRouteLevel: number; // 0 = none, 1-3 = trade route quality
  capitalX: number;
  capitalY: number;
  territory: { x: number; y: number }[];
}

export type LogKind =
  | "birth"
  | "death"
  | "succession"
  | "war"
  | "peace"
  | "event"
  | "building"
  | "province"
  | "diplomacy"
  | "marriage"
  | "expedition"
  | "gameover";

export interface LogEntry {
  year: number;
  kind: LogKind;
  text: string;
}

export interface EventChoice {
  id: string;
  label: string;
  apply: (ctx: EventContext) => string; // returns result text, mutates via ctx
}

export interface EventContext {
  state: GameState;
}

export interface GameEvent {
  id: string;
  title: string;
  body: string;
  condition?: (state: GameState) => boolean;
  weight?: number;
  choices: EventChoice[];
}

export interface Resources {
  gold: number;
  food: number;
  stability: number; // 0-100
  prestige: number;
}

export type GamePhase = "playing" | "succession" | "gameover";

export interface PendingEvent {
  eventId: string;
}

export type ExpeditionKind = "geographic" | "mercantile" | "resource";
export type Ambition = 1 | 2 | 3;

export interface ExpeditionOffer {
  id: string;
  kind: ExpeditionKind;
  explorerName: string;
  title: string;
  description: string;
  cost: number;
  duration: number;
  ambition: Ambition;
  successChance: number;
  colonize: boolean;
  expiresYear: number;
  targetX: number;
  targetY: number;
  neighborId: string | null;
  tradeLevel: number;
  rewardGold: number;
  rewardFood: number;
  rewardPrestige: number;
}

export interface ActiveExpedition {
  id: string;
  offer: ExpeditionOffer;
  departureYear: number;
  returnYear: number;
}

export interface GameState {
  year: number;
  dynastyName: string;
  kingdomName: string;
  foundingYear: number;
  ruler: Person;
  heirs: Person[];
  deceased: Person[];
  familyMembers: Person[];
  provinces: Province[];
  resources: Resources;
  neighbors: Neighbor[];
  log: LogEntry[];
  pendingEvent: PendingEvent | null;
  phase: GamePhase;
  reignCount: number;
  nextId: number;
  knownTiles: string[];
  expeditionOffers: ExpeditionOffer[];
  activeExpeditions: ActiveExpedition[];
}
