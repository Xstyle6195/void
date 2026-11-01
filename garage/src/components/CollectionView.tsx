import { carName, marketValue, modelOf } from "../game/car";
import { collectionPrestige, freeBays } from "../game/engine";
import { formatMoney } from "../game/utils";
import { useStore } from "../state/store";
import { CarSvg } from "./CarSvg";
import { CarLabelsFor, Empty, LabelBadges } from "./common";

export function CollectionView() {
  const { game, fromCollection } = useStore();
  const collection = game.cars.filter((c) => c.status === "collection");
  const totalSales = game.sold.reduce((s, r) => s + r.price, 0);
  const totalProfit = game.sold.reduce((s, r) => s + r.profit, 0);
  const pieces = game.sold.filter((r) => r.labels.includes("Pièce de collection")).length;
  return (
    <section>
      <div className="section-head">
        <h2>Ma collection</h2>
        <span className="muted">Les pièces exposées rapportent de la réputation chaque semaine.</span>
      </div>
      {collection.length === 0 && <Empty>Gardez vos plus belles réalisations ici plutôt que de les vendre.</Empty>}
      <div className="bay-grid">
        {collection.map((car) => {
          const prestige = collectionPrestige(car);
          return (
            <article key={car.id} className="card bay museum">
              <h3>{carName(car)}</h3>
              <span className="muted">{modelOf(car).year}</span>
              <div className="bay-car">
                <CarSvg car={car} size={260} />
              </div>
              <CarLabelsFor car={car} />
              <p className="small">
                Cote : <strong>{formatMoney(marketValue(car))}</strong> · prestige +{prestige.toFixed(1)} réputation/semaine
              </p>
              <button disabled={freeBays(game) <= 0} onClick={() => fromCollection(car.id)}>
                Ramener à l'atelier
              </button>
            </article>
          );
        })}
      </div>
      <div className="section-head">
        <h2>Palmarès</h2>
        <span className="muted">
          {game.sold.length} voiture(s) · CA {formatMoney(totalSales)} · bénéfice {formatMoney(totalProfit)} · {pieces} pièce(s) de collection
        </span>
      </div>
      {game.sold.length === 0 ? (
        <Empty>Aucune vente pour le moment.</Empty>
      ) : (
        <table className="palmares">
          <thead>
            <tr>
              <th>Sem.</th>
              <th>Voiture</th>
              <th>Acheteur</th>
              <th>Prix</th>
              <th>Bénéfice</th>
            </tr>
          </thead>
          <tbody>
            {game.sold.map((r, i) => (
              <tr key={i}>
                <td>{r.week}</td>
                <td>
                  {r.name} <span className="muted">({r.year})</span>
                  <LabelBadges labels={r.labels} />
                </td>
                <td>{r.buyer}</td>
                <td>{formatMoney(r.price)}</td>
                <td className={r.profit >= 0 ? "up" : "down"}>{formatMoney(r.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
