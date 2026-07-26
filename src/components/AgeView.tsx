import { AGE_DESCRIPTION, AGE_LABEL, AGE_ORDER, AGE_THRESHOLD, techGainPerTurn } from "../game/ages";
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
  const upcoming = AGE_ORDER[idx + 1];
  const threshold = AGE_THRESHOLD[game.age];
  const gainPerTurn = techGainPerTurn(game);
  const pct = threshold ? Math.min(100, (game.techProgress / threshold) * 100) : 100;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>
          {AGE_ICON[game.age]} {AGE_LABEL[game.age]}
        </h2>
      </div>
      <p className="muted">{AGE_DESCRIPTION[game.age]}</p>

      {threshold && upcoming ? (
        <>
          <div className="bar-row">
            <div className="bar">
              <div className="bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="muted">
              {Math.floor(game.techProgress)} / {threshold}
            </span>
          </div>
          <p className="muted">
            Progrès technologique : +{gainPerTurn.toFixed(1)} par an. Prochaine
            époque : {AGE_ICON[upcoming]} {AGE_LABEL[upcoming]}.
          </p>
        </>
      ) : (
        <p className="muted">Orion a atteint la dernière époque connue.</p>
      )}

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
