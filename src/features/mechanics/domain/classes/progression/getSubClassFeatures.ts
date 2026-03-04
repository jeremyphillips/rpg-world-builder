import { getById } from '@/utils'
import { classes } from '@/data'
import type { SubclassFeature } from '@/data/classes.types'

// ---------------------------------------------------------------------------
// Subclass feature extraction (for UI display)
// ---------------------------------------------------------------------------

/**
 * Extract displayable subclass features for a given class + subclass + edition.
 * Only returns features with a human-readable name, filtered by character level.
 */
export function getSubclassFeatures(
  classId: string | undefined,
  classDefinitionId: string | undefined,
  characterLevel: number
): SubclassFeature[] {
  if (!classId || !classDefinitionId) return [];

  const cls = getById(classes, classId);
  if (!cls) return [];

  const def = Array.isArray(cls.definitions) ? cls.definitions[0] : cls.definitions;
  if (!def?.options) return [];

  const subclass = def.options.find((o: any) => o?.id === classDefinitionId);
  if (!subclass?.features) return [];

  return subclass.features
    .filter((f: any) => typeof f?.name === 'string')
    .map((f: any) => ({
      name: f.name!,
      level: f.level ?? def.selectionLevel ?? 1,
      description: typeof f.description === 'string' ? f.description : undefined,
    }))
    .filter((f: SubclassFeature) => f.level <= characterLevel);
}