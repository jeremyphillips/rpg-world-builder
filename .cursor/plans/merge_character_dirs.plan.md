# Plan: Merge Character Domain Directories ✅ COMPLETED

**Goal:** Merge `core/character` and `character-build` into a single `character` domain at `src/features/mechanics/domain/character/`.

**Note:** The codebase uses `src/features/mechanics/domain/` (not `src/mechanics/domain/`). This plan uses the actual paths.

---

## Current State

| Source | Contents |
|--------|----------|
| `core/character/` | `abilities.ts`, `abilities.types.ts`, `abilities.utils.ts`, `skillProficiencies.utils.ts`, `index.ts` |
| `character-build/` | `types.ts` (BuildDraft), `invalidation/` (detect, resolve, rules, types), `rules/` (class-eligibility), `options/` (empty) |
| `character/` (existing) | `generation/` (calculateBaseHitPoints, calculateWealth), `selection/` (getAlignmentOptionsForClass) |

---

## Target Structure

```
src/features/mechanics/domain/character/
├── index.ts
├── types.ts
├── abilities/
│   ├── index.ts
│   ├── abilities.ts
│   ├── abilities.types.ts
│   ├── abilities.utils.ts
│   └── skillProficiencies.utils.ts
├── generation/
│   ├── index.ts
│   ├── calculateBaseHitPoints.ts
│   └── calculateWealth.ts
├── selection/
│   ├── index.ts
│   └── getAlignmentOptionsForClass.ts
├── build/
│   ├── types.ts
│   ├── invalidation/
│   │   ├── index.ts
│   │   ├── detect.ts
│   │   ├── resolve.ts
│   │   ├── rules.ts
│   │   └── types.ts
│   ├── options/
│   └── rules/
│       ├── index.ts
│       └── class-eligibility.ts
```

---

## Phase 1: Create New Structure (No Deletions Yet)

### 1.1 Create `abilities/` subfolder

- [ ] Create `character/abilities/` directory
- [ ] Move `core/character/abilities.ts` → `character/abilities/abilities.ts`
- [ ] Move `core/character/abilities.types.ts` → `character/abilities/abilities.types.ts`
- [ ] Move `core/character/abilities.utils.ts` → `character/abilities/abilities.utils.ts`
- [ ] Move `core/character/skillProficiencies.utils.ts` → `character/abilities/skillProficiencies.utils.ts`
- [ ] Create `character/abilities/index.ts`:
  ```ts
  export * from './abilities'
  export * from './abilities.types'
  export * from './abilities.utils'
  export * from './skillProficiencies.utils'
  ```

**Internal import fix:** `abilities.types.ts` imports from `./abilities` — path stays valid.

### 1.2 Create `build/` subfolder

- [ ] Create `character/build/` directory
- [ ] Move `character-build/types.ts` → `character/build/types.ts`
- [ ] Create `character/build/invalidation/` and move:
  - `character-build/invalidation/detect.ts` → `character/build/invalidation/detect.ts`
  - `character-build/invalidation/resolve.ts` → `character/build/invalidation/resolve.ts`
  - `character-build/invalidation/rules.ts` → `character/build/invalidation/rules.ts`
  - `character-build/invalidation/types.ts` → `character/build/invalidation/types.ts`
  - `character-build/invalidation/index.ts` → `character/build/invalidation/index.ts`
- [ ] Create `character/build/rules/` and move:
  - `character-build/rules/class-eligibility.ts` → `character/build/rules/class-eligibility.ts`
  - `character-build/rules/index.ts` → `character/build/rules/index.ts`
- [ ] Create `character/build/options/` (empty, or add `index.ts` placeholder if needed)

**Import fixes within build:**
- `class-eligibility.ts`: change `import type { BuildDraft } from '../types'` → stays `../types` (build/types.ts)
- `invalidation/*`: no internal path changes needed (relative paths within invalidation stay same)

### 1.3 Root `types.ts` and `index.ts`

