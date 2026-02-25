import type { Condition } from "../conditions/condition.types"
import type { EvaluationContext } from "../conditions/evaluation-context.types"

function getSnapshotForTarget(
  target: 'self' | 'target' | 'ally',
  context: EvaluationContext,
): Record<string, unknown> | undefined {
  if (target === 'self') return context.self as unknown as Record<string, unknown>
  if (target === 'target') return context.target as unknown as Record<string, unknown>
  return undefined
}

function readProperty(obj: Record<string, unknown>, path: string): unknown {
  let current: unknown = obj
  for (const key of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

export function evaluateCondition(
  condition: Condition,
  context: EvaluationContext,
): boolean {
  switch (condition.kind) {
    case 'and':
      return condition.conditions.every(c => evaluateCondition(c, context))

    case 'or':
      return condition.conditions.some(c => evaluateCondition(c, context))

    case 'not':
      return !evaluateCondition(condition.condition, context)

    case 'state': {
      const snapshot = getSnapshotForTarget(condition.target, context)
      if (!snapshot) return false
      const value = readProperty(snapshot, condition.property)
      if (condition.equals !== undefined) return value === condition.equals || (condition.equals === null && value == null)
      if (condition.notEquals !== undefined) return value !== condition.notEquals && !(condition.notEquals === null && value == null)
      return value != null
    }

    case 'compare': {
      const snapshot = getSnapshotForTarget(condition.target, context)
      if (!snapshot) return false
      const value = readProperty(snapshot, condition.property)
      if (typeof value !== 'number') return false
      switch (condition.operator) {
        case '>': return value > condition.value
        case '>=': return value >= condition.value
        case '<': return value < condition.value
        case '<=': return value <= condition.value
        case '==': return value === condition.value
        case '!=': return value !== condition.value
      }
      return false
    }

    case 'event':
      return context.event?.type === condition.event.replace(/^on_/, '')

    default:
      return false
  }
}
