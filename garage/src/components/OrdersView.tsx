import { useState } from "react";
import { carName, modelOf } from "../game/car";
import { acceptBlockReason, checkCriteria, eligibleCarsForOrder, meetsCriteria } from "../game/engine";
import type { ClientOrder } from "../game/types";
import { formatMoney } from "../game/utils";
import { useStore } from "../state/store";
import { CarSvg } from "./CarSvg";
import { Empty } from "./common";

function AcceptedOrder({ order }: { order: ClientOrder }) {
  const { game, deliver, openCar } = useStore();
  const cars = eligibleCarsForOrder(game, order);
  const [carId, setCarId] = useState<string>("");
  const selected = cars.find((c) => c.id === carId) ?? cars.find((c) => meetsCriteria(c, order.criteria)) ?? cars[0];
  const left = order.deadlineWeeks - (game.week - (order.acceptedWeek ?? game.week));
  return (
    <article className="card order accepted">
      <div className="bay-top">
        <h3>{order.client}</h3>
        <span className={`pill ${left <= 1 ? "pill-urgent" : "pill-client"}`}>
          {left} semaine{left > 1 ? "s" : ""} restante{left > 1 ? "s" : ""}
        </span>
      </div>
      <p className="quote">{order.text}</p>
      <p className="small">
        Récompense : <strong>{formatMoney(order.reward)}</strong> · réputation +{order.repReward}
      </p>
      {cars.length === 0 ? (
        <p className="hint">Aucune voiture de votre atelier ne peut être proposée. Trouvez-en une au marché.</p>
      ) : (
        <>
          {order.kind === "recherche" && cars.length > 1 && (
            <select value={selected?.id} onChange={(e) => setCarId(e.target.value)}>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {carName(c)} ({modelOf(c).year})
                </option>
              ))}
            </select>
          )}
          {selected && (
            <div className="order-check">
              <CarSvg car={selected} size={160} />
              <div>
                {checkCriteria(selected, order.criteria).map((c) => (
                  <div key={c.label} className={c.ok ? "ok" : "ko"}>
                    {c.ok ? "✔" : "✘"} {c.label}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="actions">
            {selected && order.kind === "preparation" && (
              <button onClick={() => openCar(selected.id)}>Travailler dessus</button>
            )}
            <button className="primary" disabled={!selected || !meetsCriteria(selected, order.criteria)} onClick={() => selected && deliver(order.id, selected.id)}>
              Livrer au client
            </button>
          </div>
        </>
      )}
    </article>
  );
}

export function OrdersView() {
  const { game, acceptOrder, declineOrder } = useStore();
  const available = game.orders.filter((o) => o.status === "disponible");
  const accepted = game.orders.filter((o) => o.status === "acceptee");
  return (
    <section>
      <div className="section-head">
        <h2>Commandes spéciales</h2>
        <span className="muted">Des clients privés font appel à votre savoir-faire.</span>
      </div>
      <h3 className="sub">En cours</h3>
      {accepted.length === 0 && <Empty>Aucune commande en cours.</Empty>}
      <div className="orders-grid">
        {accepted.map((o) => (
          <AcceptedOrder key={o.id} order={o} />
        ))}
      </div>
      <h3 className="sub">Demandes reçues</h3>
      {available.length === 0 && <Empty>Pas de nouvelle demande cette semaine.</Empty>}
      <div className="orders-grid">
        {available.map((o) => {
          const reason = acceptBlockReason(game, o);
          return (
            <article key={o.id} className="card order">
              <div className="bay-top">
                <h3>{o.client}</h3>
                <span className="pill">{o.kind === "preparation" ? "Voiture confiée" : "Recherche & préparation"}</span>
              </div>
              <p className="quote">{o.text}</p>
              {o.clientCar && (
                <div className="order-check">
                  <CarSvg car={o.clientCar} size={160} />
                  <div className="small muted">
                    {carName(o.clientCar)} {modelOf(o.clientCar).year}
                    <br />
                    La voiture vous est confiée : pièces et main-d'œuvre à votre charge.
                  </div>
                </div>
              )}
              <ul className="criteria">
                {Object.entries(o.criteria).length > 0 &&
                  checkCriteriaPreview(o).map((c) => <li key={c}>{c}</li>)}
              </ul>
              <p className="small">
                Récompense : <strong>{formatMoney(o.reward)}</strong> · réputation +{o.repReward} · délai {o.deadlineWeeks} semaines
              </p>
              <p className="small muted">Expire dans {2 - (game.week - o.createdWeek)} semaine(s) si vous ne répondez pas.</p>
              <div className="actions">
                <button className="primary" disabled={!!reason} onClick={() => acceptOrder(o.id)}>
                  {reason ?? "Accepter"}
                </button>
                <button className="ghost" onClick={() => declineOrder(o.id)}>
                  Refuser
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function checkCriteriaPreview(o: ClientOrder): string[] {
  const c = o.criteria;
  const out: string[] = [];
  if (c.minCondition) out.push(`État général ≥ ${c.minCondition} %`);
  if (c.minOriginality) out.push(`Originalité ≥ ${c.minOriginality} %`);
  if (c.minPower) out.push(`Puissance ≥ ${c.minPower} ch`);
  if (c.minLuxe) out.push(`Luxe ≥ ${c.minLuxe}`);
  if (c.minStyle) out.push(`Style ≥ ${c.minStyle}`);
  if (c.minHandling) out.push(`Tenue de route ≥ ${c.minHandling}`);
  return out;
}
