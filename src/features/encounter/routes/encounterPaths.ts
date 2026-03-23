/** Campaign-scoped encounter URLs (concrete ids, not :id patterns). */
export function campaignEncounterPath(campaignId: string): string {
  return `/campaigns/${campaignId}/encounter`
}

export function campaignEncounterSetupPath(campaignId: string): string {
  return `/campaigns/${campaignId}/encounter/setup`
}

export function campaignEncounterActivePath(campaignId: string): string {
  return `/campaigns/${campaignId}/encounter/active`
}