- [ ] Create `character/types.ts` — re-export shared types for convenience:
  ```ts
  export type {
    AbilityKey,
    AbilityId,
    AbilityRef,
    AbilityScoreValue,
    AbilityScoreMap,
    AbilityScoreMapResolved,
    Ability,
    AbilityName,
  } from './abilities/abilities.types'
  ```
- [ ] Create/update `character/index.ts`:
  ```ts
  export * from './abilities'
  export * from './generation'
  export * from './selection'
  export * from './build/invalidation'
  export * from './build/rules'
  export type { BuildDraft } from './build/types'
  ```

---

## Phase 2: Update All Imports

### 2.1 Imports from `core/character` → `character` or `character/abilities`

| Old Path | New Path |
|----------|----------|
| `@/features/mechanics/domain/core/character` | `@/features/mechanics/domain/character` |
| `@/features/mechanics/domain/core/character/abilities` | `@/features/mechanics/domain/character/abilities` or `@/features/mechanics/domain/character` |
| `@/features/mechanics/domain/core/character/abilities.types` | `@/features/mechanics/domain/character/abilities/abilities.types` or `@/features/mechanics/domain/character` |
| `@/features/mechanics/domain/core/character/abilities.utils` | `@/features/mechanics/domain/character/abilities/abilities.utils` or `@/features/mechanics/domain/character` |
| `@/features/mechanics/domain/core/character/skillProficiencies.utils` | `@/features/mechanics/domain/character/abilities/skillProficiencies.utils` or `@/features/mechanics/domain/character` |

**Files to update (core/character):**
- `src/features/character/domain/engine/buildCharacterContext.ts`
- `src/features/content/skillProficiencies/domain/forms/types/skillProficiencyForm.types.ts`
- `server/features/campaign/services/rulesetPatch.service.ts`
- `src/features/characterBuilder/constants/characterBuilder.constants.ts`
- `src/features/characterBuilder/steps/ProficiencyStep/ProficiencyStep.tsx`
- `src/features/mechanics/domain/resolution/attack-resolver.ts`
- `server/features/content/skillProficiencies/services/skillProficiencies.service.ts`
- `src/features/character/read-model/character-read.types.ts`
- `src/features/mechanics/domain/encounter/state/types/combatant.types.ts`
- `src/features/mechanics/domain/abilities/getAbilityModifier.ts`
- `shared/types/ruleset.ts`
- `src/features/character/domain/types/character.types.ts`
- `src/features/mechanics/domain/rulesets/campaign/patch/validate.ts`
- `src/features/characterBuilder/steps/AbilityScoresStep/AbilityScoresStep.tsx`
- `src/features/mechanics/domain/conditions/evaluation-context.types.ts`
- `src/features/content/classes/domain/types/requirements.types.ts`
- `src/features/content/classes/domain/types/progression.types.ts`
- `src/features/character/components/views/CharacterView/sections/AbilityScoresCard.tsx`
- `src/features/chat/components/ChatContainer.tsx`
- `src/features/content/classes/domain/list/classList.columns.tsx`
- `src/features/content/classes/domain/list/classList.options.ts`
- `src/features/character/components/views/CharacterView/CharacterView.tsx`
- `src/features/characterBuilder/steps/ConfirmationStep/ConfirmationStep.tsx`
- `src/features/mechanics/domain/effects/sources/tests/equipment-to-effects.test.ts`
- `src/features/mechanics/domain/generation/ability-scores/assign.ts`
- `src/features/character/domain/validation/canMulticlass.ts`
- `src/features/content/skillProficiencies/domain/list/skillProficiencyList.columns.tsx`
- `src/features/content/skillProficiencies/domain/list/skillProficiencyList.options.ts`
- `src/features/content/skillProficiencies/domain/forms/registry/skillProficiencyForm.registry.ts`
- `src/features/content/classes/domain/types/class.types.ts`
- `src/features/content/monsters/domain/types/monster-combat.types.ts`
- `src/features/content/monsters/domain/types/monster-actions.types.ts`
- `src/features/content/classes/domain/details/classDetail.spec.ts`
- `src/features/content/monsters/domain/types/monster.types.ts`
- `src/features/content/skillProficiencies/domain/details/skillProficiencyDetail.spec.ts`
- `src/features/character/read-model/character-read.refs.ts`
- `src/features/character/read-model/character-read.mappers.ts` (dynamic import path)
- `src/features/mechanics/domain/encounter/resolution/action-resolution.ts`
- `src/features/mechanics/domain/resolution/formula.engine.ts`
- `src/features/mechanics/domain/resolution/stat-resolver.ts`
- `src/features/mechanics/domain/effects/effects.types.ts`

