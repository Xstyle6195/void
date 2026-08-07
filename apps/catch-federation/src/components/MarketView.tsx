import { useMemo, useState } from "react"
import type { CategorieRecrutement, Wrestler } from "../game/types"
import { MAX_ROSTER_DIVISION, useDivisionActive, useFederation, useStore } from "../state/store"
import { Etoiles } from "./Etoiles"

type TriMarche = "aucun" | "sexe" | "niveau" | "specialite" | "alignment"

const OPTIONS_TRI: { value: TriMarche; label: string }[] = [
  { value: "aucun", label: "Par défaut" },
  { value: "niveau", label: "Niveau" },
  { value: "sexe", label: "Sexe" },
  { value: "specialite", label: "Spécialité" },
  { value: "alignment", label: "Heel / Face" },
]

function niveauLutteur(w: Wrestler): number {
  return (w.charisme + w.technique + w.force) / 3
}

function trierLutteurs(lutteurs: Wrestler[], tri: TriMarche): Wrestler[] {
  const copie = [...lutteurs]
  switch (tri) {
    case "niveau":
      return copie.sort((a, b) => niveauLutteur(b) - niveauLutteur(a))
    case "sexe":
      return copie.sort((a, b) => a.genre.localeCompare(b.genre))
    case "specialite":
      return copie.sort((a, b) => a.style.localeCompare(b.style))
    case "alignment":
      return copie.sort((a, b) => a.alignment.localeCompare(b.alignment))
    default:
      return copie
  }
}

function libelleContrat(w: Wrestler): string {
  if (w.typeContrat === "temporaire" && w.dureeMoisContrat) {
    return `Contrat temporaire (${w.dureeMoisContrat} mois)`
  }
  return "Contrat permanent (3 ans)"
}

function CarteAgentLibre({ w }: { w: Wrestler }) {
  const federation = useFederation()
  const divisionActive = useDivisionActive()
  const signerAgentLibre = useStore((s) => s.signerAgentLibre)
  const [cible, setCible] = useState(divisionActive.id)
  const divisionCible = federation.divisions.find((d) => d.id === cible)
  const divisionPleine = (divisionCible?.roster.length ?? 0) >= MAX_ROSTER_DIVISION

  return (
    <div className="carte-lutteur">
      <div className="carte-lutteur-entete">
        <div>
          <h3>{w.name}</h3>
          <span className="badge badge-genre">
            {w.genre === "homme" ? "Catcheur" : "Catcheuse"}
          </span>
          <span className={`badge badge-${w.alignment}`}>
            {w.alignment === "face" ? "Face" : "Heel"}
          </span>
          <span className="badge badge-style">{w.style}</span>
          {w.debutant && <span className="badge">Débutant</span>}
          {w.typeContrat === "temporaire" && <span className="badge badge-titre">Guest star</span>}
        </div>
      </div>
      <Etoiles label="Charisme" valeur={w.charisme} />
      <Etoiles label="Technique" valeur={w.technique} />
      <Etoiles label="Force" valeur={w.force} />
      <div className="carte-lutteur-pied">
        <span>Âge {w.age}</span>
        <span>{w.salaire} €/sem.</span>
        <span>{libelleContrat(w)}</span>
      </div>
      <div className="carte-lutteur-actions">
        <select value={cible} onChange={(e) => setCible(e.target.value)}>
          {federation.divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nom} ({d.roster.length}/{MAX_ROSTER_DIVISION})
            </option>
          ))}
        </select>
        <button
          className="primaire"
          onClick={() => signerAgentLibre(w.id, cible)}
          disabled={federation.argent < w.coutSignature || divisionPleine}
        >
          {divisionPleine ? "Division pleine" : `Signer (${w.coutSignature.toLocaleString("fr-FR")} €)`}
        </button>
      </div>
    </div>
  )
}

const ONGLETS_MARCHE: { value: CategorieRecrutement; label: string; description: string }[] = [
  {
    value: "officiel",
    label: "Recrutements officiels",
    description:
      "Contrat permanent de 3 ans, sauf mention « guest star » : ces profils ne sont disponibles que pour 1, 3 ou 6 mois, avec de meilleures stats et un coût plus élevé.",
  },
  {
    value: "jobbeur",
    label: "Jobbeurs",
    description: "Stats très faibles, coût de signature réduit. Utiles pour compléter une carte à moindre coût.",
  },
]

export function MarketView() {
  const federation = useFederation()
  const [onglet, setOnglet] = useState<CategorieRecrutement>("officiel")
  const [tri, setTri] = useState<TriMarche>("aucun")

  const ongletActif = ONGLETS_MARCHE.find((o) => o.value === onglet)!
  const lutteurs = useMemo(
    () => trierLutteurs(federation.freeAgents.filter((w) => w.categorie === onglet), tri),
    [federation.freeAgents, onglet, tri],
  )

  return (
    <div className="vue">
      <h2>Marché des transferts</h2>

      <div className="sous-onglets">
        {ONGLETS_MARCHE.map((o) => (
          <button
            key={o.value}
            className={onglet === o.value ? "actif" : ""}
            onClick={() => setOnglet(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="texte-muted">{ongletActif.description}</p>

      <div className="barre-filtre">
        <label htmlFor="tri-marche">Trier par</label>
        <select id="tri-marche" value={tri} onChange={(e) => setTri(e.target.value as TriMarche)}>
          {OPTIONS_TRI.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="liste-lutteurs">
        {lutteurs.map((w) => (
          <CarteAgentLibre key={w.id} w={w} />
        ))}
      </div>
    </div>
  )
}
