import { useMemo } from 'react'

import type { Monster } from '@/features/content/monsters/domain/types'
import type { CombatantPortraitEntry } from '@/features/encounter/helpers/resolveCombatantAvatarSrc'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import type { AoeStep } from '../../../helpers/area-grid-action'
import {
  collectPresentableEffects,
  enrichPresentableEffects,
  groupBySection,
  partitionCombatantActionBuckets,
  sortByPriority,
} from '../../../domain'
import { AllyCombatantActivePreviewCard } from '../cards/AllyCombatantActivePreviewCard'
import { OpponentCombatantActivePreviewCard } from '../cards/OpponentCombatantActivePreviewCard'
import { CombatantActionDrawer } from './CombatantActionDrawer'

type AllyActionDrawerProps = {
  open: boolean
  onClose: () => void
  monstersById: Record<string, Monster>
  characterPortraitById: Record<string, CombatantPortraitEntry>
  combatant: CombatantInstance
  /** Drawer title; defaults to `combatant.source.label`. */
  drawerTitle?: string
  availableActions: CombatActionDefinition[]
  validActionIdsForTarget?: Set<string>
  invalidActionReasons?: Map<string, string>
  selectedActionId?: string
  onSelectAction?: (actionId: string) => void
  selectedCasterOptions?: Record<string, string>
  onCasterOptionsChange?: (values: Record<string, string>) => void
  targetCombatant?: CombatantInstance | null
  allCombatants?: readonly CombatantInstance[]
  targetLabel?: string | null
  canResolveAction?: boolean
  onResolveAction?: () => void
  onEndTurn?: () => void
  aoeStep?: AoeStep
  aoePlacementError?: string | null
  onDismissAoeError?: () => void
  aoeAffectedNames?: string[]
  aoeAffectedTotal?: number
  aoeAffectedOverflow?: number
  onCancelAoe?: () => void
  onUndoAoeSelection?: () => void
}

export function AllyActionDrawer({
  open,
  onClose,
  monstersById,
  characterPortraitById,
  combatant,
  drawerTitle,
  availableActions,
  validActionIdsForTarget,
  invalidActionReasons,
  selectedActionId,
  onSelectAction,
  selectedCasterOptions,
  onCasterOptionsChange,
  targetCombatant,
  allCombatants,
  targetLabel,
  canResolveAction,
  onResolveAction,
  onEndTurn,
  aoeStep,
  aoePlacementError,
  onDismissAoeError,
  aoeAffectedNames,
  aoeAffectedTotal,
  aoeAffectedOverflow,
  onCancelAoe,
  onUndoAoeSelection,
}: AllyActionDrawerProps) {
  const availableActionIds = useMemo(
    () => new Set(availableActions.map((a) => a.id)),
    [availableActions],
  )
  const { actionDefs: actions, bonusDefs: bonusActions } = useMemo(
    () => partitionCombatantActionBuckets(combatant.actions),
    [combatant.actions],
  )

  const combatEffects = useMemo(() => {
    const presentable = collectPresentableEffects(combatant)
    const enriched = enrichPresentableEffects(presentable)
    const sorted = sortByPriority(enriched)
    return groupBySection(sorted)
  }, [combatant])

  const targetPreview = targetCombatant ? (
    targetCombatant.side === 'party' ? (
      <AllyCombatantActivePreviewCard
        combatant={targetCombatant}
        monstersById={monstersById}
        characterPortraitById={characterPortraitById}
        allCombatants={allCombatants}
        showChips={false}
      />
    ) : (
      <OpponentCombatantActivePreviewCard
        combatant={targetCombatant}
        monstersById={monstersById}
        characterPortraitById={characterPortraitById}
        allCombatants={allCombatants}
        showChips={false}
      />
    )
  ) : null

  return (
    <CombatantActionDrawer
      open={open}
      onClose={onClose}
      title={drawerTitle ?? combatant.source.label}
      actions={actions}
      bonusActions={bonusActions}
      availableActionIds={availableActionIds}
      validActionIdsForTarget={validActionIdsForTarget}
      invalidActionReasons={invalidActionReasons}
      selectedActionId={selectedActionId}
      onSelectAction={onSelectAction}
      selectedCasterOptions={selectedCasterOptions}
      onCasterOptionsChange={onCasterOptionsChange}
      combatEffects={combatEffects}
      targetPreview={targetPreview}
      targetLabel={targetLabel}
      canResolveAction={canResolveAction}
      onResolveAction={onResolveAction}
      onEndTurn={onEndTurn}
      aoeStep={aoeStep}
      aoePlacementError={aoePlacementError}
      onDismissAoeError={onDismissAoeError}
      aoeAffectedNames={aoeAffectedNames}
      aoeAffectedTotal={aoeAffectedTotal}
      aoeAffectedOverflow={aoeAffectedOverflow}
      onCancelAoe={onCancelAoe}
      onUndoAoeSelection={onUndoAoeSelection}
    />
  )
}
