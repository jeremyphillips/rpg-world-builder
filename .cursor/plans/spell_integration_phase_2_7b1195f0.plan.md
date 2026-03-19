---
name: Spell Integration Phase 2
overview: Split large files into focused modules, then continue spell effect integration across ~101 remaining stubs and ~35 partial spells, with targeted engine extensions for repeat saves, damage resistance, and auto-hit resolution.
todos:
  - id: phase-1a-split-encounter-helpers
    content: Split encounter-helpers.ts (987 lines) into spell-combat-adapter.ts, monster-combat-adapter.ts, combatant-builders.ts; update barrel and verify tests
    status: pending
  - id: phase-1b-split-runtime
    content: Split runtime.ts (683 lines) into marker-lifecycle.ts, turn-hooks.ts, and slimmed runtime.ts; update barrel
    status: pending
  - id: phase-1c-split-mutations
    content: Split mutations.ts (573 lines) into damage-mutations.ts, condition-mutations.ts, modifier-mutations.ts, concentration-mutations.ts; update barrel
    status: pending
  - id: phase-1d-split-spell-data
    content: Split spell data files exceeding ~400 lines into alphabetical halves; parent files re-export merged arrays
    status: pending
  - id: phase-2-utility-stubs
    content: Author structured effects for ~40 utility/exploration/social stub spells (detection, creation, social, summoning)
    status: done
  - id: phase-3-repeat-saves
    content: Add repeatSave field to condition/state effects; implement repeat-save turn hook; upgrade ~15 partial spells
    status: done
  - id: phase-4-resistance
    content: Add DamageResistanceMarker to CombatantInstance; wire resistance/vulnerability into damage application; upgrade ~10 spells
    status: done
  - id: phase-5-combat-stubs
    content: Author structured effects for ~60 remaining combat-adjacent stub spells (save+condition, area control, attack-roll, buff)
    status: done
  - id: phase-6-auto-hit
    content: Add auto-hit resolution mode, HP-threshold gating, and contest/check resolution; upgrade Magic Missile, Power Words, Counterspell
    status: done
  - id: phase-7-reduce-undermodeled
    content: Systematically convert under-modeled notes to structured effects or reclassify as flavor; target ~60% reduction
    status: done
  - id: phase-8-docs
    content: Update effects.md scaling tiers and resolution.md supported effect matrix to reflect all Phase 2 changes
    status: done
isProject: false
---

# Spell Resolution Integration — Phase 2

## Current State (Post Phase 1)

- **~73 spells** have structured effects (23 original + 50 authored in Phase 1)
- **~101 spells** remain as note-only stubs (`log-only`)
- **~35 spells** are partial — structured effects but with `category: 'under-modeled'` notes
- **0 spells** use `resolution.caveats`

**Engine support:**

- Full: `save`, `damage`, `hit-points`, `condition`, `state`, `modifier` (AC add/set, speed add), `roll-modifier`, `immunity` (spell/source-action), `interval`, concentration tracking
- Log-only: `note`, `move`, `trigger`, `activation`, `check`, `grant`, `form`, `death-outcome`
- Unsupported: `formula`, `resource`, `containment`, `visibility-rule`, `hold-breath`, `tracked-part`, `extra-reaction`, `action`, `spawn`, `aura`, `custom`

---

## Phase 1: Split Large Files

Prerequisite for clean subsequent work. Split files that have crossed ~400 lines into focused modules with clear single responsibilities.

### 1a. Split `encounter-helpers.ts` (987 lines)

[encounter-helpers.ts](src/features/encounter/helpers/encounter-helpers.ts) mixes four unrelated concerns. Split into:

- `**spell-combat-adapter.ts`** — `classifySpellResolutionMode`, `buildSpellCombatActions`, `buildSpellAttackAction`, `buildSpellEffectsAction`, and injection helpers (`injectSpellSaveDc`, `injectHealingAbilityModifier`, `injectSpellEffectDuration`, `resolveInstanceCount`, `buildSpellTargeting`, `buildSpellActionCost`, `resolveSpellUsage`, `findSpellDamageEffect`)
- `**monster-combat-adapter.ts`** — `resolveMonsterWeaponAttack`, `buildMonsterAttackEntries`, `buildMonsterActionDefinition`, `buildMonsterExecutableActions`, `buildMonsterEffectLabels`, `buildTurnHooksFromEffects`
- `**combatant-builders.ts`** — `buildCharacterCombatantInstance`, `buildMonsterCombatantInstance`, `buildAttackActions`, shared helpers (`formatRuntimeLabel`, `formatSigned`, `toSavingThrowModifier`, `formatAuthoredDamage`)
- `**encounter-helpers.ts`** — re-exports from the three new modules + retains `getCharacterSpellcastingStats` and `buildSpellDisplayMeta`, `buildSpellLogText`

