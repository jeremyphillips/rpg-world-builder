export interface ResolveCombatActionSelection {
  actorId: string
  targetId?: string
  actionId: string
}

export interface ResolveCombatActionOptions {
  rng?: () => number
}
