import { useEffect, useMemo, useRef } from "react";
import { tileKey } from "../game/mapPlacement";
import type { GameState } from "../game/types";
import { getOrionWorld, type Biome } from "../game/worldgen";

const TILE = 10;

const BIOME_COLORS: Record<Biome, string> = {
  ocean: "#164a63",
  coast: "#2f88a0",
  plains: "#a3a555",
  forest: "#2e5c37",
  mountain: "#83786a",
  desert: "#dcbb70",
  badlands: "#b5602f",
  frozen: "#edf5f6",
};

const FOG_COLOR = "#0b0e13";
const NEIGHBOR_COLORS = ["#4a7fc9", "#c96a4a", "#4ac97f", "#c9a24a", "#a24ac9"];
const PLAYER_COLOR = "#d1a94a";

export function MapView({ game }: { game: GameState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const world = useMemo(() => getOrionWorld(), []);
  const known = useMemo(() => new Set(game.knownTiles), [game.knownTiles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = world.width * TILE;
    canvas.height = world.height * TILE;

    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        ctx.fillStyle = known.has(tileKey(x, y))
          ? BIOME_COLORS[world.tiles[y][x]]
          : FOG_COLOR;
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }

    game.neighbors.forEach((n, i) => {
      const color = NEIGHBOR_COLORS[i % NEIGHBOR_COLORS.length];
      ctx.fillStyle = `${color}55`;
      for (const t of n.territory) {
        ctx.fillRect(t.x * TILE, t.y * TILE, TILE, TILE);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        n.capitalX * TILE + 1,
        n.capitalY * TILE + 1,
        TILE - 2,
        TILE - 2,
      );
    });

    ctx.fillStyle = `${PLAYER_COLOR}55`;
    for (const p of game.provinces) {
      ctx.fillRect(p.x * TILE, p.y * TILE, TILE, TILE);
    }
    for (const p of game.provinces) {
      ctx.strokeStyle = p.kind === "capital" ? "#fff3d0" : PLAYER_COLOR;
      ctx.lineWidth = p.kind === "capital" ? 2.5 : 1.5;
      ctx.strokeRect(p.x * TILE + 1, p.y * TILE + 1, TILE - 2, TILE - 2);
    }
  }, [world, known, game.provinces, game.neighbors]);

  return (
    <section className="panel map-panel">
      <div className="panel-header">
        <h2>Le monde d'Orion</h2>
        <button className="btn small" disabled title="Reviendra bientôt">
          Lancer une expédition (bientôt)
        </button>
      </div>
      <p className="muted">
        Vous ne connaissez que les terres proches de {game.kingdomName} et les
        territoires de vos voisins. Le reste d'Orion demeure dans la brume.
      </p>
      <div className="map-scroll">
        <canvas ref={canvasRef} className="world-canvas" />
      </div>
      <div className="map-legend">
        <LegendSwatch color={BIOME_COLORS.plains} label="Plaines" />
        <LegendSwatch color={BIOME_COLORS.forest} label="Forêt" />
        <LegendSwatch color={BIOME_COLORS.mountain} label="Montagnes" />
        <LegendSwatch color={BIOME_COLORS.desert} label="Désert" />
        <LegendSwatch color={BIOME_COLORS.badlands} label="Terres arides" />
        <LegendSwatch color={BIOME_COLORS.frozen} label="Glace éternelle" />
        <LegendSwatch color={BIOME_COLORS.coast} label="Côte" />
        <LegendSwatch color={BIOME_COLORS.ocean} label="Océan" />
        <LegendSwatch color={FOG_COLOR} label="Inexploré" />
        <LegendSwatch color={PLAYER_COLOR} label={game.kingdomName} outline />
        {game.neighbors.map((n, i) => (
          <LegendSwatch
            key={n.id}
            color={NEIGHBOR_COLORS[i % NEIGHBOR_COLORS.length]}
            label={n.name}
            outline
          />
        ))}
      </div>
    </section>
  );
}

function LegendSwatch({
  color,
  label,
  outline,
}: {
  color: string;
  label: string;
  outline?: boolean;
}) {
  return (
    <div className="legend-item">
      <span
        className={`legend-swatch${outline ? " outline" : ""}`}
        style={outline ? { borderColor: color } : { background: color }}
      />
      <span>{label}</span>
    </div>
  );
}
