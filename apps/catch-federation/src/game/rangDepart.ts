import type { PalierRivale } from "./rivals"

export interface PresetRang {
  argent: number
  fans: number
  popularite: number
  description: string
}

export const ORDRE_RANGS: PalierRivale[] = ["locale", "regionale", "nationale", "mondiale"]

export const PRESETS_RANG: Record<PalierRivale, PresetRang> = {
  locale: {
    argent: 15000,
    fans: 0,
    popularite: 20,
    description: "Une petite fédération qui débute, sans public établi. Le marché des transferts ne propose que des étoiles locales.",
  },
  regionale: {
    argent: 40000,
    fans: 6000,
    popularite: 32,
    description: "Déjà connue dans sa région, avec un peu plus de moyens et de meilleurs catcheurs disponibles à la signature.",
  },
  nationale: {
    argent: 100000,
    fans: 30000,
    popularite: 48,
    description: "Reconnue à l'échelle nationale, avec une trésorerie confortable et accès aux meilleurs talents du marché.",
  },
  mondiale: {
    argent: 350000,
    fans: 130000,
    popularite: 68,
    description: "De renommée mondiale, riche et déjà installée face aux plus grandes fédérations concurrentes.",
  },
}
