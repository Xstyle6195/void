export type Alignment = "face" | "heel"

export type MoveStyle = "technique" | "puissance" | "aérien" | "hardcore" | "catch-mental"

export interface Wrestler {
  id: string
  name: string
  alignment: Alignment
  style: MoveStyle
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
  prestige: number
  championId: string | null
}

export type MatchStipulation = "normal" | "titre" | "no-dq" | "échelles"

export interface BookedMatch {
  id: string
  participantIds: string[]
  stipulation: MatchStipulation
  titleId: string | null
}

export interface MatchResult {
  match: BookedMatch
  winnerId: string
  note: number
  blesseId: string | null
}

export interface ShowResult {
  semaine: number
  matches: MatchResult[]
  note: number
  spectateurs: number
  revenus: number
  depenses: number
  popularitePost: number
}

export type Screen =
  | "effectif"
  | "booking"
  | "resultats"
  | "titres"
  | "marche"

export interface FederationState {
  nom: string
  semaine: number
  argent: number
  popularite: number
  roster: Wrestler[]
  freeAgents: Wrestler[]
  titles: Title[]
  card: BookedMatch[]
  dernierResultat: ShowResult | null
  historique: ShowResult[]
  gameOver: boolean
}
