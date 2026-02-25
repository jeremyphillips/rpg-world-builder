import type { Condition } from "../conditions/condition.types"
import type { EvaluationContext } from "../conditions/evaluation-context.types"

export function evaluateCondition(
  _condition: Condition,
  _context: EvaluationContext
): boolean {
  return false
}

