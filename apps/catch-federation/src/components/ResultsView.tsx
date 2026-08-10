import { areneParId } from "../game/arenas"
import { Etoiles } from "./Etoiles"
import { infoPromo } from "../game/promos"
import { infoStipulation } from "../game/stipulations"
import type { DivisionInstance } from "../game/types"
import { useFederation, useStore } from "../state/store"

function reactionPublique(note: number): string {
  if (note >= 85) return "Le public est en délire, ce show restera dans les mémoires !"
  if (note >= 70) return "Très bon accueil du public, l'énergie était au rendez-vous."
  if (note >= 50) return "Le public a suivi sans grand enthousiasme."
  if (note >= 30) return "Réactions tièdes, la foule s'est vite lassée."
  return "Le public a hué certains passages, soirée compliquée."
}

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

          <p className="texte-reaction-public">🎤 {reactionPublique(resultat.note)}</p>

          <div className="detail-depenses">
            <span className="detail-depenses-titre">Détail des dépenses</span>
            <div className="detail-depenses-ligne">
              <span>Salaires</span>
              <span>{resultat.detailDepenses.salaires.toLocaleString("fr-FR")} €</span>
            </div>
            <div className="detail-depenses-ligne">
              <span>Frais de salle</span>
              <span>{resultat.detailDepenses.frais.toLocaleString("fr-FR")} €</span>
            </div>
            <div className="detail-depenses-ligne">
              <span>Stipulations &amp; interférences</span>
              <span>{resultat.detailDepenses.stipulations.toLocaleString("fr-FR")} €</span>
            </div>
            <div className="detail-depenses-ligne">
              <span>Promos</span>
              <span>{resultat.detailDepenses.promos.toLocaleString("fr-FR")} €</span>
            </div>
            <div className="detail-depenses-ligne detail-depenses-total">
              <span>Total</span>
              <span>{resultat.depenses.toLocaleString("fr-FR")} €</span>
            </div>
          </div>

          <div className="liste-resultats-matches">
            {resultat.matches.map((m, i) => {
              const gagnants = m.winnerIds
                .map((id) => division.roster.find((w) => w.id === id)?.name)
                .filter((n): n is string => Boolean(n))
              const blesse = division.roster.find((w) => w.id === m.blesseId)
              const stip = infoStipulation(m.match.stipulation)
              return (
                <div key={m.match.id} className="carte-resultat-match">
                  <span className="badge">
                    Match {i + 1} · {stip.nom}
                    {m.match.estTitre ? " 🏆" : ""}
                  </span>
                  {m.match.vainqueurImposeIds.length > 0 && (
                    <span className="badge badge-programme">Résultat programmé</span>
                  )}
                  <p>
                    Vainqueur{gagnants.length > 1 ? "s" : ""} :{" "}
                    <strong>{gagnants.length > 0 ? gagnants.join(" & ") : "?"}</strong> — note {m.note}/100
                  </p>
                  {blesse && <p className="texte-blessure">{blesse.name} a été blessé.</p>}
                  {m.interferenceNom && (
                    <p className="texte-interference">🥊 {m.interferenceNom} est intervenu(e) dans le match.</p>
                  )}
                  {m.partisNoms.length > 0 && (
                    <p className="texte-blessure">
                      {m.partisNoms.join(" & ")} quitte{m.partisNoms.length > 1 ? "nt" : ""} la fédération.
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {resultat.promos.length > 0 && (
            <div className="liste-resultats-promos">
              {resultat.promos.map((p, i) => {
                const info = infoPromo(p.type)
                return (
                  <div key={i} className="carte-resultat-match">
                    <span className="badge">🎙️ {info.nom}</span>
                    <p>
                      <strong>{p.participantNoms.join(" & ")}</strong> — effet : popularité{" "}
                      {info.bonusPopularite >= 0 ? "+" : ""}
                      {info.bonusPopularite}, moral {info.bonusMoral >= 0 ? "+" : ""}
                      {info.bonusMoral}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {resultat.debauchesNoms.length > 0 && (
            <p className="texte-blessure">
              🏴 {resultat.debauchesNoms.join(", ")} {resultat.debauchesNoms.length > 1 ? "ont" : "a"} signé
              avec une fédération rivale.
            </p>
          )}

          {division.roster.length > 0 && (
            <div className="etat-roster">
              <span className="detail-depenses-titre">État du roster après le show</span>
              {division.roster.map((w) => (
                <div key={w.id} className="ligne-etat-lutteur">
                  <span className="etat-lutteur-nom">
                    {w.name}
                    {w.blessureSemaines > 0 && (
                      <span className="badge badge-blessure">Blessé ({w.blessureSemaines} sem.)</span>
                    )}
                  </span>
                  <Etoiles label="Moral" valeur={w.moral} />
                  <Etoiles label="Forme" valeur={w.forme} />
                </div>
              ))}
            </div>
          )}
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
