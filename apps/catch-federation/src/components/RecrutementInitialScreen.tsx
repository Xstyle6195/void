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
import { TAILLE_ROSTER_INITIAL, useDivisionActive, useFederation, useStore } from "../state/store"
import { CarteAgentLibre } from "./CarteAgentLibre"
import { PanneauFiltres } from "./PanneauFiltres"
import { RosterView } from "./RosterView"

type VueRecrutement = "marche" | "effectif"

const VUES_RECRUTEMENT: { value: VueRecrutement; label: string }[] = [
  { value: "marche", label: "Marché" },
  { value: "effectif", label: "Mon effectif" },
]

const ONGLETS_RECRUTEMENT: { value: CategorieRecrutement; label: string }[] = [
  { value: "officiel", label: "Recrutements officiels" },
  { value: "jobbeur", label: "Jobbeurs" },
]

export function RecrutementInitialScreen() {
  const federation = useFederation()
  const division = useDivisionActive()
  const terminerRecrutementInitial = useStore((s) => s.terminerRecrutementInitial)
  const [vue, setVue] = useState<VueRecrutement>("marche")
  const [onglet, setOnglet] = useState<CategorieRecrutement>("officiel")
  const [tri, setTri] = useState<TriMarche>("aucun")
  const [filtres, setFiltres] = useState<FiltresLutteurs>(FILTRES_PAR_DEFAUT)

  const rosterComplet = division.roster.length >= TAILLE_ROSTER_INITIAL
  const lutteurs = useMemo(() => {
    const disponibles = federation.freeAgents.filter((w) => w.categorie === onglet)
    return trierLutteurs(filtrerLutteurs(disponibles, filtres), tri)
  }, [federation.freeAgents, onglet, tri, filtres])

  return (
    <div className="vue ecran-recrutement-initial">
      <div className="entete-recrutement-initial">
        <span className="entete-recrutement-initial-logo">{federation.logo}</span>
        <div>
          <h2>{federation.nom}</h2>
          <p className="texte-muted">
            Trésorerie : {federation.argent.toLocaleString("fr-FR")} € · Roster sélectionné (
            {division.roster.length}/{TAILLE_ROSTER_INITIAL})
          </p>
        </div>
      </div>

      <p className="texte-muted">
        Recrute jusqu'à {TAILLE_ROSTER_INITIAL} catcheurs pour lancer ta fédération — en général une
        composition équilibrée (6 hommes, 6 femmes), mais libre à toi de voir.
      </p>

      <div className="sous-onglets">
        {VUES_RECRUTEMENT.map((v) => (
          <button
            key={v.value}
            className={vue === v.value ? "actif" : ""}
            onClick={() => setVue(v.value)}
          >
            {v.label} {v.value === "effectif" && `(${division.roster.length}/${TAILLE_ROSTER_INITIAL})`}
          </button>
        ))}
      </div>

      {vue === "effectif" ? (
        <RosterView capRoster={TAILLE_ROSTER_INITIAL} />
      ) : (
        <>
          <div className="sous-onglets">
            {ONGLETS_RECRUTEMENT.map((o) => (
              <button
                key={o.value}
                className={onglet === o.value ? "actif" : ""}
                onClick={() => setOnglet(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>

          <PanneauFiltres filtres={filtres} onChange={setFiltres} />

          <div className="barre-filtre">
            <label htmlFor="tri-recrutement">Trier par</label>
            <select id="tri-recrutement" value={tri} onChange={(e) => setTri(e.target.value as TriMarche)}>
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

          {rosterComplet && (
            <p className="texte-muted">Roster complet — libère un catcheur depuis « Mon effectif » pour en signer un autre.</p>
          )}

          <div className="liste-lutteurs">
            {lutteurs.map((w) => (
              <CarteAgentLibre key={w.id} w={w} capRoster={TAILLE_ROSTER_INITIAL} />
            ))}
          </div>
        </>
      )}

      {division.roster.length === 0 && (
        <p className="texte-muted">
          Tu peux continuer sans catcheur, mais ce sera difficile de composer un show.
        </p>
      )}

      <button className="primaire bouton-demarrer" onClick={terminerRecrutementInitial}>
        Continuer vers ta fédération →
      </button>
    </div>
  )
}
