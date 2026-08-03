import { useFederation, useStore } from "../state/store"

export function MarketView() {
  const federation = useFederation()
  const signerAgentLibre = useStore((s) => s.signerAgentLibre)

  return (
    <div className="vue">
      <h2>Marché des transferts</h2>
      <p className="texte-muted">Signature : 300 € de prime.</p>
      <div className="liste-lutteurs">
        {federation.freeAgents.map((w) => (
          <div key={w.id} className="carte-lutteur">
            <div className="carte-lutteur-entete">
              <div>
                <h3>{w.name}</h3>
                <span className={`badge badge-${w.alignment}`}>
                  {w.alignment === "face" ? "Face" : "Heel"}
                </span>
                <span className="badge badge-style">{w.style}</span>
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
              <button
                className="primaire"
                onClick={() => signerAgentLibre(w.id)}
                disabled={federation.argent < 300}
              >
                Signer (300 €)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
