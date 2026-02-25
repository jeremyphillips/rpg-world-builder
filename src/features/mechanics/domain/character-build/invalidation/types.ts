/**
 * Engine-owned invalidation types.
 *
 * Items are identified by `id` — display labels are provided alongside
 * so the UI never needs to re-look-up names from catalogs.
 */

// ---------------------------------------------------------------------------
// Draft type — mirrors CharacterBuilderState for now, decoupled later
// ---------------------------------------------------------------------------

export type { CharacterBuilderState as CharacterDraft } from '@/features/characterBuilder/types'
export type { StepId } from '@/features/characterBuilder/types'

// ---------------------------------------------------------------------------
// Invalidation item
// ---------------------------------------------------------------------------

export type InvalidationItemKind =
  | 'spell'
  | 'class'
  | 'race'
  | 'equipment'
  | 'alignment'
  | 'message'

export type InvalidationItem = {
  id: string
  kind: InvalidationItemKind
  label: string
}

// ---------------------------------------------------------------------------
// Trigger — key string (shallow !==) OR comparator function
// ---------------------------------------------------------------------------

export type TriggerKey = string & keyof import('@/features/characterBuilder/types').CharacterBuilderState

export type TriggerFn = (
  prev: import('@/features/characterBuilder/types').CharacterBuilderState,
  next: import('@/features/characterBuilder/types').CharacterBuilderState,
) => boolean

export type Trigger = TriggerKey | TriggerFn

// ---------------------------------------------------------------------------
// Rule
// ---------------------------------------------------------------------------

export interface InvalidationRule {
  id: string
  triggers: Trigger[]
  affectedStep: import('@/features/characterBuilder/types').StepId
  label: string

  detect: (
    prev: import('@/features/characterBuilder/types').CharacterBuilderState,
    next: import('@/features/characterBuilder/types').CharacterBuilderState,
  ) => InvalidationItem[]

  resolve: (
    state: import('@/features/characterBuilder/types').CharacterBuilderState,
    items: InvalidationItem[],
  ) => import('@/features/characterBuilder/types').CharacterBuilderState
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

export interface StepInvalidation {
  ruleId: string
  stepId: import('@/features/characterBuilder/types').StepId
  label: string
  items: InvalidationItem[]
}

export interface InvalidationResult {
  hasInvalidations: boolean
  affected: StepInvalidation[]
}
