export interface ResolveCombatActionSelection {
  actorId: string
  targetId?: string
  actionId: string
  /** Values for {@link CombatActionDefinition.casterOptions}, keyed by field `id`. */
  casterOptions?: Record<string, string>
}

export interface ResolveCombatActionOptions {
  rng?: () => number
  /**
   * Called when a spell action is spent. Use to persist character.resources.
   * Set resources[`spell_used_${spellId}`] = 1.
   *
   * KNOWN EDGE CASES:
   * - Warlock pact: Different period (short-rest); would need separate callback or payload.
   */
  onSpellSlotSpent?: (sourceId: string, spellId: string) => void
  /**
   * When true (default), hostile `single-target` actions cannot target same-side combatants (legacy "enemies only").
   * Set false for pure core (friendly fire / PC vs PC on same side allowed). Prefer driving from ruleset `mechanics.combat.encounter.suppressSameSideHostile` in app code.
   */
  suppressSameSideHostileActions?: boolean
}
