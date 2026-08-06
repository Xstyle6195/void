import { areneParId } from "../game/arenas"
import { infoStipulation } from "../game/stipulations"
import type { DivisionInstance } from "../game/types"
import { useFederation, useStore } from "../state/store"

function BlocDivision({ division, semaine }: { division: DivisionInstance; semaine: number }) {
  const resultat = division.dernierResultat
  const aJoue = resultat?.semaine === semaine
  const arene = areneParId(division.areneId)

  return (
    <div className="carte-resultat-division">
      <h3>{division.nom}</h3>
      <p className="texte-muted">{arene.nom}</p>
      {!aJoue || !resultat ? (
        <p className="texte-muted">Pas de show cette semaine.</p>
      ) : (
        <>
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
              <span className="top-bar-label">Nouveaux fans</span>
              <span className="top-bar-value">+{resultat.nouveauxFans.toLocaleString("fr-FR")}</span>
            </div>
          </div>
          <div className="liste-resultats-matches">
            {resultat.matches.map((m, i) => {
              const gagnant = division.roster.find((w) => w.id === m.winnerId)
              const blesse = division.roster.find((w) => w.id === m.blesseId)
              const stip = infoStipulation(m.match.stipulation)
              return (
                <div key={m.match.id} className="carte-resultat-match">
                  <span className="badge">
                    Match {i + 1} · {stip.nom}
                    {m.match.estTitre ? " 🏆" : ""}
                  </span>
                  <p>
                    Vainqueur : <strong>{gagnant?.name ?? "?"}</strong> — note {m.note}/100
                  </p>
                  {blesse && <p className="texte-blessure">{blesse.name} a été blessé.</p>}
                  {m.partiNom && (
                    <p className="texte-blessure">{m.partiNom} quitte la fédération.</p>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export function ResultsView() {
  const federation = useFederation()
  const setEcran = useStore((s) => s.setEcran)
  const semaineEcoulee = federation.semaine - 1

  const divisionsAyantJoue = federation.divisions.filter(
    (d) => d.dernierResultat?.semaine === semaineEcoulee,
  )
  const revenusTotaux = divisionsAyantJoue.reduce((acc, d) => acc + (d.dernierResultat?.revenus ?? 0), 0)
  const fansTotaux = divisionsAyantJoue.reduce((acc, d) => acc + (d.dernierResultat?.nouveauxFans ?? 0), 0)

  if (semaineEcoulee < 1) {
    return (
      <div className="vue">
        <h2>Résultats</h2>
        <p className="texte-muted">Aucun show n'a encore eu lieu.</p>
      </div>
    )
  }

  return (
    <div className="vue">
      <h2>Bilan de la semaine {semaineEcoulee}</h2>
      <div className="resume-show">
        <div>
          <span className="top-bar-label">Trésorerie</span>
          <span className="top-bar-value">{federation.argent.toLocaleString("fr-FR")} €</span>
        </div>
        <div>
          <span className="top-bar-label">Revenus des shows</span>
          <span className="top-bar-value">{revenusTotaux.toLocaleString("fr-FR")} €</span>
        </div>
        <div>
          <span className="top-bar-label">Nouveaux fans</span>
          <span className="top-bar-value">+{fansTotaux.toLocaleString("fr-FR")}</span>
        </div>
        <div>
          <span className="top-bar-label">Total fans</span>
          <span className="top-bar-value">{federation.fans.toLocaleString("fr-FR")}</span>
        </div>
      </div>

      <div className="liste-resultats-divisions">
        {federation.divisions.map((d) => (
          <BlocDivision key={d.id} division={d} semaine={semaineEcoulee} />
        ))}
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
