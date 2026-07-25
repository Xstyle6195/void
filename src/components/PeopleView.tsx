import {
  productionMultiplier,
  satisfactionTier,
  TIER_DESCRIPTION,
  TIER_LABEL,
} from "../game/satisfaction";
import type { GameState } from "../game/types";

export function PeopleView({ game }: { game: GameState }) {
  const nationalTier = satisfactionTier(game.resources.stability);

  return (
    <section className="panel">
      <h2>Le Peuple</h2>
      <p className="muted">
        Un peuple bien traité ne se fait pas entendre. Ravi, il travaille
        deux fois plus et fait plus d'enfants. Mécontent, il produit et se
        reproduit moins. Furieux, des villes peuvent se soulever, faire
        sécession ou même renverser le souverain.
      </p>

      <div className="bar-row">
        <span>Satisfaction générale</span>
        <div className="bar">
          <div
            className={`bar-fill tier-fill-${nationalTier}`}
            style={{ width: `${game.resources.stability}%` }}
          />
        </div>
      </div>
      <p className={`tier-text tier-text-${nationalTier}`}>
        <strong>{TIER_LABEL[nationalTier]}</strong> — {TIER_DESCRIPTION[nationalTier]}
      </p>

      <h3>Satisfaction par province</h3>
      <ul className="province-list">
        {game.provinces.map((p) => {
          const tier = satisfactionTier(p.satisfaction);
          return (
            <li key={p.id} className="province-item">
              <div className="province-row">
                <div>
                  <strong>{p.name}</strong>{" "}
                  <span className={`tag tier-tag-${tier}`}>{TIER_LABEL[tier]}</span>
                </div>
                <div className="muted">×{productionMultiplier(tier)} production</div>
              </div>
              <div className="bar-row">
                <div className="bar">
                  <div
                    className={`bar-fill tier-fill-${tier}`}
                    style={{ width: `${p.satisfaction}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
