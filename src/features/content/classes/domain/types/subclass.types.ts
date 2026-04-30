import type { Effect, ResourceEffect } from '@/features/mechanics/domain/effects/effects.types'

type SubclassFeatureBase = {
  name: string
  level: number
  description?: string
  id?: string
}

type NestedSubclassFeature = SubclassFeatureBase & {
  features: SubclassFeature[]
}

type SubclassResourceFeature = SubclassFeatureBase & {
  kind: 'resource'
  resource: ResourceEffect['resource']
}

type SubclassEffectFeature = SubclassFeatureBase & Effect

type CustomSubclassFeature = SubclassFeatureBase & {
  kind?: string
  type?: string
  [key: string]: unknown
}

type SpellGrantProgressionEntry = {
  level: number
  spellIds: string[]
}

type SubclassSpellcastingFeature = SubclassFeatureBase & {
  kind: 'spellcasting'
  mode:
    | 'always_prepared'
    | 'always_known'
    | 'expanded_list'
    | 'bonus_cantrip'
  spellcastingClassId?: string
  grants: SpellGrantProgressionEntry[]
}

export type SubclassFeature =
  | NestedSubclassFeature
  | SubclassResourceFeature
  | SubclassEffectFeature
  | CustomSubclassFeature
  | SubclassSpellcastingFeature

export interface Subclass {
  id: string
  name: string
  description: string
  features?: SubclassFeature[]
}

export interface SubclassSelection {
  id: string
  name: string
  selectionLevel: number | null
  options: Subclass[]
}
