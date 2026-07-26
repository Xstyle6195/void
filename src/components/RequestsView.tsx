import { POLITICAL_REQUESTS } from "../game/politics";
import type { GameState } from "../game/types";
import { useGameStore } from "../state/store";

export function RequestsView({ game }: { game: GameState }) {
  const resolveRequest = useGameStore((s) => s.resolveRequest);

  return (
    <section className="panel">
      <h2>Requêtes en attente</h2>
      <p className="muted">
        Le peuple attend une décision de votre part. Une requête ignorée trop
        longtemps finit par lasser tout le monde.
      </p>
      {game.politicalRequests.length === 0 ? (
        <p className="muted">Aucune requête en attente pour l'instant.</p>
      ) : (
        <ul className="marriage-list">
          {game.politicalRequests.map((active) => {
            const def = POLITICAL_REQUESTS.find((d) => d.id === active.requestId);
            if (!def) return null;
            return (
              <li key={active.requestId} className="marriage-item">
                <strong>{def.title}</strong>
                <div className="muted">{def.body}</div>
                <div className="muted">
                  Sans réponse avant l'an {active.expiresYear}.
                </div>
                <div className="build-menu">
                  {def.choices.map((choice) => (
                    <button
                      key={choice.id}
                      className="btn small"
                      onClick={() => resolveRequest(active.requestId, choice.id)}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
