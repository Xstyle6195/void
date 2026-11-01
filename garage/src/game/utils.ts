export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function weightedPick<T>(items: readonly T[], weight: (item: T) => number): T {
  const total = items.reduce((s, i) => s + Math.max(0, weight(i)), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= Math.max(0, weight(item));
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

export function round10(v: number): number {
  return Math.round(v / 10) * 10;
}

export function roundTo(v: number, step: number): number {
  return Math.round(v / step) * step;
}

export function formatMoney(v: number): string {
  return `${Math.round(v).toLocaleString("fr-FR")} €`;
}
