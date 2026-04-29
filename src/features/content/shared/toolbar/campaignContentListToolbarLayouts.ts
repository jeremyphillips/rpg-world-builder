import type { AppDataGridToolbarLayout } from '@/ui/patterns';
import type { ContentListPreferencesKey } from '@/shared';

import { CLASS_LIST_TOOLBAR_LAYOUT } from '@/features/content/classes/domain/list';
import { SPELL_LIST_TOOLBAR_LAYOUT } from '@/features/content/spells/domain/list';
import { RACE_LIST_TOOLBAR_LAYOUT } from '@/features/content/races/domain/list';
import { MONSTER_LIST_TOOLBAR_LAYOUT } from '@/features/content/monsters/domain/list';
import { LOCATION_LIST_TOOLBAR_LAYOUT } from '@/features/content/locations/domain/list';
import { SKILL_PROFICIENCY_LIST_TOOLBAR_LAYOUT } from '@/features/content/skillProficiencies/domain/list';
import { GEAR_LIST_TOOLBAR_LAYOUT } from '@/features/content/equipment/gear/domain/list';
import { ARMOR_LIST_TOOLBAR_LAYOUT } from '@/features/content/equipment/armor/domain/list';
import { WEAPON_LIST_TOOLBAR_LAYOUT } from '@/features/content/equipment/weapons/domain/list';
import { MAGIC_ITEM_LIST_TOOLBAR_LAYOUT } from '@/features/content/equipment/magicItems/domain/list';

/**
 * Canonical toolbar layouts for campaign content lists, keyed by `preferences.ui.contentLists` keys.
 * Domain modules remain the source definitions; this map ties prefs persistence to layout in one place.
 */
export const CAMPAIGN_CONTENT_LIST_TOOLBAR_LAYOUT_BY_PREFS_KEY = {
  classes: CLASS_LIST_TOOLBAR_LAYOUT,
  spells: SPELL_LIST_TOOLBAR_LAYOUT,
  races: RACE_LIST_TOOLBAR_LAYOUT,
  monsters: MONSTER_LIST_TOOLBAR_LAYOUT,
  locations: LOCATION_LIST_TOOLBAR_LAYOUT,
  skillProficiencies: SKILL_PROFICIENCY_LIST_TOOLBAR_LAYOUT,
  gear: GEAR_LIST_TOOLBAR_LAYOUT,
  armor: ARMOR_LIST_TOOLBAR_LAYOUT,
  weapons: WEAPON_LIST_TOOLBAR_LAYOUT,
  magicItems: MAGIC_ITEM_LIST_TOOLBAR_LAYOUT,
} as const satisfies Record<ContentListPreferencesKey, AppDataGridToolbarLayout>;

export function getCampaignContentListToolbarLayout(
  key: ContentListPreferencesKey,
): AppDataGridToolbarLayout {
  return CAMPAIGN_CONTENT_LIST_TOOLBAR_LAYOUT_BY_PREFS_KEY[key];
}
