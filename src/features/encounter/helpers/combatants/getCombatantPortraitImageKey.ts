/**
 * Single place to derive the persisted portrait storage key for a combatant at build time.
 * Prefer character portrait over monster when both are provided (should not happen in normal builds).
 */
export function getCombatantPortraitImageKey(input: {
  character?: { imageKey?: string | null }
  monster?: { imageKey?: string | null }
}): string | null {
  return input.character?.imageKey ?? input.monster?.imageKey ?? null
}
