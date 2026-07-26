import { GOALS } from "../game/politics";
import type { GameState } from "../game/types";

export function GoalsView({ game }: { game: GameState }) {
  return (
    <section className="panel">
      <h2>Objectifs du peuple</h2>
      <p className="muted">
        Des aspirations que votre peuple souhaite vous voir accomplir. Elles
        se réalisent automatiquement dès que les conditions sont réunies, et
        récompensent le royaume.
      </p>
      {game.goals.length === 0 ? (
        <p className="muted">Aucun objectif en cours.</p>
      ) : (
        <ul className="marriage-list">
          {game.goals.map((goal) => {
            const def = GOALS.find((g) => g.id === goal.defId);
            if (!def) return null;
            return (
              <li key={goal.defId} className="marriage-item">
                <strong>{def.title}</strong>
                <div className="muted">{def.description}</div>
                <div className="muted">
                  Récompense : {def.rewardGold > 0 && `${def.rewardGold} or, `}
                  {def.rewardPrestige} prestige, +{def.rewardStability} satisfaction
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
