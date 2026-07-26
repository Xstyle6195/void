import { AGE_LABEL } from "../game/ages";
import { canResearch, isResearched, TECHS, techUnlocks, type Technology } from "../game/techs";
import type { Age, GameState } from "../game/types";
import { useGameStore } from "../state/store";

const TECH_AGE_ORDER: Age[] = ["steam", "modern", "future"];

function TechCard({ game, tech }: { game: GameState; tech: Technology }) {
  const research = useGameStore((s) => s.research);
  const done = isResearched(game, tech.id);
  const available = canResearch(game, tech.id);
  const missingPrereqs = tech.requires.filter((r) => !isResearched(game, r));
  const unlocks = techUnlocks(tech.id);
  const unlockNames = [
    ...unlocks.buildings.map((b) => b.name),
    ...unlocks.units.map((u) => u.name),
  ];

  const reason = done
    ? ""
    : missingPrereqs.length > 0
      ? `Requiert : ${missingPrereqs
          .map((id) => TECHS.find((t) => t.id === id)?.name ?? id)
          .join(", ")}`
      : game.resources.research < tech.cost
        ? "Points de recherche insuffisants"
        : "";

  return (
    <li className="marriage-item">
      <div className="province-row">
        <div>
          <strong>
            {done ? "✔ " : missingPrereqs.length > 0 ? "🔒 " : ""}
            {tech.name}
          </strong>{" "}
          <span className="tag">{tech.cost} PR</span>
          <div className="muted">{tech.description}</div>
          {unlockNames.length > 0 && (
            <div className="muted">Débloque : {unlockNames.join(", ")}</div>
          )}
        </div>
        {!done && (
          <button
            className="btn small"
            disabled={!available}
            title={reason}
            onClick={() => research(tech.id)}
          >
            Rechercher ({tech.cost} PR)
          </button>
        )}
      </div>
    </li>
  );
}

export function TechTreeView({ game }: { game: GameState }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>🔬 Arbre technologique</h2>
        <span className="tag">{Math.floor(game.resources.research)} points de recherche</span>
      </div>
      <p className="muted">
        Les points de recherche s'accumulent grâce aux bâtiments scientifiques,
        aux expéditions réussies et à certaines requêtes du peuple. Dépensez-les
        pour faire progresser Orion à travers les âges.
      </p>
      {TECH_AGE_ORDER.map((age) => (
        <div className="build-category" key={age}>
          <div className="build-category-label">{AGE_LABEL[age]}</div>
          <ul className="marriage-list">
            {TECHS.filter((t) => t.age === age).map((tech) => (
              <TechCard key={tech.id} game={game} tech={tech} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
