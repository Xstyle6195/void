import type { FormatMatch, MatchStipulation } from "./stipulations"
import type { FederationRivale } from "./rivals"
import type { TypePromo } from "./promos"
import type { TypeModeDiffusion, TypeScenographie } from "./showSetup"

export type Alignment = "face" | "heel"

export type Genre = "homme" | "femme"

export type MoveStyle = "technique" | "puissance" | "aérien" | "hardcore" | "catch-mental"

export type CategorieRecrutement = "officiel" | "jobbeur"

export type TypeContrat = "permanent" | "temporaire"

export type { FormatMatch, MatchStipulation, FederationRivale, TypePromo, TypeModeDiffusion, TypeScenographie }

export interface Wrestler {
  id: string
  name: string
  genre: Genre
  debutant: boolean
  alignment: Alignment
  style: MoveStyle
  categorie: CategorieRecrutement
  typeContrat: TypeContrat
  dureeMoisContrat: number | null
  coutSignature: number
  charisme: number
  technique: number
  force: number
  popularite: number
  moral: number
  forme: number
  age: number
  salaire: number
  contratSemaines: number
  blessureSemaines: number
  titreId: string | null
}

export interface Title {
  id: string
  name: string
  genre: Genre
  prestige: number
  championIds: string[]
}

export interface BookedMatch {
  id: string
  format: FormatMatch
  participantIds: string[]
  equipeA: string[]
  equipeB: string[]
  stipulation: MatchStipulation
  estTitre: boolean
  titleId: string | null
  vainqueurImposeIds: string[]
  interferenceId: string | null
}

export interface MatchResult {
  match: BookedMatch
  winnerIds: string[]
  note: number
  blesseId: string | null
  partisNoms: string[]
  interferenceNom: string | null
}

export interface BookedPromo {
  id: string
  type: TypePromo
  participantIds: string[]
}

export interface PromoResultat {
  type: TypePromo
  participantNoms: string[]
}

export interface DetailDepenses {
  salaires: number
  frais: number
  stipulations: number
  promos: number
}

export interface ShowResult {
  semaine: number
  matches: MatchResult[]
  promos: PromoResultat[]
  note: number
  spectateurs: number
  revenus: number
  depenses: number
  detailDepenses: DetailDepenses
  nouveauxFans: number
  debauchesNoms: string[]
}

export interface DivisionInstance {
  id: string
  nom: string
  areneId: string
  scenographie: TypeScenographie
  modeDiffusion: TypeModeDiffusion
  roster: Wrestler[]
  titles: Title[]
  card: BookedMatch[]
  promos: BookedPromo[]
  dernierResultat: ShowResult | null
  historique: ShowResult[]
}

export type Screen =
  | "effectif"
  | "booking"
  | "resultats"
  | "titres"
  | "marche"
  | "marketing"
  | "arenes"
  | "officiels"
  | "divisions"
  | "rivales"

export type Difficulte = "facile" | "normal" | "difficile"

export interface FederationState {
  nom: string
  logo: string
  difficulte: Difficulte
  semaine: number
  argent: number
  popularite: number
  fans: number
  divisions: DivisionInstance[]
  freeAgents: Wrestler[]
  derniereCampagne: Record<string, number>
  officiels: Record<"marketing" | "artistique" | "adjoint", string | null>
  rivales: FederationRivale[]
  gameOver: boolean
}
