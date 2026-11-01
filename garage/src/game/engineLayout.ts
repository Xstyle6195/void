import { SWAP_BY_ID } from "./data";
import { computeStats, modelOf } from "./car";
import type { Car } from "./types";

export type EngineKind = "inline" | "v" | "flat" | "electric";

export interface EngineLayout {
  kind: EngineKind;
  cylinders: number;
  /** Angle entre les bancs, en degrés (V et flat). */
  vAngle: number;
  turbos: 0 | 1 | 2;
  carbs: boolean;
  /** Allumeur + fils de bougies plutôt que bobines crayon. */
  classic: boolean;
  label: string;
  power: number;
  swapped: boolean;
}

export interface EngineLook {
  condMoteur: number;
  condTransmission: number;
  condEchappement: number;
  stage: 0 | 1 | 2;
  exhaust: "stock" | "inox" | "titane";
  gearbox: "stock" | "sport" | "seq";
  coverColor: string;
}

export function parseEngineLabel(label: string, classic: boolean): Omit<EngineLayout, "label" | "power" | "swapped"> {
  const l = label.toLowerCase();
  const turbos: 0 | 1 | 2 = l.includes("biturbo") ? 2 : l.includes("turbo") ? 1 : 0;
  const carbs = l.includes("carbu");
  if (l.includes("électrique") || l.includes("electrique")) {
    return { kind: "electric", cylinders: 0, vAngle: 0, turbos: 0, carbs: false, classic: false };
  }
  if (l.includes("v12")) return { kind: "v", cylinders: 12, vAngle: 60, turbos, carbs, classic };
  if (l.includes("v8")) return { kind: "v", cylinders: 8, vAngle: 90, turbos, carbs, classic };
  if (l.includes("v6")) return { kind: "v", cylinders: 6, vAngle: 60, turbos, carbs, classic };
  const m = l.match(/(\d+)\s*cyl/);
  const cylinders = m ? Number(m[1]) : 4;
  if (l.includes("à plat") || l.includes("a plat")) return { kind: "flat", cylinders, vAngle: 180, turbos, carbs, classic };
  return { kind: "inline", cylinders, vAngle: 0, turbos, carbs, classic };
}

export function engineLayoutOf(car: Car): EngineLayout {
  const m = modelOf(car);
  const engine = car.parts.moteur;
  const swap = engine.variantId ? SWAP_BY_ID[engine.variantId] : undefined;
  const label = swap ? swap.label : m.engineLabel;
  // Un moteur swappé est un bloc moderne ; un moteur d'origine ancien garde son allumeur.
  const classic = !swap && m.year < 1990;
  const base = parseEngineLabel(label, classic);
  // Le Stage 2 ajoute un turbo à un moteur atmosphérique thermique.
  let turbos = base.turbos;
  if (engine.variantId === "moteur-s2" && turbos === 0 && base.kind !== "electric") turbos = 1;
  return { ...base, turbos, carbs: base.carbs && engine.variantId !== "moteur-s2", label, power: computeStats(car).power, swapped: !!swap };
}

export function engineLookOf(car: Car): EngineLook {
  const p = car.parts;
  const layout = engineLayoutOf(car);
  const stage: 0 | 1 | 2 = p.moteur.variantId === "moteur-s2" ? 2 : p.moteur.variantId === "moteur-s1" ? 1 : 0;
  const exhaust = p.echappement.variantId === "echap-titane" ? "titane" : p.echappement.variantId === "echap-inox" ? "inox" : "stock";
  const gearbox = p.transmission.variantId === "boite-seq" ? "seq" : p.transmission.variantId === "boite-sport" ? "sport" : "stock";
  let coverColor = "#2a2b2e";
  if (layout.classic || layout.carbs) coverColor = "#8b1e1e";
  if (layout.cylinders === 12) coverColor = "#a3161c";
  if (layout.kind === "flat") coverColor = "#3b3d42";
  if (stage === 2 || layout.swapped) coverColor = "#c4471b";
  return {
    condMoteur: p.moteur.condition,
    condTransmission: p.transmission.condition,
    condEchappement: p.echappement.condition,
    stage,
    exhaust,
    gearbox,
    coverColor,
  };
}
