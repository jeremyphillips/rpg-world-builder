import type { CharacterQueryContext } from './characterQueryContext.types'
import { getOwnedIdsForContentType } from './selectors/inventory.selectors'

/**
 * Campaign content list keys that have a single {@link CharacterQueryContext} ownership slice.
 * Aligns with `ContentListPreferencesKey` entries that use party ownership filters.
 */
export type CampaignContentListOwnershipKey =
  | 'spells'
  | 'skillProficiencies'
  | 'weapons'
  | 'armor'
  | 'gear'
  | 'magicItems'

/**
 * Resolves the owned content id set for a campaign list from the character query layer.
 * Use for PC-owned UI and DM “owned by character” filters — do not re-derive per route.
 */
export function getOwnedIdsForCampaignContentListKey(
  ctx: CharacterQueryContext,
  key: CampaignContentListOwnershipKey,
): ReadonlySet<string> {
  switch (key) {
    case 'spells':
      return ctx.spells.knownSpellIds
    case 'skillProficiencies':
      return ctx.proficiencies.skillIds
    case 'weapons':
    case 'armor':
    case 'gear':
    case 'magicItems':
      return getOwnedIdsForContentType(ctx, key)
    default: {
      const _exhaustive: never = key
      return _exhaustive
    }
  }
}
