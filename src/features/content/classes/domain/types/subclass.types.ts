import type { Condition } from '@/features/mechanics/domain/conditions/condition.types'
import type { Effect, ResourceCost, ResourceEffect } from '@/features/mechanics/domain/effects/effects.types'
import type { FormulaEffect } from '@/features/mechanics/domain/resolution/formula.engine'
import type { TriggerType } from '@/features/mechanics/domain/triggers/trigger.types'
import type { EffectDuration } from '@/features/mechanics/domain/effects/timing.types'
import type { AbilityId } from '@/features/mechanics/domain/core/character'
import type { StatTarget } from '@/features/mechanics/domain/resolution/stat-resolver'

type SubclassFeatureBase = {
  name: string
  level: number
  description?: string
  id?: string
}

type NestedSubclassFeature = SubclassFeatureBase & {
  features: SubclassFeature[]
}

type SubclassSaveEffect = {
  kind: 'save'
  ability: AbilityId
  onFail: {
    applyCondition: string
  }
}

type SubclassResourceFeature = SubclassFeatureBase & {
  kind: 'resource'
  resource: ResourceEffect['resource']
}

type SubclassTriggerFeature = SubclassFeatureBase & {
  kind: 'trigger'
  trigger: TriggerType
  cost?: ResourceCost
  effects: Array<Effect | SubclassSaveEffect>
}

type SubclassAuraFeature = SubclassFeatureBase & Extract<Effect, { kind: 'aura' }>

type SubclassFormulaFeature = SubclassFeatureBase & FormulaEffect & {
  condition?: Condition
}

type SubclassModifierFeature = SubclassFeatureBase & Extract<Effect, { kind: 'modifier' }>

type ActiveBuffEffect = {
  target: StatTarget
  stat: AbilityId
  type: 'additive'
}

type ActiveBuffFeature = SubclassFeatureBase & {
  type: 'active_buff'
  action: 'action'
  duration: EffectDuration
  resource: string
  effects: ActiveBuffEffect[]
}

type CustomSubclassFeature = SubclassFeatureBase & {
  kind?: string
  type?: string
  [key: string]: unknown
}

export type SubclassFeature =
  | NestedSubclassFeature
  | SubclassResourceFeature
  | SubclassTriggerFeature
  | SubclassAuraFeature
  | SubclassFormulaFeature
  | SubclassModifierFeature
  | ActiveBuffFeature
  | CustomSubclassFeature

export interface Subclass {
  id: string
  name: string
  source?: string
  features?: SubclassFeature[]
}

export interface SubclassSelection {
  id: string
  name: string
  selectionLevel: number | null
  options: Subclass[]
}
