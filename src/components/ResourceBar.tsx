import type { GameState } from "../game/types";

export function ResourceBar({ game }: { game: GameState }) {
  const r = game.resources;
  return (
    <section className="panel resource-bar">
      <div className="resource">
        <span className="resource-icon">👑</span>
        <span>An {game.year}</span>
      </div>
      <div className="resource">
        <span className="resource-icon">🪙</span>
        <span>{r.gold} or</span>
      </div>
      <div className="resource">
        <span className="resource-icon">🌾</span>
        <span>{r.food} vivres</span>
      </div>
      <div className="resource">
        <span className="resource-icon">⚖️</span>
        <span>{Math.round(r.stability)} stabilité</span>
      </div>
      <div className="resource">
        <span className="resource-icon">✨</span>
        <span>{Math.round(r.prestige)} prestige</span>
      </div>
    </section>
  );
}
