import { ageAtLeast, AGE_LABEL } from "../game/ages";
import {
  activeReadinessBonus,
  CORPS_BUILDING,
  CORPS_LABEL,
  EXERCISE_BONUS,
  EXERCISE_COST_PER_UNIT,
  EXERCISE_MAX_BONUS,
  totalArmyPower,
  totalArmyUnits,
  unitsForCorps,
} from "../game/army";
import { BUILDINGS, RECRUIT_BATCH, RECRUIT_COST_PER_MAN } from "../game/data";
import type { CorpsType, GameState } from "../game/types";
import { useGameStore } from "../state/store";

const ATTACK_COST = 40;

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
  const buildingName = buildingId ? BUILDINGS[buildingId].name : "";
  const buildingRequiredAge = buildingId ? BUILDINGS[buildingId].age : "medieval";
  const buildingLocked = !ageAtLeast(game.age, buildingRequiredAge);

  return (
    <section className="panel">
      <h2>
        {CORPS_ICON[corps]} {CORPS_LABEL[corps]}
      </h2>

      {buildingLocked ? (
        <p className="muted">
          {corps === "air"
            ? `Le corps aérien nécessite une avancée technologique : atteignez l'époque ${AGE_LABEL[buildingRequiredAge]} pour pouvoir construire un(e) ${buildingName} et recruter vos premiers aviateurs.`
            : `Nécessite l'époque ${AGE_LABEL[buildingRequiredAge]}.`}
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
              Construisez un(e) {buildingName} dans une province pour pouvoir y
              recruter.
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
              const locked = !ageAtLeast(game.age, u.age);
              const disabled = locked || amount <= 0 || game.resources.gold < cost;
              const reason = locked
                ? `Nécessite l'époque ${AGE_LABEL[u.age]}`
                : amount <= 0
                  ? "Aucune recrue disponible"
                  : game.resources.gold < cost
                    ? "Or insuffisant"
                    : "";
              return (
                <li key={u.id} className="marriage-item">
                  <div className="province-row">
                    <div>
                      <strong>
                        {locked ? "🔒 " : ""}
                        {u.name}
                      </strong>{" "}
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

function StrategySection({ game }: { game: GameState }) {
  const attack = useGameStore((s) => s.attack);
  const exercise = useGameStore((s) => s.exercise);

  const totalUnits = totalArmyUnits(game);
  const power = totalArmyPower(game);
  const readiness = activeReadinessBonus(game);
  const exerciseCost = Math.round(totalUnits * EXERCISE_COST_PER_UNIT);
  const exerciseDisabled = totalUnits <= 0 || game.resources.gold < exerciseCost;
  const exerciseReason =
    totalUnits <= 0
      ? "Aucune unité équipée"
      : game.resources.gold < exerciseCost
        ? "Or insuffisant"
        : "";

  const targets = game.neighbors.filter((n) => !n.atWar);

  return (
    <section className="panel">
      <h2>Stratégie militaire</h2>
      <p className="muted">
        {readiness > 0
          ? `Préparation actuelle : +${Math.round(readiness * 100)}% de puissance jusqu'en ${game.army.readinessExpiresYear}.`
          : "Aucune préparation active."}
      </p>

      <div className="panel-header">
        <h3>Exercices</h3>
        <button
          className="btn small"
          disabled={exerciseDisabled}
          title={exerciseReason}
          onClick={exercise}
        >
          Organiser des manœuvres ({exerciseCost} or)
        </button>
      </div>
      <p className="muted">
        Entraîne les troupes équipées pour accroître temporairement leur
        puissance de combat (+{Math.round(EXERCISE_BONUS * 100)}%, jusqu'à +
        {Math.round(EXERCISE_MAX_BONUS * 100)}% cumulé).
      </p>

      <div className="panel-header">
        <h3>Attaquer une cible</h3>
      </div>
      {power <= 0 ? (
        <p className="muted">
          Équipez au moins une unité pour pouvoir lancer une offensive.
        </p>
      ) : targets.length === 0 ? (
        <p className="muted">Tous vos voisins sont déjà en guerre contre vous.</p>
      ) : (
        <div className="build-menu">
          {targets.map((n) => {
            const disabled = game.resources.gold < ATTACK_COST;
            return (
              <button
                key={n.id}
                className="btn small danger"
                disabled={disabled}
                title={
                  disabled ? "Or insuffisant" : `Force adverse estimée : ${n.strength}`
                }
                onClick={() => attack(n.id)}
              >
                Attaquer {n.name} ({ATTACK_COST} or)
              </button>
            );
          })}
        </div>
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
      <StrategySection game={game} />
      <CorpsSection game={game} corps="land" />
      <CorpsSection game={game} corps="naval" />
      <CorpsSection game={game} corps="air" />
    </>
  );
}
