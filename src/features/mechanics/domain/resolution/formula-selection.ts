import type { FormulaEffect } from "./formula.engine"

export function selectWinningFormula(
  base: number,
  candidates: number[],
  effects: FormulaEffect[]
): number {
  // default 5e rule: choose highest
  return Math.max(base, ...candidates)
}
