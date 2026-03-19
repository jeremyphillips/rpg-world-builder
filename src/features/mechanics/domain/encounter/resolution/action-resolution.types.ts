export interface ResolveCombatActionSelection {
  actorId: string
  targetId?: string
  actionId: string
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
}
