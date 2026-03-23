import { Navigate } from 'react-router-dom'

import { campaignEncounterActivePath, campaignEncounterSetupPath } from './encounterPaths'
import { useEncounterRuntime } from './EncounterRuntimeContext'

export default function EncounterIndexRedirect() {
  const { encounterState, campaignId } = useEncounterRuntime()
  if (!campaignId) return null
  if (encounterState) return <Navigate to={campaignEncounterActivePath(campaignId)} replace />
  return <Navigate to={campaignEncounterSetupPath(campaignId)} replace />
}
