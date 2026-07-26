import { totalArmyUnits } from "./army";
import type { EventChoice, EventContext, GameEvent, GameState } from "./types";
import { chance, clamp, log, pick, randInt } from "./utils";

// ---- Objectifs du peuple ----

export interface GoalDef {
  id: string;
  title: string;
  description: string;
  check: (state: GameState) => boolean;
  rewardGold: number;
  rewardPrestige: number;
  rewardStability: number;
}

export const MAX_ACTIVE_GOALS = 3;

export const GOALS: GoalDef[] = [
  {
    id: "trade_route",
    title: "Établir une route commerciale",
    description: "Le peuple souhaite voir s'ouvrir une route commerciale avec un royaume voisin.",
    check: (s) => s.neighbors.some((n) => n.tradeRouteLevel > 0),
    rewardGold: 60,
    rewardPrestige: 5,
    rewardStability: 6,
  },
  {
    id: "stockpile_food",
    title: "Constituer des réserves de vivres",
    description: "Importer et stocker suffisamment de vivres pour rassurer la population (200 vivres).",
    check: (s) => s.resources.food >= 200,
    rewardGold: 40,
    rewardPrestige: 2,
    rewardStability: 6,
  },
  {
    id: "seal_alliance",
    title: "Sceller une alliance",
    description: "Nouer une alliance officielle avec un royaume voisin.",
    check: (s) => s.neighbors.some((n) => n.allied),
    rewardGold: 30,
    rewardPrestige: 8,
    rewardStability: 6,
  },
  {
    id: "found_school",
    title: "Ouvrir une école",
    description: "Construire une école quelque part dans le royaume.",
    check: (s) => s.provinces.some((p) => p.buildings.includes("school")),
    rewardGold: 40,
    rewardPrestige: 3,
    rewardStability: 6,
  },
  {
    id: "build_defense",
    title: "Renforcer les défenses",
    description: "Ériger des murailles ou une garnison pour protéger le royaume.",
    check: (s) =>
      s.provinces.some((p) => p.buildings.includes("walls") || p.buildings.includes("garrison")),
    rewardGold: 40,
    rewardPrestige: 3,
    rewardStability: 6,
  },
  {
    id: "treasury",
    title: "Remplir le trésor royal",
    description: "Accumuler suffisamment d'or pour rassurer sur la solidité du royaume (300 or).",
    check: (s) => s.resources.gold >= 300,
    rewardGold: 0,
    rewardPrestige: 6,
    rewardStability: 6,
  },
  {
    id: "expand_realm",
    title: "Étendre le royaume",
    description: "Faire grandir le royaume jusqu'à trois provinces.",
    check: (s) => s.provinces.length >= 3,
    rewardGold: 50,
    rewardPrestige: 8,
    rewardStability: 6,
  },
  {
    id: "raise_army",
    title: "Lever une armée",
    description: "Équiper au moins 25 soldats ou marins pour la défense du royaume.",
    check: (s) => totalArmyUnits(s) >= 25,
    rewardGold: 40,
    rewardPrestige: 4,
    rewardStability: 6,
  },
];

export function topUpGoals(state: GameState): void {
  const activeIds = new Set(state.goals.map((g) => g.defId));
  const candidates = GOALS.filter((g) => !activeIds.has(g.id));
  while (state.goals.length < MAX_ACTIVE_GOALS && candidates.length > 0) {
    const idx = randInt(0, candidates.length - 1);
    const def = candidates.splice(idx, 1)[0];
    state.goals.push({ defId: def.id, assignedYear: state.year });
  }
}

export function checkGoals(state: GameState): void {
  const stillActive = [];
  for (const goal of state.goals) {
    const def = GOALS.find((g) => g.id === goal.defId);
    if (!def || !def.check(state)) {
      stillActive.push(goal);
      continue;
    }
    state.resources.gold += def.rewardGold;
    state.resources.prestige += def.rewardPrestige;
    state.resources.stability = clamp(state.resources.stability + def.rewardStability, 0, 100);
    log(
      state,
      "goal",
      `Le peuple se réjouit : "${def.title}" est accompli ! (+${def.rewardGold} or, +${def.rewardPrestige} prestige)`,
    );
  }
  state.goals = stillActive;
  topUpGoals(state);
}

