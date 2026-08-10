export interface ArenaTier {
  id: string
  nom: string
  description: string
  capacite: number
  prixBillet: number
  fansRequis: number
  coutLocation: number
}

export const ARENES: ArenaTier[] = [
  {
    id: "rue",
    nom: "La Rue",
    description: "Des combats organisés à même le bitume, sur une place publique.",
    capacite: 900,
    prixBillet: 18,
    fansRequis: 0,
    coutLocation: 0,
  },
  {
    id: "salle-communale",
    nom: "Salle Communale",
    description: "Une salle des fêtes louée pour l'occasion.",
    capacite: 2000,
    prixBillet: 22,
    fansRequis: 0,
    coutLocation: 3000,
  },
  {
    id: "gymnase-lycee",
    nom: "Gymnase de Lycée",
    description: "Un gymnase scolaire, gradins compris.",
    capacite: 4000,
    prixBillet: 26,
    fansRequis: 3000,
    coutLocation: 8000,
  },
  {
    id: "arene-nationale",
    nom: "Arène Nationale",
    description: "Une véritable arène couverte, à l'échelle du pays.",
    capacite: 12000,
    prixBillet: 35,
    fansRequis: 15000,
    coutLocation: 25000,
  },
  {
    id: "stade",
    nom: "Stade",
    description: "Un stade complet, pour l'événement le plus prestigieux de la fédération.",
    capacite: 40000,
    prixBillet: 50,
    fansRequis: 50000,
    coutLocation: 70000,
  },
]

export function areneParId(id: string): ArenaTier {
  return ARENES.find((a) => a.id === id) ?? ARENES[0]
}
