import type { CampaignViewer } from '../types/campaign.types'

/**
 * Centralized capability helpers for campaign-scoped access control.
 *
 * Pure functions — no framework dependencies — usable by both client and server.
 *
 * Platform admin bypass never depends on campaign membership.
 */

import type { ViewerCampaignRole } from '../types/campaign.types'

export interface ViewerContext {
  campaignRole: ViewerCampaignRole | null
  isOwner: boolean
  isPlatformAdmin: boolean
  characterIds: string[]
}

const DM_LEVEL_ROLES: ReadonlySet<string> = new Set(['dm', 'co_dm'])

export function toViewerContext(
  viewer: CampaignViewer | null | undefined,
  characterIds: string[] = [],
): ViewerContext {
  return {
    campaignRole: viewer?.campaignRole ?? null,
    isOwner: Boolean(viewer?.isOwner),
    isPlatformAdmin: Boolean(viewer?.isPlatformAdmin),
    characterIds,
  };
}

export function canBypassVisibility(ctx: ViewerContext): boolean {
  return (
    ctx.isPlatformAdmin ||
    ctx.isOwner ||
    (ctx.campaignRole !== null && DM_LEVEL_ROLES.has(ctx.campaignRole))
  )
}

export function canViewDmScoped(ctx: ViewerContext): boolean {
  return canBypassVisibility(ctx)
}

/**
 * Whether the viewer may see **detail meta** rows gated as `dm-or-platformOwner`
 * (DM / co-DM or platform admin — not campaign owner alone).
 */
export function canViewDetailMetaDmOrPlatformOwner(
  viewer: Partial<Pick<ViewerContext, 'isPlatformAdmin' | 'campaignRole'>> | null | undefined,
): boolean {
  if (!viewer) return false
  if (viewer.isPlatformAdmin) return true
  return viewer.campaignRole != null && DM_LEVEL_ROLES.has(viewer.campaignRole)
}

export function canViewRestricted(
  ctx: ViewerContext,
  allowCharacterIds: string[],
): boolean {
  if (canBypassVisibility(ctx)) return true
  if (allowCharacterIds.length === 0) return false
  return ctx.characterIds.some((id) => allowCharacterIds.includes(id))
}

export function intersects(a: string[], b: string[]): boolean {
  const set = new Set(b)
  return a.some((id) => set.has(id))
}

/**
 * Session visibility check.
 *
 * When `allCharacters` is true the session is visible to every campaign member.
 * Otherwise only characters listed in `characterIds` (plus privileged users) can see it.
 */
export function canViewSession(
  ctx: ViewerContext,
  visibility: { allCharacters: boolean; characterIds: string[] } | undefined,
): boolean {
  if (canBypassVisibility(ctx)) return true
  if (!visibility || visibility.allCharacters) return true
  if (visibility.characterIds.length === 0) return false
  return intersects(ctx.characterIds, visibility.characterIds)
}

/**
 * Full content visibility check that replaces the scattered role comparisons.
 *
 * Mirrors the logic of `canUserViewContent` in accessPolicy.ts but uses
 * the new ViewerContext shape instead of a flat ContentViewerRole.
 */
export function canViewContent(
  ctx: ViewerContext,
  policy: { scope: string; allowCharacterIds?: string[] } | undefined,
): boolean {
  if (canBypassVisibility(ctx)) return true
  if (!policy || policy.scope === 'public') return true
  if (policy.scope === 'dm') return false

  // restricted
  const allowed = policy.allowCharacterIds ?? []
  if (allowed.length === 0) return false
  return intersects(ctx.characterIds, allowed)
}

export function canManageContent(ctx: ViewerContext): boolean {
  return ctx.isOwner || (ctx.campaignRole !== null && DM_LEVEL_ROLES.has(ctx.campaignRole));
}

/** @deprecated Use canManageContent instead. Will be removed in a future build. */
export const canManageCampaignContent = canManageContent

export function getCapabilities(ctx: ViewerContext) {
  return {
    canBypassVisibility: canBypassVisibility(ctx),
    canViewDmScoped: canViewDmScoped(ctx),
    canManageContent: canManageContent(ctx),
  };
}