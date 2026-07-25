import type { ExpeditionKind, GameState } from "../game/types";
import { useGameStore } from "../state/store";

const KIND_LABEL: Record<ExpeditionKind, string> = {
  geographic: "Géographique",
  mercantile: "Mercantile",
  resource: "Ressources",
};

const KIND_ICON: Record<ExpeditionKind, string> = {
  geographic: "🧭",
  mercantile: "🤝",
  resource: "⛏️",
};

const MAX_ACTIVE = 3;

export function ExpeditionView({ game }: { game: GameState }) {
  const sendExpedition = useGameStore((s) => s.sendExpedition);
  const atCapacity = game.activeExpeditions.length >= MAX_ACTIVE;

  return (
    <>
      <section className="panel">
        <h2>Expéditions en cours</h2>
        {game.activeExpeditions.length === 0 ? (
          <p className="muted">Aucune expédition en route pour le moment.</p>
        ) : (
          <ul className="marriage-list">
            {game.activeExpeditions.map((exp) => (
              <li key={exp.id} className="marriage-item">
                <div className="province-row">
                  <div>
                    <strong>
                      {KIND_ICON[exp.offer.kind]} {exp.offer.explorerName}
                    </strong>{" "}
                    <span className="tag">{KIND_LABEL[exp.offer.kind]}</span>
                    <div className="muted">{exp.offer.title}</div>
                  </div>
                  <div className="muted">Retour en {exp.returnYear}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Offres d'expédition</h2>
          {atCapacity && (
            <span className="muted">
              Maximum de {MAX_ACTIVE} expéditions simultanées atteint
            </span>
          )}
        </div>
        {game.expeditionOffers.length === 0 ? (
          <p className="muted">Aucun explorateur ne se présente pour l'instant.</p>
        ) : (
          <ul className="marriage-list">
            {game.expeditionOffers.map((offer) => {
              const disabled = atCapacity || game.resources.gold < offer.cost;
              const reason = atCapacity
                ? "Trop d'expéditions en cours"
                : game.resources.gold < offer.cost
                  ? "Or insuffisant"
                  : "";
              return (
                <li key={offer.id} className="marriage-item">
                  <div className="province-row">
                    <div>
                      <strong>
                        {KIND_ICON[offer.kind]} {offer.title}
                      </strong>{" "}
                      <span className="tag">{KIND_LABEL[offer.kind]}</span>
                      {offer.colonize && <span className="tag ally">Colonisation</span>}
                      <div className="muted">{offer.explorerName}</div>
                      <div className="muted">{offer.description}</div>
                      <div className="muted">
                        {"★".repeat(offer.ambition)}
                        {"☆".repeat(3 - offer.ambition)} · {offer.cost} or ·{" "}
                        {offer.duration} an{offer.duration > 1 ? "s" : ""} ·{" "}
                        {Math.round(offer.successChance * 100)}% de réussite
                      </div>
                    </div>
                    <button
                      className="btn small"
                      disabled={disabled}
                      title={reason}
                      onClick={() => sendExpedition(offer.id)}
                    >
                      Envoyer
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
