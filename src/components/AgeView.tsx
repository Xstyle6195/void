import { AGE_DESCRIPTION, AGE_LABEL, AGE_ORDER } from "../game/ages";
import { GOVERNMENT_DESCRIPTION, GOVERNMENT_LABEL } from "../game/government";
import type { GameState } from "../game/types";

const AGE_ICON: Record<string, string> = {
  stone: "🪨",
  medieval: "🏰",
  steam: "🚂",
  modern: "✈️",
  future: "🚀",
};

export function AgeView({ game }: { game: GameState }) {
  const idx = AGE_ORDER.indexOf(game.age);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>
          {AGE_ICON[game.age]} {AGE_LABEL[game.age]}
        </h2>
        <span className="tag">{GOVERNMENT_LABEL[game.government]}</span>
      </div>
      <p className="muted">{AGE_DESCRIPTION[game.age]}</p>
      <p className="muted">{GOVERNMENT_DESCRIPTION[game.government]}</p>

      <div className="age-timeline">
        {AGE_ORDER.map((a, i) => (
          <span
            key={a}
            className={`tag${i < idx ? " tier-tag-content" : ""}${a === game.age ? " tier-tag-delighted" : ""}`}
            title={AGE_LABEL[a]}
          >
            {AGE_ICON[a]} {AGE_LABEL[a]}
          </span>
        ))}
      </div>
    </section>
  );
}
