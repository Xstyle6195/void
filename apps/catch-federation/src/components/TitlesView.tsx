import { useDivisionActive } from "../state/store"
import { DivisionSwitcher } from "./DivisionSwitcher"

export function TitlesView() {
  const division = useDivisionActive()

  return (
    <div className="vue">
      <div className="vue-entete">
        <h2>{division.nom} — Championnats</h2>
        <DivisionSwitcher divisionId={division.id} />
      </div>
      <div className="liste-titres">
        {division.titles.map((t) => {
          const champions = t.championIds
            .map((id) => division.roster.find((w) => w.id === id)?.name)
            .filter((n): n is string => Boolean(n))
          return (
            <div key={t.id} className="carte-titre">
              <h3>{t.name}</h3>
              <span className="top-bar-label">Prestige {t.prestige}</span>
              <p>{champions.length > 0 ? `Détenu par ${champions.join(" & ")}` : "Vacant"}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
