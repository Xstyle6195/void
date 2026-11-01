import { useState } from "react";
import { CHANNELS, PROFILE_LABELS } from "../game/data";
import { carName, modelOf } from "../game/car";
import { listBlockReason } from "../game/engine";
import type { Car, SaleChannel } from "../game/types";
import { formatMoney } from "../game/utils";
import { useStore } from "../state/store";
import { CarSvg } from "./CarSvg";
import { CarLabelsFor, Empty, StatGrid, ValueLine } from "./common";

function ListForm({ car }: { car: Car }) {
  const { game, list } = useStore();
  const [channel, setChannel] = useState<SaleChannel>("annonces");
  const reason = listBlockReason(game, car, channel);
  return (
    <div className="list-form">
      <div className="channels">
        {(Object.keys(CHANNELS) as SaleChannel[]).map((id) => {
          const ch = CHANNELS[id];
          const locked = game.reputation < ch.repRequired;
          return (
            <label key={id} className={`channel ${channel === id ? "active" : ""} ${locked ? "locked" : ""}`}>
              <input type="radio" name={`ch-${car.id}`} checked={channel === id} onChange={() => setChannel(id)} disabled={locked} />
              <strong>{ch.label}</strong>
              <small>{ch.description}</small>
              <small className="muted">
                {formatMoney(ch.cost)}
                {locked ? ` · réputation ${ch.repRequired} requise` : ""}
              </small>
            </label>
          );
        })}
      </div>
      <button className="primary" disabled={!!reason} onClick={() => list(car.id, channel)}>
        {reason ?? "Lancer la promotion"}
      </button>
    </div>
  );
}

export function SalesView() {
  const { game, accept, decline, unlist } = useStore();
  const sellable = game.cars.filter((c) => !c.clientOrderId && (c.status === "atelier" || c.status === "vente"));
  if (!sellable.length) {
    return (
      <section>
        <h2>Vente</h2>
        <Empty>Aucune voiture à vendre pour le moment.</Empty>
      </section>
    );
  }
  return (
    <section>
      <div className="section-head">
        <h2>Vente</h2>
        <span className="muted">Choisissez votre promotion : chaque canal attire des acheteurs différents.</span>
      </div>
      <div className="sales-list">
        {sellable.map((car) => {
          const m = modelOf(car);
          return (
            <article key={car.id} className="card sale-card">
              <div className="sale-left">
                <h3>{carName(car)}</h3>
                <span className="muted">{m.year}</span>
                <CarSvg car={car} size={220} />
                <CarLabelsFor car={car} />
                <StatGrid car={car} compact />
                <ValueLine car={car} />
              </div>
              <div className="sale-right">
                {car.status === "atelier" && <ListForm car={car} />}
                {car.status === "vente" && car.listing && (
                  <>
                    <div className="listing-status">
                      <span className="pill pill-sale">{CHANNELS[car.listing.channel].label}</span>
                      <button className="ghost" onClick={() => unlist(car.id)}>
                        Retirer de la vente
                      </button>
                    </div>
                    {car.listing.channel === "encheres" ? (
                      <p className="hint">🔨 La vente aux enchères aura lieu à la fin de la semaine. La voiture sera adjugée au plus offrant.</p>
                    ) : car.offers.length === 0 ? (
                      <p className="hint">Aucune offre pour l'instant. De nouveaux acheteurs se manifesteront la semaine prochaine.</p>
                    ) : (
                      <div className="offers">
                        {car.offers.map((o) => {
                          const profit = o.amount - car.purchasePrice - car.invested;
                          return (
                            <div key={o.id} className="offer">
                              <div>
                                <strong>{o.buyer}</strong>
                                <small className="muted">{PROFILE_LABELS[o.profile]}</small>
                              </div>
                              <div className="offer-amount">
                                <strong>{formatMoney(o.amount)}</strong>
                                <small className={profit >= 0 ? "up" : "down"}>
                                  {profit >= 0 ? "+" : ""}
                                  {formatMoney(profit)}
                                </small>
                              </div>
                              <div className="offer-actions">
                                <button className="primary" onClick={() => accept(car.id, o.id)}>
                                  Accepter
                                </button>
                                <button className="ghost" onClick={() => decline(car.id, o.id)}>
                                  ✕
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
