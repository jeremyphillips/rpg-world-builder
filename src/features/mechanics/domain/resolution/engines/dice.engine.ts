export type ParsedDamageExpression =
  | { kind: 'flat'; value: number }
  | { kind: 'dice'; count: number; die: number; modifier: number; expression: string }

export function rollDie(sides: number, rng: () => number): number {
  return Math.floor(rng() * sides) + 1
}

export function parseDamageExpression(input?: string): ParsedDamageExpression | null {
  if (!input) return null

  const trimmed = input.trim()
  if (trimmed.length === 0 || trimmed === '—' || trimmed === '-') return null

  if (/^\d+$/.test(trimmed)) {
    return { kind: 'flat', value: Number(trimmed) }
  }

  const normalized = trimmed.replace(/\s+/g, '')
  const match = normalized.match(/^(\d+)d(\d+)([+-]\d+)?$/i)
  if (!match) return null

  return {
    kind: 'dice',
    count: Number(match[1]),
    die: Number(match[2]),
    modifier: match[3] ? Number(match[3]) : 0,
    expression: trimmed,
  }
}

export function rollDamage(
  input: string | undefined,
  rng: () => number,
): { total: number; details: string } | null {
  const parsed = parseDamageExpression(input)
  if (!parsed) return null

  if (parsed.kind === 'flat') {
    return {
      total: parsed.value,
      details: `Damage: ${parsed.value}.`,
    }
  }

  const rolls = Array.from({ length: parsed.count }, () => rollDie(parsed.die, rng))
  const diceTotal = rolls.reduce((sum, value) => sum + value, 0)
  const total = Math.max(0, diceTotal + parsed.modifier)
  const modifierText =
    parsed.modifier === 0 ? '' : parsed.modifier > 0 ? ` + ${parsed.modifier}` : ` - ${Math.abs(parsed.modifier)}`

  return {
    total,
    details: `Damage: ${parsed.expression} -> [${rolls.join(', ')}]${modifierText} = ${total}.`,
  }
}
