/**
 * Encounter Simulator feature re-exports combat-owned presentation/selectors (Phase 2).
 * Prefer importing from `@/features/mechanics/domain/combat/presentation/*` or `.../selectors/*` in new code.
 */
export {
  buildEncounterDefensePreviewChips,
  defenseBadgesToPresentableCombatEffects,
  deriveEncounterDefenseBadges,
  describeConditionScopeForDefenseTooltip,
  formatDamageDefenseLabel,
} from '@/features/mechanics/domain/combat/presentation/badges/defense/encounter-defense-badges'
export type {
  EncounterConditionImmunityBadge,
  EncounterDamageDefenseBadge,
  EncounterDefenseBadges,
} from '@/features/mechanics/domain/combat/presentation/badges/defense/encounter-defense-badges.types'
export { deriveCombatActionBadges } from '@/features/mechanics/domain/combat/presentation/badges/action/combat-action-badges'
export type {
  ActionBadgeDescriptor,
  ActionBadgeKind,
} from '@/features/mechanics/domain/combat/presentation/badges/action/combat-action-badges.types'
export { deriveActionPresentation } from '@/features/mechanics/domain/combat/presentation/actions/action-presentation'
export { deriveRecommendedActionsForTarget } from '@/features/mechanics/domain/combat/presentation/actions/derive-recommended-actions-for-target'
export type {
  ActionPresentationViewModel,
  ActionSemanticCategory,
  ActionSourceTag,
  ActionFooterLink,
} from '@/features/mechanics/domain/combat/presentation/actions/action-presentation.types'
export {
  collectPresentableEffects,
  enrichPresentableEffects,
  enrichWithPresentation,
  getUserFacingEffectLabel,
  groupBySection,
  sortByPriority,
} from '@/features/mechanics/domain/combat/presentation/effects/presentable-effects'
export {
  COMBAT_STATE_UI_MAP,
  COMBAT_STATE_MARKER_UI_MAP,
  CONDITION_IMMUNITY_ONLY_PRESENTATION_MAP,
  CORE_COMBAT_STATE_KEYS,
  CORE_COMBAT_STATE_MAP,
  CORE_ENGINE_MARKER_PRESENTATION_MAP,
  EFFECT_CONDITION_PRESENTATION_MAP,
  getCombatStatePresentation,
  getFallbackPresentation,
  getPriorityOrder,
  getSectionOrder,
  resolveEffectPresentation,
  resolvePresentationForSemanticKey,
  shouldShowPresentationInHeader,
  SPECIALIZED_EFFECT_KEYS,
  SPECIALIZED_EFFECT_PRESENTATION_MAP,
} from '@/features/mechanics/domain/combat/presentation/effects/combat-state-ui-map'
export type {
  CombatStatePresentation,
  CombatStateSection,
  CombatStateTone,
  CombatStatePriority,
  EnrichedPresentableEffect,
  PresentationTier,
  PresentableCombatEffect,
  PresentableCombatEffectKind,
  PresentableTurnHook,
} from '@/features/mechanics/domain/combat/presentation/effects/presentable-effects.types'

export {
  filterLogByMode,
  groupLogEntries,
  formatLogGroupHeader,
  formatLogEntryDetail,
} from '@/features/mechanics/domain/combat/presentation/combat-log/combat-log'
export type { GroupedLogEntry } from '@/features/mechanics/domain/combat/presentation/combat-log/combat-log'
export type { CombatLogEntry, CombatLogEntryImportance, CombatLogPresentationMode } from '@/features/mechanics/domain/combat/presentation/combat-log/combat-log.types'
export type { GridInteractionMode } from '@/features/mechanics/domain/combat/selectors/interaction/encounter-interaction.types'
export {
  deriveBucketChrome,
  deriveBucketState,
  deriveTurnResourceBucketState,
  deriveTurnExhaustion,
  partitionCombatantActionBuckets,
  turnResourceBucketHeaderBadge,
} from '@/features/mechanics/domain/combat/selectors/turn/turn-options'
export {
  canResolveCombatActionSelection,
  selectValidActionIdsForTarget,
} from '@/features/mechanics/domain/combat/selectors/interaction/encounter-resolve-selection'
export type { CanResolveCombatActionSelectionArgs } from '@/features/mechanics/domain/combat/selectors/interaction/encounter-resolve-selection'
export { deriveCombatantTurnExhaustion } from '@/features/mechanics/domain/combat/selectors/turn/combatant-turn-exhaustion'
export type { CombatantTurnExhaustionInput } from '@/features/mechanics/domain/combat/selectors/turn/combatant-turn-exhaustion'
export {
  deriveEncounterHeaderModel,
  resolveEncounterHeaderPhase,
} from '@/features/mechanics/domain/combat/presentation/header/encounter-header-model'
export type {
  DeriveEncounterHeaderModelArgs,
  EncounterHeaderDisplayArgs,
  EncounterHeaderInteractionArgs,
  EncounterHeaderModel,
  EncounterHeaderPhase,
  EncounterHeaderTonePerspective,
  EncounterHeaderTurnArgs,
  EncounterHeaderViewerPolicy,
  EndTurnEmphasis,
} from '@/features/mechanics/domain/combat/presentation/header/encounter-header-model'
export type { TurnOptionBucketState, TurnResourceBucketHeaderBadge } from '@/features/mechanics/domain/combat/selectors/turn/turn-options'
export { deriveEncounterCapabilities } from '@/features/mechanics/domain/combat/selectors/capabilities/encounter-capabilities.types'
export { resolveSessionControlledCombatantIds } from '@/features/mechanics/domain/combat/selectors/capabilities/resolve-session-controlled-combatant-ids'
export type {
  EncounterCapabilities,
  EncounterSimulatorViewerMode,
  EncounterViewerContext,
  EncounterSessionSeat,
} from '@/features/mechanics/domain/combat/selectors/capabilities/encounter-capabilities.types'
export type { ResolveSessionControlledCombatantIdsArgs } from '@/features/mechanics/domain/combat/selectors/capabilities/resolve-session-controlled-combatant-ids'
export { deriveEncounterPerceptionUiFeedback } from '@/features/mechanics/domain/combat/presentation/perception/encounter-perception-ui.feedback'
export type {
  EncounterPerceptionUiFeedback,
  DeriveEncounterPerceptionUiFeedbackArgs,
} from '@/features/mechanics/domain/combat/presentation/perception/encounter-perception-ui.feedback'
export { deriveEncounterPresentationGridPerceptionInput } from '@/features/mechanics/domain/combat/presentation/perception/derive-encounter-presentation-grid-perception'
export type { DeriveEncounterPresentationGridPerceptionInputArgs } from '@/features/mechanics/domain/combat/presentation/perception/derive-encounter-presentation-grid-perception'
export type {
  CombatantPreviewMode,
  CombatantPreviewKind,
  PreviewTone,
  PreviewChip,
  PreviewStat,
  CombatantStatBadge,
  CombatantTrackedPartBadge,
  CombatantPreviewAction,
  CharacterCombatant,
  MonsterCombatant,
  SetupPreviewWrapperProps,
  ActivePreviewWrapperProps,
  TurnOrderStatus,
  ViewerCombatantPresentationKind,
} from '@/features/mechanics/domain/combat/presentation/view/tactical-preview.types'
export type { CombatantPreviewCardProps } from './view/encounter-view.types'

export type {
  EncounterSetupPolicy,
  EncounterSetupRosterPolicy,
  EncounterSetupEnvironmentPolicy,
  EncounterSetupGridPolicy,
} from './setup'
export { SIMULATOR_ENCOUNTER_SETUP_POLICY } from './setup'
