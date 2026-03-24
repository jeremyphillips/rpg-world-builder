export {
  buildEncounterDefensePreviewChips,
  defenseBadgesToPresentableCombatEffects,
  deriveEncounterDefenseBadges,
  describeConditionScopeForDefenseTooltip,
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
export { deriveActionPresentation } from './badges/action/action-presentation'
export type {
  ActionPresentationViewModel,
  ActionSemanticCategory,
  ActionSourceTag,
  ActionFooterLink,
} from './badges/action/action-presentation.types'
export {
  collectPresentableEffects,
  enrichPresentableEffects,
  enrichWithPresentation,
  groupBySection,
  sortByPriority,
} from './effects/presentable-effects'
export {
  COMBAT_STATE_UI_MAP,
  COMBAT_STATE_MARKER_UI_MAP,
  EFFECT_CONDITION_PRESENTATION_MAP,
  getCombatStatePresentation,
  getFallbackPresentation,
  getPriorityOrder,
  getSectionOrder,
  shouldShowPresentationInHeader,
} from './effects/combat-state-ui-map'
export type {
  CombatStatePresentation,
  CombatStateSection,
  CombatStateTone,
  CombatStatePriority,
  EnrichedPresentableEffect,
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
export type { GridInteractionMode } from './encounter-interaction.types'
export {
  deriveBucketChrome,
  deriveBucketState,
  deriveTurnExhaustion,
} from './turn-options'
export type { TurnOptionBucketState } from './turn-options'
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
