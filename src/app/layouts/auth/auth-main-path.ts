/** Pathnames that use {@link AuthMainFocus} instead of {@link AuthMainChrome}. */
export function isAuthMainFocusPath(pathname: string): boolean {
  return (
    /\/campaigns\/[^/]+\/encounter\/active/.test(pathname) ||
    /\/campaigns\/[^/]+\/game-sessions\/[^/]+\/play\/?$/.test(pathname) ||
    /\/campaigns\/[^/]+\/world\/locations\/new/.test(pathname) ||
    /\/campaigns\/[^/]+\/world\/locations\/[^/]+\/edit/.test(pathname)
  )
}
