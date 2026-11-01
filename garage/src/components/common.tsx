import type { ReactNode } from "react";
import { carLabels, computeStats, marketValue, type CarLabel } from "../game/car";
import type { Car } from "../game/types";
import { formatMoney } from "../game/utils";

export function Bar({ value, max = 100, tone }: { value: number; max?: number; tone?: "good" | "warn" | "bad" | "accent" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const auto = pct >= 75 ? "good" : pct >= 45 ? "warn" : "bad";
  return (
    <div className="bar">
      <div className={`bar-fill ${tone ?? auto}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function LabelBadges({ labels }: { labels: (CarLabel | string)[] }) {
  if (!labels.length) return null;
  return (
    <div className="badges">
      {labels.map((l) => (
        <span key={l} className={`badge badge-${slug(l)}`}>
          {l === "Pièce de collection" ? "🏆 " : l === "Restomod" ? "⚡ " : l === "Préparation d'exception" ? "💎 " : l === "Épave" ? "🪦 " : ""}
          {l}
        </span>
      ))}
    </div>
  );
}

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "-");
}

export function StatGrid({ car, compact }: { car: Car; compact?: boolean }) {
  const s = computeStats(car);
  const rows: { label: string; value: number; base: number; suffix?: string; max?: number }[] = [
    { label: "Puissance", value: s.power, base: s.base.power, suffix: " ch", max: 900 },
    { label: "Performance", value: s.perf, base: s.base.perf },
    { label: "Tenue de route", value: s.handling, base: s.base.handling },
    { label: "Luxe", value: s.luxe, base: s.base.luxe },
    { label: "Style", value: s.style, base: s.base.style },
    { label: "État général", value: s.condition, base: 100, suffix: " %" },
    { label: "Originalité", value: s.originality, base: 100, suffix: " %" },
  ];
  return (
    <div className={`stat-grid ${compact ? "compact" : ""}`}>
      {rows.map((r) => {
        const diff = r.label === "État général" || r.label === "Originalité" ? 0 : r.value - r.base;
        return (
          <div key={r.label} className="stat-row">
            <span className="stat-label">{r.label}</span>
            <Bar value={r.value} max={r.max ?? 100} tone={r.label === "Puissance" || r.label === "Performance" ? "accent" : undefined} />
            <span className="stat-value">
              {r.value}
              {r.suffix ?? ""}
              {diff !== 0 && <em className={diff > 0 ? "up" : "down"}> {diff > 0 ? `+${diff}` : diff}</em>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ValueLine({ car }: { car: Car }) {
  const stats = computeStats(car);
  const value = marketValue(car, stats);
  const cost = car.purchasePrice + car.invested;
  const margin = value - cost;
  return (
    <div className="value-line">
      <div>
        <small>Cote estimée</small>
        <strong>{formatMoney(value)}</strong>
      </div>
      <div>
        <small>Coût de revient</small>
        <strong>{formatMoney(cost)}</strong>
      </div>
      <div>
        <small>Marge potentielle</small>
        <strong className={margin >= 0 ? "up" : "down"}>{formatMoney(margin)}</strong>
      </div>
    </div>
  );
}

export function CarLabelsFor({ car }: { car: Car }) {
  return <LabelBadges labels={carLabels(car)} />;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
