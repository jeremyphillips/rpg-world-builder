/**
 * Canonical feat / content ids that grant hide-eligibility runtime flags.
 * Keep ids stable; align authored character `feats[]` and content packs with these values.
 *
 * **Half-cover hide (Skulker-style):** PHB Skulker — hide when only lightly obscured by dim light / foliage;
 * this engine maps the **half-cover** branch only via `allowHalfCoverForHide` (see sight-hide-rules).
 */
export const FEAT_IDS_ALLOW_HALF_COVER_FOR_HIDE: ReadonlySet<string> = new Set(['skulker'])

export function featGrantsAllowHalfCoverForHide(featId: string): boolean {
  return FEAT_IDS_ALLOW_HALF_COVER_FOR_HIDE.has(featId)
}
