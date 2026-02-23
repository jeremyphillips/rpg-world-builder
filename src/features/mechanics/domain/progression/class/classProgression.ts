// Cross-edition class progression conversions.

import { classes } from '@/data'
import type { EditionId } from '@/data'
import type {
  ClassProgression,
  AttackProgression,
  ClassFeature,
} from '@/data/classes/types'
import { getById } from '@/domain/lookups'

// ---------------------------------------------------------------------------
// Subclass feature extraction (for UI display)
// ---------------------------------------------------------------------------

export type SubclassFeature = {
  name: string
  level: number
  description?: string
}

/**
 * Extract displayable subclass features for a given class + subclass + edition.
 * Only returns features with a human-readable name, filtered by character level.
 */
export function getSubclassFeatures(
  classId: string | undefined,
  classDefinitionId: string | undefined,
  edition: EditionId | string | undefined,
  characterLevel: number
): SubclassFeature[] {
  if (!classId || !classDefinitionId || !edition) return []

  const cls = getById(classes, classId)
  if (!cls) return []

  const def = cls.definitions?.find((d) => d.edition === edition)
  if (!def?.options) return []

  const subclass = def.options.find((o) => o.id === classDefinitionId)
  if (!subclass?.features) return []

  return subclass.features
    .filter((f) => typeof f.name === 'string')
    .map((f) => ({
      name: f.name!,
      level: f.level ?? def.selectionLevel ?? 1,
      description: typeof f.description === 'string' ? f.description : undefined,
    }))
    .filter((f) => f.level <= characterLevel)
}

// ---------------------------------------------------------------------------
// Core Class Progression — edition-agnostic intermediate representation
// ---------------------------------------------------------------------------

export interface CoreClassProgression {
  hitDie: number
  hpPerLevel: number
  attackProgression: AttackProgression
  primaryAbilities: string[]
  armorProficiency: string[]
  weaponProficiency: string[]
  savingThrows: string[]
  spellcasting: string
  features: CoreFeature[]
}

export interface CoreFeature {
  level: number
  name: string
  description?: string
}

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Get progression entry for a given class + edition */
export function getClassProgression(
  classId?: string,
  edition?: EditionId | string
): ClassProgression | undefined {
  if (!classId || !edition) return undefined
  const cls = getById(classes, classId)
  if (!cls?.progression) return undefined
  return cls.progression.find((p) => p.edition === edition)
}

/** Get all progression entries for a given class */
export function getClassProgressionsByClass(
  classId?: string
): ClassProgression[] {
  if (!classId) return []
  const cls = getById(classes, classId)
  return cls?.progression ?? []
}

// ---------------------------------------------------------------------------
// Edition → Core converters
// ---------------------------------------------------------------------------

function convert5eToCore(prog: ClassProgression): CoreClassProgression {
  return {
    hitDie: prog.hitDie,
    hpPerLevel: Math.floor(prog.hitDie / 2) + 1,
    attackProgression: prog.attackProgression,
    primaryAbilities: prog.primaryAbilities,
    armorProficiency: prog.armorProficiency,
    weaponProficiency: prog.weaponProficiency,
    savingThrows: prog.savingThrows ?? [],
    spellcasting: prog.spellcasting ?? 'none',
    features: (prog.features ?? []).map(featureToCore),
  }
}

function convert4eToCore(prog: ClassProgression): CoreClassProgression {
  const estimatedHitDie = prog.hpPerLevel ? prog.hpPerLevel * 2 : 8

  const savingThrows: string[] = []
  if (prog.fortitudeBonus && prog.fortitudeBonus > 0) savingThrows.push('str', 'con')
  if (prog.reflexBonus && prog.reflexBonus > 0) savingThrows.push('dex')
  if (prog.willBonus && prog.willBonus > 0) savingThrows.push('wis')
  const saves = savingThrows.slice(0, 2)

  return {
    hitDie: estimatedHitDie,
    hpPerLevel: prog.hpPerLevel ?? Math.floor(estimatedHitDie / 2) + 1,
    attackProgression: prog.attackProgression,
    primaryAbilities: prog.primaryAbilities,
    armorProficiency: prog.armorProficiency,
    weaponProficiency: prog.weaponProficiency,
    savingThrows: saves,
    spellcasting: prog.powerSource === 'Arcane' || prog.powerSource === 'Divine'
      ? 'full'
      : 'none',
    features: (prog.features ?? []).map(featureToCore),
  }
}

