# Resolution Architecture Reference

## 1. Purpose and Scope

The resolution system computes derived mechanical values (armor class, hit points, attack bonuses, damage, initiative) from creature data and authored effects.

It serves two distinct resolution paradigms:

- **Stat resolution** (pure): `(context, effects) -> StatResult`
- **Action resolution** (state reducer): `(encounterState, selection) -> encounterState`

Both paradigms share engines, types, and the builder pattern for input assembly.

## 2. Domain Vocabulary

- **Creature** — umbrella term for anything with ability scores, HP, and level. Includes characters and monsters.
- **Character** — PC or NPC. Has equipment, loadout, and intrinsic class/race effects.
- **Monster** — monster stat block. Pre-computed abilities, no equipment system.

Creature-level functions are the shared base. Character-specific logic layers on top. Monster consumers use the creature builder directly.

## 3. Directory Layout

```
src/features/mechanics/domain/resolution/
├── index.ts                           # Public barrel
├── types.ts                           # StatTarget, BreakdownToken, StatResult
├── engines/
│   ├── condition.engine.ts            # Evaluate effect conditions
│   ├── formula.engine.ts             # Resolve formula values (base + ability + proficiency)
│   ├── modifier.engine.ts            # Resolve modifier values (add, set, multiply)
│   └── dice.engine.ts                # Dice rolling, damage expression parsing
├── resolvers/
│   ├── base-stat-resolver.ts         # Unmodified base values (before effects)
│   ├── stat-resolver.ts              # Full stat resolution pipeline with breakdowns
│   ├── attack-resolver.ts            # Weapon attack bonus and damage resolution
│   └── initiative-resolver.ts        # Initiative rolling and tiebreaker sorting
├── selection/
│   └── formula-selection.ts          # Formula selection strategy (5e: max wins)
└── builders/
    ├── types.ts                      # ResolutionInput, CreatureResolutionShape
    ├── buildCreatureResolutionInput.ts  # Shared base for any creature
    └── buildCharacterResolutionInput.ts # Extends creature with character concerns

src/features/mechanics/domain/encounter/resolution/
├── index.ts                           # Encounter resolution barrel
├── combat-action.types.ts            # CombatActionDefinition, profiles, costs
├── action-resolution.types.ts        # Selection and options types
├── action-resolution.ts              # Re-export barrel (backwards compat)
├── initiative-resolution.ts          # Re-export from resolution/resolvers/
├── initiative-resolution.types.ts    # Re-export from resolution/resolvers/
└── action/
    ├── action-resolver.ts            # Combat action orchestrator
    ├── action-cost.ts                # Turn resource management
    ├── action-targeting.ts           # Target selection and sequence steps
    └── action-effects.ts             # Effect application to encounter state
```

## 4. Layers

### 4.1 Engines (pure computation, no domain knowledge)

Engines are stateless functions that evaluate a single concern:

| Engine | Responsibility |
|--------|----------------|
| `formula.engine` | Resolve formula values: base + ability modifier + proficiency + per-level |
| `modifier.engine` | Resolve modifier values and build breakdown tokens |
| `condition.engine` | Evaluate authored conditions against an EvaluationContext |
| `dice.engine` | Parse damage expressions, roll dice, compute totals |

### 4.2 Resolvers (domain-aware pipelines)

Resolvers compose engines into resolution pipelines:

| Resolver | Input | Output |
|----------|-------|--------|
| `base-stat-resolver` | `(target, context)` | Base value before effects |
| `stat-resolver` | `(target, context, effects)` | Value + breakdown tokens |
| `attack-resolver` | `(context, weapon, effects, options)` | Attack bonus + damage results |
| `initiative-resolver` | `(participants, options)` | Sorted initiative rolls |

**Stat resolution flow:**

1. Compute base value via `getBaseStat`
2. If formula effects exist for the target, resolve each and use the highest
3. Apply additive modifiers
4. Apply set modifiers (last wins, replaces everything)
5. Apply multiply modifiers
6. Return `{ value, breakdown }`

