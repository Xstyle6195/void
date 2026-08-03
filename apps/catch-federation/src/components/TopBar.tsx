import { useFederation } from "../state/store"

export function TopBar() {
  const federation = useFederation()
  return (
    <header className="top-bar">
      <div className="top-bar-item">
        <span className="top-bar-label">Semaine</span>
        <span className="top-bar-value">{federation.semaine}</span>
      </div>
      <div className="top-bar-item">
        <span className="top-bar-label">Trésorerie</span>
        <span className={`top-bar-value ${federation.argent < 0 ? "negatif" : ""}`}>
          {federation.argent.toLocaleString("fr-FR")} €
        </span>
      </div>
      <div className="top-bar-item">
        <span className="top-bar-label">Popularité</span>
        <span className="top-bar-value">{federation.popularite}%</span>
      </div>
    </header>
  )
}
