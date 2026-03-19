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
├── index.ts                           # Encounter resolution barrel (re-exports initiative from resolution/)
├── combat-action.types.ts            # CombatActionDefinition, profiles, costs
├── action-resolution.types.ts        # Selection and options types
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
| `action-targeting` | Shared targeting query layer: `isValidActionTarget` (predicate), `getActionTargetCandidates` (candidate list for UI), `getActionTargets` (resolved targets for action resolution); sequence step counts |
| `action-effects` | Applies effects to encounter state: damage, healing, conditions (with repeat-save hooks), states, saves, modifiers (AC add/set, speed add/set/multiply, resistance add), roll-modifiers (advantage/disadvantage), immunities, intervals (registered as turn hooks), damage resistance markers, movement, and advanced effect logging (trigger, activation, check, grant, form) |

**Action resolution modes:**

- `attack-roll` — roll d20 + attack bonus vs AC, apply damage and on-hit effects
- `auto-hit` — apply damage directly without attack roll or save. Supports HP-threshold gating and multi-instance sequences (e.g. Magic Missile darts)
- `saving-throw` — targets roll saves vs DC, apply damage (with half on save) and on-fail/on-success effects
- `effects` — apply effects directly to targets (no roll). Used for save-based spells, healing spells, and self-buff spells
- `log-only` — log the action with no mechanical resolution

**Action targeting kinds:**

- `single-target` — one enemy combatant (opposite side, HP > 0)
- `all-enemies` — all living enemy combatants
- `self` — the acting combatant
- `single-creature` — any living combatant regardless of side (used by healing spells and other creature-targeting effects)
- `dead-creature` — any combatant at 0 HP regardless of side (used by resurrection spells)
- `entered-during-move` — creatures entered during movement

**Targeting query layer** (`action-targeting.ts`):

Targeting validation is centralized so the resolver and UI share a single source of truth:

- `isValidActionTarget(combatant, actor, action)` — pure predicate. Checks banished state, creature type filter, charmed exclusion, HP alive/dead, and side filtering for a single combatant.
- `getActionTargetCandidates(state, actor, action)` — returns all combatants that pass `isValidActionTarget`, in initiative order. Used by the UI to populate the target picker.
- `getActionTargets(state, actor, selection, action)` — resolves the actual target(s) for a selected action. Handles selection-specific concerns (targetId lookup, `self` auto-targeting, no-target fallbacks) and delegates validation to `isValidActionTarget`.

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

### Adding concentration tracking

Concentration is tracked on `CombatantInstance` via a `ConcentrationState`:

```typescript
type ConcentrationState = {
  spellId: string;
  spellLabel: string;
  linkedMarkerIds: string[];
  remainingTurns?: number; // encounter-scoped, see note below
};
```

**Wiring:**

- When a concentration spell is cast, `resolveCombatAction` (in `action-resolver.ts`) calls `setConcentration` after effects resolve, passing the IDs of all markers created by `applyActionEffects`.
- `applyActionEffects` returns `{ state, createdMarkerIds }` — the IDs of conditions, states, statModifiers, rollModifiers, damageResistanceMarkers, and turnHooks created during effect application.
- `setConcentration` establishes concentration, automatically dropping any previous concentration (and cleaning up linked markers).
- `dropConcentration` removes concentration state and cleans up all linked markers (conditions, states, statModifiers, rollModifiers, turnHooks, damageResistanceMarkers) on both the caster and all other combatants.
- When a concentrating combatant takes damage, `applyDamageToCombatant` triggers a CON save (DC = max(10, damage/2)). On failure, concentration drops.

**Duration tracking:**

- `remainingTurns` is decremented at the caster's turn-end via `tickConcentrationDuration` (called from `advanceEncounterTurn`). When it reaches 0, concentration drops automatically.
- The spell combat adapter pre-computes `concentrationDurationTurns` from the spell's `TimedDuration` (1 minute = 10 turns, 1 hour = 600 turns at 6 seconds per turn). Indefinite durations (`until-dispelled`, `until-triggered`, `special`) omit `remainingTurns`.
- `remainingTurns` is encounter-scoped. When a non-encounter consumer needs spell duration tracking (exploration timers, world clock), refactor to store a canonical `{ value, unit }` duration alongside or instead of `remainingTurns`, with a shared `durationToRounds()` utility.

**UI:**

- `collectPresentableEffects` derives a "Concentrating" presentable effect from `combatant.concentration`, mapped to the `concentrating` entry in `COMBAT_STATE_UI_MAP` (`critical-now` section, `info` tone, `showAsChip`).
- Preview cards (`AllyCombatantActivePreviewCard`, `OpponentCombatantActivePreviewCard`, `CombatTargetPreviewCard`) show a "Concentrating" chip when `combatant.concentration` is set.

To add new linked effects to concentration cleanup, include their identifiers in `linkedMarkerIds` when calling `setConcentration`.

### Adding ongoing/interval effects

Ongoing effects are resolved via `RuntimeTurnHook`s on `CombatantInstance`:

- **Interval effects** (e.g., Moonbeam, Spirit Guardians) are registered as turn hooks by `applyActionEffects` when the `interval` effect is applied.
- **State ongoing effects** (e.g., Flaming Sphere) are also registered as turn hooks from `state.ongoingEffects`.

