export type TimeUnit =
  | 'turn'
  | 'round'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'year'

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

const FIXED_DURATION_PATTERN =
  /^(?<value>\d+)\s+(?<unit>turn|round|minute|hour|day|week|month|year)s?$/

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