function convert2eToCore(prog: ClassProgression): CoreClassProgression {
  const savingThrows = derive2eSavingThrows(prog)

  return {
    hitDie: prog.hitDie,
    hpPerLevel: Math.floor(prog.hitDie / 2) + 1,
    attackProgression: prog.attackProgression,
    primaryAbilities: prog.primaryAbilities,
    armorProficiency: prog.armorProficiency,
    weaponProficiency: prog.weaponProficiency,
    savingThrows,
    spellcasting: 'none',
    features: (prog.features ?? []).map(featureToCore),
  }
}

function convert1eToCore(prog: ClassProgression): CoreClassProgression {
  return convert2eToCore(prog)
}

function convertClassicToCore(prog: ClassProgression): CoreClassProgression {
  return {
    hitDie: prog.hitDie,
    hpPerLevel: Math.floor(prog.hitDie / 2) + 1,
    attackProgression: prog.attackProgression,
    primaryAbilities: prog.primaryAbilities,
    armorProficiency: prog.armorProficiency,
    weaponProficiency: prog.weaponProficiency,
    savingThrows: [],
    spellcasting: 'none',
    features: [],
  }
}

// ---------------------------------------------------------------------------
// Derive 2e saving throw mapping
// ---------------------------------------------------------------------------

function derive2eSavingThrows(prog: ClassProgression): string[] {
  if (!prog.saves2e) return []

  const categories = [
    { cat: 'ppd', val: prog.saves2e.ppd[0], maps: 'con' },
    { cat: 'rsw', val: prog.saves2e.rsw[0], maps: 'wis' },
    { cat: 'pp', val: prog.saves2e.pp[0], maps: 'str' },
    { cat: 'bw', val: prog.saves2e.bw[0], maps: 'dex' },
    { cat: 'sp', val: prog.saves2e.sp[0], maps: 'int' },
  ]

  categories.sort((a, b) => a.val - b.val)
  const seen = new Set<string>()
  const saves: string[] = []
  for (const c of categories) {
    if (!seen.has(c.maps)) {
      seen.add(c.maps)
      saves.push(c.maps)
    }
    if (saves.length >= 2) break
  }
  return saves
}

// ---------------------------------------------------------------------------
// Public conversion API
// ---------------------------------------------------------------------------

const CLASSIC_EDITIONS = new Set<string>(['becmi', 'bx', 'b', 'odd'])

export function progressionToCore(prog: ClassProgression): CoreClassProgression {
  const edition = prog.edition as string

  if (edition === '5e') return convert5eToCore(prog)
  if (edition === '4e') return convert4eToCore(prog)
  if (edition === '2e') return convert2eToCore(prog)
  if (edition === '1e') return convert1eToCore(prog)
  if (CLASSIC_EDITIONS.has(edition)) return convertClassicToCore(prog)

  return {
    hitDie: prog.hitDie || 8,
    hpPerLevel: prog.hpPerLevel ?? (Math.floor((prog.hitDie || 8) / 2) + 1),
    attackProgression: prog.attackProgression,
    primaryAbilities: prog.primaryAbilities,
    armorProficiency: prog.armorProficiency,
    weaponProficiency: prog.weaponProficiency,
    savingThrows: prog.savingThrows ?? [],
    spellcasting: prog.spellcasting ?? 'none',
    features: (prog.features ?? []).map(featureToCore),
  }
}

export function classToCore(
  classId: string,
  edition: EditionId | string
): CoreClassProgression | undefined {
  const prog = getClassProgression(classId, edition)
  if (!prog) return undefined
  return progressionToCore(prog)
}

export function compareClassAcrossEditions(
  classId: string,
  editionA: EditionId | string,
  editionB: EditionId | string
): { a: CoreClassProgression; b: CoreClassProgression } | undefined {
  const a = classToCore(classId, editionA)
  const b = classToCore(classId, editionB)
  if (!a || !b) return undefined
  return { a, b }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function featureToCore(f: ClassFeature): CoreFeature {
  return { level: f.level, name: f.name, description: f.description }
}
