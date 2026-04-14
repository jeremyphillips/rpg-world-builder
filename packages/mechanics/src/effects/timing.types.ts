import { TIME_UNIT_DEFINITIONS, type TimeUnit as CalendarTimeUnit } from '@/shared/domain/time';

/** Combat-scale units not modeled in {@link TIME_UNIT_DEFINITIONS} (calendar / wall-time ids live in shared time). */
export type CombatRoundTimeUnit = 'turn' | 'round';

/** Effect timing: combat round units plus shared calendar time units. */
export type TimeUnit = CombatRoundTimeUnit | CalendarTimeUnit;

/** Turn boundary for duration tick and hook trigger timing. */
export type TurnBoundary = 'start' | 'end'

export type EffectDuration =
  | { kind: 'instant' }
  | {
      kind: 'fixed'
      value: number
      unit: TimeUnit
    }
  | {
      kind: 'until-turn-boundary'
      subject: 'self' | 'source' | 'target'
      turn: 'current' | 'next'
      boundary: TurnBoundary
    }

export type EffectDurationInput =
  | EffectDuration
  | 'instant'
  | 'next-turn'
  | `${number} ${TimeUnit}`
  | `${number} ${TimeUnit}s`

export type EffectInterval = {
  value: number
  unit: Extract<TimeUnit, 'turn' | 'round' | 'minute' | 'hour' | 'day'>
}

export type EffectUses = {
  count: number
  period: Extract<TimeUnit, 'day'>
}

export type RechargeSpec = {
  min: number
  max: number
}

const FIXED_DURATION_UNIT_ALTERNATION = [
  ...(['turn', 'round'] as const satisfies readonly CombatRoundTimeUnit[]),
  ...TIME_UNIT_DEFINITIONS.map((r) => r.id),
].join('|');

const FIXED_DURATION_PATTERN = new RegExp(
  `^(?<value>\\d+)\\s+(?<unit>${FIXED_DURATION_UNIT_ALTERNATION})s?$`,
);

export function normalizeDuration(
  duration?: EffectDurationInput | null,
): EffectDuration | undefined {
  if (duration == null) return undefined
  if (typeof duration !== 'string') return duration
  if (duration === 'instant') return { kind: 'instant' }
  if (duration === 'next-turn') {
    return {
      kind: 'until-turn-boundary',
      subject: 'self',
      turn: 'next',
      boundary: 'end',
    }
  }

  const match = FIXED_DURATION_PATTERN.exec(duration)
  if (!match?.groups) return undefined

  return {
    kind: 'fixed',
    value: Number(match.groups.value),
    unit: match.groups.unit as TimeUnit,
  }
}
