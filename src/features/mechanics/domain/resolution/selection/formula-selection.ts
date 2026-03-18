import type { FormulaEffect } from '../engines/formula.engine'

export function selectWinningFormula(
  base: number,
  candidates: number[],
  _effects: FormulaEffect[]
): number {
  // default 5e rule: choose highest
  return Math.max(base, ...candidates)
}
