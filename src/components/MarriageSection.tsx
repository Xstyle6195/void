import { useState } from "react";
import { MIN_MARRIAGE_AGE } from "../game/engine";
import type { GameState } from "../game/types";
import { useGameStore } from "../state/store";

export function MarriageSection({ game }: { game: GameState }) {
  const marryOff = useGameStore((s) => s.marryOff);
  const [openPersonId, setOpenPersonId] = useState<string | null>(null);

  const marriageable = [game.ruler, ...game.heirs].filter((p) => !p.spouseId);

  return (
    <section className="panel">
      <h2>Mariages dynastiques</h2>
      <p className="muted">
        Marier un membre de la famille à la noblesse d'un royaume voisin scelle
        une alliance, améliore durablement les relations, et peut vous offrir
        des terres en dot.
      </p>
      {marriageable.length === 0 ? (
        <p className="muted">
          Tous les membres de la famille en âge de se marier ont déjà un
          époux ou une épouse.
        </p>
      ) : (
        <ul className="marriage-list">
          {marriageable.map((p) => {
            const age = game.year - p.birthYear;
            const tooYoung = age < MIN_MARRIAGE_AGE;
            return (
              <li key={p.id} className="marriage-item">
                <div className="province-row">
                  <div>
                    <strong>{p.name}</strong>{" "}
                    <span className="tag">
                      {p.id === game.ruler.id ? "Souverain(e)" : "Héritier(e)"}
                    </span>
                    <div className="muted">{age} ans, célibataire</div>
                  </div>
                  <button
                    className="btn small"
                    disabled={tooYoung}
                    title={tooYoung ? `Doit avoir au moins ${MIN_MARRIAGE_AGE} ans` : ""}
                    onClick={() =>
                      setOpenPersonId(openPersonId === p.id ? null : p.id)
                    }
                  >
                    {tooYoung ? `Trop jeune (< ${MIN_MARRIAGE_AGE} ans)` : "Marier"}
                  </button>
                </div>
                {openPersonId === p.id && !tooYoung && (
                  <div className="build-menu">
                    {game.neighbors.map((n) => {
                      const disabled =
                        n.atWar || n.relation < -20 || game.resources.gold < 50;
                      const reason = n.atWar
                        ? "En guerre"
                        : n.relation < -20
                          ? "Relations trop hostiles"
                          : game.resources.gold < 50
                            ? "Or insuffisant"
                            : "";
                      return (
                        <button
                          key={n.id}
                          className="btn small"
                          disabled={disabled}
                          title={reason}
                          onClick={() => {
                            marryOff(p.id, n.id);
                            setOpenPersonId(null);
                          }}
                        >
                          Maison de {n.name} (relation {n.relation}, 50 or)
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
