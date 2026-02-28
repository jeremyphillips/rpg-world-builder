/** Single source of truth for platform admin detection on server. */
export function isPlatformAdmin(userRole: string | undefined | null): boolean {
  return userRole === 'superadmin'
}
