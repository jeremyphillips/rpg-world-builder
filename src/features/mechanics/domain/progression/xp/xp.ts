// XP-for-level lookups across all D&D editions.
//
// Two XP models:
//   Universal (3e, 3.5e, 4e, 5e): one table for all classes.
//   Class-specific (OD&D, Basic, 1e, 2e): per-class XP curves.
//
// Aliases are resolved before lookup so callers can pass either form.

import { editions } from '@/data/editions/editions'
import { getById } from '@/domain/lookups'
import type { EditionId, Edition } from '@/data'
import { resolveClassId } from '../reference/classAliases'

export const getLevelForXp = (
  xp: number,
  editionId: EditionId,
  classId?: string,
): number => {
  const edition = getById<Edition>(editions, editionId)
  if (!edition?.progression) return 1

  const { progression } = edition
  const maxLevel = progression.maxLevel ?? 20

  if (progression.classExperience && classId) {
    const canonicalId = resolveClassId(classId)
    const classTable = progression.classExperience[canonicalId]

    if (classTable) {
      for (let lvl = maxLevel; lvl >= 1; lvl--) {
        const entry = classTable.find(e => e.level === lvl)
        if (entry && xp >= entry.xpRequired) return lvl
      }
      return 1
    }
  }

  if (progression.experience) {
    for (let lvl = maxLevel; lvl >= 1; lvl--) {
      const entry = progression.experience.find(e => e.level === lvl)
      if (entry && xp >= entry.xpRequired) return lvl
    }
  }

  return 1
}

export const getXpByLevelAndEdition = (
  level: number,
  editionId: EditionId,
  classId?: string
): number => {
  const edition = getById<Edition>(editions, editionId)
  if (!edition?.progression) return 0

  const { progression } = edition
  const maxLevel = progression.maxLevel ?? 20
  const targetLevel = Math.min(Math.max(1, level), maxLevel)

  if (progression.classExperience && classId) {
    const canonicalId = resolveClassId(classId)
    const classTable = progression.classExperience[canonicalId]

    if (classTable) {
      const entry = classTable.find(e => e.level === targetLevel)
      return entry?.xpRequired ?? 0
    }
  }

  if (progression.experience) {
    const entry = progression.experience.find(e => e.level === targetLevel)
    return entry?.xpRequired ?? 0
  }

  return 0
}
