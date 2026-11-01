import { repTitle, weeklyCosts, weeklyHours } from "./game/engine";
import { REP_TITLES } from "./game/data";
import { formatMoney } from "./game/utils";
import { useStore, type Tab } from "./state/store";
import { GarageView } from "./components/GarageView";
import { MarketView } from "./components/MarketView";
import { ConceptionView } from "./components/ConceptionView";
import { SalesView } from "./components/SalesView";
import { OrdersView } from "./components/OrdersView";
import { UpgradesView } from "./components/UpgradesView";
import { CollectionView } from "./components/CollectionView";
import "./App.css";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "atelier", label: "Atelier", icon: "🏠" },
  { id: "marche", label: "Achat", icon: "🛒" },
  { id: "conception", label: "Conception", icon: "🛠️" },
  { id: "vente", label: "Vente", icon: "💰" },
  { id: "commandes", label: "Commandes", icon: "📋" },
  { id: "equipement", label: "Équipement", icon: "⚙️" },
  { id: "collection", label: "Collection", icon: "🏆" },
];

export default function App() {
  const { game, tab, setTab, nextWeek, reset } = useStore();
  const nextTitle = REP_TITLES.find((t) => t.min > game.reputation);
  const offers = game.cars.reduce((s, c) => s + c.offers.length, 0);
  const newOrders = game.orders.filter((o) => o.status === "disponible").length;
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>Atelier Prépa</h1>
          <span className="muted">{repTitle(game.reputation)}</span>
        </div>
        <div className="resources">
          <div className={`res ${game.money < 0 ? "down" : ""}`}>
            <small>Trésorerie</small>
            <strong>{formatMoney(game.money)}</strong>
          </div>
          <div className="res">
            <small>Réputation</small>
            <strong>
              ⭐ {Math.floor(game.reputation)}
              {nextTitle && <span className="muted small"> / {nextTitle.min}</span>}
            </strong>
          </div>
          <div className="res">
            <small>Semaine</small>
            <strong>{game.week}</strong>
          </div>
          <div className="res">
            <small>Heures d'atelier</small>
            <strong>
              ⏱ {game.hoursLeft} / {weeklyHours(game)} h
            </strong>
          </div>
        </div>
        <button className="primary next-week" onClick={nextWeek} disabled={game.gameOver} title={`Charges : ${formatMoney(weeklyCosts(game))}`}>
          Semaine suivante ▸
          <small>charges {formatMoney(weeklyCosts(game))}</small>
        </button>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span> {t.label}
            {t.id === "vente" && offers > 0 && <span className="dot">{offers}</span>}
            {t.id === "commandes" && newOrders > 0 && <span className="dot">{newOrders}</span>}
          </button>
        ))}
      </nav>

      {game.gameOver && (
        <div className="card gameover">
          <h2>Faillite</h2>
          <p>
            Votre atelier ferme ses portes après {game.week} semaines. Réputation finale : {Math.floor(game.reputation)} — {repTitle(game.reputation)}.
          </p>
          <button className="primary" onClick={reset}>
            Recommencer
          </button>
        </div>
      )}

      <main>
        {tab === "atelier" && <GarageView />}
        {tab === "marche" && <MarketView />}
        {tab === "conception" && <ConceptionView />}
        {tab === "vente" && <SalesView />}
        {tab === "commandes" && <OrdersView />}
        {tab === "equipement" && <UpgradesView />}
        {tab === "collection" && <CollectionView />}
      </main>

      <section className="journal card">
        <div className="section-head">
          <h3>Journal</h3>
          <button
            className="ghost small"
            onClick={() => {
              if (confirm("Recommencer une nouvelle partie ? La sauvegarde actuelle sera perdue.")) reset();
            }}
          >
            Nouvelle partie
          </button>
        </div>
        <ul>
          {game.log.slice(0, 14).map((l, i) => (
            <li key={i} className={l.tone ?? ""}>
              <span className="muted">S{l.week}</span> {l.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
