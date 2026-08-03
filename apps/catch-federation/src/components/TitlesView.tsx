import { useFederation } from "../state/store"

export function TitlesView() {
  const federation = useFederation()
  return (
    <div className="vue">
      <h2>Championnats</h2>
      <div className="liste-titres">
        {federation.titles.map((t) => {
          const champion = federation.roster.find((w) => w.id === t.championId)
          return (
            <div key={t.id} className="carte-titre">
              <h3>{t.name}</h3>
              <span className="top-bar-label">Prestige {t.prestige}</span>
              <p>{champion ? `Détenu par ${champion.name}` : "Vacant"}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
