import { areneParId } from "../game/arenas"
import { infoStipulation, LIMITES_FORMAT, stipulationsPourFormat } from "../game/stipulations"
import type { BookedMatch, FormatMatch, MatchStipulation, Wrestler } from "../game/types"
import { useDivisionActive, useStore } from "../state/store"
import { DivisionSwitcher } from "./DivisionSwitcher"

const FORMATS: { value: FormatMatch; label: string }[] = [
  { value: "1v1", label: "1v1" },
  { value: "2v2", label: "2v2" },
  { value: "triple-menace", label: "Triple Menace" },
  { value: "a-4", label: "Match à 4" },
  { value: "battle-royal", label: "Battle Royal" },
]

function EquipeSelection({
  match,
  equipe,
  lutteursDisponibles,
}: {
  match: BookedMatch
  equipe: "A" | "B"
  lutteursDisponibles: Wrestler[]
}) {
  const toggleParticipantEquipe = useStore((s) => s.toggleParticipantEquipe)
  const membres = equipe === "A" ? match.equipeA : match.equipeB
  const autreEquipe = equipe === "A" ? match.equipeB : match.equipeA
  const division = useDivisionActive()
  const complete = membres.length >= 2

  return (
    <div className="bloc-equipe">
      <span className="titre-equipe">Équipe {equipe}</span>
      <div className="participants-choisis">
        {membres.length === 0 && <span className="texte-muted">Aucun lutteur</span>}
        {membres.map((id) => {
          const w = division.roster.find((r) => r.id === id)
          if (!w) return null
          return (
            <span
              key={id}
              className="jeton-participant"
              onClick={() => toggleParticipantEquipe(match.id, equipe, id)}
            >
              {w.name} ✕
            </span>
          )
        })}
      </div>
      <div className="grille-selection">
        {lutteursDisponibles.map((w) => {
          const selectionne = membres.includes(w.id)
          const dejaDansAutreEquipe = autreEquipe.includes(w.id)
          return (
            <button
              key={w.id}
              className={`bouton-lutteur ${selectionne ? "selectionne" : ""}`}
              onClick={() => toggleParticipantEquipe(match.id, equipe, w.id)}
              disabled={dejaDansAutreEquipe || (!selectionne && complete)}
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

function campsDuMatch(match: BookedMatch): string[][] {
  if (match.format === "2v2") return [match.equipeA, match.equipeB]
  return match.participantIds.map((id) => [id])
}

function VainqueurSelector({ match }: { match: BookedMatch }) {
  const division = useDivisionActive()
  const definirVainqueurImpose = useStore((s) => s.definirVainqueurImpose)

  const camps = campsDuMatch(match).filter((camp) => camp.length > 0)
  if (camps.length < 2) return null

  const nomsCamp = (camp: string[]) =>
    camp.map((id) => division.roster.find((w) => w.id === id)?.name ?? "?").join(" & ")

  const cleCamp = (camp: string[]) => camp.join(",")
  const valeurActuelle =
    match.vainqueurImposeIds.length > 0 ? [...match.vainqueurImposeIds].sort().join(",") : ""

  return (
    <div className="controle-booking">
      <label className="libelle-controle">Vainqueur</label>
      <select
        value={valeurActuelle}
        onChange={(e) => {
          if (!e.target.value) {
            definirVainqueurImpose(match.id, [])
            return
          }
          const camp = camps.find((c) => [...c].sort().join(",") === e.target.value)
          definirVainqueurImpose(match.id, camp ?? [])
        }}
      >
        <option value="">Libre (déterminé par le match)</option>
        {camps.map((camp) => (
          <option key={cleCamp(camp)} value={[...camp].sort().join(",")}>
            {match.format === "2v2" ? `Équipe : ${nomsCamp(camp)}` : nomsCamp(camp)}
          </option>
        ))}
      </select>
    </div>
  )
}

function InterferenceSelector({ match }: { match: BookedMatch }) {
  const division = useDivisionActive()
  const definirInterference = useStore((s) => s.definirInterference)
  const dansLeMatch = new Set(campsDuMatch(match).flat())
  const candidats = division.roster.filter((w) => !dansLeMatch.has(w.id) && w.blessureSemaines === 0)

  return (
    <div className="controle-booking">
      <label className="libelle-controle">Interférence (+200 €)</label>
      <select
        value={match.interferenceId ?? ""}
        onChange={(e) => definirInterference(match.id, e.target.value || null)}
      >
        <option value="">Aucune</option>
        {candidats.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </div>
  )
}

function MatchCard({ match }: { match: BookedMatch }) {
  const division = useDivisionActive()
  const toggleParticipant = useStore((s) => s.toggleParticipant)
  const definirFormatMatch = useStore((s) => s.definirFormatMatch)
  const definirStipulation = useStore((s) => s.definirStipulation)
  const definirEstTitre = useStore((s) => s.definirEstTitre)
  const definirTitre = useStore((s) => s.definirTitre)
  const supprimerMatch = useStore((s) => s.supprimerMatch)

  const lutteursDisponibles = division.roster.filter((w) => w.blessureSemaines === 0)
  const stip = infoStipulation(match.stipulation)
  const stipulationsDisponibles = stipulationsPourFormat(match.format)
  const limites = LIMITES_FORMAT[match.format]
  const completLibre = match.participantIds.length >= limites.max

  return (
    <div className="carte-match">
      <div className="carte-match-entete">
        <div className="selecteur-format">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              className={match.format === f.value ? "actif" : ""}
              onClick={() => definirFormatMatch(match.id, f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button className="danger" onClick={() => supprimerMatch(match.id)}>
          Retirer le match
        </button>
      </div>

      <select
        value={match.stipulation}
        onChange={(e) => definirStipulation(match.id, e.target.value as MatchStipulation)}
      >
        {stipulationsDisponibles.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nom}
          </option>
        ))}
      </select>

      <p className="texte-muted texte-stipulation">
        {stip.description} {stip.cout > 0 && `· Coût : ${stip.cout.toLocaleString("fr-FR")} €`}
      </p>
      {(match.stipulation === "loser-leaves-town" || match.stipulation === "loser-leaves-town-tag") && (
        <p className="avertissement-stipulation">
          ⚠️ {match.format === "2v2" ? "L'équipe perdante sera libérée" : "Le perdant sera libéré"} de la
          fédération. Idéal pour clore une rivalité.
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

      {match.format === "2v2" ? (
        <div className="bloc-equipes">
          <EquipeSelection match={match} equipe="A" lutteursDisponibles={lutteursDisponibles} />
          <EquipeSelection match={match} equipe="B" lutteursDisponibles={lutteursDisponibles} />
        </div>
      ) : (
        <>
          <p className="texte-muted">
            {limites.min === limites.max
              ? `${limites.max} participants requis`
              : `De ${limites.min} à ${limites.max} participants`}
          </p>
          <div className="participants-choisis">
            {match.participantIds.length === 0 && (
              <span className="texte-muted">Aucun lutteur sélectionné</span>
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
                  disabled={!selectionne && completLibre}
                >
                  {w.name}
                  <span className="bouton-lutteur-pop">{w.popularite}%</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      <VainqueurSelector match={match} />
      <InterferenceSelector match={match} />
    </div>
  )
}

function matchEstValide(match: BookedMatch): boolean {
  if (match.format === "2v2") return match.equipeA.length === 2 && match.equipeB.length === 2
  return match.participantIds.length >= LIMITES_FORMAT[match.format].min
}

export function BookingView() {
  const division = useDivisionActive()
  const ajouterMatch = useStore((s) => s.ajouterMatch)
  const lancerSemaine = useStore((s) => s.lancerSemaine)
  const arene = areneParId(division.areneId)

  const matchesValides = division.card.filter(matchEstValide).length

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
