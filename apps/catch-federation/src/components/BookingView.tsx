import { useState } from "react"
import { ARENES, areneParId } from "../game/arenas"
import { infoPromo, PROMOS } from "../game/promos"
import { MODES_DIFFUSION, SCENOGRAPHIES } from "../game/showSetup"
import { infoStipulation, LIMITES_FORMAT, stipulationsPourFormat } from "../game/stipulations"
import type { BookedMatch, BookedPromo, DivisionInstance, FormatMatch, Genre, MatchStipulation, Title, Wrestler } from "../game/types"
import {
  MAX_MATCHS_CARTE,
  MIN_MATCHS_CARTE,
  useDivisionActive,
  useFederation,
  useStore,
} from "../state/store"
import { DivisionSwitcher } from "./DivisionSwitcher"

function genreParticipantsDuMatch(match: BookedMatch, roster: Wrestler[]): Genre | undefined {
  const participants =
    match.format === "2v2" ? [...match.equipeA, ...match.equipeB] : match.participantIds
  return participants.map((id) => roster.find((w) => w.id === id)?.genre).find((g): g is Genre => Boolean(g))
}

function genreVerrouilleDuMatch(match: BookedMatch, roster: Wrestler[], titles: Title[]): Genre | undefined {
  const genreParticipants = genreParticipantsDuMatch(match, roster)
  if (genreParticipants) return genreParticipants
  if (match.estTitre && match.titleId) {
    return titles.find((t) => t.id === match.titleId)?.genre
  }
  return undefined
}

const FORMATS: { value: FormatMatch; label: string }[] = [
  { value: "1v1", label: "1v1" },
  { value: "2v2", label: "2v2" },
  { value: "triple-menace", label: "Triple Menace" },
  { value: "a-4", label: "Match à 4" },
  { value: "battle-royal", label: "Battle Royal" },
]

