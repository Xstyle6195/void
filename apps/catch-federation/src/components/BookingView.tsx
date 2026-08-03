import { labelDivision } from "../game/divisions"
import type { BookedMatch, Division, MatchStipulation } from "../game/types"
import { useFederation, useStore } from "../state/store"

const STIPULATIONS: { value: MatchStipulation; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "titre", label: "Titre" },
  { value: "no-dq", label: "No DQ" },
  { value: "échelles", label: "Échelles" },
]

function MatchCard({ match }: { match: BookedMatch }) {
  const federation = useFederation()
  const toggleParticipant = useStore((s) => s.toggleParticipant)
  const definirStipulation = useStore((s) => s.definirStipulation)
  const definirTitre = useStore((s) => s.definirTitre)
  const definirDivisionMatch = useStore((s) => s.definirDivisionMatch)
  const supprimerMatch = useStore((s) => s.supprimerMatch)

  const lutteursDisponibles = federation.roster.filter(
    (w) => w.division === match.division && w.blessureSemaines === 0,
  )
  const titresDivision = federation.titles.filter((t) => t.division === match.division)

  return (
    <div className="carte-match">
      <div className="carte-match-entete">
        <select
          value={match.division}
          onChange={(e) => definirDivisionMatch(match.id, e.target.value as Division)}
        >
          {federation.divisionsDebloquees.map((d) => (
            <option key={d} value={d}>
              {labelDivision(d)}
            </option>
          ))}
        </select>
        <button className="danger" onClick={() => supprimerMatch(match.id)}>
          Retirer le match
        </button>
      </div>

      <select
        value={match.stipulation}
        onChange={(e) => definirStipulation(match.id, e.target.value as MatchStipulation)}
      >
        {STIPULATIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {match.stipulation === "titre" && (
        <select
          value={match.titleId ?? ""}
          onChange={(e) => definirTitre(match.id, e.target.value || null)}
        >
          <option value="">Choisir un titre…</option>
          {titresDivision.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}

      <div className="participants-choisis">
        {match.participantIds.length === 0 && (
          <span className="texte-muted">Aucun lutteur sélectionné</span>
        )}
        {match.participantIds.map((id) => {
          const w = federation.roster.find((r) => r.id === id)
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
  const federation = useFederation()
  const ajouterMatch = useStore((s) => s.ajouterMatch)
  const lancerShow = useStore((s) => s.lancerShow)

  const matchesValides = federation.card.filter((m) => m.participantIds.length >= 2).length

  return (
    <div className="vue">
      <h2>Composer la carte — Semaine {federation.semaine}</h2>
      {federation.card.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}

      <div className="actions-booking">
        <button onClick={ajouterMatch} disabled={federation.card.length >= 5}>
          + Ajouter un match
        </button>
        <button
          className="primaire"
          onClick={lancerShow}
          disabled={matchesValides === 0}
        >
          Lancer le show ({matchesValides} match{matchesValides > 1 ? "s" : ""})
        </button>
      </div>
    </div>
  )
}
