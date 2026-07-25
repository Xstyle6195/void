import type { EventContext, GameEvent } from "./types";
import { clamp, log, randInt } from "./utils";

function res(ctx: EventContext) {
  return ctx.state.resources;
}

export const EVENTS: GameEvent[] = [
  {
    id: "good_harvest",
    title: "Une récolte abondante",
    body: "Les greniers débordent cette année. Vos intendants vous demandent quoi en faire.",
    weight: 3,
    choices: [
      {
        id: "store",
        label: "Stocker le surplus pour l'hiver",
        apply: (ctx) => {
          res(ctx).food += 30;
          return "Le surplus est mis en réserve. Le peuple dormira tranquille cet hiver.";
        },
      },
      {
        id: "feast",
        label: "Organiser un grand festin",
        apply: (ctx) => {
          res(ctx).food -= 10;
          res(ctx).stability = clamp(res(ctx).stability + 8, 0, 100);
          return "Le festin renforce la loyauté du peuple envers votre lignée.";
        },
      },
    ],
  },
  {
    id: "famine",
    title: "Disette",
    body: "Une mauvaise saison menace d'affamer vos terres.",
    weight: 2,
    condition: (state) => state.resources.food < 40,
    choices: [
      {
        id: "buy",
        label: "Acheter du grain à prix d'or",
        apply: (ctx) => {
          const cost = Math.min(res(ctx).gold, 40);
          res(ctx).gold -= cost;
          res(ctx).food += cost;
          return "Vos coffres s'allègent, mais le peuple mange à sa faim.";
        },
      },
      {
        id: "ration",
        label: "Rationner les vivres",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability - 10, 0, 100);
          return "Le rationnement évite le pire, mais le mécontentement gronde.";
        },
      },
    ],
  },
  {
    id: "plague",
    title: "Épidémie",
    body: "Une maladie se répand dans vos provinces.",
    weight: 1,
    choices: [
      {
        id: "quarantine",
        label: "Imposer une quarantaine",
        apply: (ctx) => {
          res(ctx).gold -= 20;
          res(ctx).stability = clamp(res(ctx).stability - 5, 0, 100);
          return "La quarantaine limite les pertes, au prix du commerce.";
        },
      },
      {
        id: "ignore",
        label: "Laisser faire la nature",
        apply: (ctx) => {
          ctx.state.provinces.forEach((p) => {
            p.population = Math.max(10, p.population - randInt(5, 20));
          });
          return "La maladie fait des ravages parmi votre peuple.";
        },
      },
    ],
  },
  {
    id: "bandits",
    title: "Bandits sur les routes",
    body: "Des brigands pillent les marchands aux abords de vos terres.",
    weight: 2,
    choices: [
      {
        id: "hunt",
        label: "Envoyer une troupe les chasser",
        apply: (ctx) => {
          res(ctx).gold -= 15;
          res(ctx).stability = clamp(res(ctx).stability + 5, 0, 100);
          return "Les bandits sont dispersés. La route est de nouveau sûre.";
        },
      },
      {
        id: "ignore_bandits",
        label: "Ignorer, ce ne sont que des routes secondaires",
        apply: (ctx) => {
          res(ctx).gold = Math.max(0, res(ctx).gold - 25);
          return "Le commerce en pâtit et vos coffres s'amenuisent.";
        },
      },
    ],
  },
  {
    id: "envoy_gift",
    title: "Un envoyé étranger",
    body: "Un émissaire d'un royaume voisin propose des cadeaux en échange de faveurs.",
    weight: 2,
    condition: (state) => state.neighbors.length > 0,
    choices: [
      {
        id: "accept",
        label: "Accepter les présents",
        apply: (ctx) => {
          res(ctx).gold += 25;
          const neighbor = ctx.state.neighbors[randInt(0, ctx.state.neighbors.length - 1)];
          neighbor.relation = clamp(neighbor.relation + 10, -100, 100);
          return `Vous acceptez les présents. Les relations avec ${neighbor.name} s'améliorent.`;
        },
      },
      {
        id: "refuse",
        label: "Refuser, méfiant de leurs intentions",
        apply: () => "Vous refusez poliment. L'émissaire repart, déçu.",
      },
    ],
  },
  {
    id: "noble_intrigue",
    title: "Intrigue de cour",
    body: "Un noble complote pour accroître son influence à vos dépens.",
    weight: 2,
    choices: [
      {
        id: "confront",
        label: "Le confronter publiquement",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability + 3, 0, 100);
          ctx.state.ruler.health = clamp(ctx.state.ruler.health - 5, 0, 100);
          return "Le complot est déjoué, mais l'affaire vous a coûté des nuits blanches.";
        },
      },
      {
        id: "bribe",
        label: "L'acheter avec de l'or",
        apply: (ctx) => {
          res(ctx).gold = Math.max(0, res(ctx).gold - 30);
          return "Le noble se tait, satisfait de sa nouvelle fortune.";
        },
      },
    ],
  },
  {
    id: "ruler_illness",
    title: "Le souverain tombe malade",
    body: "Une fièvre frappe votre souverain.",
    weight: 2,
    condition: (state) => state.year - state.ruler.birthYear > 30,
    choices: [
      {
        id: "healer",
        label: "Faire venir le meilleur guérisseur",
        apply: (ctx) => {
          res(ctx).gold = Math.max(0, res(ctx).gold - 20);
          ctx.state.ruler.health = clamp(ctx.state.ruler.health + 10, 0, 100);
          return "Le guérisseur soigne le souverain, qui reprend des forces.";
        },
      },
      {
        id: "rest",
        label: "Le laisser se reposer",
        apply: (ctx) => {
          ctx.state.ruler.health = clamp(ctx.state.ruler.health - 5, 0, 100);
          return "Le repos ne suffit pas tout à fait à le remettre sur pied.";
        },
      },
    ],
  },
  {
    id: "tournament",
    title: "Tournoi de la cour",
    body: "Vos chevaliers proposent d'organiser un tournoi pour célébrer votre règne.",
    weight: 2,
    choices: [
      {
        id: "hold",
        label: "Organiser le tournoi",
        apply: (ctx) => {
          res(ctx).gold = Math.max(0, res(ctx).gold - 15);
          res(ctx).prestige += 5;
          return "Le tournoi impressionne vos vassaux et accroît votre prestige.";
        },
      },
      {
        id: "skip",
        label: "Économiser plutôt",
        apply: (ctx) => {
          res(ctx).gold += 10;
          return "Vous préférez remplir les coffres plutôt que le spectacle.";
        },
      },
    ],
  },
  {
    id: "wandering_sage",
    title: "Un sage de passage",
    body: "Un érudit itinérant offre ses conseils à votre cour.",
    weight: 1,
    choices: [
      {
        id: "listen",
        label: "Écouter ses enseignements",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability + 4, 0, 100);
          return "Ses paroles éclairent votre cour et apaisent les esprits.";
        },
      },
      {
        id: "dismiss",
        label: "Le renvoyer, occupé par les affaires du royaume",
        apply: () => "Le sage repart sur les routes, sans que rien ne change.",
      },
    ],
  },
  {
    id: "fire",
    title: "Incendie",
    body: "Un feu ravage une partie d'une de vos provinces.",
    weight: 1,
    condition: (state) => state.provinces.length > 0,
    choices: [
      {
        id: "rebuild",
        label: "Financer la reconstruction",
        apply: (ctx) => {
          res(ctx).gold = Math.max(0, res(ctx).gold - 25);
          res(ctx).stability = clamp(res(ctx).stability + 3, 0, 100);
          return "La reconstruction rassure les habitants.";
        },
      },
      {
        id: "leave",
        label: "Laisser les habitants se débrouiller",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability - 8, 0, 100);
          return "Les habitants se sentent abandonnés par leur souverain.";
        },
      },
    ],
  },
  {
    id: "trade_caravan",
    title: "Caravane marchande",
    body: "Une riche caravane demande à traverser vos terres.",
    weight: 2,
    choices: [
      {
        id: "tax",
        label: "Taxer son passage",
        apply: (ctx) => {
          res(ctx).gold += 20;
          return "Les taxes remplissent un peu plus vos coffres.";
        },
      },
      {
        id: "free_passage",
        label: "Laisser passer librement",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability + 2, 0, 100);
          return "Les marchands répandent votre réputation de souverain juste.";
        },
      },
    ],
  },
  {
    id: "omens",
    title: "Présages",
    body: "Les prêtres rapportent des présages inquiétants dans le ciel.",
    weight: 1,
    choices: [
      {
        id: "ceremony",
        label: "Organiser une cérémonie d'apaisement",
        apply: (ctx) => {
          res(ctx).gold = Math.max(0, res(ctx).gold - 15);
          res(ctx).prestige += 2;
          return "La cérémonie rassure le peuple superstitieux.";
        },
      },
      {
        id: "dismiss_omens",
        label: "Ignorer ces superstitions",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability - 3, 0, 100);
          return "Certains murmurent que le souverain défie les dieux.";
        },
      },
    ],
  },
  {
    id: "assassination_attempt",
    title: "Tentative d'assassinat",
    body: "Un inconnu s'en est pris à votre souverain avant d'être maîtrisé.",
    weight: 1,
    condition: (state) => state.resources.stability < 40,
    choices: [
      {
        id: "investigate",
        label: "Ouvrir une enquête",
        apply: (ctx) => {
          res(ctx).gold = Math.max(0, res(ctx).gold - 20);
          res(ctx).stability = clamp(res(ctx).stability + 5, 0, 100);
          return "L'enquête identifie des conspirateurs, qui sont arrêtés.";
        },
      },
      {
        id: "execute",
        label: "Exécuter le coupable sur-le-champ",
        apply: (ctx) => {
          if (!ctx.state.ruler.traits.includes("cruel")) {
            ctx.state.ruler.traits.push("cruel");
          }
          res(ctx).stability = clamp(res(ctx).stability - 5, 0, 100);
          return "Le coupable est exécuté sans procès. La cour murmure sur la cruauté du souverain.";
        },
      },
    ],
  },
];

export function pickEvent(ctx: EventContext): GameEvent | null {
  const eligible = EVENTS.filter((e) => !e.condition || e.condition(ctx.state));
  if (eligible.length === 0) return null;
  const totalWeight = eligible.reduce((sum, e) => sum + (e.weight ?? 1), 0);
  let roll = Math.random() * totalWeight;
  for (const e of eligible) {
    roll -= e.weight ?? 1;
    if (roll <= 0) return e;
  }
  return eligible[eligible.length - 1];
}

export function resolveChoice(
  ctx: EventContext,
  event: GameEvent,
  choiceId: string,
): string {
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) return "";
  const resultText = choice.apply(ctx);
  log(ctx.state, "event", `${event.title} — ${resultText}`);
  return resultText;
}
