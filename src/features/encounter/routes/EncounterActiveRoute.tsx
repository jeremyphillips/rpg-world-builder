import { useEncounterRuntime } from './EncounterRuntimeContext'
import { campaignEncounterSetupPath } from './encounterPaths'
import { useEncounterActivePlaySurface } from '../hooks/useEncounterActivePlaySurface'

export default function EncounterActiveRoute() {
  const runtime = useEncounterRuntime()
  return useEncounterActivePlaySurface(runtime, {
    setupPathWhenEmpty: runtime.campaignId ? campaignEncounterSetupPath(runtime.campaignId) : undefined,
  })
}