function SelecteurLutteur({
  w,
  selectionne,
  disabled,
  title,
  onClick,
}: {
  w: Wrestler
  selectionne: boolean
  disabled?: boolean
  title?: string
  onClick: () => void
}) {
  return (
    <button
      className={`carte-selecteur-lutteur ${selectionne ? "selectionne" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <span className="carte-selecteur-lutteur-nom">{w.name}</span>
      <span className="carte-selecteur-lutteur-badges">
        <span className="badge badge-genre">{w.genre === "homme" ? "Catcheur" : "Catcheuse"}</span>
        <span className={`badge badge-${w.alignment}`}>{w.alignment === "face" ? "Face" : "Heel"}</span>
        <span className="badge badge-style">{w.style}</span>
        {w.typeContrat === "temporaire" && <span className="badge badge-titre">Guest star</span>}
      </span>
      <span className="carte-selecteur-lutteur-stats">
        Popularité {w.popularite}% · Âge {w.age}
        {w.blessureSemaines > 0 && ` · Blessé (${w.blessureSemaines} sem.)`}
      </span>
    </button>
  )
}

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
  const genreVerrouille = genreVerrouilleDuMatch(match, division.roster, division.titles)

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
          const genreIncompatible = Boolean(genreVerrouille) && w.genre !== genreVerrouille
          return (
            <SelecteurLutteur
              key={w.id}
              w={w}
              selectionne={selectionne}
              onClick={() => toggleParticipantEquipe(match.id, equipe, w.id)}
              disabled={dejaDansAutreEquipe || (!selectionne && (complete || genreIncompatible))}
              title={genreIncompatible ? "Un homme ne peut pas affronter une femme" : undefined}
            />
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
  const genreVerrouille = genreVerrouilleDuMatch(match, division.roster, division.titles)
  const candidats = division.roster.filter(
    (w) =>
      !dansLeMatch.has(w.id) &&
      w.blessureSemaines === 0 &&
      (!genreVerrouille || w.genre === genreVerrouille),
  )

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

function MatchCard({ match, numero }: { match: BookedMatch; numero: number }) {
  const division = useDivisionActive()
  const toggleParticipant = useStore((s) => s.toggleParticipant)
  const definirFormatMatch = useStore((s) => s.definirFormatMatch)
  const definirStipulation = useStore((s) => s.definirStipulation)
  const definirEstTitre = useStore((s) => s.definirEstTitre)
  const definirTitre = useStore((s) => s.definirTitre)

  const lutteursDisponibles = division.roster.filter((w) => w.blessureSemaines === 0)
  const stip = infoStipulation(match.stipulation)
  const stipulationsDisponibles = stipulationsPourFormat(match.format)
  const limites = LIMITES_FORMAT[match.format]
  const completLibre = match.participantIds.length >= limites.max
  const genreParticipants = genreParticipantsDuMatch(match, division.roster)
  const genreVerrouille = genreVerrouilleDuMatch(match, division.roster, division.titles)
  const titresDisponibles = division.titles.filter(
    (t) => !genreParticipants || t.genre === genreParticipants,
  )

  return (
    <div className="carte-match">
      <div className="carte-match-entete">
        <span className="numero-match">Match {numero}</span>
      </div>
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
          {titresDisponibles.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.genre === "homme" ? "masculin" : "féminin"})
            </option>
          ))}
        </select>
      )}

      {genreVerrouille && (
        <p className="texte-muted texte-genre-verrouille">
          Match {genreVerrouille === "homme" ? "masculin" : "féminin"} — les catégories ne se mélangent pas
        </p>
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
              const genreIncompatible = Boolean(genreVerrouille) && w.genre !== genreVerrouille
              return (
                <SelecteurLutteur
                  key={w.id}
                  w={w}
                  selectionne={selectionne}
                  onClick={() => toggleParticipant(match.id, w.id)}
                  disabled={!selectionne && (completLibre || genreIncompatible)}
                  title={genreIncompatible ? "Un homme ne peut pas affronter une femme" : undefined}
                />
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

function PromoCard({ promo, slotIndex }: { promo: BookedPromo; slotIndex: number }) {
  const division = useDivisionActive()
  const definirTypePromo = useStore((s) => s.definirTypePromo)
  const toggleParticipantPromo = useStore((s) => s.toggleParticipantPromo)
  const togglePromoSlot = useStore((s) => s.togglePromoSlot)

  const info = infoPromo(promo.type)
  const complet = promo.participantIds.length >= info.participantsMax

  return (
    <div className="carte-match carte-promo">
      <div className="carte-match-entete">
        <div className="selecteur-format">
          {PROMOS.map((p) => (
            <button
              key={p.id}
              className={promo.type === p.id ? "actif" : ""}
              onClick={() => definirTypePromo(promo.id, p.id)}
            >
              {p.nom}
            </button>
          ))}
        </div>
        <button className="danger" onClick={() => togglePromoSlot(division.id, slotIndex)}>
          Retirer la promo
        </button>
      </div>

      <p className="texte-muted texte-stipulation">
        {info.description} · Coût : {info.cout.toLocaleString("fr-FR")} €
      </p>
      <p className="texte-muted">
        {info.participantsMin === info.participantsMax
          ? `${info.participantsMax} participant${info.participantsMax > 1 ? "s" : ""} requis`
          : `De ${info.participantsMin} à ${info.participantsMax} participants`}
      </p>

      <div className="participants-choisis">
        {promo.participantIds.length === 0 && (
          <span className="texte-muted">Aucun lutteur sélectionné</span>
        )}
        {promo.participantIds.map((id) => {
          const w = division.roster.find((r) => r.id === id)
          if (!w) return null
          return (
            <span key={id} className="jeton-participant" onClick={() => toggleParticipantPromo(promo.id, id)}>
              {w.name} ✕
            </span>
          )
        })}
      </div>

      <div className="grille-selection">
        {division.roster.map((w) => {
          const selectionne = promo.participantIds.includes(w.id)
          return (
            <SelecteurLutteur
              key={w.id}
              w={w}
              selectionne={selectionne}
              onClick={() => toggleParticipantPromo(promo.id, w.id)}
              disabled={!selectionne && complet}
            />
          )
        })}
      </div>
    </div>
  )
}

function matchEstValide(match: BookedMatch): boolean {
  if (match.format === "2v2") return match.equipeA.length === 2 && match.equipeB.length === 2
  return match.participantIds.length >= LIMITES_FORMAT[match.format].min
}

function promoEstValide(promo: BookedPromo): boolean {
  const info = infoPromo(promo.type)
  return promo.participantIds.length >= info.participantsMin && promo.participantIds.length <= info.participantsMax
}

function libelleSlot(index: number, nombreMatchs: number): string {
  if (index === 0) return "Avant le Match 1"
  if (index === nombreMatchs) return `Après le Match ${nombreMatchs}`
  return `Entre les matchs ${index} et ${index + 1}`
}

const OPTIONS_NB_MATCHS = Array.from(
  { length: MAX_MATCHS_CARTE - MIN_MATCHS_CARTE + 1 },
  (_, i) => MIN_MATCHS_CARTE + i,
)

function EtapeFormat({ division, onSuivant }: { division: DivisionInstance; onSuivant: () => void }) {
  const definirPlanCarte = useStore((s) => s.definirPlanCarte)
  const togglePromoSlot = useStore((s) => s.togglePromoSlot)
  const plan = division.planCarte

  return (
    <>
      <p className="texte-muted">
        Choisis d'abord le plan de ce show : le nombre de matchs, puis les créneaux de promo autour d'eux.
      </p>

      <div className="selecteur-format">
        {OPTIONS_NB_MATCHS.map((n) => (
          <button
            key={n}
            className={plan?.matchs.length === n ? "actif" : ""}
            onClick={() => definirPlanCarte(division.id, n)}
          >
            {n} matchs
          </button>
        ))}
      </div>

      {plan && (
        <div className="timeline-carte">
          {plan.matchs.map((_, i) => (
            <div key={i} className="fragment-timeline">
              <button
                className={`bouton-slot-promo ${plan.promoSlots[i] ? "actif" : ""}`}
                onClick={() => togglePromoSlot(division.id, i)}
              >
                {plan.promoSlots[i] ? "🎙️ Promo activée" : "+ Ajouter une promo"} —{" "}
                {libelleSlot(i, plan.matchs.length)}
              </button>
              <div className="timeline-match-label">Match {i + 1}</div>
            </div>
          ))}
          <button
            className={`bouton-slot-promo ${plan.promoSlots[plan.matchs.length] ? "actif" : ""}`}
            onClick={() => togglePromoSlot(division.id, plan.matchs.length)}
          >
            {plan.promoSlots[plan.matchs.length] ? "🎙️ Promo activée" : "+ Ajouter une promo"} —{" "}
            {libelleSlot(plan.matchs.length, plan.matchs.length)}
          </button>
        </div>
      )}

      <button className="primaire bouton-etape-suivante" onClick={onSuivant} disabled={!plan}>
        Étape suivante →
      </button>
    </>
  )
}

function EtapeCarte({ division }: { division: DivisionInstance }) {
  const plan = division.planCarte
  if (!plan) return null

  return (
    <>
      {plan.matchs.map((match, i) => (
        <div key={match.id}>
          {plan.promoSlots[i] && <PromoCard promo={plan.promoSlots[i]!} slotIndex={i} />}
          <MatchCard match={match} numero={i + 1} />
        </div>
      ))}
      {plan.promoSlots[plan.matchs.length] && (
        <PromoCard promo={plan.promoSlots[plan.matchs.length]!} slotIndex={plan.matchs.length} />
      )}
    </>
  )
}

type EtapeShow = "format" | "carte" | "setup"

const ETAPES: { value: EtapeShow; label: string }[] = [
  { value: "format", label: "Format" },
  { value: "carte", label: "Carte" },
  { value: "setup", label: "Setup" },
]

function BookingWizard() {
  const division = useDivisionActive()
  const federation = useFederation()
  const definirArene = useStore((s) => s.definirArene)
  const lancerSemaine = useStore((s) => s.lancerSemaine)
  const arene = areneParId(division.areneId)
  const [etape, setEtape] = useState<EtapeShow>(division.planCarte ? "carte" : "format")

  const matchs = division.planCarte?.matchs ?? []
  const promos = division.planCarte?.promoSlots.filter((p): p is BookedPromo => Boolean(p)) ?? []
  const matchesValides = matchs.filter(matchEstValide).length
  const promosValides = promos.filter(promoEstValide).length
  const coutEstime =
    arene.coutLocation +
    matchs.filter(matchEstValide).reduce((acc, m) => acc + infoStipulation(m.stipulation).cout, 0) +
    promos.filter(promoEstValide).reduce((acc, p) => acc + infoPromo(p.type).cout, 0)

  const indexEtape = ETAPES.findIndex((e) => e.value === etape)
  const scenographie = SCENOGRAPHIES[0]
  const modeDiffusion = MODES_DIFFUSION[0]

  return (
    <div className="vue">
      <div className="vue-entete">
        <h2>{division.nom} — Composer la carte</h2>
        <DivisionSwitcher divisionId={division.id} />
      </div>

      <p className="texte-etape-wizard">
        Étape {indexEtape + 1}/3 — {ETAPES[indexEtape].label}
      </p>

      {division.roster.length === 0 && (
        <p className="texte-muted">Aucun lutteur dans cette division pour composer une carte.</p>
      )}

      {etape === "format" && <EtapeFormat division={division} onSuivant={() => setEtape("carte")} />}

      {etape === "carte" && division.planCarte && (
        <>
          <p className="texte-muted texte-arene-active">
            Salle : {arene.nom} (capacité {arene.capacite.toLocaleString("fr-FR")})
          </p>
          <EtapeCarte division={division} />
          <div className="actions-etapes">
            <button onClick={() => setEtape("format")}>← Revoir le format</button>
            <button className="primaire" onClick={() => setEtape("setup")}>
              Étape suivante →
            </button>
          </div>
        </>
      )}

      {etape === "setup" && (
        <>
          <div className="carte-setup">
            <span className="carte-setup-titre">Arène</span>
            <p className="texte-muted">Choisis la salle pour ce show. Plus elle est grande, plus la location coûte cher et plus il faut de fans pour y accéder.</p>
            <div className="grille-arenes">
              {ARENES.map((a) => {
                const verrouillee = federation.fans < a.fansRequis
                return (
                  <button
                    key={a.id}
                    className={`carte-arene ${division.areneId === a.id ? "actif" : ""}`}
                    onClick={() => definirArene(division.id, a.id)}
                    disabled={verrouillee}
                  >
                    <span className="carte-arene-nom">{a.nom}</span>
                    <span className="carte-arene-stats">
                      Capacité {a.capacite.toLocaleString("fr-FR")} · {a.prixBillet} €/billet · Location{" "}
                      {a.coutLocation.toLocaleString("fr-FR")} €
                    </span>
                    {verrouillee && (
                      <span className="carte-arene-verrou">
                        Nécessite {a.fansRequis.toLocaleString("fr-FR")} fans
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="carte-setup">
            <span className="carte-setup-titre">Scénographie</span>
            <p className="texte-muted">
              {scenographie.nom} — {scenographie.description}
            </p>
          </div>

          <div className="carte-setup">
            <span className="carte-setup-titre">Mode de diffusion</span>
            <p className="texte-muted">
              {modeDiffusion.nom} — {modeDiffusion.description}
            </p>
          </div>

          <div className="recap-show">
            <span>
              {matchesValides} match{matchesValides > 1 ? "s" : ""}
            </span>
            <span>
              {promosValides} promo{promosValides > 1 ? "s" : ""}
            </span>
            <span>Location + stipulations + promos : {coutEstime.toLocaleString("fr-FR")} €</span>
          </div>

          <p className="texte-muted texte-lancer-semaine">
            Lancer le show résout la semaine pour toutes les divisions ayant des matchs ou promos
            programmés, pas seulement celle-ci.
          </p>

          <div className="actions-etapes">
            <button onClick={() => setEtape("carte")}>← Retour</button>
            <button className="primaire" onClick={lancerSemaine}>
              🎤 Lancer le show
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function BookingView() {
  const division = useDivisionActive()
  return <BookingWizard key={division.id} />
}
