import type { PickerOption } from '@/ui/patterns/form/OptionPickerField'
import type { Location } from '@/features/content/locations/domain/model/location'

export type BuildParentLocationPickerOptionsArgs = {
  /** Exclude this id (e.g. current location when editing) */
  excludeLocationId?: string
}

/**
 * Builds option-picker rows for choosing a parent location from campaign locations.
 * Labels: "Name — scale"; description: ancestor path when available.
 */
export function buildParentLocationPickerOptions(
  locations: Location[],
  args: BuildParentLocationPickerOptionsArgs = {},
): PickerOption[] {
  const { excludeLocationId } = args
  const idToName = new Map(locations.map((l) => [l.id, l.name] as const))

  const filtered = excludeLocationId
    ? locations.filter((l) => l.id !== excludeLocationId)
    : locations

  return filtered.map((loc) => {
    const label = `${loc.name} — ${loc.scale}`
    const ancestorIds = loc.ancestorIds ?? []
    const ancestorPath =
      ancestorIds.length > 0
        ? ancestorIds.map((id) => idToName.get(id) ?? id).join(' › ')
        : undefined

    return {
      value: loc.id,
      label,
      description: ancestorPath,
      keywords: [loc.name, loc.scale, ...(loc.category ? [loc.category] : [])],
    }
  })
}
