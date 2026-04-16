---
name: Character Query Layer
overview: Design a shared, normalized character query context that centralizes how features derive read-only information from character state, replacing ad-hoc ownership/availability/proficiency checks with a single build-once, query-many pattern.
todos:
  - id: types
    content: Create `characterQueryContext.types.ts` with the phase-1 `CharacterQueryContext` shape
    status: pending
  - id: builder
    content: Create `buildCharacterQueryContext.ts` that maps `Character` to `CharacterQueryContext`
    status: pending
  - id: merge
    content: Create `mergeCharacterQueryContexts.ts` for multi-character union (viewer hook replacement)
    status: pending
  - id: selectors
    content: Create initial selector files grouped by concern (inventory, spells, proficiency, economy, combat, progression)
    status: pending
  - id: tests
    content: Write tests for builder, merge, and selectors
    status: pending
  - id: hook
    content: Create `useViewerCharacterQuery` hook in campaign/hooks to replace the three viewer hooks
    status: pending
  - id: migrate-routes
    content: Migrate six content list routes to use `useViewerCharacterQuery`
    status: pending
  - id: deprecate
    content: Deprecate and remove old `useViewerEquipment`, `useViewerSpells`, `useViewerProficiencies`
    status: pending
isProject: false
---

# Character Query Layer Design

## 1. Current Query Landscape

### Existing helpers/selectors (character feature)

| Location | What it does |
|----------|-------------|
| [`character-proficiency.utils.ts`](src/features/character/domain/utils/character-proficiency.utils.ts) | `getSkillIds` / `toSkillProficienciesRecord` -- converts between `Record<string, ProficiencyAdjustment>` and `string[]` |
| [`buildCharacterContext.ts`](src/features/character/domain/engine/buildCharacterContext.ts) | `buildCharacterContext` -- flattens `Character` into `EvaluationContext` (mechanics engine). Normalizes abilities, equipment/loadout, empty conditions/resources/flags |
| [`getLoadoutPickerOptions.ts`](src/features/character/domain/engine/getLoadoutPickerOptions.ts) | Iterates `character.equipment.armor` to produce loadout AC options. Contains inline `getOwnedArmors` / `getOwnedShields` that traverse `character.equipment.armor` |
| [`getWeaponPickerOptions.ts`](src/features/character/domain/engine/getWeaponPickerOptions.ts) | Reads `character.equipment.weapons` for wielded weapon picker |
| [`collectCharacterEffects.ts`](src/features/character/domain/engine/collectCharacterEffects.ts) | Walks `character.classes` to extract level-gated class/subclass effects |
| [`character-read.mappers.ts`](src/features/character/read-model/character-read.mappers.ts) | `toCharacterDetailDto` (doc -> DTO), `toCharacterForEngine` (DTO -> mechanics Character). This is the primary normalization boundary today |
| [`calculateArmorClass.ts`](src/features/character/domain/combat/calculateArmorClass.ts) | AC resolution from character + effects |
| [`canMulticlass.ts`](src/features/character/domain/validation/canMulticlass.ts), [`proficiencySlots.ts`](src/features/character/domain/validation/proficiencySlots.ts) | Validation helpers reading `character.classes`, `character.abilityScores` |

### Viewer ownership hooks (campaign feature reaching into character data)

| Hook | File | Character fields accessed | Return shape |
|------|------|--------------------------|-------------|
| `useViewerEquipment` | [`useViewerEquipment.ts`](src/features/campaign/hooks/useViewerEquipment.ts) | `character.equipment` (weapons/armor/gear/magicItems) | `{ weapons, armor, gear, magicItems, loading }` -- each `ReadonlySet<string>` |
| `useViewerSpells` | [`useViewerSpells.ts`](src/features/campaign/hooks/useViewerSpells.ts) | `character.spells` | `ReadonlySet<string>` (no loading flag) |
| `useViewerProficiencies` | [`useViewerProficiencies.ts`](src/features/campaign/hooks/useViewerProficiencies.ts) | `character.proficiencies` via `getSkillIds` | `{ skills, loading }` |

All three independently call `GET /api/characters/:id` per viewer character via `Promise.all`. None share a fetch or cache.

### Content list ownership/adornment layer

