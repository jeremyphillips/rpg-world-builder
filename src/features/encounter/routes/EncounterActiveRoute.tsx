import { ActivePlayPageShell } from '@/ui/patterns'

import { useEncounterRuntime } from './EncounterRuntimeContext'
import { campaignEncounterSetupPath } from './encounterPaths'
import { useEncounterActivePlaySurface } from '../hooks/useEncounterActivePlaySurface'

export default function EncounterActiveRoute() {
  const runtime = useEncounterRuntime()
  return (
    <ActivePlayPageShell>
      {useEncounterActivePlaySurface(runtime, {
        setupPathWhenEmpty: runtime.campaignId ? campaignEncounterSetupPath(runtime.campaignId) : undefined,
      })}
    </ActivePlayPageShell>
  )
}
