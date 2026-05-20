import { Outlet } from 'react-router-dom'
import { CharacterProviders } from './CharacterProviders'

/** Router layout: `/characters` routes (no socket/messaging). */
export default function CharacterProvidersLayout() {
  return (
    <CharacterProviders>
      <Outlet />
    </CharacterProviders>
  )
}
