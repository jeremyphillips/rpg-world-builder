import type { ResolveActionIntent } from '@/features/mechanics/domain/combat/intents'

/**
 * Pure mapping from confirmed Encounter hook selection into {@link ResolveActionIntent}.
 * UI-local prep (hover, unconfirmed AoE step, drawer state) must be resolved before calling this.
 */
export type BuildResolveActionIntentArgs = {
  activeCombatantId: string
  selectedActionId: string
  selectedActionTargetId: string
  selectedCasterOptions: Record<string, string>
  aoeOriginCellId: string | null
  selectedSingleCellPlacementCellId: string | null
  unaffectedCombatantIds: string[]
  selectedObjectAnchorId: string | null
  selectedDoorCellIdA: string | null
  selectedDoorCellIdB: string | null
}

export function buildResolveActionIntentFromActiveSelection(
  args: BuildResolveActionIntentArgs,
): ResolveActionIntent {
  return {
    kind: 'resolve-action',
    actorId: args.activeCombatantId,
    targetId: args.selectedActionTargetId || undefined,
    actionId: args.selectedActionId,
    casterOptions: args.selectedCasterOptions,
    aoeOriginCellId: args.aoeOriginCellId || undefined,
    singleCellPlacementCellId: args.selectedSingleCellPlacementCellId || undefined,
    unaffectedCombatantIds: args.unaffectedCombatantIds,
    objectId: args.selectedObjectAnchorId?.trim() || undefined,
    doorCellIdA: args.selectedDoorCellIdA?.trim() || undefined,
    doorCellIdB: args.selectedDoorCellIdB?.trim() || undefined,
  }
}
