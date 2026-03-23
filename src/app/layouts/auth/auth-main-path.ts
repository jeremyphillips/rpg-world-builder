/** Pathnames that use {@link AuthMainFocus} instead of {@link AuthMainChrome}. */
export function isAuthMainFocusPath(pathname: string): boolean {
  return /\/campaigns\/[^/]+\/encounter\/active/.test(pathname)
}
