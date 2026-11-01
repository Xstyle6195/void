import { carName, modelOf } from "../game/car";
import { dealerPrice, freeBays, occupiedBays } from "../game/engine";
import { formatMoney } from "../game/utils";
import { useStore } from "../state/store";
import { CarSvg } from "./CarSvg";
import { Bar, CarLabelsFor, Empty, ValueLine } from "./common";
import { computeStats } from "../game/car";

export function GarageView() {
  const { game, openCar, setTab, dealer, toCollection } = useStore();
  const cars = game.cars.filter((c) => c.status !== "collection");
  const empty = freeBays(game);
  return (
    <section>
      <div className="section-head">
        <h2>Atelier</h2>
        <span className="muted">
          {occupiedBays(game)} / {game.bays} places occupées
        </span>
      </div>
      {cars.length === 0 && (
        <Empty>
          Votre atelier est vide. Rendez-vous au <button className="link" onClick={() => setTab("marche")}>marché</button> pour acheter votre
          première voiture, ou acceptez une <button className="link" onClick={() => setTab("commandes")}>commande client</button>.
        </Empty>
      )}
      <div className="bay-grid">
        {cars.map((car) => {
          const m = modelOf(car);
          const s = computeStats(car);
          const order = car.clientOrderId ? game.orders.find((o) => o.id === car.clientOrderId) : undefined;
          return (
            <article key={car.id} className="bay card">
              <div className="bay-top">
                <div>
                  <h3>{carName(car)}</h3>
                  <span className="muted">
                    {m.year} · {car.km.toLocaleString("fr-FR")} km · {car.color.name}
                  </span>
                </div>
                {car.status === "vente" && <span className="pill pill-sale">En vente</span>}
                {order && <span className="pill pill-client">Client : {order.client}</span>}
              </div>
              <div className="bay-car">
                <CarSvg car={car} size={260} />
              </div>
              <CarLabelsFor car={car} />
              <div className="domain-bars">
                <div>
                  <small>🔧 Mécanique</small>
                  <Bar value={s.domainCondition.mecanique} />
                </div>
                <div>
                  <small>🚗 Carrosserie</small>
                  <Bar value={s.domainCondition.carrosserie} />
                </div>
                <div>
                  <small>💺 Intérieur</small>
                  <Bar value={s.domainCondition.interieur} />
                </div>
              </div>
              <p className="muted small">
                {s.power} ch · état {s.condition} % · originalité {s.originality} %
              </p>
              {!order && <ValueLine car={car} />}
              <div className="actions">
                <button className="primary" onClick={() => openCar(car.id)} disabled={car.status !== "atelier"}>
                  Concevoir
                </button>
                {!order && (
                  <>
                    <button onClick={() => setTab("vente")}>{car.status === "vente" ? "Voir les offres" : "Vendre"}</button>
                    <button onClick={() => toCollection(car.id)} disabled={car.status !== "atelier"} title="Garder dans votre collection personnelle">
                      Garder
                    </button>
                    <button
                      className="ghost"
                      disabled={car.status !== "atelier"}
                      onClick={() => {
                        if (confirm(`Céder la ${carName(car)} à un marchand pour ${formatMoney(dealerPrice(car))} ?`)) dealer(car.id);
                      }}
                    >
                      Marchand ({formatMoney(dealerPrice(car))})
                    </button>
                  </>
                )}
                {order && (
                  <button onClick={() => setTab("commandes")}>Voir la commande</button>
                )}
              </div>
            </article>
          );
        })}
        {Array.from({ length: Math.max(0, empty) }).map((_, i) => (
          <article key={`empty-${i}`} className="bay card bay-empty" onClick={() => setTab("marche")}>
            <span>Place libre</span>
            <small>Acheter une voiture →</small>
          </article>
        ))}
      </div>
    </section>
  );
}
