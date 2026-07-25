import { useState } from "react";
import { BUILDINGS } from "../game/data";
import type { BuildingId, GameState } from "../game/types";
import { useGameStore } from "../state/store";

const KIND_LABEL: Record<string, string> = {
  capital: "Capitale",
  town: "Ville",
  village: "Village",
  frontier: "Frontière",
};

export function ProvinceList({ game }: { game: GameState }) {
  const buildAt = useGameStore((s) => s.buildAt);
  const expandKingdom = useGameStore((s) => s.expandKingdom);
  const [openProvince, setOpenProvince] = useState<string | null>(null);

  const expandCost = 120 + game.provinces.length * 40;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Territoires</h2>
        <button
          className="btn"
          disabled={game.resources.gold < expandCost}
          onClick={expandKingdom}
        >
          Fonder une province ({expandCost} or)
        </button>
      </div>
      <ul className="province-list">
        {game.provinces.map((p) => (
          <li key={p.id} className="province-item">
            <div className="province-row">
              <div>
                <strong>{p.name}</strong>{" "}
                <span className="tag">{KIND_LABEL[p.kind]}</span>
                <div className="muted">Population : {p.population}</div>
              </div>
              <button
                className="btn small"
                onClick={() =>
                  setOpenProvince(openProvince === p.id ? null : p.id)
                }
              >
                Bâtir
              </button>
            </div>
            <div className="building-icons">
              {p.buildings.map((b) => (
                <span key={b} className="building-chip" title={BUILDINGS[b].description}>
                  {BUILDINGS[b].name}
                </span>
              ))}
            </div>
            {openProvince === p.id && (
              <div className="build-menu">
                {Object.values(BUILDINGS).map((b) => {
                  const built = p.buildings.includes(b.id as BuildingId);
                  return (
                    <button
                      key={b.id}
                      className="btn small"
                      disabled={built || game.resources.gold < b.cost}
                      onClick={() => buildAt(p.id, b.id as BuildingId)}
                      title={b.description}
                    >
                      {built ? "✔ " : ""}
                      {b.name} ({b.cost} or)
                    </button>
                  );
                })}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
