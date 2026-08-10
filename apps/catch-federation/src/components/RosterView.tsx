import { useState } from "react"
import type { Wrestler } from "../game/types"
import { MAX_ROSTER_DIVISION, useDivisionActive, useFederation, useStore } from "../state/store"
import { DivisionSwitcher } from "./DivisionSwitcher"
import { Etoiles } from "./Etoiles"

function WrestlerCard({ w }: { w: Wrestler }) {
  const federation = useFederation()
  const divisionActive = useDivisionActive()
  const renouvelerContrat = useStore((s) => s.renouvelerContrat)
  const libererLutteur = useStore((s) => s.libererLutteur)
  const transfererLutteur = useStore((s) => s.transfererLutteur)
  const [cibleTransfert, setCibleTransfert] = useState("")

  const autresDivisions = federation.divisions.filter((d) => d.id !== divisionActive.id)

  return (
    <div className="carte-lutteur">
      <div className="carte-lutteur-entete">
        <div>
          <h3>{w.name}</h3>
          <span className="badge badge-genre">
            {w.genre === "homme" ? "Catcheur" : "Catcheuse"}
          </span>
          <span className={`badge badge-${w.alignment}`}>
            {w.alignment === "face" ? "Face" : "Heel"}
          </span>
          <span className="badge badge-style">{w.style}</span>
          {w.debutant && <span className="badge">Débutant</span>}
          {w.categorie === "jobbeur" && <span className="badge">Jobbeur</span>}
          {w.typeContrat === "temporaire" && <span className="badge badge-titre">Guest star</span>}
          {w.titreId && <span className="badge badge-titre">Champion</span>}
        </div>
        {w.blessureSemaines > 0 && (
          <span className="badge badge-blessure">Blessé ({w.blessureSemaines} sem.)</span>
        )}
      </div>
      <Etoiles label="Charisme" valeur={w.charisme} />
      <Etoiles label="Technique" valeur={w.technique} />
      <Etoiles label="Force" valeur={w.force} />
      <Etoiles label="Popularité" valeur={w.popularite} />
      <Etoiles label="Moral" valeur={w.moral} />
      <Etoiles label="Forme" valeur={w.forme} />
      <div className="carte-lutteur-pied">
        <span>Âge {w.age}</span>
        <span>{w.salaire} €/sem.</span>
        <span>Contrat {w.contratSemaines} sem.</span>
      </div>
      <div className="carte-lutteur-actions">
        <button onClick={() => renouvelerContrat(w.id)}>Renouveler (500 €)</button>
        <button className="danger" onClick={() => libererLutteur(w.id)}>
          Libérer
        </button>
      </div>
      {autresDivisions.length > 0 && (
        <div className="carte-lutteur-transfert">
          <select value={cibleTransfert} onChange={(e) => setCibleTransfert(e.target.value)}>
            <option value="">Transférer vers…</option>
            {autresDivisions.map((d) => (
              <option key={d.id} value={d.id} disabled={d.roster.length >= MAX_ROSTER_DIVISION}>
                {d.nom} ({d.roster.length}/{MAX_ROSTER_DIVISION})
                {d.roster.length >= MAX_ROSTER_DIVISION ? " · pleine" : ""}
              </option>
            ))}
          </select>
          <button
            disabled={!cibleTransfert}
            onClick={() => {
              transfererLutteur(w.id, cibleTransfert)
              setCibleTransfert("")
            }}
          >
            Transférer
          </button>
        </div>
      )}
    </div>
  )
}

export function RosterView({ capRoster = MAX_ROSTER_DIVISION }: { capRoster?: number } = {}) {
  const divisionActive = useDivisionActive()

  return (
    <div className="vue">
      <div className="vue-entete">
        <h2>
          {divisionActive.nom} — Effectif ({divisionActive.roster.length}/{capRoster})
        </h2>
        <DivisionSwitcher divisionId={divisionActive.id} />
      </div>
      {divisionActive.roster.length === 0 && (
        <p className="texte-muted">
          Aucun lutteur dans cette division. Recrutez-en sur le marché des transferts ou
          transférez-en depuis une autre division.
        </p>
      )}
      <div className="liste-lutteurs">
        {divisionActive.roster.map((w) => (
          <WrestlerCard key={w.id} w={w} />
        ))}
      </div>
    </div>
  )
}
