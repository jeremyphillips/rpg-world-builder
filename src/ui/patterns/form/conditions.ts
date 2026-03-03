/**
 * Condition DSL for conditional field visibility.
 * Evaluated against form/patch values via getValue(path).
 */

export type Condition =
  | { op: 'eq'; path: string; value: unknown }
  | { op: 'neq'; path: string; value: unknown }
  | { op: 'in'; path: string; values: unknown[] }
  | { op: 'contains'; path: string; value: unknown }
  | { op: 'and'; conditions: Condition[] }
  | { op: 'or'; conditions: Condition[] }
  | { op: 'not'; condition: Condition };

export const when = {
  eq: (path: string, value: unknown): Condition => ({ op: 'eq', path, value }),
  neq: (path: string, value: unknown): Condition => ({ op: 'neq', path, value }),
  in: (path: string, values: unknown[]): Condition => ({ op: 'in', path, values }),
  contains: (path: string, value: unknown): Condition => ({ op: 'contains', path, value }),
  and: (...conditions: Condition[]): Condition => ({ op: 'and', conditions }),
  or: (...conditions: Condition[]): Condition => ({ op: 'or', conditions }),
  not: (condition: Condition): Condition => ({ op: 'not', condition }),
};

export function evaluateCondition(
  condition: Condition,
  getValue: (path: string) => unknown,
): boolean {
  switch (condition.op) {
    case 'eq': {
      const v = getValue(condition.path);
      return v === condition.value;
    }
    case 'neq': {
      const v = getValue(condition.path);
      return v !== condition.value;
    }
    case 'in': {
      const v = getValue(condition.path);
      return condition.values.includes(v);
    }
    case 'contains': {
      const v = getValue(condition.path);
      return Array.isArray(v) && v.includes(condition.value);
    }
    case 'and':
      return condition.conditions.every((c) => evaluateCondition(c, getValue));
    case 'or':
      return condition.conditions.some((c) => evaluateCondition(c, getValue));
    case 'not':
      return !evaluateCondition(condition.condition, getValue);
    default:
      return false;
  }
}
