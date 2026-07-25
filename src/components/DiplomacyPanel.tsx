import type { GameState } from "../game/types";
import { useGameStore } from "../state/store";

function relationLabel(relation: number): string {
  if (relation > 50) return "Alliés";
  if (relation > 10) return "Amicaux";
  if (relation > -10) return "Neutres";
  if (relation > -50) return "Tendus";
  return "Hostiles";
}

export function DiplomacyPanel({ game }: { game: GameState }) {
  const giftNeighbor = useGameStore((s) => s.giftNeighbor);
  const warNeighbor = useGameStore((s) => s.warNeighbor);
  const peaceNeighbor = useGameStore((s) => s.peaceNeighbor);

  return (
    <section className="panel">
      <h2>Royaumes voisins</h2>
      <ul className="neighbor-list">
        {game.neighbors.map((n) => (
          <li key={n.id} className="neighbor-item">
            <div className="province-row">
              <div>
                <strong>{n.name}</strong>{" "}
                {n.atWar && <span className="tag war">En guerre</span>}
                <div className="muted">
                  {relationLabel(n.relation)} ({n.relation}) · Force {n.strength}
                </div>
              </div>
            </div>
            <div className="bar-row">
              <div className="bar relation">
                <div
                  className="bar-fill relation-fill"
                  style={{ width: `${((n.relation + 100) / 200) * 100}%` }}
                />
              </div>
            </div>
            <div className="diplo-actions">
              <button
                className="btn small"
                disabled={game.resources.gold < 25}
                onClick={() => giftNeighbor(n.id)}
              >
                Envoyer un présent (25 or)
              </button>
              {n.atWar ? (
                <button className="btn small" onClick={() => peaceNeighbor(n.id)}>
                  Proposer la paix
                </button>
              ) : (
                <button className="btn small danger" onClick={() => warNeighbor(n.id)}>
                  Déclarer la guerre
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
