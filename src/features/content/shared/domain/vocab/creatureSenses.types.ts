import type { CreatureSenseType } from './creatureSenses.vocab'

export type { CreatureSenseType }

export type CreatureSenseSource = {
  kind: 'race' | 'monster' | 'class' | 'item' | 'trait' | 'effect' | 'manual'
  id?: string
  label?: string
}

export type CreatureSense = {
  type: CreatureSenseType
  range?: number
  notes?: string
  source?: CreatureSenseSource
}

export type CreatureSenses = {
  special: CreatureSense[]
  passivePerception?: number
}
