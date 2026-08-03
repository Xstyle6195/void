import { useFederation, useStore } from "../state/store"
import type { Wrestler } from "../game/types"

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-bar">
      <span className="stat-bar-label">{label}</span>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="stat-bar-value">{value}</span>
    </div>
  )
}

function WrestlerCard({ w }: { w: Wrestler }) {
  const renouvelerContrat = useStore((s) => s.renouvelerContrat)
  const libererLutteur = useStore((s) => s.libererLutteur)

  return (
    <div className="carte-lutteur">
      <div className="carte-lutteur-entete">
        <div>
          <h3>{w.name}</h3>
          <span className={`badge badge-${w.alignment}`}>
            {w.alignment === "face" ? "Face" : "Heel"}
          </span>
          <span className="badge badge-style">{w.style}</span>
          {w.titreId && <span className="badge badge-titre">Champion</span>}
        </div>
        {w.blessureSemaines > 0 && (
          <span className="badge badge-blessure">Blessé ({w.blessureSemaines} sem.)</span>
        )}
      </div>
      <StatBar label="Charisme" value={w.charisme} />
      <StatBar label="Technique" value={w.technique} />
      <StatBar label="Force" value={w.force} />
      <StatBar label="Popularité" value={w.popularite} />
      <StatBar label="Moral" value={w.moral} />
      <StatBar label="Forme" value={w.forme} />
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
    </div>
  )
}

export function RosterView() {
  const federation = useFederation()
  return (
    <div className="vue">
      <h2>Effectif ({federation.roster.length})</h2>
      <div className="liste-lutteurs">
        {federation.roster.map((w) => (
          <WrestlerCard key={w.id} w={w} />
        ))}
      </div>
    </div>
  )
}
