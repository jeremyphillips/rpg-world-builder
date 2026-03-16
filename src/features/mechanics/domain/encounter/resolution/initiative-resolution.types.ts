export interface InitiativeParticipant {
  instanceId: string
  label: string
  initiativeModifier: number
  dexterityScore?: number
}

export interface InitiativeRoll {
  combatantId: string
  label: string
  roll: number
  modifier: number
  total: number
  dexterityScore?: number
}

export interface InitiativeResolverOptions {
  rng?: () => number
}
