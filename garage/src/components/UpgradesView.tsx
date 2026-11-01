import { MAX_MECHANICS, MECHANIC_HIRE_COST, MECHANIC_HOURS, MECHANIC_SALARY, UPGRADES } from "../game/data";
import { nextBayCost, weeklyCosts, weeklyHours } from "../game/engine";
import { formatMoney } from "../game/utils";
import { useStore } from "../state/store";

export function UpgradesView() {
  const { game, upgrade, bay, hire, fire } = useStore();
  const bayCost = nextBayCost(game);
  return (
    <section>
      <div className="section-head">
        <h2>Équipement de l'atelier</h2>
        <span className="muted">
          Charges hebdomadaires : {formatMoney(weeklyCosts(game))} · {weeklyHours(game)} h de travail par semaine
        </span>
      </div>
      <div className="upgrade-grid">
        <article className="card upgrade">
          <h3>🅿️ Places d'atelier</h3>
          <p>Vous disposez de {game.bays} places. Chaque place supplémentaire coûte 150 €/semaine.</p>
          <button className="primary" disabled={bayCost === null || game.money < bayCost} onClick={bay}>
            {bayCost === null ? "Maximum atteint" : `Agrandir (${formatMoney(bayCost)})`}
          </button>
        </article>
        <article className="card upgrade">
          <h3>👷 Mécaniciens</h3>
          <p>
            {game.mechanics} / {MAX_MECHANICS} embauché(s). Chacun apporte {MECHANIC_HOURS} h/semaine pour {formatMoney(MECHANIC_SALARY)}/semaine.
          </p>
          <div className="actions">
            <button className="primary" disabled={game.mechanics >= MAX_MECHANICS || game.money < MECHANIC_HIRE_COST} onClick={hire}>
              Embaucher ({formatMoney(MECHANIC_HIRE_COST)})
            </button>
            <button className="ghost" disabled={game.mechanics === 0} onClick={fire}>
              Licencier
            </button>
          </div>
        </article>
        {UPGRADES.map((u) => {
          const owned = game.upgrades.includes(u.id);
          const locked = game.reputation < u.repRequired;
          return (
            <article key={u.id} className={`card upgrade ${owned ? "owned" : ""}`}>
              <h3>{u.label}</h3>
              <p>{u.description}</p>
              <button className="primary" disabled={owned || locked || game.money < u.cost} onClick={() => upgrade(u.id)}>
                {owned ? "✔ Installé" : locked ? `Réputation ${u.repRequired} requise` : `Acheter (${formatMoney(u.cost)})`}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
