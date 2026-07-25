import { KINGDOM_NAME_ADJ, KINGDOM_NAME_SUFFIX } from "./data";
import type { GameState, LogEntry, LogKind } from "./types";

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function chance(probability: number): boolean {
  return Math.random() < probability;
}

export function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function nextId(state: GameState, prefix: string): string {
  state.nextId += 1;
  return `${prefix}-${state.nextId}`;
}

export function log(state: GameState, kind: LogKind, text: string): void {
  const entry: LogEntry = { year: state.year, kind, text };
  state.log.unshift(entry);
  if (state.log.length > 200) state.log.length = 200;
}

export function randomKingdomName(): string {
  return `${pick(KINGDOM_NAME_ADJ)}${pick(KINGDOM_NAME_SUFFIX)}`;
}
