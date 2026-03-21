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

**Caster options:** `ResolveCombatActionSelection` may include `casterOptions` (`Record<string, string>` keyed by authored field ids). Spell `resolution.casterOptions` is copied onto `CombatActionDefinition` by `buildSpellCombatActions`; encounter UI collects values before `resolveCombatAction` runs. `action-resolver` includes a formatted fragment in `action-declared` and spell `log-only` summaries (`formatCasterOptionSummary` in `mechanics/domain/spells/caster-options.ts`). For **summon spells**, enum options typically encode **form** (e.g. giant centipede vs spider) or **CR tier** (Conjure Minor Elementals / Woodland Beings); resolution will combine these with the monster catalog to pick stat blocks or random eligible creatures—see [§8 — Summon spells and spawn](#summon-spells-and-spawn) below.

**Action resolution modes:**

- `attack-roll` — roll d20 + attack bonus vs AC, apply damage and on-hit effects
- `auto-hit` — apply damage directly without attack roll or save. Supports HP-threshold gating and multi-instance sequences (e.g. Magic Missile darts)
- `saving-throw` — targets roll saves vs DC, apply damage (with half on save) and on-fail/on-success effects
- `effects` — apply effects directly to targets (no roll). Used for save-based spells, healing spells, and self-buff spells
- `log-only` — log the action with no mechanical resolution

**Action targeting kinds:**

- `single-target` — one living combatant (HP > 0) subject to policy below; weapon attacks and most offensive spells use this kind
- `all-enemies` — all living enemy combatants
- `self` — the acting combatant
- `none` — no creature target; used when the action does not select another combatant (e.g. **ally summon**). The resolver still runs the `effects` pipeline once, passing the **actor** into `applyActionEffects` for API compatibility; **`spawn`** should treat the actor as source only. Target picker has **no** candidates. Prefer over **`self`** for summons (caster is not the subject of the effect bundle like a self-buff).
- `single-creature` — any living combatant regardless of side (used by healing spells and other creature-targeting effects)
- `dead-creature` — combatant at 0 HP with a **valid body** (`remains` not `dust` or `disintegrated`; see `CombatantInstance` in encounter state). Used by resurrection and **Animate Dead** (often with `creatureTypeFilter`, e.g. humanoid). `creatureTypeFilter` is applied the same as for living targets.
- `entered-during-move` — creatures entered during movement

**Targeting profile fields:**

- `requiresWilling` — when `true` on `single-target`, valid targets are same-side only (caster + allies); “willing” is approximated as allies until explicit consent exists. Such actions are **non-hostile** for charm / hostile-action rules. Authored on spells via `targeting.requiresWilling` in spell effects.
- `requiresSight` — when `true` (spell `targeting.requiresSight` → `buildSpellCombatActions`), valid targets must pass `canSeeForTargeting` in `encounter/state/visibility-seams.ts`: not blinded (via `canSee`), invisible targets blocked unless the observer has the See Invisibility state, and LOS/LoE geometry stubs (currently always `true`). Not applied to `self`, `none`, or `all-enemies` (area mapping does not validate per-creature sight).
- `suppressSameSideHostileActions` — passed through `ResolveCombatActionOptions` (default **true** when omitted: legacy “no friendly fire”). When **true**, hostile `single-target` actions cannot target same-side combatants. When **false**, core resolution allows same-side targets (e.g. PC vs PC). Campaign/app code can drive this from `mechanics.combat.encounter.suppressSameSideHostile` on the ruleset.

**Targeting query layer** (`action-targeting.ts`):

Targeting validation is centralized so the resolver and UI share a single source of truth:

- `isValidActionTarget(state, combatant, actor, action, options?)` — predicate. Checks banished state, creature type filter, charmed exclusion, `requiresSight` (when set), HP alive/dead, `requiresWilling` (same-side), and optional same-side suppression for hostile `single-target` actions.
- `getActionTargetCandidates(state, actor, action, options?)` — returns all combatants that pass `isValidActionTarget`. **Initiative order** for most kinds; for **`dead-creature`**, also includes combatants in `combatantsById` that are **missing from `initiativeOrder`** (e.g. corpses dropped when a new round re-rolls initiative from living participants only in `advanceEncounterTurn`). Used by the UI to populate the target picker.
- `getActionTargets(state, actor, selection, action, options?)` — resolves the actual target(s) for a selected action. Handles selection-specific concerns (targetId lookup, `self` auto-targeting, no-target fallbacks) and delegates validation to `isValidActionTarget`.

**LOS / visibility seams** (`visibility-seams.ts`): `lineOfSightClear` and `lineOfEffectClear` are compatibility stubs returning `true` until grid or terrain exists. `canSeeForTargeting` is the single entry point for “can I select this target for a sight-required action?”; replace the stubs later without changing call sites.

### 4.5 Condition Consequence Framework

Condition consequences model the mechanical rules of each `EffectConditionId` as composable data primitives. Rather than scattering condition-specific `if` checks through action resolution code, each condition declares its consequences as a typed array, and derived query helpers combine active conditions into answers the resolution layer can consume.

**Directory:** `encounter/state/condition-rules/`

| Module | Responsibility |
|--------|----------------|
| `condition-consequences.types` | `ConditionConsequence` discriminated union and `ConditionRule` type |
| `condition-consequence-helpers` | Primitive consequence builders (`cannotAct`, `immobile`, `autoFailStrDexSaves`, etc.) for DRY composition |
| `condition-definitions` | `CONDITION_RULES` record mapping all 14 `EffectConditionId` values to their consequence arrays |
| `condition-queries` | Derived query helpers consumed by the resolution layer |

**Consequence kinds:**

- `action_limit` — cannot take actions and/or reactions (incapacitated, paralyzed, stunned, unconscious, petrified)
- `movement` — speed becomes zero or stand-up costs half movement (grappled, restrained, prone, paralyzed, stunned, unconscious, petrified)
- `attack_mod` — advantage or disadvantage on incoming or outgoing attacks, optionally scoped to melee/ranged (blinded, invisible, prone, restrained, poisoned, frightened, paralyzed, stunned, unconscious, petrified)
- `save_mod` — auto-fail, advantage, or disadvantage on specific ability saves (paralyzed, stunned, unconscious, petrified: auto-fail Str/Dex; restrained: disadvantage Dex)
- `check_mod` — advantage or disadvantage on ability checks (poisoned, frightened)
- `visibility` — cannot see or unseen by default (blinded, invisible)
- `speech` — cannot speak (paralyzed, stunned, unconscious, petrified)
- `awareness` — unaware of surroundings (unconscious, petrified)
- `crit_window` — incoming melee hits within distance become critical (paralyzed, unconscious)
- `source_relative` — cannot attack source, cannot move closer to source, while source in sight (charmed, frightened)
- `damage_interaction` — resistance or vulnerability to damage types (petrified: resistance to all)

**Derived queries:**

- `canTakeActions(combatant)` / `canTakeReactions(combatant)` — used by `createCombatantTurnResources` in `shared.ts`
- `getIncomingAttackModifiers(combatant, range)` / `getOutgoingAttackModifiers(combatant, range)` — flat condition-derived attack mods (no attacker/defender pairing).
- `getIncomingAttackModifiersForAttack(attacker, defender, range)` / `getOutgoingAttackModifiersForAttack(attacker, defender, range)` — used by `resolveRollModifier` in `action-resolver.ts`; suppresses invisible-related adv/disadv when the other combatant has the `see-invisibility` state.
- `autoFailsSave(combatant, ability)` / `getSaveModifiersFromConditions(combatant, ability)` — used by saving-throw resolution in `action-resolver.ts`
- `getSpeedConsequences(combatant)` — used by `createCombatantTurnResources` to zero movement for grappled, restrained, etc.
- `getDamageResistanceFromConditions(combatant, damageType?)` — used by `applyDamageToCombatant` to apply petrified resistance-to-all
- `incomingHitBecomesCrit(combatant, distanceFt?)` — available for future crit-window wiring when distance tracking exists
- `getConditionSourceIds(combatant, conditionLabel)` — returns all `sourceInstanceId` values for markers matching the given condition label
- `hasConditionFromSource(combatant, conditionLabel, sourceId)` — checks whether a specific source applied a specific condition
- `getSourceRelativeRestrictions(actor)` — returns `{ sourceId, cannotAttackSource, cannotMoveCloserToSource }[]` by combining `source_relative` consequences with marker source data
- `cannotTargetWithHostileAction(actor, targetId)` — returns `true` if any source-relative restriction prevents the actor from targeting `targetId` with a hostile action (e.g., charmed)
- `canSpeak(combatant)` — seam query; returns `false` when any active condition has a `speech.cannotSpeak` consequence
- `isAwareOfSurroundings(combatant)` — seam query; returns `false` when any active condition has an `awareness.unawareOfSurroundings` consequence
- `canSee(combatant)` — seam query; returns `false` when any active condition has a `visibility.cannotSee` consequence
- `getActiveConsequences(combatant)` — foundation helper that flattens all active conditions' consequences

**Integration points:**

- `shared.ts` `createCombatantTurnResources` — uses `canTakeActions`/`canTakeReactions` to disable actions for incapacitated, paralyzed, stunned, unconscious, and petrified. Uses `getSpeedConsequences` to zero movement for grappled, restrained, paralyzed, stunned, unconscious, and petrified.
- `action-resolver.ts` `resolveRollModifier` — combines spell/effect `RollModifierMarker` entries with condition-derived attack modifiers. Blinded, poisoned, prone, restrained, invisible, frightened, paralyzed, stunned, unconscious, and petrified now affect attack rolls.
- `action-resolver.ts` saving-throw resolution — checks `autoFailsSave` before rolling. Paralyzed, stunned, unconscious, and petrified combatants auto-fail Str/Dex saves. Restrained combatants roll Dex saves at disadvantage.
- `action-resolver.ts` attack-roll resolution — natural 20 = auto-hit + critical hit (doubled damage dice). Natural 1 = auto-miss.
- `damage-mutations.ts` `applyDamageToCombatant` — checks `getDamageResistanceFromConditions` after marker-based resistance. Petrified combatants have resistance to all damage types. **Charm Person (early end):** if the target has `charmed` with `sourceInstanceId` set to the charmer’s combatant id, and the damage source (`options.actorId` or `activeCombatantId`) is on the **same** `CombatantSide` as that charmer, the `charmed` marker(s) matching that rule are stripped and a `condition-removed` log line is emitted.
- `action-targeting.ts` `isValidActionTarget` — uses `cannotTargetWithHostileAction` (backed by `getSourceRelativeRestrictions`) to enforce the charmed targeting exclusion via the consequence framework instead of the ad-hoc `getCharmedSourceIds` helper.

**Consequence wiring status:**

*Supported now* — consequences with live integration points in the resolution layer:

- `action_limit` — `canTakeActions` / `canTakeReactions` consumed by `createCombatantTurnResources`
- `movement.speedBecomesZero` — `getSpeedConsequences` consumed by `createCombatantTurnResources`
- `attack_mod` — pair-aware helpers in `condition-queries.ts` consumed by `resolveRollModifier` (See Invisibility vs invisible)
- `save_mod` — `autoFailsSave` / `getSaveModifiersFromConditions` consumed by saving-throw resolution
- `damage_interaction` — `getDamageResistanceFromConditions` consumed by `applyDamageToCombatant`
- `source_relative` by source identity — `cannotTargetWithHostileAction` consumed by `isValidActionTarget` (charmed targeting exclusion)
- `speech` / `awareness` derived queries — `canSpeak`, `isAwareOfSurroundings` defined and exported; ready for consumption when verbal components, surprise, or perception are added

*Modeled but not enforced* — consequences and queries exist in the data layer but nothing in resolution reads them yet:

- `crit_window` (paralyzed, unconscious) — `incomingHitBecomesCrit` query exists but requires distance input. Currently only natural 20 triggers critical hits.
- `movement.standUpCostsHalfMovement` (prone) — consequence defined but movement spending is not granular enough to deduct half movement for standing.
- `check_mod` (poisoned, frightened) — consequences defined but ability checks are not part of encounter resolution. Relevant if contested checks (grapple escape, shove) are added.
- `visibility` — `canSee` seam query exists but has no mechanical consumer. Relevant when stealth, hiding, or heavily-obscured mechanics are added.

*Requires future subsystem* — consequences that depend on infrastructure not yet built:

- Line of sight / full visibility — frightened's `whileSourceInSight` gating and blinded sight-dependent check auto-fail need a `canSeeSource(combatant, sourceId)` predicate, which depends on position/LOS tracking.
- Distance / proximity — `crit_window` evaluation and frightened's `cannotMoveCloserToSource` both need distance between combatants (even a simple adjacency flag would unblock crit_window).
- Granular movement economy — prone stand-up cost and frightened movement restriction require movement spending to distinguish "standing up" and "approaching source" from general movement.

### 4.6 Debug Logging

The combat log supports three presentation modes: compact (headlines only), normal (headlines + supporting), and debug (all entries). Debug mode surfaces diagnostic information about how resolution decisions were derived.

**Pipeline:**

`CombatLogEvent` carries an optional `debugDetails?: string[]` field. The bridge (`toCombatLogEntry` in `combat-log-bridge.ts`) passes it through to `CombatLogEntry.debugDetails`. The UI renders debug details in monospace below the entry when debug mode is active.

**Formatting helpers** (`resolution-debug.ts`):

Pure formatting functions that take raw resolution data and return `string[]` for `debugDetails`. They use `getActiveConsequencesWithOrigin` to trace each modifier back to the originating condition ID.

| Helper | Emitted from | Shows |
|--------|-------------|-------|
| `formatAttackRollDebug` | attack-hit / attack-missed events | Roll mode, contributing roll-modifier markers, condition-derived attack modifiers with range |
| `formatAutoFailDebug` | save auto-fail events | Which conditions caused auto-fail and which abilities they cover |
| `formatSaveDebug` | save-roll events | Save roll mode and contributing condition modifiers |
| `formatDamageResistanceDebug` | damage-resistance notes | Which conditions provide resistance/vulnerability |
| `formatTurnResourceDebug` | noOp resource-blocked notes | Which conditions disabled the required turn resource |
| `formatConditionConsequencesDebug` | condition-applied events | Full consequence breakdown for the applied condition (action limits, movement, attack mods, save mods, speech, visibility, etc.) |
| `formatCombatantStatusSnapshot` | turn-started events | HP, conditions, states, concentration timer, disabled resources with originating conditions |
| `formatConcentrationTimer` | turn-ended events | Concentration spell name with elapsed/total time (e.g., `Banishment (12s/60s)`) |

**Integration points:**

- `action-resolver.ts` — attack-roll, save auto-fail, save-roll, and resource-blocked noOp events include `debugDetails`.
- `damage-mutations.ts` — condition-based resistance notes include `debugDetails`.
- `condition-mutations.ts` — condition-applied events include a consequence breakdown when the condition is a known `EffectConditionId`.
- `logging.ts` `createTurnStartedLog` — includes a combatant status snapshot (HP, conditions, states, concentration, disabled resources).
- `logging.ts` `createTurnEndedLog` — includes the concentration timer when the active combatant is concentrating.
- `appendEncounterNote` — accepts `debugDetails` in its options, allowing any call site to attach debug lines.

To add debug details to a new log event, format the relevant diagnostic data into `string[]` and pass it as `debugDetails` on the `CombatLogEvent`. The bridge and UI handle it automatically.

## 5. Extension Points

### Adding a new stat target

1. Add the target string to `StatTarget` in `types.ts`
2. Add base value logic to `getBaseStat` in `base-stat-resolver.ts`
3. Optionally add custom breakdown tokens in `stat-resolver.ts`

### Adding a new condition consequence

1. If the consequence kind already exists in `ConditionConsequence`, add it to the condition's entry in `CONDITION_RULES` in `condition-definitions.ts`. Use existing primitive builders from `condition-consequence-helpers.ts` where possible.
2. If a new consequence kind is needed, add a new interface to `condition-consequences.types.ts` and add it to the `ConditionConsequence` union.
3. Add a derived query helper in `condition-queries.ts` if the resolution layer needs to consume it (e.g., `canConcentrate(combatant)`).
4. Wire the query into the appropriate resolution code (action-resolver, shared, or action-effects).

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
  singleAttempt?: boolean;
  onFail?: { addCondition?: EffectConditionId; markerClassification?: string[] };
  autoSuccessIfImmuneTo?: ConditionImmunityId;
  outcomeTrack?: {
    successCountToEnd?: number;
    failCountToLock?: number;
    failLockStateId?: string;
  };
};
```

When `applyActionEffects` applies a condition or state with `repeatSave`, it registers a `RuntimeTurnHook` of type `repeat-save` on the target combatant. At the specified turn boundary, `executeTurnHooks` rolls the save vs the source's DC. On success, the linked condition/state is automatically removed and the hook is cleared.

**Default:** failed saves keep the condition and the hook fires again on later boundaries (save each turn until success). **`singleAttempt: true`:** one resolution at the next boundary; on success the interim condition is removed; on failure `onFail.addCondition` is applied (e.g. Sleep: `unconscious` with `markerClassification: ['sleep']`) and the hook is removed. **`autoSuccessIfImmuneTo`:** if the target has that condition immunity, the repeat save succeeds without rolling (mirrors `SaveEffect.autoSuccessIfImmuneTo` on the initial save). **`outcomeTrack`:** Contagion-style counting — `successCountToEnd` / `failCountToLock` with progress on `RuntimeTurnHook.repeatSaveProgress`; reaching the success threshold removes the linked condition and the hook; reaching the failure threshold removes the hook, keeps the condition, and optionally applies `failLockStateId` as a state marker.

Sleep unconscious created this way ends when the target takes damage (`applyDamageToCombatant` clears `unconscious` markers tagged with `sleep`). Shaking a creature awake within 5 feet is not automated.

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

### Spell combat adapter — resolution mode classification

`classifySpellResolutionMode` (in `src/features/encounter/helpers/spell-resolution-classifier.ts`) decides how `buildSpellCombatActions` builds each spell action:

- **`attack-roll`** — spell has `deliveryMethod` (`melee-spell-attack` or `ranged-spell-attack`); damage and on-hit riders come from the spell’s effects, but the primary hit uses the attack pipeline.
- **`effects`** — spell has at least one effect kind the adapter treats as mechanically actionable (e.g. `damage`, `save`, `hit-points`, `condition`, `state`, `roll-modifier`, `modifier`, `immunity`, `interval`, `remove-classification`, **`spawn`**), and effects are not **only** `note` and/or `targeting`. Spells with **`spawn`** use **`targeting: { kind: 'none' }`** (see [§8 — Summon spells and spawn](#summon-spells-and-spawn)).
- **`log-only`** — empty effects, only `note` / `targeting`, or only kinds such as `grant` / `move` that the encounter layer currently resolves as structured log output without the same mechanical path.

Multi-instance **auto-hit** spells authored with a single root `damage` effect and `instances.count` above 1 (no top-level `save`) are built as a **parent `effects` action with `sequence`** plus a child `effects` action per hit (same pattern as multi-beam spell attacks). Each child applies one damage resolution against the selected target until proper multi-target selection exists.

**HP threshold:** `CombatActionDefinition` may set `hpThreshold: { maxHp }` with `aboveThresholdEffects`. In `effects` resolution, if the target’s current HP is at or below `maxHp`, `action.effects` apply; otherwise `aboveThresholdEffects` apply (or none if omitted). Spells author this via `spell.resolution.hpThreshold` in [spell.types.ts](../../src/features/content/spells/domain/types/spell.types.ts) (e.g. Power Word Kill).

**Timed spell duration on effects:** `until-turn-boundary` spell durations map to the same-shaped effect duration; `timed` spell durations (minute/hour/day) map to `fixed` effect duration in **combat turns** via the same 6-second-per-turn heuristic used for concentration display, so modifiers and similar markers can tick down in encounter time.

**Spell level vs cantrips:** Authored `spell.level` is **0** for cantrips. For formulas that need a positive spell tier when slot level is not modeled, use `effectiveSpellLevelForScaling` in `spells/shared.ts` (**0 → 1**). Cantrip damage scaling by **character** level uses effect `levelScaling` / `cantripDamageScaling`, not that helper.

Behavioral tests in `encounter-helpers.test.ts` lock in representative routing; catalog-wide stranded counts are for manual or PR reporting, not CI thresholds.

**Equipment snapshot:** `CombatantInstance.equipment` mirrors character loadout (armor, weapons, shield) when built from PCs. **`patchCombatantEquipmentSnapshot`** merges a partial snapshot and removes `statModifiers` whose `eligibility.requiresUnarmored` no longer holds (e.g. Mage Armor after donning armor). Set `armor_class` modifiers with that eligibility store `armorClassBeforeApply` so AC can be restored. Encounter UI must invoke this (or rebuild combatants) when loadout changes—there is no automatic sync from the character sheet yet.

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
| `spawn` | **Partial** | When **`monstersById`**, **`buildSummonAllyCombatant`**, and resolved ids are available, **`applyActionEffects`** merges **`Monster`**-backed allies into the encounter (party side) with **`initiativeMode`**. Otherwise logs via **`describeResolvedSpawn`**. Classifier + adapter: **`effects`** + **`targeting: none`**. **`casterOptions`** are passed into spawn resolution for **`mapMonsterIdFromCasterOption`** / **`poolFromCasterOption`** (see [Summon spells and spawn](#summon-spells-and-spawn)). |

**Resolution levels:**

- **Full**: Mechanically resolved with state changes.
- **Partial**: Some sub-cases resolved, others degrade to log.
- **Handled**: Consumed elsewhere in the pipeline (not in `applyActionEffects`).
- **Log**: Structured summary logged to encounter log; no mechanical state changes.

### Summon spells and spawn

This subsection documents **intent and architecture** for ally summon spells. Implementation may lag; the [effects.md §13 `spawn`](./effects.md#spawn) entry stays aligned with runtime truth. Phased delivery: [`summon_spells_phased.plan.md`](../../.cursor/plans/summon_spells_phased.plan.md).

**Implemented path**

- **`mergeCombatantsIntoEncounter`** appends party combatants and sorts initiative; **`applyActionEffects`** runs **`spawn`** when effects resolve.
- **`ResolveCombatActionOptions`**: **`monstersById`**, **`buildSummonAllyCombatant`**, **`rng`**. **`ApplyActionEffectsOptions.casterOptions`** mirrors **`selection.casterOptions`** so enum choices feed **`resolveSpawnMonsterIds`**.
- **`SpawnEffect`**: **`monsterId`** / **`monsterIds`**, **`pool`**, **`mapMonsterIdFromCasterOption`**, **`poolFromCasterOption`**, **`initiativeMode`**.

**Remaining gaps**

- Higher-slot **count multipliers** for conjures (6th / 8th) and Animate Dead **+2 undead** are not yet applied to **`spawn.count`** / pool resolution.
- **Concentration** / dismissal at 0 HP (Phase 5 in the plan).

**Ally summon behavior**

- **Source of truth:** **`Monster.id`** from the merged catalog (`monstersById`), except legacy **`creature`** strings where needed.
- **Side:** allies use the party-side summon builder; they are merged as **party** combatants.
- **`casterOptions`:** map to explicit ids via **`mapMonsterIdFromCasterOption`**, or to **count + type + CR cap** via **`poolFromCasterOption`** (conjure tiers).
- **Random pools:** filter by `type` and `lore.challengeRating <= cap`; pick with encounter **`rng`**.
- **Initiative:** **`initiativeMode`** on **`SpawnEffect`** (`'group' | 'share-caster' | 'individual'`).

**Classifier / adapter**

- **`classifySpellResolutionMode`** treats **`spawn`** as actionable: **`effects`** actions with **`targeting: { kind: 'none' }`** — not **`self`**.

**Authoring examples (directional)**

- Animate Dead: enum → `skeleton` / `zombie` ids; scaling for extra creatures can follow later.
- Giant Insect: enum → `giant-centipede` / `giant-spider` / `giant-wasp`; initiative: **after caster** on same count.
- Conjure Woodland Beings / Minor Elementals: keep existing CR-tier enums; resolver picks random fey/elemental from the catalog under the tier cap.

## 9. Known Pressure Points

### Conditions vs states

`conditions` holds canonical status effects that participate broadly in mechanics (the SRD set: blinded, charmed, frightened, etc.). `states` holds encounter/runtime markers and custom flags that are not part of that canonical set (banished, concentrating, immune-to-X, etc.). New markers should follow this boundary so that code which iterates conditions for mechanical purposes does not accidentally pick up custom markers, and vice versa.

### Targeting families

Current targeting covers creature-selectable cases only. Future work will likely require separate handling for at least three targeting families:

- **Creature-selectable** — the current model. Actor picks one or more creatures from a candidate pool (single-target, all-enemies, single-creature, dead-creature, self).
- **Non-targeted** — **`none`**: no creature selected; used for summons and similar. Distinct from **`self`** (caster is not modeled as the “target” of the effect loop for UI semantics).
- **Event-driven** — targeting determined by a game event rather than player choice. `entered-during-move` is the current example. This should not be treated as a template for general creature-targeting abstraction.
- **Spatial/area** — point-and-shape selection (cone, sphere, line, cube) with inclusion/exclusion, friend/foe filtering, line-of-effect, and range. This is a qualitatively different problem from creature selection and should be designed as its own subsystem.

### Area spells vs `all-enemies` (friendly-fire gap)

Spells authored with **`creatures-in-area`** (and `targeting.area`) are **not** resolved with spatial inclusion. The spell combat adapter maps them to **`all-enemies`**: `getActionTargetCandidates` returns **all living enemy** combatants that satisfy `isValidActionTarget` (including charmed / hostile-action rules via `cannotTargetWithHostileAction`), and those targets receive the effect bundle.

**Limitations (by design today)**

- **No geometry** — no origin point, template, or per-creature “inside the AoE” test.
- **No friendly fire** — **allies are never** selected on this path, even when the spell’s rules allow or require hitting allies in the area. Mixed allegiance, “creatures you choose” inside a zone, and similar cases are **not** modeled.
- **No cover, line of effect, or selective exclusion** beyond what targeting predicates already express (e.g. `creatureTypeFilter`).

Authoring and content expectations: [effects.md — Area targeting and encounter combat (limitations)](./effects.md#area-targeting-and-encounter-combat-limitations).

If the creature-selectable kind union (`single-target`, `all-enemies`, etc.) grows beyond its current six members — especially if new kinds overlap with existing ones (e.g., `single-ally` vs `single-creature`) — consider decomposing into dimensional fields (allegiance, lifeState, cardinality) rather than continuing to extend the flat union.

### "Condition" is overloaded

Three distinct concepts share the term "condition" in this codebase:

- **Status condition** — a canonical mechanical status on a combatant (blinded, charmed, etc.). Typed as `EffectConditionId`.
- **Effect condition / predicate** — a boolean expression that gates whether an effect applies. Typed as `Condition` in `conditions/condition.types.ts`.
- **Form/display condition** — a UI visibility rule for form fields. Typed as `Condition` in `ui/patterns/form/conditions.ts`.

Any future naming cleanup should address all three usages together rather than renaming one in isolation.

### Stable ids over labels

Targeting checks, condition/state queries, and authored rule matching should rely on stable machine ids rather than display labels. Where existing code matches on `label` strings (e.g., `s.label === 'banished'`), treat those as interim shortcuts and prefer typed ids when the relevant type surface is extended.

## 10. Recommended Next Steps

### Low-cost wiring (no new subsystem needed)

These items can be connected to existing resolution code with minimal new surface.

- **Wire `canSpeak` / `isAwareOfSurroundings` into action availability or spell component validation** — the queries exist and are exported. Once verbal spell components or surprise mechanics are added, they become immediate consumers.
- **Wire `canSee` into targeting or action-availability guards** — e.g., blinded creatures auto-fail ability checks requiring sight, once ability check resolution exists.
- **Unconscious on-apply state transitions** — when the unconscious condition is applied, 5e rules dictate the creature drops prone and drops whatever it is holding. These are one-time transitions, not ongoing consequences, and should be handled in `addConditionToCombatant` in `condition-mutations.ts`.
- **Wire `check_mod` if contested checks are added** — poisoned and frightened already declare disadvantage on ability checks. Adding grapple escape or shove resolution would be the natural trigger.

### Subsystem-gated wiring

These items are modeled and queryable but blocked on infrastructure that does not exist yet.

- **Condition-based critical hits** — `incomingHitBecomesCrit` is ready to call. Needs a distance or adjacency input. Even a simple `isWithinMeleeRange(attackerId, targetId, state): boolean` seam with a temporary `return true` default for the current simplified encounter model would unblock it.
- **Prone stand-up cost** — `standUpCostsHalfMovement` is defined. Needs movement spending to distinguish "standing up" from general movement.
- **Frightened source-relative effects** — `cannotMoveCloserToSource` needs movement/proximity tracking. `whileSourceInSight` gating needs a `canSeeSource(combatant, sourceId)` predicate. Until then, frightened disadvantage is applied unconditionally (more restrictive than 5e).
- **Full visibility mechanics** — blinded/invisible integration into stealth, hiding, and heavily-obscured rules depends on line-of-sight and position tracking.
