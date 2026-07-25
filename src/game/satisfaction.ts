export type SatisfactionTier = "furious" | "unhappy" | "content" | "delighted";

export const SATISFACTION_START = 60;

export function satisfactionTier(value: number): SatisfactionTier {
  if (value >= 75) return "delighted";
  if (value >= 45) return "content";
  if (value >= 20) return "unhappy";
  return "furious";
}

export const TIER_LABEL: Record<SatisfactionTier, string> = {
  delighted: "Ravi",
  content: "Content",
  unhappy: "Mécontent",
  furious: "Furieux",
};

export const TIER_DESCRIPTION: Record<SatisfactionTier, string> = {
  delighted: "Le peuple est enthousiaste : production doublée et natalité en forte hausse.",
  content: "Le peuple est satisfait de son sort et ne se plaint pas.",
  unhappy: "Le peuple gronde : production et natalité en baisse.",
  furious: "Le peuple est furieux : risque de soulèvement et de révolution.",
};

export function productionMultiplier(tier: SatisfactionTier): number {
  switch (tier) {
    case "delighted":
      return 2;
    case "content":
      return 1;
    case "unhappy":
      return 0.7;
    case "furious":
      return 0.4;
  }
}

export function growthMultiplier(tier: SatisfactionTier): number {
  switch (tier) {
    case "delighted":
      return 1.5;
    case "content":
      return 1;
    case "unhappy":
      return 0.6;
    case "furious":
      return 0.3;
  }
}
