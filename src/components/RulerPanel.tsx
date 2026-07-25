import { TRAITS } from "../game/data";
import { statsWithTraits } from "../game/engine";
import type { GameState } from "../game/types";

export function RulerPanel({ game }: { game: GameState }) {
  const ruler = game.ruler;
  const age = game.year - ruler.birthYear;
  const stats = statsWithTraits(ruler);

  return (
    <section className="panel ruler-panel">
      <h2>{ruler.name}</h2>
      <p className="ruler-subtitle">
        {ruler.sex === "M" ? "Roi" : "Reine"} de {game.kingdomName} · {age} ans ·
        Dynastie des {game.dynastyName}
      </p>

      <div className="bar-row">
        <span>Santé</span>
        <div className="bar">
          <div className="bar-fill health" style={{ width: `${ruler.health}%` }} />
        </div>
      </div>

      <div className="traits">
        {ruler.traits.map((t) => (
          <span className="trait-chip" key={t} title={TRAITS[t].description}>
            {TRAITS[t].name}
          </span>
        ))}
      </div>

      <div className="stats-grid">
        <div>
          <span className="stat-label">Martial</span>
          <span className="stat-value">{stats.martial}</span>
        </div>
        <div>
          <span className="stat-label">Diplomatie</span>
          <span className="stat-value">{stats.diplomacy}</span>
        </div>
        <div>
          <span className="stat-label">Intendance</span>
          <span className="stat-value">{stats.stewardship}</span>
        </div>
        <div>
          <span className="stat-label">Piété</span>
          <span className="stat-value">{stats.piety}</span>
        </div>
      </div>

      <h3>Héritiers</h3>
      {game.heirs.length === 0 ? (
        <p className="warning-text">Aucun héritier ! La lignée est en danger.</p>
      ) : (
        <ul className="heir-list">
          {[...game.heirs]
            .sort((a, b) => a.birthYear - b.birthYear)
            .map((h, i) => (
              <li key={h.id}>
                {i === 0 ? "① " : `${i + 1}. `}
                {h.name} ({game.year - h.birthYear} ans)
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
