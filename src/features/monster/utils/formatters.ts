type EditionRule = any

export function formatAttacks(attacks: EditionRule['mechanics']['attacks']): string {
  if (!attacks?.length) return '—'
  return attacks.map((a) => `${a.name} (${a.dice})`).join(', ')
}

export function formatMovement(m: EditionRule['mechanics']['movement']): string {
  const parts: string[] = []
  if (m.ground) parts.push(`${m.ground} ft.`)
  if (m.swim) parts.push(`Swim ${m.swim} ft.`)
  if (m.fly) parts.push(`Fly ${m.fly} ft.`)
  if (m.burrow) parts.push(`Burrow ${m.burrow} ft.`)
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