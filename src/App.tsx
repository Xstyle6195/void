import { useState } from "react";
import "./App.css";
import { Chronicle } from "./components/Chronicle";
import { DiplomacyPanel } from "./components/DiplomacyPanel";
import { EventModal } from "./components/EventModal";
import { FamilyTree } from "./components/FamilyTree";
import { GameOverScreen } from "./components/GameOverScreen";
import { MapView } from "./components/MapView";
import { MarriageSection } from "./components/MarriageSection";
import { ProvinceList } from "./components/ProvinceList";
import { ResourceBar } from "./components/ResourceBar";
import { RulerPanel } from "./components/RulerPanel";
import { SuccessionScreen } from "./components/SuccessionScreen";
import { useGameStore } from "./state/store";

type Tab = "royaume" | "carte" | "diplomatie" | "dynastie";

function App() {
  const game = useGameStore((s) => s.game);
  const nextTurn = useGameStore((s) => s.nextTurn);
  const [tab, setTab] = useState<Tab>("royaume");

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

      <nav className="tabs">
        <button
          className={`tab-btn${tab === "royaume" ? " active" : ""}`}
          onClick={() => setTab("royaume")}
        >
          Royaume
        </button>
        <button
          className={`tab-btn${tab === "carte" ? " active" : ""}`}
          onClick={() => setTab("carte")}
        >
          Carte d'Orion
        </button>
        <button
          className={`tab-btn${tab === "diplomatie" ? " active" : ""}`}
          onClick={() => setTab("diplomatie")}
        >
          Diplomatie
        </button>
        <button
          className={`tab-btn${tab === "dynastie" ? " active" : ""}`}
          onClick={() => setTab("dynastie")}
        >
          Dynastie
        </button>
      </nav>

      {tab === "royaume" && (
        <main className="app-grid">
          <div className="column">
            <RulerPanel game={game} />
          </div>
          <div className="column">
            <ProvinceList game={game} />
            <Chronicle game={game} />
          </div>
        </main>
      )}
      {tab === "carte" && (
        <main>
          <MapView game={game} />
        </main>
      )}
      {tab === "diplomatie" && (
        <main className="app-grid">
          <div className="column">
            <DiplomacyPanel game={game} />
          </div>
          <div className="column">
            <MarriageSection game={game} />
          </div>
        </main>
      )}
      {tab === "dynastie" && (
        <main>
          <FamilyTree game={game} />
        </main>
      )}

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
