import type { GameState } from "../game/types";
import { useGameStore } from "../state/store";

export function SuccessionScreen({ game }: { game: GameState }) {
  const confirmSuccession = useGameStore((s) => s.confirmSuccession);
  const previous = game.deceased[game.deceased.length - 1];
  const ruler = game.ruler;
  const age = game.year - ruler.birthYear;

  return (
    <div className="overlay">
      <div className="modal succession">
        <h2>Le trône change de mains</h2>
        {previous && (
          <p>
            <strong>{previous.name}</strong> s'est éteint après{" "}
            {previous.deathYear !== null ? previous.deathYear - previous.birthYear : "?"} ans
            de vie, laissant le royaume de {game.kingdomName} à son successeur.
          </p>
        )}
        <p className="succession-new-ruler">
          Longue vie à <strong>{ruler.name}</strong>, {age} ans,{" "}
          {ruler.sex === "M" ? "nouveau roi" : "nouvelle reine"} de la dynastie des{" "}
          {game.dynastyName} — {game.reignCount}
          {game.reignCount === 1 ? "er" : "e"} souverain(e).
        </p>
        <button className="btn" onClick={confirmSuccession}>
          Continuer le règne
        </button>
      </div>
    </div>
  );
}
