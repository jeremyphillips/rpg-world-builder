import type {
  CombatantPreviewKind,
  CombatantPreviewMode,
  PreviewChip,
  PreviewStat,
  CombatantPreviewAction,
  ViewerCombatantPresentationKind,
} from '@/features/mechanics/domain/combat/presentation/view/tactical-preview.types'

export type {
  CombatantPreviewMode,
  CombatantPreviewKind,
  PreviewTone,
  PreviewChip,
  CombatantStatBadge,
  PreviewStat,
  CombatantTrackedPartBadge,
  CombatantPreviewAction,
  CharacterCombatant,
  MonsterCombatant,
  SetupPreviewWrapperProps,
  ActivePreviewWrapperProps,
  TurnOrderStatus,
  ViewerCombatantPresentationKind,
} from '@/features/mechanics/domain/combat/presentation/view/tactical-preview.types'

/** @deprecated Import from `@/features/combat/types/preview-card` — re-exported for Encounter domain compatibility (Phase 3A). */
export type { CombatantPreviewCardProps } from '@/features/combat/types/preview-card'
