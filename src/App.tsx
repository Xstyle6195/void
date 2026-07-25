import "./App.css";
import { Chronicle } from "./components/Chronicle";
import { DiplomacyPanel } from "./components/DiplomacyPanel";
import { EventModal } from "./components/EventModal";
import { GameOverScreen } from "./components/GameOverScreen";
import { ProvinceList } from "./components/ProvinceList";
import { ResourceBar } from "./components/ResourceBar";
import { RulerPanel } from "./components/RulerPanel";
import { SuccessionScreen } from "./components/SuccessionScreen";
import { useGameStore } from "./state/store";

function App() {
  const game = useGameStore((s) => s.game);
  const nextTurn = useGameStore((s) => s.nextTurn);

  const canAdvance = game.phase === "playing" && !game.pendingEvent;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Dynastie</h1>
        <p className="tagline">
          Fondez un royaume, régnez, et transmettez-le à travers les âges.
        </p>
      </header>

      <ResourceBar game={game} />

      <main className="app-grid">
        <div className="column">
          <RulerPanel game={game} />
          <DiplomacyPanel game={game} />
        </div>
        <div className="column">
          <ProvinceList game={game} />
          <Chronicle game={game} />
        </div>
      </main>

      <footer className="app-footer">
        <button className="btn primary" disabled={!canAdvance} onClick={nextTurn}>
          Passer à l'année suivante
        </button>
      </footer>

      {game.pendingEvent && <EventModal game={game} />}
      {game.phase === "succession" && <SuccessionScreen game={game} />}
      {game.phase === "gameover" && <GameOverScreen game={game} />}
    </div>
  );
}

export default App;
