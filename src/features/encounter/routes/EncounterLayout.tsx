import { Outlet } from 'react-router-dom'

import { EncounterRuntimeProvider } from './EncounterRuntimeContext'

export default function EncounterLayout() {
  return (
    <EncounterRuntimeProvider>
      <Outlet />
    </EncounterRuntimeProvider>
  )
}
