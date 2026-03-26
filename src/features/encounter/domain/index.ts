export {
  buildEncounterDefensePreviewChips,
  defenseBadgesToPresentableCombatEffects,
  deriveEncounterDefenseBadges,
  describeConditionScopeForDefenseTooltip,
  formatDamageDefenseLabel,
} from './badges/defense/encounter-defense-badges'
export type {
  EncounterConditionImmunityBadge,
  EncounterDamageDefenseBadge,
  EncounterDefenseBadges,
} from './badges/defense/encounter-defense-badges.types'
export { deriveCombatActionBadges } from './badges/action/combat-action-badges'
export type {
  ActionBadgeDescriptor,
  ActionBadgeKind,
} from './badges/action/combat-action-badges.types'
export { deriveActionPresentation } from './actions/action-presentation'
export type {
  ActionPresentationViewModel,
  ActionSemanticCategory,
  ActionSourceTag,
  ActionFooterLink,
} from './actions/action-presentation.types'
export {
  collectPresentableEffects,
  enrichPresentableEffects,
  enrichWithPresentation,
  getUserFacingEffectLabel,
  groupBySection,
  sortByPriority,
} from './effects/presentable-effects'
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
} from './effects/combat-state-ui-map'
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
} from './effects/presentable-effects.types'

export {
  filterLogByMode,
  groupLogEntries,
  formatLogGroupHeader,
  formatLogEntryDetail,
} from './combat-log/combat-log'
export type { GroupedLogEntry } from './combat-log/combat-log'
export type {
  CombatLogEntry,
  CombatLogEntryImportance,
  CombatLogPresentationMode,
} from './combat-log/combat-log.types'
export type { GridInteractionMode } from './interaction/encounter-interaction.types'
export {
  deriveBucketChrome,
  deriveBucketState,
  deriveTurnResourceBucketState,
  deriveTurnExhaustion,
  partitionCombatantActionBuckets,
  turnResourceBucketHeaderBadge,
} from './turn/turn-options'
export {
  canResolveCombatActionSelection,
  selectValidActionIdsForTarget,
} from './interaction/encounter-resolve-selection'
export type { CanResolveCombatActionSelectionArgs } from './interaction/encounter-resolve-selection'
export { deriveCombatantTurnExhaustion } from './turn/combatant-turn-exhaustion'
export type { CombatantTurnExhaustionInput } from './turn/combatant-turn-exhaustion'
export {
  deriveEncounterHeaderModel,
} from './header/encounter-header-model'
export type {
  DeriveEncounterHeaderModelArgs,
  EncounterHeaderDisplayArgs,
  EncounterHeaderInteractionArgs,
  EncounterHeaderModel,
  EncounterHeaderTurnArgs,
  EndTurnEmphasis,
} from './header/encounter-header-model'
export type { TurnOptionBucketState, TurnResourceBucketHeaderBadge } from './turn/turn-options'
export {
  deriveEncounterCapabilities,
} from './capabilities/encounter-capabilities.types'
export type {
  EncounterCapabilities,
  EncounterViewerContext,
  EncounterViewerRole,
} from './capabilities/encounter-capabilities.types'
export type {
  CombatantPreviewMode,
  CombatantPreviewKind,
  PreviewTone,
  PreviewChip,
  PreviewStat,
  CombatantStatBadge,
  CombatantTrackedPartBadge,
  CombatantPreviewAction,
  CombatantPreviewCardProps,
  CharacterCombatant,
  MonsterCombatant,
  SetupPreviewWrapperProps,
  ActivePreviewWrapperProps,
  TurnOrderStatus,
} from './view/encounter-view.types'