- [`ownedMembership.ts`](src/features/content/shared/domain/ownedMembership.ts) -- `rowOwnedSegment`, `showPcOwnedNameIcon` (pure functions over `Set<string>`)
- [`ownedMembershipFilter.ts`](src/features/content/shared/domain/ownedMembershipFilter.ts) -- `createOwnedMembershipFilter` (Owned/Not owned select)
- [`contentListTemplate.tsx`](src/features/content/shared/components/contentListTemplate.tsx) -- `makePreColumns` (owned icon), `makePostFilters` (owned filter), composed via `buildCampaignContentColumns` / `buildCampaignContentFilters`
- [`visibilityForViewer.ts`](src/ui/patterns/AppDataGrid/viewer/visibilityForViewer.ts) -- hides `pcViewerOnly` items from DMs

### Content list routes consuming owned IDs

Six routes (Armor, Weapons, Gear, MagicItems, Spells, SkillProficiencies) each import the appropriate `useViewer*` hook and destructure the relevant set for `ownedIds`. Pattern is identical across all six -- only the set name differs.

### Other character access points (builder, encounter, level-up)

- **Character builder**: [`CharacterBuilderProvider.tsx`](src/features/characterBuilder/context/CharacterBuilderProvider.tsx) accesses `wealth`, equipment, budget; [`calculateEquipmentCostCp.ts`](src/features/characterBuilder/domain/equipment/calculateEquipmentCostCp.ts) uses `moneyToCp`
- **Encounter combatant builders**: [`combatant-builders.ts`](src/features/encounter/helpers/combatants/combatant-builders.ts) reads `character.combat.loadout`, `character.equipment`, `character.abilityScores`, `character.classes`, `character.proficiencies`, `character.feats`
- **Level-up**: [`LevelUpWizard.tsx`](src/features/character/levelUp/LevelUpWizard.tsx) seeds from `character.classes`, `character.spells`
- **Validation**: `validateCharacterReferenceChange` fetches party characters and checks `character.equipment`, `character.spells`, `character.proficiencies`

---

## 2. Drift / Duplication Risks

### High risk (actively drifting now)

1. **Three parallel viewer hooks with identical fetch patterns.** `useViewerEquipment`, `useViewerSpells`, `useViewerProficiencies` each independently `GET /api/characters/:id` for every viewer character. If a fourth content type needs ownership, another copy will appear. The return shapes are inconsistent (equipment returns `loading`, spells does not).

2. **Proficiency shape mismatch.** The domain `Character` stores `proficiencies.skills` as `Record<string, ProficiencySkillAdjustment>`. The DTO stores `proficiencies` as `{ id, name }[]`. `toCharacterForEngine` round-trips DTO array back to record. Any new feature querying proficiencies must know which shape it has.

3. **"Owned" vs "equipped" confusion.** Equipment list routes show "owned" (in inventory). Loadout picker separately checks "equipped" (in combat loadout). Nothing connects these today -- a feature like "show equipped icon on weapons list" would need to reach into `character.combat.loadout` independently.

### Medium risk (will diverge with new features)

4. **Wealth/affordability.** Builder uses `moneyToCp` for budget math; character view uses it for display; content lists have no affordability check. When "can I afford this?" lands, it will need the same normalized coin total the builder computes, but from a different entry point.

5. **Spell known vs spell available.** Today `character.spells` is a flat `string[]` for "known". Level-up uses `getAvailableSpellsByClass` (class progression). A "spells available to prepare" feature would need class-based filtering on the spell list, which has no shared derivation today.

6. **Class/level eligibility.** `canMulticlass` checks ability scores against class prerequisites. `collectCharacterEffects` walks class levels for features. Content list routes don't do class/level gating at all. If "minimum level to use this item" arrives, there's no shared `classLevelsById` or `totalLevel` available outside the character feature.

### Lower risk (isolated for now)

7. **Encounter combatant building** constructs its own flat access over the DTO. Unlikely to share with content lists but could benefit from the same normalization if encounters gain list-like UI.

---

## 3. Recommended Query Layer Name

**`buildCharacterQueryContext`** returning a **`CharacterQueryContext`**.

Rationale:
- "Query" communicates read-only, derived intent (not a mutation surface)
- "Character" scopes it clearly
- "Context" matches the existing `buildCharacterContext` (mechanics engine) and `ViewerContext` (capabilities) patterns without colliding -- the existing one becomes the *engine* context while this is the *query* context
- It scales naturally: `characterQueryContext.inventory.weaponIds`, `characterQueryContext.economy.totalCp`
- Avoids "Access" (implies permissions), "Content" (too narrow), or "Ownership" (too specific)