Update [encounter-helpers/index.ts](src/features/encounter/helpers/index.ts) barrel. Verify test file [encounter-helpers.test.ts](src/features/encounter/helpers/encounter-helpers.test.ts) imports still resolve.

### 1b. Split `runtime.ts` (683 lines)

[runtime.ts](src/features/mechanics/domain/encounter/state/runtime.ts) handles marker lifecycle, turn hooks, encounter creation, and turn advance. Split into:

- `**marker-lifecycle.ts`** — `tickMarkers`, `tickRuntimeEffects`, `tickStatModifiers`, `processMarkerBoundary`, `processRuntimeEffectBoundary`, `processTrackedPartTurnEnd`
- `**turn-hooks.ts`** — `executeTurnHooks` (already a self-contained unit)
- `**runtime.ts**` — retains `createEncounterState`, `advanceEncounterTurn`, `resetCombatantTurnState`, `processActionRecharge`, `buildAliveInitiativeParticipants`, `formatRuntimeEffectLabel`. Imports from the extracted modules.

Update [state/index.ts](src/features/mechanics/domain/encounter/state/index.ts) barrel.

### 1c. Split `mutations.ts` (573 lines)

[mutations.ts](src/features/mechanics/domain/encounter/state/mutations.ts) has six distinct mutation categories. Split into:

- `**damage-mutations.ts**` — `applyDamageToCombatant`, `applyHealingToCombatant` (these share concentration-check logic)
- `**condition-mutations.ts**` — `addConditionToCombatant`, `removeConditionFromCombatant`, `addStateToCombatant`, `removeStateFromCombatant`
- `**modifier-mutations.ts**` — `applyStatModifierToStats`, `reverseStatModifierFromStats`, `addStatModifierToCombatant`, `expireStatModifier`, `addRollModifierToCombatant`
- `**concentration-mutations.ts**` — `setConcentration`, `dropConcentration`
- `**mutations.ts**` — retains `updateEncounterCombatant` and re-exports from the extracted modules

### 1d. Split spell data files

All ten spell data files (`cantrips.ts` through `level9.ts`) are 324-1245 lines. Split each file that exceeds ~400 lines into two halves at the nearest alphabetical boundary, producing files like:

- `level1-a-l.ts` + `level1-m-z.ts` (from 1245 lines)
- `level2-a-f.ts` + `level2-g-z.ts` (from 1181 lines)
- Same pattern for levels 3-6, cantrips

Each half exports a named array (e.g., `SPELLS_LEVEL_1_A_L`). The parent `level1.ts` re-exports the merged array:

```typescript
import { SPELLS_LEVEL_1_A_L } from './level1-a-l';
import { SPELLS_LEVEL_1_M_Z } from './level1-m-z';
export const SPELLS_LEVEL_1: readonly SpellEntry[] = [...SPELLS_LEVEL_1_A_L, ...SPELLS_LEVEL_1_M_Z];
```

[spells/index.ts](src/features/mechanics/domain/rulesets/system/spells/index.ts) stays unchanged — it already imports `SPELLS_LEVEL_N` from each level file.

Files under ~400 lines (level7, level8, level9) can stay as-is.

---

## Phase 2: Author Utility and Exploration Stubs (Pure Authoring)

**Engine work:** None.

Convert ~40 remaining utility/exploration spells from note-only stubs to structured effects. These spells are predominantly non-combat and will resolve as `effects` mode or remain `log-only` but with properly categorized notes:

- **Detection spells** (Detect Evil and Good, Detect Magic, Detect Poison and Disease, Detect Thoughts, Clairvoyance, Arcane Eye, Find the Path, etc.) — `state` effect with `stateId` + `flavor` notes
- **Creation/manipulation** (Create Food and Water, Fabricate, Creation, Continual Flame, etc.) — `note` with `flavor` category
- **Movement/transportation** (Dimension Door, Etherealness, Misty Step candidates, Expeditious Retreat, etc.) — `state` + `modifier` (speed) where applicable
- **Social/mental** (Charm Person, Command, Calm Emotions, Suggestion, etc.) — `save` + `condition` where applicable; `under-modeled` notes for behavioral restrictions
- **Summoning** (Conjure Animals, Conjure Elemental, Conjure Fey, Find Familiar, Find Steed, etc.) — `spawn`/`note` with `under-modeled` for stat block summoning

**Estimated yield:** ~40 spells move from `stub` to `partial` or `full`. Running total: ~113 spells with structured effects.

---

## Phase 3: Engine — Repeat Saves and Conditional Expiry

**Problem:** ~15 partial spells have `under-modeled` notes like "repeat save at end of each turn" (Hold Monster, Flesh to Stone, Phantasmal Killer, Fear, Slow, Confusion, Power Word Stun, etc.).

**Engine work in [action-effects.ts](src/features/mechanics/domain/encounter/resolution/action/action-effects.ts):**

