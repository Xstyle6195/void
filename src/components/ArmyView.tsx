import { CORPS_BUILDING, CORPS_LABEL, totalArmyPower, unitsForCorps } from "../game/army";
import { BUILDINGS, RECRUIT_BATCH, RECRUIT_COST_PER_MAN } from "../game/data";
import type { CorpsType, GameState } from "../game/types";
import { useGameStore } from "../state/store";

const CORPS_ICON: Record<CorpsType, string> = {
  land: "🛡️",
  naval: "⚓",
  air: "🪶",
};

function CorpsSection({ game, corps }: { game: GameState; corps: CorpsType }) {
  const recruit = useGameStore((s) => s.recruit);
  const equip = useGameStore((s) => s.equip);

  const buildingId = CORPS_BUILDING[corps];
  const recruits = game.army.recruits[corps];
  const units = unitsForCorps(corps);
  const recruitCost = RECRUIT_BATCH * RECRUIT_COST_PER_MAN;

  const eligibleProvinces = buildingId
    ? game.provinces.filter((p) => p.buildings.includes(buildingId))
    : [];

  return (
    <section className="panel">
      <h2>
        {CORPS_ICON[corps]} {CORPS_LABEL[corps]}
      </h2>

      {corps === "air" ? (
        <p className="muted">
          Le corps aérien n'existe pas encore : il nécessitera une avancée
          technologique future. De quoi s'occuper une fois que les
          fondations du royaume seront bien établies.
        </p>
      ) : (
        <>
          <p className="muted">
            Recrues en attente d'équipement : <strong>{recruits}</strong>
          </p>

          <div className="panel-header">
            <h3>Recruter des hommes</h3>
          </div>
          {eligibleProvinces.length === 0 ? (
            <p className="muted">
              Construisez un(e) {buildingId ? BUILDINGS[buildingId].name : ""}{" "}
              dans une province pour pouvoir y recruter.
            </p>
          ) : (
            <div className="build-menu">
              {eligibleProvinces.map((p) => {
                const disabled =
                  game.resources.gold < recruitCost || p.population < RECRUIT_BATCH;
                const reason =
                  p.population < RECRUIT_BATCH
                    ? "Population insuffisante"
                    : game.resources.gold < recruitCost
                      ? "Or insuffisant"
                      : "";
                return (
                  <button
                    key={p.id}
                    className="btn small"
                    disabled={disabled}
                    title={reason}
                    onClick={() => recruit(corps, p.id)}
                  >
                    Recruter {RECRUIT_BATCH} à {p.name} ({recruitCost} or)
                  </button>
                );
              })}
            </div>
          )}

          <div className="panel-header">
            <h3>Équiper les recrues</h3>
          </div>
          <ul className="marriage-list">
            {units.map((u) => {
              const stack = game.army.units.find((s) => s.unitId === u.id);
              const equipped = stack?.count ?? 0;
              const amount = Math.min(RECRUIT_BATCH, recruits);
              const cost = Math.round(amount * u.equipCostPerMan);
              const disabled = amount <= 0 || game.resources.gold < cost;
              const reason =
                amount <= 0 ? "Aucune recrue disponible" : game.resources.gold < cost ? "Or insuffisant" : "";
              return (
                <li key={u.id} className="marriage-item">
                  <div className="province-row">
                    <div>
                      <strong>{u.name}</strong>{" "}
                      <span className="tag">{equipped} en service</span>
                      <div className="muted">{u.description}</div>
                      <div className="muted">
                        Puissance {u.power} · Entretien {u.upkeepPerMan} or/tour/unité
                      </div>
                    </div>
                    <button
                      className="btn small"
                      disabled={disabled}
                      title={reason}
                      onClick={() => equip(u.id)}
                    >
                      Équiper {amount || RECRUIT_BATCH} ({cost} or)
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

export function ArmyView({ game }: { game: GameState }) {
  return (
    <>
      <section className="panel">
        <h2>Forces armées</h2>
        <p className="muted">
          Recrutez des hommes dans vos provinces équipées d'une caserne ou
          d'un chantier naval, puis fournissez-leur l'équipement qui en fera
          de véritables unités de combat. Puissance totale des troupes
          équipées : <strong>{totalArmyPower(game).toFixed(1)}</strong>.
        </p>
      </section>
      <CorpsSection game={game} corps="land" />
      <CorpsSection game={game} corps="naval" />
      <CorpsSection game={game} corps="air" />
    </>
  );
}
