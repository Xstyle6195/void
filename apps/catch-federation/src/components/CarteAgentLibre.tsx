import { useState } from "react"
import type { Wrestler } from "../game/types"
import { MAX_ROSTER_DIVISION, useDivisionActive, useFederation, useStore } from "../state/store"
import { Etoiles } from "./Etoiles"

function libelleContrat(w: Wrestler): string {
  if (w.typeContrat === "temporaire" && w.dureeMoisContrat) {
    return `Contrat temporaire (${w.dureeMoisContrat} mois)`
  }
  return "Contrat permanent (3 ans)"
}

export function CarteAgentLibre({ w, capRoster = MAX_ROSTER_DIVISION }: { w: Wrestler; capRoster?: number }) {
  const federation = useFederation()
  const divisionActive = useDivisionActive()
  const signerAgentLibre = useStore((s) => s.signerAgentLibre)
  const [cible, setCible] = useState(divisionActive.id)
  const divisionCible = federation.divisions.find((d) => d.id === cible)
  const divisionPleine = (divisionCible?.roster.length ?? 0) >= capRoster

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
          {w.typeContrat === "temporaire" && <span className="badge badge-titre">Guest star</span>}
        </div>
      </div>
      <Etoiles label="Charisme" valeur={w.charisme} />
      <Etoiles label="Technique" valeur={w.technique} />
      <Etoiles label="Force" valeur={w.force} />
      <div className="carte-lutteur-pied">
        <span>Âge {w.age}</span>
        <span>{w.salaire} €/sem.</span>
        <span>{libelleContrat(w)}</span>
      </div>
      <div className="carte-lutteur-actions">
        <select value={cible} onChange={(e) => setCible(e.target.value)}>
          {federation.divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nom} ({d.roster.length}/{capRoster})
            </option>
          ))}
        </select>
        <button
          className="primaire"
          onClick={() => signerAgentLibre(w.id, cible)}
          disabled={federation.argent < w.coutSignature || divisionPleine}
        >
          {divisionPleine ? "Division pleine" : `Signer (${w.coutSignature.toLocaleString("fr-FR")} €)`}
        </button>
      </div>
    </div>
  )
}
