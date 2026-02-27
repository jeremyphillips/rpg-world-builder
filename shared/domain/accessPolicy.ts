/**
 * Single source of truth for content access-policy evaluation.
 *
 * Imported by both the client (via @/shared/domain/accessPolicy) and the
 * server (via ../../shared/domain/accessPolicy).
 */

export type AccessPolicyScope = 'public' | 'dm' | 'restricted';

export interface AccessPolicy {
  scope: AccessPolicyScope;
  allowCharacterIds?: string[];
  allowFactionIds?: string[];
}

export type ContentViewerRole = 'admin' | 'dm' | 'pc' | 'observer';

/**
 * Determines whether a user can view a content item given its access policy.
 *
 * Bypass: admin and dm roles always return true.
 * Public:  everyone can view.
 * DM:      only admin/dm (handled by bypass above).
 * Restricted: true only when the user owns a character listed in
 *   `allowCharacterIds`; empty list means no non-privileged user can view.
 * Missing/undefined policy is treated as public.
 */
export function canUserViewContent(params: {
  policy: AccessPolicy | undefined;
  userRole: ContentViewerRole;
  userCharacterIds: string[];
}): boolean {
  const { policy, userRole, userCharacterIds } = params;

  if (userRole === 'admin' || userRole === 'dm') return true;

  if (!policy || policy.scope === 'public') return true;

  if (policy.scope === 'dm') return false;

  // restricted
  const allowed = policy.allowCharacterIds ?? [];
  if (allowed.length === 0) return false;
  return userCharacterIds.some(id => allowed.includes(id));
}
