import { useState } from "react"
import { coutNouvelleDivision } from "../game/divisions"
import { useFederation, useStore } from "../state/store"

export function DivisionsView() {
  const federation = useFederation()
  const setDivisionActive = useStore((s) => s.setDivisionActive)
  const setEcran = useStore((s) => s.setEcran)
  const creerDivision = useStore((s) => s.creerDivision)
  const [nom, setNom] = useState("")

  const cout = coutNouvelleDivision(federation.divisions.length)
  const argentOk = federation.argent >= cout

  return (
    <div className="vue">
      <h2>Divisions</h2>
      <div className="liste-divisions">
        {federation.divisions.map((d) => (
          <div key={d.id} className="carte-division">
            <div className="carte-division-entete">
              <h3>{d.nom}</h3>
            </div>
            <p className="texte-muted">
              {d.roster.length} lutteur{d.roster.length > 1 ? "s" : ""} · {d.titles.length} titre
              {d.titles.length > 1 ? "s" : ""}
            </p>
            <button
              onClick={() => {
                setDivisionActive(d.id)
                setEcran("effectif")
              }}
            >
              Gérer cette division
            </button>
          </div>
        ))}
      </div>

      <h2 className="titre-nouvelle-division">Ouvrir une nouvelle division</h2>
      <div className="carte-division">
        <p className="texte-muted">
          Une nouvelle division démarre sans lutteur — recrutez sur le marché des transferts ou
          transférez des lutteurs depuis vos autres divisions.
        </p>
        <input
          className="champ-nom"
          type="text"
          placeholder="Nom de la division"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          maxLength={30}
        />
        <p className="carte-division-condition">Coût : {cout.toLocaleString("fr-FR")} €</p>
        <button
          className="primaire"
          onClick={() => {
            creerDivision(nom)
            setNom("")
          }}
          disabled={!argentOk || !nom.trim()}
        >
          {!argentOk ? "Trésorerie insuffisante" : "Ouvrir la division"}
        </button>
      </div>
    </div>
  )
}
