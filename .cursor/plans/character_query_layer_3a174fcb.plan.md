---
name: Character Query Layer
overview: Design a shared, normalized CharacterQueryContext and evolve the viewer hook with explicit scope (single vs merged), explicit readiness, and a return shape that supports PC-owned UI today and DM “owned by character” filtering next—without locking ownership to merged-only.
todos:
  - id: types
    content: Create `characterQueryContext.types.ts` with the phase-1 `CharacterQueryContext` shape
    status: completed
  - id: builder
    content: Create `buildCharacterQueryContext.ts` that maps `Character` to `CharacterQueryContext`
    status: completed
  - id: merge
    content: Create `mergeCharacterQueryContexts.ts` for multi-character union (viewer hook replacement)
    status: completed
  - id: selectors
    content: Create initial selector files grouped by concern (inventory, spells, proficiency, economy, combat, progression)
    status: completed
  - id: tests
    content: Write tests for builder, merge, and selectors
    status: completed
  - id: hook
    content: Create `useViewerCharacterQuery` hook in campaign/hooks to replace the three viewer hooks
    status: completed
  - id: hook-scope-ready
    content: Refine hook — explicit scope (single/merged), contextsById, mergedContext, loading, ready; fix empty-merge-before-fetch readiness bug
    status: completed
  - id: migrate-routes
    content: Migrate six content list routes to use refined hook + correct ownership slice (active PC vs merged per product choice)
    status: completed
  - id: deprecate
    content: Deprecate and remove old `useViewerEquipment`, `useViewerSpells`, `useViewerProficiencies`
    status: completed
  - id: doc-reference
    content: Add `docs/reference/character-query-layer.md` (read-only derived querying; purpose, scope, readiness, consumers, rollout)
    status: completed
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

