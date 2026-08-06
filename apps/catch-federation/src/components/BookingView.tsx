import { areneParId } from "../game/arenas"
import { infoStipulation, STIPULATIONS } from "../game/stipulations"
import type { BookedMatch, MatchStipulation } from "../game/types"
import { useDivisionActive, useStore } from "../state/store"
import { DivisionSwitcher } from "./DivisionSwitcher"

function MatchCard({ match }: { match: BookedMatch }) {
  const division = useDivisionActive()
  const toggleParticipant = useStore((s) => s.toggleParticipant)
  const definirStipulation = useStore((s) => s.definirStipulation)
  const definirEstTitre = useStore((s) => s.definirEstTitre)
  const definirTitre = useStore((s) => s.definirTitre)
  const supprimerMatch = useStore((s) => s.supprimerMatch)

  const lutteursDisponibles = division.roster.filter((w) => w.blessureSemaines === 0)
  const stip = infoStipulation(match.stipulation)
  const complet = match.participantIds.length >= 2

  return (
    <div className="carte-match">
      <div className="carte-match-entete">
        <select
          value={match.stipulation}
          onChange={(e) => definirStipulation(match.id, e.target.value as MatchStipulation)}
        >
          {STIPULATIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nom}
            </option>
          ))}
        </select>
        <button className="danger" onClick={() => supprimerMatch(match.id)}>
          Retirer le match
        </button>
      </div>

      <p className="texte-muted texte-stipulation">
        {stip.description} {stip.cout > 0 && `· Coût : ${stip.cout.toLocaleString("fr-FR")} €`}
      </p>
      {match.stipulation === "loser-leaves-town" && (
        <p className="avertissement-stipulation">
          ⚠️ Le perdant sera libéré de la fédération. Idéal pour clore une rivalité.
        </p>
      )}

      <label className="case-titre">
        <input
          type="checkbox"
          checked={match.estTitre}
          onChange={(e) => definirEstTitre(match.id, e.target.checked)}
        />
        Match de titre
      </label>

      {match.estTitre && (
        <select
          value={match.titleId ?? ""}
          onChange={(e) => definirTitre(match.id, e.target.value || null)}
        >
          <option value="">Choisir un titre…</option>
          {division.titles.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}

      <div className="participants-choisis">
        {match.participantIds.length === 0 && (
          <span className="texte-muted">Aucun lutteur sélectionné (1v1)</span>
        )}
        {match.participantIds.map((id) => {
          const w = division.roster.find((r) => r.id === id)
          if (!w) return null
          return (
            <span key={id} className="jeton-participant" onClick={() => toggleParticipant(match.id, id)}>
              {w.name} ✕
            </span>
          )
        })}
      </div>

      <div className="grille-selection">
        {lutteursDisponibles.map((w) => {
          const selectionne = match.participantIds.includes(w.id)
          return (
            <button
              key={w.id}
              className={`bouton-lutteur ${selectionne ? "selectionne" : ""}`}
              onClick={() => toggleParticipant(match.id, w.id)}
              disabled={!selectionne && complet}
            >
              {w.name}
              <span className="bouton-lutteur-pop">{w.popularite}%</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function BookingView() {
  const division = useDivisionActive()
  const ajouterMatch = useStore((s) => s.ajouterMatch)
  const lancerSemaine = useStore((s) => s.lancerSemaine)
  const arene = areneParId(division.areneId)

  const matchesValides = division.card.filter((m) => m.participantIds.length >= 2).length

  return (
    <div className="vue">
      <div className="vue-entete">
        <h2>{division.nom} — Composer la carte</h2>
        <DivisionSwitcher divisionId={division.id} />
      </div>
      <p className="texte-muted texte-arene-active">
        Salle : {arene.nom} (capacité {arene.capacite.toLocaleString("fr-FR")})
      </p>
      {division.roster.length === 0 && (
        <p className="texte-muted">Aucun lutteur dans cette division pour composer une carte.</p>
      )}
      {division.card.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}

      <div className="actions-booking">
        <button
          onClick={ajouterMatch}
          disabled={division.card.length >= 5 || division.roster.length === 0}
        >
          + Ajouter un match
        </button>
      </div>

      <p className="texte-muted texte-lancer-semaine">
        Lancer la semaine résout les cartes de toutes les divisions ayant des matchs programmés.
      </p>
      <button className="primaire bouton-lancer-semaine" onClick={lancerSemaine}>
        Lancer la semaine ({matchesValides} match{matchesValides > 1 ? "s" : ""} ici)
      </button>
    </div>
  )
}
