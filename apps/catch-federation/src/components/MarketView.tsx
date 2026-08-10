import { useMemo, useState } from "react"
import type { CategorieRecrutement } from "../game/types"
import {
  FILTRES_PAR_DEFAUT,
  filtrerLutteurs,
  OPTIONS_TRI,
  trierLutteurs,
  type FiltresLutteurs,
  type TriMarche,
} from "../game/triLutteurs"
import { useFederation } from "../state/store"
import { CarteAgentLibre } from "./CarteAgentLibre"
import { PanneauFiltres } from "./PanneauFiltres"

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
  const [filtres, setFiltres] = useState<FiltresLutteurs>(FILTRES_PAR_DEFAUT)

  const ongletActif = ONGLETS_MARCHE.find((o) => o.value === onglet)!
  const lutteurs = useMemo(() => {
    const disponibles = federation.freeAgents.filter((w) => w.categorie === onglet)
    return trierLutteurs(filtrerLutteurs(disponibles, filtres), tri)
  }, [federation.freeAgents, onglet, tri, filtres])

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

      <PanneauFiltres filtres={filtres} onChange={setFiltres} />

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

      <p className="texte-muted texte-nb-resultats">
        {lutteurs.length} catcheur{lutteurs.length > 1 ? "s" : ""} trouvé{lutteurs.length > 1 ? "s" : ""}
      </p>

      <div className="liste-lutteurs">
        {lutteurs.map((w) => (
          <CarteAgentLibre key={w.id} w={w} />
        ))}
      </div>
    </div>
  )
}