This replaces the per-hook union logic (the `for (const eq of equipMap)` loops). **Ownership UI should not assume merged is the only mode** — see [§8 Ownership & query scope refinement](#8-ownership--query-scope-refinement-post-implementation).

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

### Stage 2: Create `useViewerCharacterQuery` hook (iterate per §8)

- Single hook replaces `useViewerEquipment`, `useViewerSpells`, `useViewerProficiencies`
- One `GET /api/characters/:id` per viewer character (same network, but single fetch per character instead of 3)
- Runs each response through `buildCharacterQueryContext`; exposes **per-id contexts** and optional **merged** context
- Must expose **readiness** (`ready`) so consumers never treat pre-fetch empty context as authoritative — see §8.2–8.3
- Return shape should support **scope** (single character vs merged) — see §8.1, §8.3

### Stage 3: Migrate content list routes

- Update all six owning list routes to use the **refined** hook (§8.4)
- Each route derives `ownedIds` from the **chosen scope** (active PC vs merged — product decision in §8.4), not blindly from merged-only:
  - `context.inventory.weaponIds` (etc.) from the **selected** `CharacterQueryContext`
  - `context.spells.knownSpellIds`, `context.proficiencies.skillIds` likewise
- Existing `contentListTemplate.tsx` / `ownedMembership.ts` continue to receive `ReadonlySet<string>` -- no changes needed there **once** `ownedIds` is sourced from the correct context slice

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

## 8. Ownership & query scope refinement (post-implementation)

**Implemented:** [`useViewerCharacterQuery.ts`](src/features/campaign/hooks/useViewerCharacterQuery.ts) fetches per `fetchIds` (all viewer ids, or one id when `characterId` is valid), stores **`contextsById`**, derives **`mergedContext`**, exposes **`ready`** (keyed to the completed fetch batch), **`loading`**, and **`activeContext`** when `characterId` is set. List routes gate ownership UI on **`ready`** so empty pre-fetch merge is never treated as authoritative.

**Historical issue (pre-fix):** the hook returned `{ context, loading }` with **`loading` initially `false`** and merged **`mergeCharacterQueryContexts([])`** before fetches completed.

### 1. Current issue summary

| Issue | Detail |
|--------|--------|
| **Merged-only mental model** | Plan text previously implied merged viewer context is *the* ownership source. Product needs **single-character** ownership (active PC, DM pick) **and** optional merged union — not one hard-coded default forever. |
| **Readiness bug** | ~~Fixed: `ready` + list spinners until fetch completes.~~ Previously: first paint could show empty merge while `loading` was false. |
| **No explicit scope** | ~~Partially addressed: optional `characterId` fetches one viewer character; `contextsById` supports DM pick.~~ Active “current PC” from prefs/URL is still a product follow-up. |
| **Future DM filter** | “Owned by character” needs a **single** `CharacterQueryContext` for the **selected** character id — same builder/merge layer, different **selection** input. |

---

### 2. Recommended scope model

**Keep `CharacterQueryContext` as the unit of truth per character.** Do **not** replace merge; **make scope explicit** at the hook/API layer.

Recommended pattern:

```text
type ViewerCharacterQueryScope =
  | { kind: 'single'; characterId: string }
  | { kind: 'mergedViewer' }
  | { kind: 'none' }   // zero viewer characters — no ownership queries
```

- **`useViewerCharacterQuery({ scope })`** (or overloads with `characterId?: string | null` where `null`/`undefined` means merged viewer) is a clean API.
- **Lower-level alternative** (composable): **`useViewerCharacterQueryBase()`** returns `contextsById`, `mergedContext`, `loading`, `ready` — callers pick **single** vs **merged**. Prefer this if many consumers need different slices without a single scope enum.

**Recommendation:** Prefer **one hook** with optional **`characterId?: string | null`**:
- `undefined` / omitted → fetch all viewer ids, expose **merged** + **byId** (see §8.4).
- **Explicit `characterId`** → fetch only that id (or filter `built` to one) — **single context** for that character’s inventory/spells/proficiencies.

**Merged viewer** remains a **convenience** (e.g. “everything my characters own”), not the only mode.

---

### 3. Recommended readiness model

**Rule:** Consumers must not derive `ownedIds` from a merged `CharacterQueryContext` when **`ready === false`**.

Concrete options (combine as needed):

1. **`ready: boolean`** — `true` iff the hook has finished the fetch cycle for the current `viewerCharacterIds` (and optional `characterId`) and `built` is consistent with that request. When `viewerCharacterIds.length === 0`, `ready === true` immediately (empty is authoritative).
2. **Initial `loading`** — when `viewerCharacterIds.length > 0`, initialize **`loading: true`** (or derive loading from `!ready`) so the first paint does not show “empty ownership” as truth.
3. **Optional `contextsById: Map<string, CharacterQueryContext>`** — partial fills are visible only if you explicitly want progressive UI; **default** for ownership UI: gate on **`ready`**.

**Recommendation:** Expose **`ready`** explicitly alongside **`loading`**. **`loading`** = in-flight network; **`ready`** = safe to use for ownership membership. For lists, block rendering of ownership-dependent props until **`ready`** (or `|| viewerCharacterIds.length === 0`).

---

### 4. Recommended hook return shape

Avoid returning **only** one merged `context` as the sole primitive.

**Recommended shape (next iteration):**

```typescript
{
  // Per-character (authoritative for DM pick + single-PC)
  contextsById: ReadonlyMap<string, CharacterQueryContext>
  // Convenience union (optional; for “all my stuff” modes)
  mergedContext: CharacterQueryContext
  loading: boolean
  ready: boolean
  // Optional: single resolved context when scope is characterId
  activeContext: CharacterQueryContext | null | undefined
}
```

- **`contextsById`** — cheap to use for DM: **filter character id → one context** → `inventory.*` / `spells` / `proficiencies`.
- **`mergedContext`** — `mergeCharacterQueryContexts([...contextsById.values()])` when needed; **not** the only export.
- **`activeContext`** — if `characterId` is passed and valid, same as `contextsById.get(characterId)`; helps PC-owned lists without re-lookup.

**Selectors** (`getOwnedIdsForContentType`, etc.) stay on **`CharacterQueryContext`**; the hook does not duplicate domain logic.

---

### 5. What current PC-owned UI should consume

| Question | Recommendation |
|----------|----------------|
| **Single vs merged for PC?** | **Prefer single active PC** when the app has a “current character” (or default to the **only** viewer PC if exactly one). **Merged** is a fallback when multiple PCs and no selection yet — product should choose whether to show “union” or “pick a character first.” |
| **Where does “current character” come from?** | When it exists: **campaign prefs**, **URL**, or **active character provider** — out of scope for the hook; hook accepts **`characterId`** from props/context. |
| **No explicit current character yet** | **Safest temporary behavior:** **Do not** treat merged empty pre-fetch as truth; **gate on `ready`**. If multiple PCs and no selection, either merged **after ready** or **first** viewer character id as deterministic default — **document the choice** in the route. |

**Tradeoff:**

- **Merged** (union): “Anything **any** of my PCs owns” — broader; wrong for “this character’s sheet” mental model.
- **Single active**: “What **this** PC owns” — matches sheet and future DM “by character” semantics.

---

### 6. How future DM “owned by character” filtering plugs in

- **DM filter** selects a **campaign character id** (party member).
- **Ownership** for that row = **`contextsById.get(selectedCharacterId)`** or **`buildCharacterQueryContext`** after a single fetch — same `CharacterQueryContext` slice as PC.
- **Hook** should **already expose `contextsById` (or fetch-one-by-id)** so the grid filter does not re-merge or re-fetch ad hoc.
- **Merged** remains a **separate convenience** (e.g. analytics or rare “all party-owned” views), **not** the default for DM list filtering.

---

### 7. Recommended immediate next step

**Before** wiring more ownership UI to the hook:

1. **Refine `useViewerCharacterQuery`** (§8.2–8.4): add **`ready`**, fix initial **`loading`/empty merge** behavior, return **`contextsById` + `mergedContext`** (and optional **`activeContext`** when `characterId` is passed).
2. **Then** point content lists at **`ready`** + **chosen scope** (single vs merged) for `ownedIds`.

**Can wait until DM feature lands:** UI for the DM character dropdown filter itself (hook can expose data first).

**Deferred:** Full campaign “active character” UX if not present — only the **API contract** (`characterId` + `ready`) needs to be in place now.

---

## 9. Recommended Next Step

**First:** Refine the viewer hook per **§8** (readiness + scope + return shape). **Second:** Wire PC-owned filter/icon to **`ready`** and **single vs merged** `CharacterQueryContext` per **§8.4–8.5**.

**Greenfield / not yet implemented:** If `CharacterQueryContext` + builder are not yet in the tree, create `characterQueryContext.types.ts` and `buildCharacterQueryContext.ts` with tests first — then hook refinement (§8).

**Deliverable checklist (§8):** (1) issue summary — §8.1; (2) scope model — §8.2; (3) readiness — §8.3; (4) hook return shape — §8.4; (5) PC-owned UI consumption — §8.5; (6) future DM filter — §8.6; (7) immediate next step — §8.7.

**Reference doc:** Maintain [`docs/reference/character-query-layer.md`](../../docs/reference/character-query-layer.md) as the canonical description of read-only derived character querying (purpose, drift, boundaries, core pieces, scope/readiness models, selectors vs context, consumers, rollout). Update it when the hook API or merge semantics change.
