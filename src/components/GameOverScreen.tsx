import type { GameState } from "../game/types";
import { useGameStore } from "../state/store";

export function GameOverScreen({ game }: { game: GameState }) {
  const restart = useGameStore((s) => s.restart);
  const yearsRuled = game.year - game.foundingYear;

  return (
    <div className="overlay">
      <div className="modal">
        <h2>La lignée s'éteint</h2>
        <p>
          Après {yearsRuled} ans et {game.reignCount} souverain(e)s, la dynastie des{" "}
          {game.dynastyName} s'éteint faute d'héritier. Le royaume de {game.kingdomName}{" "}
          passe à d'autres mains.
        </p>
        <button className="btn" onClick={restart}>
          Fonder une nouvelle dynastie
        </button>
      </div>
    </div>
  );
}
