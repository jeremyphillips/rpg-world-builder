import { editions, settings } from '@/data'
import type { OverrideConfig } from '@/data'
import type { EditionId, SettingId } from '@/data/types'
import { resolveClassId } from '@/features/mechanics/domain/progression/reference/classAliases'

type OptionType = 'races' | 'classes'

/**
 * Get available options for a given edition and setting.
 *
 * @deprecated Use named functions from `@/features/mechanics/domain/character-build/options`
 * instead: `getAllowedRaceIds`, `getAllowedClassIds`, or the draft-first variants.
 */
export const getOptions = (
  type: OptionType,
  editionId?: EditionId,
  settingId?: SettingId
): string[] => {
  if (!editionId) return []

  const edition = editions.find(e => e.id === editionId)
  if (!edition) return []

  // Start with the edition's base list
  let options = [...(edition[type] || [])]

  const setting = settingId ? settings.find(c => c.id === settingId) : null

  const overrides: OverrideConfig | undefined =
    type === 'races' ? setting?.raceOverrides : setting?.classOverrides

  if (overrides) {
    // "only" takes priority
    if (overrides.only) {
      options = [...overrides.only]
    } else {
      // Remove any options listed in "remove"
      if (overrides.remove) {
        options = options.filter(o => !overrides.remove!.includes(o))
      }

      // Add any options listed in "add"
      if (overrides.add) {
        options = Array.from(new Set([...options, ...overrides.add]))
      }
    }
  }

  // Resolve edition-specific class IDs to canonical catalog IDs
  if (type === 'classes') {
    options = options.map(resolveClassId)
  }

  return options
}
