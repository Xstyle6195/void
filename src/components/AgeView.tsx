import { AGE_DESCRIPTION, AGE_LABEL, AGE_ORDER } from "../game/ages";
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
      </div>
      <p className="muted">{AGE_DESCRIPTION[game.age]}</p>

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
