import { useFederation, useStore } from "../state/store"

export function ResultsView() {
  const federation = useFederation()
  const setEcran = useStore((s) => s.setEcran)
  const resultat = federation.dernierResultat

  if (!resultat) {
    return (
      <div className="vue">
        <h2>Résultats</h2>
        <p className="texte-muted">Aucun show n'a encore eu lieu.</p>
      </div>
    )
  }

  return (
    <div className="vue">
      <h2>Show de la semaine {resultat.semaine}</h2>
      <div className="resume-show">
        <div>
          <span className="top-bar-label">Note du show</span>
          <span className="top-bar-value">{resultat.note}/100</span>
        </div>
        <div>
          <span className="top-bar-label">Spectateurs</span>
          <span className="top-bar-value">{resultat.spectateurs.toLocaleString("fr-FR")}</span>
        </div>
        <div>
          <span className="top-bar-label">Revenus</span>
          <span className="top-bar-value">{resultat.revenus.toLocaleString("fr-FR")} €</span>
        </div>
        <div>
          <span className="top-bar-label">Dépenses</span>
          <span className="top-bar-value">{resultat.depenses.toLocaleString("fr-FR")} €</span>
        </div>
        <div>
          <span className="top-bar-label">Nouveaux fans</span>
          <span className="top-bar-value">+{resultat.nouveauxFans.toLocaleString("fr-FR")}</span>
        </div>
        <div>
          <span className="top-bar-label">Total fans</span>
          <span className="top-bar-value">{federation.fans.toLocaleString("fr-FR")}</span>
        </div>
      </div>

      <div className="liste-resultats-matches">
        {resultat.matches.map((m, i) => {
          const gagnant = federation.roster.find((w) => w.id === m.winnerId)
          const blesse = federation.roster.find((w) => w.id === m.blesseId)
          return (
            <div key={m.match.id} className="carte-resultat-match">
              <span className="badge">Match {i + 1} · {m.match.stipulation}</span>
              <p>
                Vainqueur : <strong>{gagnant?.name ?? "?"}</strong> — note {m.note}/100
              </p>
              {blesse && <p className="texte-blessure">{blesse.name} a été blessé.</p>}
            </div>
          )
        })}
      </div>

      {federation.gameOver ? (
        <div className="alerte-faillite">
          <h3>Faillite de la fédération</h3>
          <p>La trésorerie est trop négative, la fédération met la clé sous la porte.</p>
        </div>
      ) : (
        <button className="primaire" onClick={() => setEcran("booking")}>
          Préparer la semaine suivante
        </button>
      )}
    </div>
  )
}