- When a `condition` or `state` effect includes a `repeatSave` field, register a `RuntimeTurnHook` that rolls the save at the specified timing (`turn-end` typically) and removes the condition on success.
- Requires a new optional field on `ConditionEffect` and/or `StateEffect`:

```typescript
repeatSave?: {
  ability: AbilityRef;
  timing: 'turn-start' | 'turn-end';
};
```

**Engine work in [turn-hooks.ts](src/features/mechanics/domain/encounter/state/turn-hooks.ts)** (after Phase 1 split):

- `executeTurnHooks` gains a `repeat-save` hook type that rolls the save and removes the linked condition/state on success.

**Unlocked upgrades:** ~15 spells move from `partial` to `full` or have fewer `under-modeled` notes.

---

## Phase 4: Engine — Damage Resistance and Vulnerability

**Problem:** ~10 partial spells reference resistance (Protection from Energy, Stoneskin) or vulnerability. Currently `modifier` with a damage-type value is unsupported.

**Engine work:**

- Extend `applyDamageToCombatant` in [damage-mutations.ts](src/features/mechanics/domain/encounter/state/damage-mutations.ts) (after Phase 1 split) to check for active resistance/vulnerability markers before applying damage
- Add a `DamageResistanceMarker` type on `CombatantInstance`:

```typescript
type DamageResistanceMarker = {
  damageType: string;
  level: 'resistance' | 'vulnerability' | 'immunity';
  sourceId: string;
  label: string;
};
```

- Wire `modifier` effects with `target: 'damage_resistance'` or an `immunity` with `scope: 'damage-type'` to register resistance markers
- Damage application halves (resistance) or doubles (vulnerability) matching damage

**Unlocked upgrades:** Protection from Energy, Stoneskin, and several monster traits move from `under-modeled` to fully resolved.

---

## Phase 5: Author Remaining Combat Stubs

**Engine work:** None (leverages Phases 3-4).

Convert remaining ~60 combat-adjacent stub spells:

- **Save + condition (behavioral):** Blindness/Deafness, Bestow Curse, Dominate Beast/Person/Monster, Compulsion — `save` + `condition` with repeat saves (Phase 3)
- **Area control:** Black Tentacles, Antilife Shell, Wall of Force — `state` + `targeting` + `under-modeled` notes
- **Attack-roll spells:** Chromatic Orb, Acid Arrow — `deliveryMethod` + `damage`
- **Buff/utility with combat effect:** Aid (max HP increase), False Life (temp HP), Death Ward, Freedom of Movement — `modifier` or `state`
- **Concentration-dependent:** Many of these are concentration spells; now tracked via Phase 1 infrastructure

**Estimated yield:** ~60 more spells get structured effects. Running total: ~173 spells (of ~273) with structured effects.

---

## Phase 6: Engine — Auto-Hit and HP-Threshold Resolution

**Problem:** Magic Missile (auto-hit, split damage), Power Word Kill/Heal (HP threshold gate), Counterspell/Dispel Magic (ability check contest).

**Engine work:**

- Add `auto-hit` resolution mode in [action-resolver.ts](src/features/mechanics/domain/encounter/resolution/action/action-resolver.ts) — skip attack roll, apply damage directly
- Add `hpThreshold` field support on `CombatActionDefinition` — gate effect application on target HP
- Add `contest` resolution mode or `check` effect resolution — opposing ability checks

**Adapter work:**

- `classifySpellResolutionMode` gains an `auto-hit` branch (when spell has damage but no `deliveryMethod` and no top-level `save`)

**Unlocked spells:** Magic Missile, Power Word Kill, Power Word Heal (full), Counterspell, Dispel Magic.

---

## Phase 7: Reduce Under-Modeled Notes

With Phases 3-6 landed, systematically review all `category: 'under-modeled'` notes and convert to structured effects or reclassify as `flavor`:

- Repeat save notes -> structured `repeatSave` (Phase 3)
- Resistance notes -> `DamageResistanceMarker` (Phase 4)
- "Constructs have Disadvantage" -> `save.disadvantage` field or targeted `roll-modifier`
- "Heavily Obscured" / "Difficult Terrain" -> `state` effects (limited engine support, but honestly modeled)
- "Speed halved" -> `modifier` with `target: 'speed'`, `mode: 'multiply'`, `value: 0.5`

Target: reduce `under-modeled` notes by ~60%, moving ~20 spells from `partial` to `full`.

---

## Phase 8: Documentation Updates

- Update [effects.md](docs/reference/effects.md) Section 12 (Effect Type Scaling Tiers) to reflect promotions from Phases 3-6
- Update [resolution.md](docs/reference/resolution.md) Section 8 (Supported Effect Matrix) with new resolution levels
- Update Known Unsupported Spell Mechanics to strike resolved items
- Add extension point guidance for repeat saves and damage resistance

