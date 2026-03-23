import { matchPath } from 'react-router-dom'
import { ROUTES } from '@/app/routes'

/** Pathnames that use {@link AuthMainFocus} instead of {@link AuthMainChrome}. */
export function isAuthMainFocusPath(pathname: string): boolean {
  return matchPath({ path: ROUTES.CAMPAIGN_ENCOUNTER, end: false }, pathname) != null
}
