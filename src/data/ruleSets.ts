// ---------------------------------------------------------------------------
// Ruleset types
// ---------------------------------------------------------------------------

export type AttackResolution = 'to_hit' | 'thac0' | 'matrix'

export type DerivedCombat = {
  attackResolution: AttackResolution
  thac0?: number
  savingThrows?: Record<string, number>
  armorClass: number
}

export type Progression = Record<string, unknown>

export type JsonPatch = unknown
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export type ContentPolicy = {
  /** `true` = allow everything from the system catalog; string[] = allow only these ids */
  allow: string[] | true
  /** Per-id overrides applied on top of the system entry (shallow merge) */
  overrides?: Record<string, DeepPartial<Record<string, unknown>>>
  /** Brand-new campaign-specific resources keyed by id */
  custom?: Record<string, unknown>
}

export type RulesetContent = {
  classes: ContentPolicy
  races: ContentPolicy
  equipment: ContentPolicy
  spells: ContentPolicy
  monsters: ContentPolicy
}

export type Ruleset = {
  _id: string
  campaignId: string
  meta: {
    name: string
    basedOn?: string
    version: number
  }
  content: RulesetContent
  mechanics: {
    progression: Progression
    combat: DerivedCombat
  }
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

export const ruleSets: Ruleset[] = [
  {
    _id: 'testruleset01',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    meta: { name: '5e Ruleset', basedOn: '5e', version: 1 },
    content: {
      classes:    { allow: true },
      races:      { allow: true },
      equipment:  { allow: true },
      spells:     { allow: true },
      monsters:   { allow: true },
    },
    mechanics: {
      progression: {},
      combat: {
        armorClass: 10,
        attackResolution: 'to_hit',
      },
    },
  },
]

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export const ruleSetsById: Record<string, Ruleset> = Object.fromEntries(
  ruleSets.map(r => [r._id, r]),
)

export const defaultRulesetId = 'testruleset01'

export const defaultRuleset: Ruleset = ruleSetsById[defaultRulesetId]