// ---- Requêtes politiques ----

export const MAX_ACTIVE_REQUESTS = 2;
const REQUEST_LIFESPAN = 6;

function res(ctx: EventContext) {
  return ctx.state.resources;
}

function spend(ctx: EventContext, amount: number): void {
  ctx.state.resources.gold = Math.max(0, ctx.state.resources.gold - amount);
}

export const POLITICAL_REQUESTS: GameEvent[] = [
  {
    id: "justice_inheritance",
    title: "Un différend judiciaire",
    body: "Deux familles nobles se disputent un héritage et réclament votre jugement.",
    choices: [
      {
        id: "favor_strong",
        label: "Trancher en faveur de la famille la plus influente",
        apply: (ctx) => {
          res(ctx).prestige += 3;
          res(ctx).stability = clamp(res(ctx).stability - 4, 0, 100);
          return "Le jugement renforce vos appuis, mais le peuple murmure à l'injustice.";
        },
      },
      {
        id: "fair",
        label: "Trancher équitablement, quitte à indemniser",
        apply: (ctx) => {
          spend(ctx, 15);
          res(ctx).stability = clamp(res(ctx).stability + 5, 0, 100);
          return "Votre équité est saluée par tous.";
        },
      },
      {
        id: "defer",
        label: "Renvoyer l'affaire aux tribunaux locaux",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability + 1, 0, 100);
          return "L'affaire suit son cours, sans faire de vagues.";
        },
      },
    ],
  },
  {
    id: "education_program",
    title: "Un programme d'éducation pour tous",
    body: "Des érudits proposent de financer l'instruction des enfants du royaume.",
    choices: [
      {
        id: "fund_generous",
        label: "Financer largement (60 or)",
        apply: (ctx) => {
          spend(ctx, 60);
          res(ctx).stability = clamp(res(ctx).stability + 8, 0, 100);
          return "Des écoles ouvrent leurs portes, au grand bonheur des familles.";
        },
      },
      {
        id: "fund_modest",
        label: "Financer modestement (25 or)",
        apply: (ctx) => {
          spend(ctx, 25);
          res(ctx).stability = clamp(res(ctx).stability + 3, 0, 100);
          return "Un effort limité, mais apprécié.";
        },
      },
      {
        id: "refuse",
        label: "Refuser, les caisses sont vides",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability - 5, 0, 100);
          return "Les érudits repartent déçus.";
        },
      },
    ],
  },
  {
    id: "call_to_defense",
    title: "Le peuple réclame des défenses",
    body: "Après des rumeurs d'invasion, les villages demandent des fortifications.",
    choices: [
      {
        id: "fund_defense",
        label: "Lever des fonds pour les défenses (50 or)",
        apply: (ctx) => {
          spend(ctx, 50);
          res(ctx).stability = clamp(res(ctx).stability + 6, 0, 100);
          return "Les villages se sentent enfin protégés.";
        },
      },
      {
        id: "reassure",
        label: "Rassurer sans dépenser",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability + 1, 0, 100);
          return "Vos paroles calment temporairement les esprits.";
        },
      },
      {
        id: "ignore",
        label: "Ignorer les rumeurs",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability - 6, 0, 100);
          return "L'inquiétude grandit dans les villages.";
        },
      },
    ],
  },
  {
    id: "tax_burden",
    title: "Le fardeau des impôts",
    body: "Les marchands se plaignent du poids des taxes sur le commerce.",
    choices: [
      {
        id: "lower_taxes",
        label: "Alléger les impôts",
        apply: (ctx) => {
          spend(ctx, 30);
          res(ctx).stability = clamp(res(ctx).stability + 6, 0, 100);
          return "Les marchands respirent et vantent votre sagesse.";
        },
      },
      {
        id: "keep_taxes",
        label: "Maintenir les impôts",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability - 2, 0, 100);
          return "Les marchands grognent, mais s'y résignent.";
        },
      },
      {
        id: "raise_taxes",
        label: "Augmenter les impôts",
        apply: (ctx) => {
          res(ctx).gold += 40;
          res(ctx).stability = clamp(res(ctx).stability - 8, 0, 100);
          return "Les coffres se remplissent, la colère aussi.";
        },
      },
    ],
  },
  {
    id: "public_festival",
    title: "Une fête pour le peuple",
    body: "Vos conseillers suggèrent d'organiser une grande fête pour célébrer votre règne.",
    choices: [
      {
        id: "grand_festival",
        label: "Organiser une fête somptueuse (40 or)",
        apply: (ctx) => {
          spend(ctx, 40);
          res(ctx).stability = clamp(res(ctx).stability + 7, 0, 100);
          res(ctx).prestige += 3;
          return "La fête restera dans les mémoires.";
        },
      },
      {
        id: "modest_festival",
        label: "Une fête modeste (15 or)",
        apply: (ctx) => {
          spend(ctx, 15);
          res(ctx).stability = clamp(res(ctx).stability + 3, 0, 100);
          return "Une agréable journée pour tous.";
        },
      },
      {
        id: "no_festival",
        label: "Pas de fête, les temps sont durs",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability - 2, 0, 100);
          return "Le peuple comprend, sans grand enthousiasme.";
        },
      },
    ],
  },
  {
    id: "merchant_guild",
    title: "Les marchands s'organisent",
    body: "Une guilde marchande demande des privilèges commerciaux exclusifs.",
    choices: [
      {
        id: "grant_privileges",
        label: "Accorder les privilèges",
        apply: (ctx) => {
          res(ctx).gold += 30;
          res(ctx).stability = clamp(res(ctx).stability - 3, 0, 100);
          return "La guilde récompense votre générosité, mais fait des jaloux.";
        },
      },
      {
        id: "refuse_privileges",
        label: "Refuser, le commerce doit rester libre",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability + 4, 0, 100);
          return "Les petits marchands vous en sont reconnaissants.";
        },
      },
      {
        id: "tax_guild",
        label: "Taxer la guilde en échange de son autorisation",
        apply: (ctx) => {
          res(ctx).gold += 50;
          res(ctx).stability = clamp(res(ctx).stability - 1, 0, 100);
          return "Un compromis profitable au trésor.";
        },
      },
    ],
  },
  {
    id: "land_dispute",
    title: "Un litige de bornage",
    body: "Deux villages se disputent des terres agricoles fertiles.",
    choices: [
      {
        id: "favor_populous",
        label: "Trancher en faveur du village le plus peuplé",
        apply: (ctx) => {
          res(ctx).prestige += 1;
          res(ctx).stability = clamp(res(ctx).stability + 2, 0, 100);
          return "Une décision pragmatique, globalement bien accueillie.";
        },
      },
      {
        id: "share_land",
        label: "Partager équitablement les terres",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability + 5, 0, 100);
          return "La sagesse de Salomon vous est associée.";
        },
      },
      {
        id: "let_settle",
        label: "Laisser les villages régler l'affaire eux-mêmes",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability - 3, 0, 100);
          return "La querelle s'envenime sans arbitrage.";
        },
      },
    ],
  },
  {
    id: "public_works",
    title: "Des routes en mauvais état",
    body: "Les habitants réclament la réfection des routes et des ponts.",
    choices: [
      {
        id: "major_works",
        label: "Financer de grands travaux (45 or)",
        apply: (ctx) => {
          spend(ctx, 45);
          res(ctx).stability = clamp(res(ctx).stability + 6, 0, 100);
          return "Les routes retrouvent tout leur éclat.";
        },
      },
      {
        id: "minor_works",
        label: "Réparations minimales (15 or)",
        apply: (ctx) => {
          spend(ctx, 15);
          res(ctx).stability = clamp(res(ctx).stability + 2, 0, 100);
          return "Un rafistolage qui fait l'affaire, pour l'instant.";
        },
      },
      {
        id: "postpone_works",
        label: "Reporter les travaux",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability - 4, 0, 100);
          return "Les nids-de-poule irritent les voyageurs.";
        },
      },
    ],
  },
  {
    id: "religious_tolerance",
    title: "Une question de foi",
    body: "Des voyageurs d'une autre croyance souhaitent s'installer et pratiquer librement leur culte.",
    choices: [
      {
        id: "welcome",
        label: "Les accueillir avec tolérance",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability + 4, 0, 100);
          res(ctx).prestige += 2;
          return "Le royaume gagne en réputation d'ouverture.";
        },
      },
      {
        id: "conditional",
        label: "Les tolérer sous conditions",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability + 1, 0, 100);
          return "Un compromis prudent.";
        },
      },
      {
        id: "refuse_settlement",
        label: "Leur refuser l'installation",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability - 5, 0, 100);
          return "Les voyageurs repartent, déçus par cet accueil.";
        },
      },
    ],
  },
  {
    id: "royal_pardon",
    title: "Une pétition de grâce",
    body: "Le peuple demande la grâce d'un prisonnier connu pour un délit mineur.",
    choices: [
      {
        id: "grant_pardon",
        label: "Accorder la grâce",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability + 5, 0, 100);
          res(ctx).prestige += 1;
          return "Votre clémence est saluée.";
        },
      },
      {
        id: "refuse_pardon",
        label: "Refuser, la loi est la loi",
        apply: (ctx) => {
          res(ctx).stability = clamp(res(ctx).stability - 3, 0, 100);
          res(ctx).prestige += 1;
          return "Votre fermeté impressionne autant qu'elle déçoit.";
        },
      },
      {
        id: "fine_pardon",
        label: "Gracier contre une amende",
        apply: (ctx) => {
          res(ctx).gold += 20;
          res(ctx).stability = clamp(res(ctx).stability + 2, 0, 100);
          return "Justice et trésor y trouvent leur compte.";
        },
      },
    ],
  },
];

