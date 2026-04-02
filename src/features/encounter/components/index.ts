export { SelectedEntitiesLane } from '@/ui/patterns'
export { AllyRosterLane } from './setup/roster/AllyRosterLane'
export { OpponentRosterLane } from './setup/roster/OpponentRosterLane'
/** Temporary re-exports (Phase 3A). Prefer `@/features/combat/components` in new code. */
export {
  CombatantAvatar,
  CombatantPreviewCard,
  CombatActionPreviewCard,
} from '@/features/combat/components'
export {
  CombatLogEntryGroup,
  PresentableEffectsList,
  PresentableEffectsHeaderChips,
} from '@/features/combat/components'
export { EncounterView } from './shared/layout/EncounterView'
export { EncounterSetupView } from './setup/layout/EncounterSetupView'
export { EncounterSetupHeader } from './setup/layout/EncounterSetupHeader'
export { EncounterActiveHeader } from './active/layout/EncounterActiveHeader'
export { EncounterPresentationPovField } from './active/layout/EncounterPresentationPovField'
export { EncounterActiveFooter } from './active/layout/EncounterActiveFooter'
export type { InteractionMode } from './active/layout/EncounterActiveFooter'
export type { GridInteractionMode } from '@/features/mechanics/domain/combat/selectors/interaction/encounter-interaction.types'
export { EncounterEnvironmentSetup } from './setup/options/EncounterEnvironmentSetup'
export type { EnvironmentSetupValues } from './setup/options/EncounterEnvironmentSetup'
export { EncounterEnvironmentSummary } from './active/layout/EncounterEnvironmentSummary'
export { AllyCombatantSetupPreviewCard } from './setup/roster/AllyCombatantSetupPreviewCard'
export { OpponentCombatantSetupPreviewCard } from './setup/roster/OpponentCombatantSetupPreviewCard'
export { AllyCombatantActivePreviewCard } from './active/cards/AllyCombatantActivePreviewCard'
export { OpponentCombatantActivePreviewCard } from './active/cards/OpponentCombatantActivePreviewCard'
export { AllyActionDrawer } from './active/drawers/AllyActionDrawer'
export { OpponentActionDrawer } from './active/drawers/OpponentActionDrawer'
export {
  CombatantActionDrawer,
  useCloseCombatantActionDrawerOnActiveCombatantChange,
  type CombatantActionDrawerView,
} from './active/drawers/CombatantActionDrawer'
export type { CombatantStatBadge, CombatantTrackedPartBadge } from '@/features/combat/components'
export {
  CombatantCoreBadgeRow,
  CombatantPreviewChipRow,
  CombatantStatBadgeRow,
  CombatantTrackedPartBadgeRow,
} from '@/features/combat/components'
export { CombatLogPanel } from './active/combat-log/CombatLogPanel'
export { EncounterActiveSidebar } from './active/grid/EncounterActiveSidebar'
export { EncounterGrid } from './active/grid/EncounterGrid'
export { EncounterGridSetup } from './setup/options/EncounterGridSetup'
export { GRID_SIZE_PRESETS } from '@/shared/domain/grid/gridPresets'
export type { GridSizePreset } from '@/shared/domain/grid/gridPresets'
export { ActionRow } from './active/action-row/ActionRow'
/** Temporary alias (Phase 3C). Prefer `CombatActionRowBase` from `@/features/combat/components`. */
export {
  CombatActionRowBase as ActionRowBase,
  type CombatActionRowBaseProps as ActionRowBaseProps,
} from '@/features/combat/components'
export { EncounterEditModal } from './shared/modals/EncounterEditModal'
export { CombatTargetSelectModal, buildTargetOptions } from './active/modals/CombatTargetSelectModal'
export { CombatLogModal } from './active/combat-log/CombatLogModal'
export { SelectEncounterAllyModal } from './setup/modals/SelectEncounterAllyModal'
export { SelectEncounterOpponentModal } from './setup/modals/SelectEncounterOpponentModal'
