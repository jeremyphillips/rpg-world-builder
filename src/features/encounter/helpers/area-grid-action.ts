import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter'

export type AoeStep = 'none' | 'placing' | 'confirm'

/**
 * Resolves **place-or-object** emanations using {@link CombatActionDefinition.attachedEmanation.anchorChoiceFieldId}
 * and the cast-time enum in `selectedCasterOptions`.
 */
export function resolveAttachedEmanationAnchorModeFromSelection(
  action: CombatActionDefinition | undefined | null,
  selectedCasterOptions: Record<string, string> | undefined,
): 'caster' | 'place' | 'creature' | 'object' {
  const ae = action?.attachedEmanation
  if (!ae) return 'caster'
  if (ae.anchorMode !== 'place-or-object') {
    if (ae.anchorMode === 'place' || ae.anchorMode === 'creature' || ae.anchorMode === 'object') {
      return ae.anchorMode
    }
    return 'caster'
  }
  const id = ae.anchorChoiceFieldId
  if (!id) return 'place'
  const v = selectedCasterOptions?.[id]?.trim()
  return v === 'object' ? 'object' : 'place'
}

/**
 * True when the encounter should run the AoE origin flow (`aoeOriginCellId`, `aoeStep`).
 * Includes hostile/all-enemies area spells and **place-anchored** attached emanations that reuse the same grid path.
 *
 * For **`place-or-object`**, pass **`selectedCasterOptions`** so object mode does not incorrectly show the AoE overlay.
 *
 * @see {@link CombatActionDefinition.attachedEmanation} `anchorMode === 'place'` — origin is persisted on the
 *   battlefield instance via `ResolveCombatActionSelection.aoeOriginCellId` (not a separate field).
 */
export function isAreaGridAction(
  action: CombatActionDefinition | undefined | null,
  selectedCasterOptions?: Record<string, string>,
): boolean {
  if (action?.targeting?.kind === 'all-enemies' && action.areaTemplate) return true
  const ae = action?.attachedEmanation
  if (!ae || !action.areaTemplate) return false
  if (ae.anchorMode === 'place') return true
  if (ae.anchorMode === 'place-or-object') {
    return resolveAttachedEmanationAnchorModeFromSelection(action, selectedCasterOptions) === 'place'
  }
  return false
}

export function isSelfCenteredAreaAction(
  action: CombatActionDefinition | undefined | null,
  selectedCasterOptions?: Record<string, string>,
): boolean {
  return Boolean(isAreaGridAction(action, selectedCasterOptions) && action?.areaPlacement === 'self')
}
