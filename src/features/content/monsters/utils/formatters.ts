type EditionRule = any
import type {
  CreatureArmorClassBreakdownPart,
  CreatureArmorClassResult,
} from '@/features/mechanics/domain/equipment/armorClass'

/** Hit Points: {count}d{die}{modifier} e.g. 3d6+4 */
export function formatHitPoints(m: {
  count: number;
  die: number;
  modifier?: number;
}): string {
  if (!m) return '—';
  const { count, die, modifier } = m;
  let s = `${count}d${die}`;
  if (modifier != null && modifier !== 0) {
    s += modifier > 0 ? `+${modifier}` : String(modifier);
  }
  return s;
}

/** Hit Points with average: {count}d{die}{modifier} ({average}) e.g. 2d6+4 (10) */
export function formatHitPointsWithAverage(m: {
  count: number;
  die: number;
  modifier?: number;
}): string {
  if (!m) return '—';
  const base = formatHitPoints(m);
  const avg = Math.floor(m.count * ((m.die + 1) / 2)) + (m.modifier ?? 0);
  return `${avg} (${base})`;
}

export function formatAttacks(attacks: EditionRule['mechanics']['attacks']): string {
  if (!attacks?.length) return '—'
  return attacks
    .map((a: { name?: string; dice?: string }) => `${a.name} (${a.dice})`)
    .join(', ')
}

export function formatMovement(m: EditionRule['mechanics']['movement']): string {
  const parts: string[] = []
  if (m?.ground) parts.push(`${m.ground} ft.`)
  if (m?.climb) parts.push(`Climb ${m.climb} ft.`)
  if (m?.swim) parts.push(`Swim ${m.swim} ft.`)
  if (m?.fly) parts.push(`Fly ${m.fly} ft.`)
  if (m?.burrow) parts.push(`Burrow ${m.burrow} ft.`)
  return parts.join(', ') || '—'
}

export function formatHitDice(editionRule: EditionRule): string {
  const m = editionRule.mechanics
  if (!('hitDice' in m)) return '—'                       // 4e has no hit dice
  const dieSize = 'hitDieSize' in m ? m.hitDieSize : 8  // 1e always d8
  let hd = `${(m as any).hitDice}d${dieSize}`
  if ('hitDiceAsterisks' in m && (m as any).hitDiceAsterisks) {
    hd += '*'.repeat((m as any).hitDiceAsterisks)
  }
  if ('hitDieModifier' in m && (m as any).hitDieModifier != null) {
    const mod = (m as any).hitDieModifier as number
    hd += mod > 0 ? `+${mod}` : String(mod)
  }
  return hd
}

export function formatMorale(morale: unknown): string {
  if (typeof morale === 'number') return String(morale)
  if (morale && typeof morale === 'object' && 'category' in morale && 'value' in morale) {
    const m = morale as { category: string; value: number }
    return `${m.category} (${m.value})`
  }
  return '—'
}

export function formatNumberAppearing(na: unknown): string {
  if (!na) return '—'
  if (typeof na === 'string') return na
  if (typeof na !== 'object') return '—'
  if ('wandering' in na && 'lair' in na) {
    const n = na as { wandering: string; lair: string }
    return `${n.wandering} (lair: ${n.lair})`
  }
  if ('min' in na && 'max' in na) {
    const n = na as { min: number; max: number }
    return `${n.min}–${n.max}`
  }
  return '—'
}

function normalizeArmorClassLabel(part: CreatureArmorClassBreakdownPart): string {
  if (part.kind === 'modifier' && part.label.startsWith('Shield')) {
    return 'Shield'
  }

  return part.label
}

function formatArmorClassPart(part: CreatureArmorClassBreakdownPart): string {
  const label = normalizeArmorClassLabel(part)

  if (part.kind === 'base' || part.kind === 'override') {
    return `${label} ${part.value}`
  }

  return `${label} ${Math.abs(part.value)}`
}

export function formatMonsterArmorClassBreakdown(
  result: CreatureArmorClassResult,
  options?: {
    includePrefix?: boolean
  },
): string {
  const includePrefix = options?.includePrefix ?? true
  const visibleParts = result.breakdown.parts.filter((part) => {
    if (part.kind === 'base' || part.kind === 'override') return true
    return part.value !== 0
  })

  const orderedParts = [
    ...visibleParts.filter((part) => part.kind === 'base' || part.kind === 'override'),
    ...visibleParts.filter((part) => part.kind === 'modifier'),
    ...visibleParts.filter((part) => part.kind === 'dex'),
  ]

  if (orderedParts.length === 0) {
    return includePrefix ? `AC ${result.value}` : String(result.value)
  }

  const [firstPart, ...restParts] = orderedParts
  const breakdown = [
    formatArmorClassPart(firstPart),
    ...restParts.map((part) =>
      `${part.value < 0 ? '-' : '+'} ${formatArmorClassPart(part)}`,
    ),
  ].join(' ')

  if (!includePrefix) {
    return `${result.value} (${breakdown})`
  }

  return `AC ${result.value} (${breakdown})`
}