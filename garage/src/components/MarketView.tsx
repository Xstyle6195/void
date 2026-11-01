import { PARTS, DOMAINS, INSPECT_HOURS } from "../game/data";
import { carName, computeStats, isCollectible, marketValue, modelOf, partStatusLabel } from "../game/car";
import { buyBlockReason } from "../game/engine";
import { formatMoney } from "../game/utils";
import { useStore } from "../state/store";
import { CarSvg } from "./CarSvg";
import { Bar } from "./common";

const TAGS = {
  "bonne-affaire": "Bonne affaire",
  "sortie-de-grange": "Sortie de grange",
  neuve: "Neuve",
} as const;

export function MarketView() {
  const { game, buy, inspect } = useStore();
  const listings = [...game.market].sort((a, b) => a.price - b.price);
  return (
    <section>
      <div className="section-head">
        <h2>Marché</h2>
        <span className="muted">Nouvelles annonces chaque semaine · inspection : {INSPECT_HOURS} h d'atelier</span>
      </div>
      <div className="market-grid">
        {listings.map((l) => {
          const m = modelOf(l.car);
          const reason = buyBlockReason(game, l);
          const locked = m.repRequired > game.reputation;
          const stats = computeStats(l.car);
          return (
            <article key={l.id} className={`card listing ${locked ? "locked" : ""}`}>
              <div className="bay-top">
                <div>
                  <h3>{carName(l.car)}</h3>
                  <span className="muted">
                    {m.year} · {l.car.km.toLocaleString("fr-FR")} km · {l.seller}
                  </span>
                </div>
                <div className="tags">
                  {l.tag && <span className={`pill pill-${l.tag}`}>{TAGS[l.tag]}</span>}
                  {isCollectible(m) && <span className="pill pill-classic">Collection ★{m.rarity}</span>}
                </div>
              </div>
              <div className="bay-car">
                <CarSvg car={l.car} size={240} />
              </div>
              <p className="muted small">{m.description}</p>
              <p className="small">
                {m.engineLabel} · {m.basePower} ch d'origine · {l.car.color.name}
              </p>
              {l.tag === "neuve" ? (
                <div className="inspection">
                  <p className="small">
                    ✨ Voiture neuve sortie d'usine : état <strong>100 %</strong> · originalité <strong>100 %</strong> · garantie constructeur.
                  </p>
                </div>
              ) : l.inspected ? (
                <div className="inspection">
                  {DOMAINS.map((d) => (
                    <div key={d.id} className="inspect-domain">
                      <strong>
                        {d.icon} {d.label} — {stats.domainCondition[d.id]} %
                      </strong>
                      {PARTS.filter((p) => p.domain === d.id).map((p) => {
                        const ps = l.car.parts[p.id];
                        return (
                          <div key={p.id} className="inspect-row">
                            <span>{p.label}</span>
                            <Bar value={ps.condition} />
                            <span className={`origin origin-${ps.origin}`} title={partStatusLabel(ps)}>
                              {ps.condition}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <p className="small">
                    État réel : <strong>{stats.condition} %</strong> · originalité <strong>{stats.originality} %</strong> · cote{" "}
                    <strong>{formatMoney(marketValue(l.car, stats))}</strong>
                  </p>
                </div>
              ) : (
                <div className="inspection pending">
                  <p>
                    État annoncé par le vendeur : <strong>{l.claimedCondition} %</strong>
                  </p>
                  <button onClick={() => inspect(l.id)} disabled={game.hoursLeft < INSPECT_HOURS}>
                    🔍 Inspecter ({INSPECT_HOURS} h)
                  </button>
                </div>
              )}
              <div className="listing-foot">
                <span className="price">{formatMoney(l.price)}</span>
                <button className="primary" disabled={!!reason} onClick={() => buy(l.id)} title={reason ?? ""}>
                  {reason ?? "Acheter"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
