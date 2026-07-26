import { canResearch, nextAvailableTechs, techUnlocks, type Technology } from "../game/techs";
import type { GameState } from "../game/types";
import { useGameStore } from "../state/store";

function TechCard({ game, tech }: { game: GameState; tech: Technology }) {
  const research = useGameStore((s) => s.research);
  const available = canResearch(game, tech.id);
  const unlocks = techUnlocks(tech.id);
  const unlockNames = [
    ...unlocks.buildings.map((b) => b.name),
    ...unlocks.units.map((u) => u.name),
  ];
  const reason = !available && game.resources.research < tech.cost ? "Points de recherche insuffisants" : "";

  return (
    <li className="marriage-item">
      <div className="province-row">
        <div>
          <strong>{tech.name}</strong> <span className="tag">{tech.cost} PR</span>
          <div className="muted">{tech.description}</div>
          {unlockNames.length > 0 && (
            <div className="muted">Débloque : {unlockNames.join(", ")}</div>
          )}
        </div>
        <button
          className="btn small"
          disabled={!available}
          title={reason}
          onClick={() => research(tech.id)}
        >
          Rechercher ({tech.cost} PR)
        </button>
      </div>
    </li>
  );
}

export function TechTreeView({ game }: { game: GameState }) {
  const next = nextAvailableTechs(game);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>🔬 Recherche</h2>
        <span className="tag">{Math.floor(game.resources.research)} points de recherche</span>
      </div>
      <p className="muted">
        Les points de recherche s'accumulent grâce aux bâtiments scientifiques,
        aux expéditions réussies et à certaines requêtes du peuple. L'avenir
        technologique d'Orion reste incertain : seule la prochaine avancée
        possible est connue.
      </p>
      {next.length === 0 ? (
        <p className="muted">Aucune avancée technologique n'est pour l'instant à portée.</p>
      ) : (
        <ul className="marriage-list">
          {next.map((tech) => (
            <TechCard key={tech.id} game={game} tech={tech} />
          ))}
        </ul>
      )}
    </section>
  );
}
