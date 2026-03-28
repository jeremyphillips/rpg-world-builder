/**
 * Source-agnostic identity for persistent attached battlefield effects (e.g. self-centered sphere auras).
 * Spell, monster action, and (future) monster trait origins converge here for runtime resolution.
 */
export type AttachedBattlefieldEffectSource =
  | { kind: 'spell'; spellId: string }
  | { kind: 'monster-action'; monsterId: string; actionId: string }
  | { kind: 'monster-trait'; monsterId: string; traitIndex: number }

/** Stable id for {@link EncounterState.attachedAuraInstances} rows (unique per source + caster combatant). */
export function attachedAuraInstanceId(
  source: AttachedBattlefieldEffectSource,
  actorId: string,
): string {
  switch (source.kind) {
    case 'spell':
      return `attached-emanation-${source.spellId}-${actorId}`
    case 'monster-action':
      return `attached-emanation-${source.monsterId}-${source.actionId}-${actorId}`
    case 'monster-trait':
      return `attached-emanation-trait-${source.monsterId}-${source.traitIndex}-${actorId}`
  }
}

/**
 * Marker id linked to spell concentration when an attached emanation comes from a spell.
 * Matches legacy `attached-emanation-${spellId}` (no actor suffix).
 */
export function concentrationLinkedMarkerIdForSpellAttachedEmanation(spellId: string): string {
  return `attached-emanation-${spellId}`
}

export function attachedBattlefieldSourceEquals(
  a: AttachedBattlefieldEffectSource,
  b: AttachedBattlefieldEffectSource,
): boolean {
  if (a.kind !== b.kind) return false
  switch (a.kind) {
    case 'spell':
      return b.kind === 'spell' && a.spellId === b.spellId
    case 'monster-action':
      return b.kind === 'monster-action' && a.monsterId === b.monsterId && a.actionId === b.actionId
    case 'monster-trait':
      return b.kind === 'monster-trait' && a.monsterId === b.monsterId && a.traitIndex === b.traitIndex
  }
}
