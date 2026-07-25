import { EVENTS } from "../game/events";
import type { GameState } from "../game/types";
import { useGameStore } from "../state/store";

export function EventModal({ game }: { game: GameState }) {
  const answerCurrentEvent = useGameStore((s) => s.answerCurrentEvent);
  if (!game.pendingEvent) return null;
  const event = EVENTS.find((e) => e.id === game.pendingEvent!.eventId);
  if (!event) return null;

  return (
    <div className="overlay">
      <div className="modal">
        <h2>{event.title}</h2>
        <p>{event.body}</p>
        <div className="modal-choices">
          {event.choices.map((c) => (
            <button
              key={c.id}
              className="btn"
              onClick={() => answerCurrentEvent(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
