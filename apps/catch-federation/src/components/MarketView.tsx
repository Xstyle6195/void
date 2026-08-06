import { useState } from "react"
import type { Wrestler } from "../game/types"
import { useDivisionActive, useFederation, useStore } from "../state/store"

function CarteAgentLibre({ w }: { w: Wrestler }) {
  const federation = useFederation()
  const divisionActive = useDivisionActive()
  const signerAgentLibre = useStore((s) => s.signerAgentLibre)
  const [cible, setCible] = useState(divisionActive.id)

  return (
    <div className="carte-lutteur">
      <div className="carte-lutteur-entete">
        <div>
          <h3>{w.name}</h3>
          <span className={`badge badge-${w.alignment}`}>
            {w.alignment === "face" ? "Face" : "Heel"}
          </span>
          <span className="badge badge-style">{w.style}</span>
          {w.debutant && <span className="badge">Débutant</span>}
        </div>
      </div>
      <p className="texte-muted">
        Charisme {w.charisme} · Technique {w.technique} · Force {w.force}
      </p>
      <div className="carte-lutteur-pied">
        <span>Âge {w.age}</span>
        <span>{w.salaire} €/sem.</span>
      </div>
      <div className="carte-lutteur-actions">
        <select value={cible} onChange={(e) => setCible(e.target.value)}>
          {federation.divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nom}
            </option>
          ))}
        </select>
        <button
          className="primaire"
          onClick={() => signerAgentLibre(w.id, cible)}
          disabled={federation.argent < 300}
        >
          Signer (300 €)
        </button>
      </div>
    </div>
  )
}

export function MarketView() {
  const federation = useFederation()

  return (
    <div className="vue">
      <h2>Marché des transferts</h2>
      <p className="texte-muted">Signature : 300 € de prime.</p>
      <div className="liste-lutteurs">
        {federation.freeAgents.map((w) => (
          <CarteAgentLibre key={w.id} w={w} />
        ))}
      </div>
    </div>
  )
}
