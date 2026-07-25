import type { GameState } from "../game/types";
import { useGameStore } from "../state/store";

function relationLabel(relation: number): string {
  if (relation > 50) return "Cordiaux";
  if (relation > 10) return "Amicaux";
  if (relation > -10) return "Neutres";
  if (relation > -50) return "Tendus";
  return "Hostiles";
}

export function DiplomacyPanel({ game }: { game: GameState }) {
  const giftNeighbor = useGameStore((s) => s.giftNeighbor);
  const warNeighbor = useGameStore((s) => s.warNeighbor);
  const peaceNeighbor = useGameStore((s) => s.peaceNeighbor);
  const allyNeighbor = useGameStore((s) => s.allyNeighbor);
  const joinWar = useGameStore((s) => s.joinWar);

  const byId = new Map(game.neighbors.map((n) => [n.id, n]));

  return (
    <section className="panel">
      <h2>Royaumes voisins</h2>
      <p className="muted">
        Attaquer un royaume dégrade vos relations avec ses alliés mais vous
        rapproche de ses rivaux. Vos propres alliés peuvent aussi être en
        guerre contre d'autres royaumes : les rejoindre renforce ce lien.
      </p>
      <ul className="neighbor-list">
        {game.neighbors.map((n) => {
          const allies = n.alliesWith.map((id) => byId.get(id)?.name).filter(Boolean);
          const rivals = n.rivalsWith.map((id) => byId.get(id)?.name).filter(Boolean);
          const wars = n.warWith.map((id) => byId.get(id)).filter(Boolean);
          return (
            <li key={n.id} className="neighbor-item">
              <div className="province-row">
                <div>
                  <strong>{n.name}</strong>{" "}
                  {n.atWar && <span className="tag war">En guerre</span>}
                  {n.allied && <span className="tag ally">Alliés</span>}
                  {n.tradeRouteLevel > 0 && (
                    <span
                      className="tag"
                      title="Bonus commercial passif issu d'une expédition mercantile"
                    >
                      Route commerciale {n.tradeRouteLevel}/3
                    </span>
                  )}
                  <div className="muted">
                    {relationLabel(n.relation)} ({n.relation}) · Force {n.strength}
                  </div>
                  {(allies.length > 0 || rivals.length > 0) && (
                    <div className="muted">
                      {allies.length > 0 && `Alliés de ${allies.join(", ")}. `}
                      {rivals.length > 0 && `Rivaux de ${rivals.join(", ")}.`}
                    </div>
                  )}
                  {wars.length > 0 && (
                    <div className="muted">
                      En guerre contre {wars.map((w) => w?.name).join(", ")}.
                    </div>
                  )}
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
                {!n.atWar && !n.allied && (
                  <button
                    className="btn small"
                    disabled={n.relation < 40}
                    title="Nécessite des relations cordiales (40+) : libre passage, soutien militaire et bonus commercial."
                    onClick={() => allyNeighbor(n.id)}
                  >
                    Proposer une alliance
                  </button>
                )}
                {n.allied &&
                  wars.map((enemy) =>
                    enemy && !enemy.atWar ? (
                      <button
                        key={enemy.id}
                        className="btn small danger"
                        onClick={() => joinWar(n.id, enemy.id)}
                      >
                        Rejoindre {n.name} contre {enemy.name}
                      </button>
                    ) : null,
                  )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