Turn hooks fire at `turn-start` or `turn-end` and apply their nested effects (damage, saves, conditions) to the combatant. The hook includes `sourceId` to trace back to the originating spell or action.

To add a new ongoing effect pattern:

1. Author it as an `interval` or `state` effect with `ongoingEffects`.
2. The existing turn hook infrastructure will register and fire it automatically.
3. For custom timing or logic, add a new hook type to `RuntimeTurnHook`.

### Adding repeat saves

Conditions and states can include a `repeatSave` field:

```typescript
repeatSave?: {
  ability: AbilityRef;
  timing: 'turn-start' | 'turn-end';
};
```

When `applyActionEffects` applies a condition or state with `repeatSave`, it registers a `RuntimeTurnHook` of type `repeat-save` on the target combatant. At the specified turn boundary, `executeTurnHooks` rolls the save vs the source's DC. On success, the linked condition/state is automatically removed.

### Adding damage resistance

`DamageResistanceMarker` on `CombatantInstance` tracks active damage resistances and vulnerabilities:

```typescript
type DamageResistanceMarker = {
  damageType: string;
  level: 'resistance' | 'vulnerability' | 'immunity';
  sourceId: string;
  label: string;
};
```

Modifier effects with `target: 'resistance'` register markers via `applyActionEffects`. The `applyDamageToCombatant` function checks for active resistance/vulnerability markers and halves or doubles matching damage before applying.

### Adding HP-threshold gating

`CombatActionDefinition` supports `hpThreshold` for conditional effect application:

```typescript
hpThreshold?: { maxHp: number };
aboveThresholdEffects?: Effect[];
```

During `auto-hit` resolution, the engine checks the target's current HP against `hpThreshold.maxHp`. If below or equal, the main `effects` are applied. If above, `aboveThresholdEffects` are applied instead. The spell adapter reads `spell.resolution.hpThreshold` and maps it to the action definition.

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

### Healing spell resolution

Healing spells are authored with `hit-points` effects and resolved through the `effects` action resolution mode. The spell adapter injects the caster's spellcasting ability modifier when `abilityModifier` is `true`, and the action effects engine rolls the dice and applies healing via `applyHealingToCombatant`.

```typescript
import { buildSpellCombatActions, getCharacterSpellcastingStats } from '@/features/encounter/helpers'

const stats = getCharacterSpellcastingStats(character, ruleset)
const actions = buildSpellCombatActions({
  runtimeId,
  spellIds: character.spells,
  spellsById: catalog.spellsById,
  spellSaveDc: stats.spellSaveDc,
  spellAttackBonus: stats.spellAttackBonus,
  spellcastingAbilityModifier: stats.spellcastingAbilityModifier,
  casterLevel: character.level,
})
```

Healing actions use `targeting: { kind: 'single-creature' }`, which allows any living combatant (ally, enemy, or self) as a target. The encounter UI shows all living combatants as valid targets when a `single-creature` action is selected.

## 8. Supported Effect Matrix

How each effect kind is resolved at runtime by `action-effects.ts`:

| Effect Kind | Resolution | Notes |
|-------------|-----------|-------|
| `damage` | **Full** | Rolls dice expression, applies to target HP; respects active damage resistance markers |
| `save` | **Full** | Target rolls ability save vs DC; gates subsequent effects |
| `condition` | **Full** | Applies/removes conditions on target; `repeatSave` registers turn hooks for automatic save-or-remove |
| `hit-points` | **Full** | Rolls healing dice, applies via `applyHealingToCombatant`; supports `abilityModifier` injection |
| `state` | **Full** | Sets state flags; registers `ongoingEffects` as turn hooks; supports `repeatSave` |
| `note` | **Full** | Logs text; `category` distinguishes `under-modeled` from `flavor` |
| `targeting` | **Handled** | Consumed by the action resolver for target selection, not by `applyActionEffects` |
| `modifier` | **Partial** | `armor_class` (add/set), `speed` (add/set/multiply), and `resistance` (add) fully resolved; other targets log gracefully |
| `roll-modifier` | **Full** | Registers `RollModifierMarker` on target; applied during attack-roll and saving throw resolution |
| `interval` | **Full** | Registers `RuntimeTurnHook` for per-turn effect application |
| `immunity` | **Partial** | `spell` and `source-action` scopes resolved; other scopes log |
| `move` | **Log** | Logs structured summary (direction, distance); no position tracking |
| `death-outcome` | **Log** | Logs outcome description |
| `trigger` | **Log** | Logs trigger condition and linked effects |
| `activation` | **Log** | Logs activation cost and linked effects |
| `check` | **Log** | Logs ability check requirement |
| `grant` | **Log** | Logs granted capability |
| `form` | **Log** | Logs form change description |
| `spawn` | **Log** | Logs summoned creature description |

**Resolution levels:**

- **Full**: Mechanically resolved with state changes.
- **Partial**: Some sub-cases resolved, others degrade to log.
- **Handled**: Consumed elsewhere in the pipeline (not in `applyActionEffects`).
- **Log**: Structured summary logged to encounter log; no mechanical state changes.