const NEW_REQUEST_CHANCE = 0.3;

export function topUpPoliticalRequests(state: GameState): void {
  if (state.politicalRequests.length >= MAX_ACTIVE_REQUESTS) return;
  if (!chance(NEW_REQUEST_CHANCE)) return;
  const activeIds = new Set(state.politicalRequests.map((r) => r.requestId));
  const candidates = POLITICAL_REQUESTS.filter(
    (r) => !activeIds.has(r.id) && (!r.condition || r.condition(state)),
  );
  if (candidates.length === 0) return;
  const def = pick(candidates);
  state.politicalRequests.push({
    requestId: def.id,
    assignedYear: state.year,
    expiresYear: state.year + REQUEST_LIFESPAN,
  });
}

export function expireStaleRequests(state: GameState): void {
  const expired = state.politicalRequests.filter((r) => r.expiresYear <= state.year);
  if (expired.length === 0) return;
  state.politicalRequests = state.politicalRequests.filter((r) => r.expiresYear > state.year);
  for (const r of expired) {
    const def = POLITICAL_REQUESTS.find((d) => d.id === r.requestId);
    state.resources.stability = clamp(state.resources.stability - 3, 0, 100);
    log(
      state,
      "politics",
      `Le peuple s'impatiente : "${def?.title ?? "une requête"}" reste sans réponse.`,
    );
  }
}

export function resolvePoliticalRequest(
  state: GameState,
  requestId: string,
  choiceId: string,
): GameState {
  const s = structuredClone(state);
  const active = s.politicalRequests.find((r) => r.requestId === requestId);
  const def = POLITICAL_REQUESTS.find((d) => d.id === requestId);
  if (!active || !def) return s;
  const choice = def.choices.find((c: EventChoice) => c.id === choiceId);
  if (!choice) return s;
  const resultText = choice.apply({ state: s });
  log(s, "politics", `${def.title} — ${resultText}`);
  s.politicalRequests = s.politicalRequests.filter((r) => r.requestId !== requestId);
  return s;
}