---

## 4. Recommended First-Pass `CharacterQueryContext` Shape

```typescript
type CharacterQueryContext = {
  /** Phase 1 */
  identity: {
    id: string
    name: string
    type: 'pc' | 'npc'
    raceId: string | null
    alignmentId: string | null
  }

  progression: {
    totalLevel: number
    classIds: ReadonlySet<string>
    classLevelsById: ReadonlyMap<string, number>
    xp: number
    levelUpPending: boolean
  }

  inventory: {
    weaponIds: ReadonlySet<string>
    armorIds: ReadonlySet<string>
    gearIds: ReadonlySet<string>
    magicItemIds: ReadonlySet<string>
    allEquipmentIds: ReadonlySet<string>
  }

  proficiencies: {
    skillIds: ReadonlySet<string>
  }

  spells: {
    knownSpellIds: ReadonlySet<string>
  }

  economy: {
    totalWealthCp: number
  }

  combat: {
    equippedArmorId: string | null
    equippedShieldId: string | null
    equippedMainHandWeaponId: string | null
    equippedOffHandWeaponId: string | null
  }

  /** Phase 2 (deferred) */
  // stats: { abilityScores, proficiencyBonus }
  // feats: { featIds: ReadonlySet<string> }
  // resources: { spellSlots, etc. }
  // narrative: { ... }
}
```

### Phase 1 vs deferred

**Phase 1** (immediate value, covers current content list + forthcoming affordability/loadout features):
- `identity` -- needed for display + type checks
- `progression` -- needed for class-filtered lists and level gating
- `inventory` -- replaces all three viewer hooks' equipment sets
- `proficiencies` -- replaces `useViewerProficiencies`
- `spells` -- replaces `useViewerSpells`
- `economy` -- `totalWealthCp` via existing `moneyToCp` utility; enables affordability
- `combat` -- loadout slot IDs; enables "equipped" adornments

**Phase 2** (defer until features need them):
- `stats` -- ability scores, proficiency bonus, modifiers
- `feats` -- feat id set (currently only used by encounter hide-eligibility)
- `resources` -- spell slots, daily resources
- `narrative` -- personality, backstory (display-only, no query need yet)

---

## 5. Recommended Selector Groups

Selectors are thin, single-purpose pure functions that take `CharacterQueryContext` (or a slice) plus a query argument. Grouped by concern into separate files:

### `selectors/inventory.selectors.ts`
```typescript
ownsItem(ctx: CharacterQueryContext, contentType: EquipmentCategory, id: string): boolean
ownsAnyItem(ctx: CharacterQueryContext, contentType: EquipmentCategory, ids: string[]): boolean
getOwnedIdsForContentType(ctx: CharacterQueryContext, contentType: EquipmentCategory): ReadonlySet<string>
```

### `selectors/spells.selectors.ts`
```typescript
knowsSpell(ctx: CharacterQueryContext, spellId: string): boolean
```

### `selectors/proficiency.selectors.ts`
```typescript
isProficientInSkill(ctx: CharacterQueryContext, skillId: string): boolean
```

### `selectors/economy.selectors.ts`
```typescript
canAffordCostCp(ctx: CharacterQueryContext, costCp: number): boolean
```

### `selectors/combat.selectors.ts`
```typescript
isEquipped(ctx: CharacterQueryContext, itemId: string): boolean
getEquippedWeaponIds(ctx: CharacterQueryContext): string[]
```

### `selectors/progression.selectors.ts`
```typescript
hasClass(ctx: CharacterQueryContext, classId: string): boolean
classLevel(ctx: CharacterQueryContext, classId: string): number
meetsLevelRequirement(ctx: CharacterQueryContext, minLevel: number): boolean
```

### Aggregate viewer selector (merges N characters)
```typescript
// query/mergeCharacterQueryContexts.ts
mergeCharacterQueryContexts(contexts: CharacterQueryContext[]): CharacterQueryContext
```

This replaces the per-hook union logic (the `for (const eq of equipMap)` loops). The merged context is what content list routes use as "viewer owned ids."

---

