export type Domain = "mecanique" | "carrosserie" | "interieur";

export type PartId =
  | "moteur"
  | "transmission"
  | "suspension"
  | "freins"
  | "echappement"
  | "caisse"
  | "peinture"
  | "boucliers"
  | "jantes"
  | "optiques"
  | "sieges"
  | "tableau"
  | "sellerie"
  | "electronique";

export type BodyType = "citadine" | "berline" | "coupe" | "roadster" | "suv" | "supercar";
export type EngineSize = "petit" | "moyen" | "gros";

export type UpgradeId =
  | "bancMoteur"
  | "cabinePeinture"
  | "atelierSellerie"
  | "outillagePro"
  | "showroom";

export interface CarModel {
  id: string;
  brand: string;
  name: string;
  year: number;
  body: BodyType;
  engineSize: EngineSize;
  engineLabel: string;
  basePower: number;
  weight: number;
  baseHandling: number;
  baseLuxe: number;
  baseStyle: number;
  /** Valeur neuve (modèle récent) ou cote en état concours (modèle ancien). */
  refValue: number;
  rarity: 1 | 2 | 3 | 4 | 5;
  repRequired: number;
  colors: { name: string; hex: string }[];
  description: string;
}

export interface Effects {
  powerPct?: number;
  handling?: number;
  luxe?: number;
  style?: number;
}

export interface PartDef {
  id: PartId;
  domain: Domain;
  label: string;
  /** Poids dans le calcul de l'état général et de l'originalité. */
  weight: number;
  baseCost: number;
  restoreHours: number;
  replaceHours: number;
}

export interface VariantDef {
  id: string;
  part: PartId;
  label: string;
  description: string;
  costMult: number;
  hours: number;
  effects: Effects;
  requires?: UpgradeId;
  repRequired?: number;
  /** Ce variant demande de choisir une teinte. */
  customColor?: boolean;
}

export interface EngineSwapDef {
  id: string;
  label: string;
  power: number;
  sizes: EngineSize[];
  cost: number;
  hours: number;
  repRequired: number;
}

export type PartOrigin = "original" | "oem" | "aftermarket";

export interface PartState {
  condition: number;
  origin: PartOrigin;
  variantId?: string;
}

export type SaleChannel = "annonces" | "reseaux" | "salon" | "encheres";
export type BuyerProfile = "collectionneur" | "performance" | "luxe" | "particulier";

export interface Offer {
  id: string;
  buyer: string;
  profile: BuyerProfile;
  amount: number;
  week: number;
}

export type CarStatus = "atelier" | "vente" | "collection";

export interface Car {
  id: string;
  modelId: string;
  km: number;
  color: { name: string; hex: string };
  originalColor: { name: string; hex: string };
  parts: Record<PartId, PartState>;
  purchasePrice: number;
  invested: number;
  boughtWeek: number;
  status: CarStatus;
  listing?: { channel: SaleChannel; week: number };
  offers: Offer[];
  clientOrderId?: string;
  history: string[];
}

export interface MarketListing {
  id: string;
  car: Car;
  price: number;
  claimedCondition: number;
  inspected: boolean;
  week: number;
  tag?: "bonne-affaire" | "sortie-de-grange" | "neuve";
  seller: string;
}

export type OrderKind = "recherche" | "preparation";

export interface OrderCriteria {
  modelId?: string;
  body?: BodyType;
  collectibleOnly?: boolean;
  minCondition?: number;
  minOriginality?: number;
  minPower?: number;
  minLuxe?: number;
  minStyle?: number;
  minHandling?: number;
}

export interface ClientOrder {
  id: string;
  kind: OrderKind;
  client: string;
  text: string;
  criteria: OrderCriteria;
  reward: number;
  repReward: number;
  deadlineWeeks: number;
  createdWeek: number;
  acceptedWeek?: number;
  status: "disponible" | "acceptee";
  /** Pour une préparation : la voiture confiée par le client. */
  clientCar?: Car;
}

export interface SoldRecord {
  name: string;
  year: number;
  price: number;
  profit: number;
  labels: string[];
  week: number;
  buyer: string;
}

export interface GameState {
  week: number;
  money: number;
  reputation: number;
  hoursLeft: number;
  mechanics: number;
  bays: number;
  upgrades: UpgradeId[];
  cars: Car[];
  market: MarketListing[];
  orders: ClientOrder[];
  sold: SoldRecord[];
  log: { week: number; text: string; tone?: "good" | "bad" | "info" }[];
  debtWeeks: number;
  gameOver: boolean;
  nextId: number;
}
