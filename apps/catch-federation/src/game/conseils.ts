import { coutNouvelleDivision } from "./divisions"
import { CAMPAGNES_MARKETING } from "./marketing"
import type { FederationState, Wrestler } from "./types"

export function conseilMarketing(federation: FederationState): string {
  const candidates = CAMPAGNES_MARKETING.filter((c) => {
    if (federation.fans < c.fansRequis) return false
    if (federation.argent < c.cout) return false
    const derniere = federation.derniereCampagne[c.id]
    if (derniere !== undefined && federation.semaine - derniere < c.cooldownSemaines) return false
    return true
  }).sort((a, b) => b.gainFans / b.cout - a.gainFans / a.cout)

  const meilleure = candidates[0]
  if (!meilleure) {
    return "Aucune campagne n'est disponible pour le moment : attendez la fin d'un cooldown ou gagnez plus de fans."
  }
  return `Lancez « ${meilleure.nom} » (${meilleure.cout.toLocaleString("fr-FR")} €) : le meilleur rapport fans/coût actuellement disponible.`
}

export function conseilArtistique(federation: FederationState): string {
  const roster: Wrestler[] = federation.divisions.flatMap((d) => d.roster)
  const disponibles = roster.filter((w) => w.blessureSemaines === 0)

  let meilleurePaire: [Wrestler, Wrestler] | null = null
  let meilleurEcart = Infinity
  for (let i = 0; i < disponibles.length; i += 1) {
    for (let j = i + 1; j < disponibles.length; j += 1) {
      const a = disponibles[i]
      const b = disponibles[j]
      if (a.alignment === b.alignment) continue
      const ecart = Math.abs(a.popularite - b.popularite)
      if (ecart < meilleurEcart) {
        meilleurEcart = ecart
        meilleurePaire = [a, b]
      }
    }
  }

  if (!meilleurePaire) {
    return "Recrutez davantage de lutteurs des deux alignements pour construire de bonnes rivalités."
  }
  const [a, b] = meilleurePaire
  return `Une rivalité entre ${a.name} (${a.alignment === "face" ? "face" : "heel"}) et ${b.name} (${b.alignment === "face" ? "face" : "heel"}) aurait un bon écho : popularités proches, alignements opposés.`
}

export function conseilAdjoint(federation: FederationState): string {
  const roster: Wrestler[] = federation.divisions.flatMap((d) => d.roster)

  const contratBientotFini = roster
    .filter((w) => w.contratSemaines <= 3)
    .sort((a, b) => a.contratSemaines - b.contratSemaines)[0]
  if (contratBientotFini) {
    return `Le contrat de ${contratBientotFini.name} expire dans ${contratBientotFini.contratSemaines} semaine${contratBientotFini.contratSemaines > 1 ? "s" : ""} : pensez à le renouveler ou à le laisser partir.`
  }

  const coutProchaineDivision = coutNouvelleDivision(federation.divisions.length)
  if (federation.argent > coutProchaineDivision * 2) {
    return `La trésorerie est confortable : vous pourriez ouvrir une nouvelle division (${coutProchaineDivision.toLocaleString("fr-FR")} €).`
  }

  const meilleurAgent = [...federation.freeAgents].sort(
    (a, b) =>
      (b.charisme + b.technique + b.force) / b.salaire - (a.charisme + a.technique + a.force) / a.salaire,
  )[0]
  if (meilleurAgent) {
    return `Sur le marché des transferts, ${meilleurAgent.name} offre un bon rapport qualité/prix (${meilleurAgent.salaire} €/sem.).`
  }

  return "Rien d'urgent à signaler cette semaine : les finances de la fédération sont sous contrôle."
}

export interface EtatEffectif {
  total: number
  blesses: number
  moralMoyen: number
  formeMoyenne: number
}

export function etatEffectif(federation: FederationState): EtatEffectif {
  const roster: Wrestler[] = federation.divisions.flatMap((d) => d.roster)
  if (roster.length === 0) {
    return { total: 0, blesses: 0, moralMoyen: 0, formeMoyenne: 0 }
  }
  const blesses = roster.filter((w) => w.blessureSemaines > 0).length
  const moralMoyen = Math.round(roster.reduce((acc, w) => acc + w.moral, 0) / roster.length)
  const formeMoyenne = Math.round(roster.reduce((acc, w) => acc + w.forme, 0) / roster.length)
  return { total: roster.length, blesses, moralMoyen, formeMoyenne }
}
