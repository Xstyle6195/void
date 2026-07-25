import type { GameState } from "../game/types";

export function Chronicle({ game }: { game: GameState }) {
  return (
    <section className="panel chronicle">
      <h2>Chronique du royaume</h2>
      <ul className="log-list">
        {game.log.map((entry, i) => (
          <li key={i} className={`log-entry log-${entry.kind}`}>
            <span className="log-year">{entry.year}</span>
            <span>{entry.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