## 6. Recommended Folder Structure

```
src/features/character/domain/query/
  buildCharacterQueryContext.ts       -- the builder function
  buildCharacterQueryContext.test.ts
  characterQueryContext.types.ts      -- CharacterQueryContext type
  mergeCharacterQueryContexts.ts      -- merge N contexts into one
  mergeCharacterQueryContexts.test.ts
  index.ts                            -- barrel export

  selectors/
    inventory.selectors.ts
    spells.selectors.ts
    proficiency.selectors.ts
    economy.selectors.ts
    combat.selectors.ts
    progression.selectors.ts
    index.ts                          -- barrel export
```

This sits alongside the existing `engine/`, `combat/`, `utils/`, `validation/` directories inside `domain/`. The `engine/` folder keeps its mechanics-oriented `buildCharacterContext` (EvaluationContext) -- no conflict.

The hook that fetches and builds the context for the viewer's characters lives in the campaign feature since it depends on `useCampaignMembers`:

```
src/features/campaign/hooks/
  useViewerCharacterQuery.ts  -- replaces useViewerEquipment/Spells/Proficiencies
```

---

## 7. Staged Rollout Plan

### Stage 1: Extract `CharacterQueryContext` type + builder (pure domain)

- Create `characterQueryContext.types.ts` with the phase-1 shape
- Create `buildCharacterQueryContext.ts` that accepts `Character` (or `CharacterDetailDto` via `toCharacterForEngine` first) and returns `CharacterQueryContext`
- Use existing `getSkillIds`, `moneyToCp`, and loadout resolution helpers -- no new dependencies
- Create `mergeCharacterQueryContexts.ts` for multi-character union (Set unions, summed wealth, merged class maps)
- Write tests for the builder and merge function

**This is pure extraction -- no consumers change yet.**

### Stage 2: Create `useViewerCharacterQuery` hook

- Single hook replaces `useViewerEquipment`, `useViewerSpells`, `useViewerProficiencies`
- One `GET /api/characters/:id` per viewer character (same network, but single fetch per character instead of 3)
- Runs each response through `buildCharacterQueryContext`, then `mergeCharacterQueryContexts`
- Returns `{ context: CharacterQueryContext; loading: boolean }`
- Consistent return shape (always includes `loading`)

### Stage 3: Migrate content list routes

- Update all six owning list routes to use `useViewerCharacterQuery` instead of the three separate hooks
- Each route extracts `ownedIds` from the context via the appropriate selector or direct set access:
  - `context.inventory.weaponIds` instead of `useViewerEquipment().weapons`
  - `context.spells.knownSpellIds` instead of `useViewerSpells()`
  - `context.proficiencies.skillIds` instead of `useViewerProficiencies().skills`
- Existing `contentListTemplate.tsx` / `ownedMembership.ts` continue to receive `ReadonlySet<string>` -- no changes needed there

### Stage 4: Deprecate and remove old viewer hooks

- Mark `useViewerEquipment`, `useViewerSpells`, `useViewerProficiencies` as deprecated
- Remove after all references are migrated
- Delete the `ownedContent.tsx` file that git status shows as already deleted

### Stage 5 (future): Expand to other consumers

- Affordability: content list routes add "can afford" icon/filter using `context.economy.totalWealthCp`
- Equipped adornments: weapons list shows "equipped" badge via `context.combat`
- Level-up / builder: use `context.progression` for eligibility gates
- Encounter combatant building: optionally accept `CharacterQueryContext` for the query subset

### Adapter strategy during migration

No adapters needed. The `CharacterQueryContext` is a new, additive type. Old hooks keep working until explicitly migrated. The context builder accepts the same `Character` type the engine already uses. Routes can be migrated one at a time -- there is no big-bang switchover.

---

## 8. Recommended Next Step

**Create `characterQueryContext.types.ts` and `buildCharacterQueryContext.ts` with tests.**

This is the smallest, safest extraction:
- Zero consumer changes
- Pure functions, fully testable in isolation
- Establishes the canonical type that all future work references
- Exercises existing helpers (`getSkillIds`, `moneyToCp`, loadout resolution)
- Can be reviewed and merged without touching any route or hook

After that merges, the natural follow-up is `mergeCharacterQueryContexts` + `useViewerCharacterQuery`, then migrating list routes one at a time.
