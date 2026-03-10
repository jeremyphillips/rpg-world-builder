import type { Character } from '@/features/character/domain/types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import { getSystemClass } from '@/features/mechanics/domain/core/rules/systemCatalog.classes';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds';
import type { SubclassSelection } from '@/features/content/classes/domain/types'

type FeatureRecord = Record<string, unknown>

function isEffectLike(obj: FeatureRecord): boolean {
  return typeof obj.kind === 'string'
}

/**
 * Recursively extract Effect objects from a subclass feature tree.
 *
 * A feature node can:
 *  - BE an effect itself (has `kind`) — push it
 *  - CONTAIN nested `.effects[]` — push each
 *  - CONTAIN nested `.features[]` — recurse
 *
 * Level-gated features are filtered by clsLevel.
 */
function extractEffects(node: FeatureRecord, clsLevel: number, out: Effect[]): void {
  const featureLevel = typeof node.level === 'number' ? node.level : 0
  if (featureLevel > clsLevel) return

  if (isEffectLike(node)) {
    out.push(node as unknown as Effect)
  }

  if (Array.isArray(node.effects)) {
    for (const e of node.effects as unknown[]) {
      if (e && typeof e === 'object' && isEffectLike(e as FeatureRecord)) {
        out.push(e as Effect)
      }
    }
  }

  if (Array.isArray(node.features)) {
    for (const child of node.features as FeatureRecord[]) {
      extractEffects(child, clsLevel, out)
    }
  }
}

/**
 * Convert base class proficiency entries into GrantEffects so they flow
 * through the engine alongside subclass grants.
 *
 * Reads the flat `proficiencies.weapons` / `proficiencies.armor` objects
 * from classes (ClassProficiencyWeapon / ClassProficiencyArmor).
 */
function collectBaseProficiencyEffects(character: Character): Effect[] {
  const effects: Effect[] = []

  for (const cls of character.classes ?? []) {
    if (!cls.classId) continue
    const classDef = getSystemClass(DEFAULT_SYSTEM_RULESET_ID, cls.classId)
    if (!classDef) continue

    const profs = classDef.proficiencies
    if (!profs || Array.isArray(profs)) continue

    const slots = ['weapons', 'armor'] as const
    const targetMap = { weapons: 'weapon', armor: 'armor' } as const

    for (const slot of slots) {
      const entry = profs[slot]
      if (!entry) continue

      const categories = entry.categories ?? []
      const items = entry.items ?? []

      if (categories.length > 0 || items.length > 0) {
        effects.push({
          kind: 'grant',
          grantType: 'proficiency',
          value: [{ target: targetMap[slot], categories, items }],
          source: `class:${cls.classId}`,
        } as Effect)
      }
    }
  }

  return effects
}

type ClassOption =
  | string
  | {
      id?: string
      features?: FeatureRecord[]
    }
    
function normalizeDefinitions(defs?: SubclassSelection) {
  if (!defs) return []
  return Array.isArray(defs) ? defs : [defs]
}

function optionId(opt: ClassOption): string | undefined {
  return typeof opt === 'string' ? opt : opt?.id
}

function optionFeatures(opt: ClassOption): FeatureRecord[] | undefined {
  return typeof opt === 'object' && opt && 'features' in opt ? opt.features : undefined
}

function resolveSelectedOption(
  options: ClassOption[],
  selectedId?: string | null
): ClassOption | undefined {
  if (!options.length) return undefined

  // If only one option exists, use it (nice for classes without choices)
  if (options.length === 1) return options[0]

  if (!selectedId) return undefined

  return options.find(o => optionId(o) === selectedId)
}

/**
 * Collect effects from character's class and subclass features.
 * Returns all effect kinds (modifier, formula, grant, etc.) — not filtered by target.
 */
export function collectClassEffects(
  character: Character
): Effect[] {
  const effects: Effect[] = []

  for (const cls of character.classes ?? []) {
    if (!cls.classId) continue
    const classDef = getSystemClass(DEFAULT_SYSTEM_RULESET_ID, cls.classId)
    if (!classDef) continue

    const clsLevel = (cls.level ?? character.totalLevel ?? 1) || 1

    // Base class features (e.g. Unarmored Defense, Extra Attack)
    const progFeatures = (classDef as any).progression?.features as FeatureRecord[] | undefined
    if (progFeatures) {
      for (const feat of progFeatures) {
        extractEffects(feat, clsLevel, effects)
      }
    }

    // Subclass / definition features
    const defs = normalizeDefinitions(classDef.definitions)
    const selectedId = cls.subclassId ?? null
    const defToUse =
      defs.find(d => d?.id && d.id === selectedId) ??
      defs[0]

    const options = defToUse?.options ?? []
    if (!options.length) continue

    const chosen = resolveSelectedOption(options, selectedId)
    const features = chosen ? optionFeatures(chosen) : undefined
    if (!features?.length) continue

    for (const feat of features) {
      extractEffects(feat, clsLevel, effects)
    }
  }

  return effects
}

function collectRaceEffects(_character: Character): Effect[] {
  return []
}

function collectActiveBuffsEffects(_character: Character): Effect[] {
  return []
}

function collectConditionsEffects(_character: Character): Effect[] {
  return []
}

/**
 * Gather intrinsic effects from a character: class, race, buffs, conditions.
 *
 * Equipment effects are handled separately via
 * getEquipmentEffects → selectActiveEquipmentEffects.
 */
export function collectIntrinsicEffects(character: Character): Effect[] {
  return [
    ...collectBaseProficiencyEffects(character),
    ...collectClassEffects(character),
    ...collectRaceEffects(character),
    ...collectActiveBuffsEffects(character),
    ...collectConditionsEffects(character),
  ]
}
