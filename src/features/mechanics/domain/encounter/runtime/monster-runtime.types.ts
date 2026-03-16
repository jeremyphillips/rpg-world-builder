export type ManualEnvironmentContext = 'none' | 'sunlight'
export type MonsterFormContext = 'object' | 'true-form'

export type ManualMonsterTriggerContext = {
  contact: boolean
  allyNearTarget: boolean
  movingGrappledCreature: boolean
}

export type MonsterRuntimeContext = {
  environment: ManualEnvironmentContext
  form: MonsterFormContext
  manual: ManualMonsterTriggerContext
}

export type MonsterContextTriggerStatus = {
  id: string
  traitName: string
  label: string
  status: 'matched' | 'inactive' | 'manual'
}

export const DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT: ManualMonsterTriggerContext = {
  contact: false,
  allyNearTarget: false,
  movingGrappledCreature: false,
}
