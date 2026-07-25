import { useMemo } from "react";
import { TRAITS } from "../game/data";
import { buildCoupleGroups, computeGenerations, reignOrder } from "../game/genealogy";
import type { GameState, Person } from "../game/types";

function PersonCard({
  game,
  person,
  byId,
  reigns,
  founderId,
}: {
  game: GameState;
  person: Person;
  byId: Map<string, Person>;
  reigns: Map<string, number>;
  founderId?: string;
}) {
  const isCurrentRuler = person.id === game.ruler.id;
  const reign = reigns.get(person.id);
  const father = person.fatherId ? byId.get(person.fatherId) : undefined;
  const mother = person.motherId ? byId.get(person.motherId) : undefined;
  const spouse = person.spouseId ? byId.get(person.spouseId) : undefined;
  const age = (person.deathYear ?? game.year) - person.birthYear;

  let roleLabel: string;
  if (person.id === founderId) roleLabel = "Fondateur·rice de la dynastie";
  else if (reign !== undefined) {
    roleLabel = isCurrentRuler ? "Souverain(e) régnant(e)" : `${reign}e souverain(e)`;
  } else if (!father && !mother) roleLabel = "Uni(e) par mariage";
  else roleLabel = "Héritier(e)";

  return (
    <div
      className={`person-card${isCurrentRuler ? " current-ruler" : ""}${
        person.deathYear !== null ? " deceased" : ""
      }`}
    >
      <div className="person-name">
        {reign !== undefined && <span title="A régné sur le royaume">👑 </span>}
        {person.name}
      </div>
      <div className="muted">
        {person.deathYear !== null
          ? `${person.birthYear} – ${person.deathYear} (${age} ans)`
          : `${age} ans`}
      </div>
      <div className="person-role">{roleLabel}</div>
      {(father || mother) && (
        <div className="muted person-parents">
          Enfant de {father?.name ?? "?"}
          {mother ? ` et ${mother.name}` : ""}
        </div>
      )}
      {spouse && <div className="muted person-spouse">⚭ {spouse.name}</div>}
      {person.traits.length > 0 && (
        <div className="traits">
          {person.traits.map((t) => (
            <span key={t} className="trait-chip" title={TRAITS[t].description}>
              {TRAITS[t].name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function FamilyTree({ game }: { game: GameState }) {
  const byId = useMemo(
    () => new Map(game.familyMembers.map((p) => [p.id, p])),
    [game.familyMembers],
  );
  const generations = useMemo(
    () => computeGenerations(game.familyMembers),
    [game.familyMembers],
  );
  const reigns = useMemo(() => reignOrder(game), [game]);
  const founderId = game.familyMembers[0]?.id;

  const byGeneration = useMemo(() => {
    const map = new Map<number, Person[]>();
    for (const p of game.familyMembers) {
      const g = generations.get(p.id) ?? 0;
      if (!map.has(g)) map.set(g, []);
      map.get(g)?.push(p);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.birthYear - b.birthYear);
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [game.familyMembers, generations]);

  return (
    <section className="panel">
      <h2>Arbre généalogique de la dynastie des {game.dynastyName}</h2>
      {byGeneration.map(([gen, members]) => (
        <div className="generation-row" key={gen}>
          <div className="generation-label">Génération {gen + 1}</div>
          <div className="generation-members">
            {buildCoupleGroups(members, byId).map((group) => (
              <div className="couple-group" key={group[0].id}>
                {group.map((p) => (
                  <PersonCard
                    key={p.id}
                    game={game}
                    person={p}
                    byId={byId}
                    reigns={reigns}
                    founderId={founderId}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