### 2.2 Imports from `character-build` → `character/build`

| Old Path | New Path |
|----------|----------|
| `@/features/mechanics/domain/character-build/invalidation` | `@/features/mechanics/domain/character/build/invalidation` or `@/features/mechanics/domain/character` |
| `@/features/mechanics/domain/character-build/rules` | `@/features/mechanics/domain/character/build/rules` or `@/features/mechanics/domain/character` |

**Files to update (character-build):**
- `src/features/characterBuilder/components/InvalidationConfirmDialog/InvalidationConfirmDialog.tsx`
- `src/features/characterBuilder/components/InvalidationNotice/InvalidationNotice.tsx`
- `src/features/characterBuilder/types/characterBuilder.types.ts`
- `src/features/characterBuilder/context/CharacterBuilderProvider.tsx`
- `src/features/characterBuilder/steps/ClassStep/ClassStep.tsx`

### 2.3 Relative imports within mechanics domain

- [ ] `src/features/mechanics/domain/core/base-stat-resolver.ts`: `@/features/mechanics/domain/character/generation` — already correct
- [ ] `src/features/mechanics/domain/resolution/formula.engine.ts`: `"../core/character"` → `"../character"`
- [ ] `src/features/mechanics/domain/effects/effects.types.ts`: `'../core/character'` → `'../character'`
- [ ] `src/features/mechanics/domain/resolution/stat-resolver.ts`: `"../core/character"` → `"../character"`
- [ ] `src/features/mechanics/domain/encounter/resolution/action-resolution.ts`: `'../../core/character/abilities.utils'` and `'../../core/character/abilities.types'` → `'../../character/abilities/abilities.utils'` and `'../../character/abilities/abilities.types'` (or `'../../character'` if barrel exports)

---

## Phase 3: Update core/index.ts

- [ ] Remove any reference to `core/character` from `core/index.ts` (currently it does NOT export character — it exports combat.types, getAbilityModifier, base-stat-resolver, creatureArmorClass). No change needed unless character was re-exported elsewhere.

---

## Phase 4: Delete Old Directories

- [ ] Delete `src/features/mechanics/domain/core/character/` (entire directory)
- [ ] Delete `src/features/mechanics/domain/character-build/` (entire directory)

---

## Phase 5: Verification

- [ ] Run `npm run build` (or equivalent)
- [ ] Run tests: `npm test`
- [ ] Search for any remaining references: `rg "core/character|character-build" src/ server/ shared/`

---

## Import Strategy

**Recommendation:** Prefer barrel imports where possible. Update consumers to use:
- `@/features/mechanics/domain/character` for abilities, types, utils (all re-exported from root index)
- `@/features/mechanics/domain/character` for invalidation and rules (re-exported from root index)

This minimizes churn — most imports can stay as `@/features/mechanics/domain/character` with only the path changing from `core/character` or `character-build` to `character`.

---

## Execution Order Summary

1. Create `character/abilities/` and move core/character files
2. Create `character/build/` and move character-build files
3. Create root `character/types.ts` and `character/index.ts`
4. Update all imports across the codebase
5. Delete `core/character/` and `character-build/`
6. Verify build and tests
