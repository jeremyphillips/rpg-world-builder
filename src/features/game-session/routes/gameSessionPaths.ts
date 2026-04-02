export function campaignGameSessionsListPath(campaignId: string): string {
  return `/campaigns/${campaignId}/game-sessions`
}

export function campaignGameSessionPath(campaignId: string, gameSessionId: string): string {
  return `/campaigns/${campaignId}/game-sessions/${gameSessionId}`
}

export function campaignGameSessionLobbyPath(campaignId: string, gameSessionId: string): string {
  return `/campaigns/${campaignId}/game-sessions/${gameSessionId}/lobby`
}

export function campaignGameSessionSetupPath(campaignId: string, gameSessionId: string): string {
  return `/campaigns/${campaignId}/game-sessions/${gameSessionId}/setup`
}

export function campaignGameSessionPlayPath(campaignId: string, gameSessionId: string): string {
  return `/campaigns/${campaignId}/game-sessions/${gameSessionId}/play`
}