### 4.3 Builders (domain objects -> ResolutionInput)

Builders transform domain objects into `ResolutionInput = { context, effects }`:

```
buildCreatureResolutionInput(creature, effects?)
  └── Maps CreatureResolutionShape to EvaluationContext
  └── Used directly by monster consumers

buildCharacterResolutionInput(character, catalog?)
  └── Calls buildCharacterContext (anti-corruption layer)
  └── Collects intrinsic effects (class, race, buffs, conditions)
  └── Resolves equipment effects for active loadout
  └── Returns context + merged effects
```

### 4.4 Action Resolution (encounter state reducer)

The encounter action system resolves combat actions against encounter state:

| Module | Responsibility |
|--------|----------------|
| `action-resolver` | Orchestrates action resolution: validates, targets, resolves, updates state |
| `action-cost` | Turn resource management: spend/check action, bonus action, reaction, movement |
| `action-targeting` | Target selection: self, all-enemies, single-target; sequence step counts |
| `action-effects` | Applies effects to encounter state: damage, conditions, saves, immunities, movement |

**Action resolution modes:**

- `attack-roll` — roll d20 + attack bonus vs AC, apply damage and on-hit effects
- `saving-throw` — targets roll saves vs DC, apply damage (with half on save) and on-fail/on-success effects
- `effects` — apply effects directly to targets (no roll)
- `log-only` — log the action with no mechanical resolution

## 5. Extension Points

### Adding a new stat target

1. Add the target string to `StatTarget` in `types.ts`
2. Add base value logic to `getBaseStat` in `base-stat-resolver.ts`
3. Optionally add custom breakdown tokens in `stat-resolver.ts`

### Adding a new effect kind

1. Define the effect shape in `effects.types.ts`
2. If it modifies stats: handle in `stat-resolver.ts` (formula or modifier)
3. If it applies during combat: handle in `action-effects.ts`

### Adding a new action resolution mode

1. Add the mode string to `CombatActionResolutionMode` in `combat-action.types.ts`
2. Add a branch in `action-resolver.ts` `resolveCombatActionInternal`

### Adding a new entity type

1. Create a builder (e.g., `buildSummonResolutionInput`) that calls `buildCreatureResolutionInput`
2. Layer entity-specific effects on top
3. All existing resolvers work unchanged

### Edition-specific rules

- Swap `formula-selection.ts` strategy for different formula competition rules
- Extend builders with edition configuration to change base values or proficiency scaling

## 6. Key Types

```typescript
type ResolutionInput = {
  context: EvaluationContext
  effects: Effect[]
}

type CreatureResolutionShape = {
  id: string
  level: number
  hp: number
  hpMax: number
  hitDie?: DieFace
  abilities: AbilityScoreMapResolved
  conditions?: string[]
  creatureType?: string
  resources?: Record<string, number>
  equipment?: { ... }
  flags?: Record<string, boolean>
}

type StatResult = {
  value: number
  breakdown: BreakdownToken[]
}

type BreakdownToken = {
  label: string
  value: string
  type: 'proficiency' | 'ability' | 'dice' | 'modifier' | 'damage_type' | 'formula'
}
```

## 7. Consumer Patterns

### Character stat resolution

```typescript
import { buildCharacterResolutionInput, resolveStat } from '@/features/mechanics/domain/resolution'

const { context, effects } = buildCharacterResolutionInput(character)
const ac = resolveStat('armor_class', context, effects)
```

### Monster attack resolution

```typescript
import { buildCreatureResolutionInput, resolveWeaponAttackBonus } from '@/features/mechanics/domain/resolution'

const { context } = buildCreatureResolutionInput(monsterShape)
const result = resolveWeaponAttackBonus(context, weaponInput, effects, options)
```

### Combat stats with additional effects (magic items, enchantments)

```typescript
const base = buildCharacterResolutionInput(character, { armorById: catalog.armorById })
const allEffects = [...base.effects, ...enchantmentEffects, ...magicItemEffects]
const result = resolveStatDetailed('armor_class', base.context, allEffects)
```
