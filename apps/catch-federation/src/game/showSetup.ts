export type TypeScenographie = "standard"

export interface InfoScenographie {
  id: TypeScenographie
  nom: string
  description: string
}

export const SCENOGRAPHIES: InfoScenographie[] = [
  {
    id: "standard",
    nom: "Scénographie standard",
    description: "Décor de base, sans effet particulier. D'autres options (pyrotechnie, écran géant...) arriveront bientôt.",
  },
]

export type TypeModeDiffusion = "locale"

export interface InfoModeDiffusion {
  id: TypeModeDiffusion
  nom: string
  description: string
}

export const MODES_DIFFUSION: InfoModeDiffusion[] = [
  {
    id: "locale",
    nom: "Diffusion locale",
    description: "Diffusion gratuite limitée à la zone de la fédération. Streaming et TV arriveront bientôt.",
  },
]
