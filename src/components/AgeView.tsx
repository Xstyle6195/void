import { AGE_DESCRIPTION, AGE_LABEL, AGE_ORDER } from "../game/ages";
import {
  CITIES_TO_CAPTURE,
  CLANS_TO_ABSORB,
  GOVERNMENT_BONUS_LABEL,
  GOVERNMENT_DESCRIPTION,
  GOVERNMENT_LABEL,
} from "../game/government";
import type { GameState } from "../game/types";

const AGE_ICON: Record<string, string> = {
  stone: "🪨",
  medieval: "🏰",
  steam: "🚂",
  modern: "✈️",
  future: "🚀",
};

function GovernmentProgress({ game }: { game: GameState }) {
  if (game.government === "clan") {
    return (
      <p className="muted">
        Absorbez entièrement au moins {CLANS_TO_ABSORB} clans rivaux par la
        conquête pour proclamer un royaume ({game.absorbedClans}/{CLANS_TO_ABSORB} absorbés).
      </p>
    );
  }
  if (game.government === "kingdom") {
    const techDone = game.researchedTechs.includes("steam_dawn");
    return (
      <p className="muted">
        Pour proclamer un Empire : rechercher « Les Balbutiements de la Vapeur »
        ({techDone ? "✔ acquise" : "non acquise"}) et capturer au moins{" "}
        {CITIES_TO_CAPTURE} villes à un royaume rival (
        {game.capturedCities}/{CITIES_TO_CAPTURE} capturées).
      </p>
    );
  }
  return null;
}

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
      <p className="muted">
        <strong>Avantage actuel :</strong> {GOVERNMENT_BONUS_LABEL[game.government]}
      </p>
      <GovernmentProgress game={game} />

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
