# Monster System Catalog Migration Plan

Phased build plan for migrating monster data from legacy `src/data/monsters/` to the system catalog, with full campaign content support, patching, and new routes.

**Target system catalog location:** `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts`  
*(Note: User specified `src/features/features/mechanics/...` — assumed typo; use `src/features/mechanics/...`)*

**Clarifications:**
- `monsters.lankhmar.ts` / `monsters.lankhmar.legacy.ts` — out of scope; no action.
- `src/features/mechanics/domain/adapters/monsters/` — legacy; no need to support; can break.
- Create/Edit routes: display objects and arrays in **JsonPreviewField**.
- Hit Points: use **formatHitPointsWithAverage** in both MonsterDetailRoute and MonsterListRoute (same formula).

---

## Summary of Deliverables

- 4 new Monster routes: `MonsterListRoute`, `MonsterDetailRoute`, `MonsterEditRoute`, `MonsterCreateRoute`
- Monster data migrated to `systemCatalog.monsters.ts`
- System content patching working for monsters
- Monster domain aligned with races/classes patterns
- Server routes for campaign monsters CRUD
- Delete legacy `MonsterRoute` and `MonstersRoute`; replace with `MonsterListRoute` in router

---

## Phase 1: Domain & Types Foundation

**Goal:** Align Monster types and domain structure with races/classes.

### 1.1 Update Monster Types

- **File:** `src/features/content/monsters/domain/types/monster.types.ts`
- Extend `Monster` to include `ContentItem` (source, systemId, campaignId, accessPolicy, imageKey, patched)
- Add `MonsterSummary` with `allowedInCampaign`
- Add `MonsterInput` for create/update
- Introduce `MonsterFields` as the raw data shape (without ContentBase); `Monster` = `ContentItem & MonsterFields`

### 1.2 Create Monster Domain Structure (mirror races)

Create the following under `src/features/content/monsters/domain/`:

| Path | Purpose |
|------|---------|
| `validation/validateMonsterChange.ts` | Validator with TODO for future logic; no restrictions for now |
| `repo/monsterRepo.ts` | Merges system + campaign monsters; supports patching via `getContentPatch` + `applyContentPatch` |
| `list/monsterList.types.ts` | `MonsterListRow = MonsterSummary & { allowedInCampaign?: boolean }` |
| `list/monsterList.columns.tsx` | `buildMonsterCustomColumns()` — see Phase 3 for column specs |
| `list/monsterList.filters.ts` | `buildMonsterCustomFilters()` — Size Category select + default filters |
| `list/monsterList.options.ts` | List options if needed |
| `list/index.ts` | Barrel |
| `details/monsterDetail.spec.tsx` | `MONSTER_DETAIL_SPECS` for detail view |
| `forms/types/monsterForm.types.ts` | `MonsterFormValues` |
| `forms/registry/monsterForm.registry.ts` | Field registry |
| `forms/config/monsterForm.config.ts` | `getMonsterFieldConfigs`, `MONSTER_FORM_DEFAULTS` |
| `forms/mappers/monsterForm.mappers.ts` | `monsterToFormValues`, `toMonsterInput` |
| `forms/index.ts` | Barrel |
| `index.ts` | Domain barrel |

### 1.3 Hit Points Formatter

- **File:** `src/features/content/monsters/utils/formatters.ts` (extend)
- Add `formatHitPoints(m: { count: number; die: number; modifier?: number }): string` → `{count}d{die}{modifier}` (e.g. `3d6+4`)
- Add `formatHitPointsWithAverage(...): string` → `{count}d{die}{modifier} ({average})` (e.g. `2d6+4 (10)`)

**Concerns:**
- Monster type is large; `MonsterFields` has nested `mechanics`, `lore`. Ensure `ContentItem` intersection is clean.
- `monster.types.ts` has `MonsterSummary = ContentSummary & MonsterFields` — may need refinement to match list row shape.

---

## Phase 2: System Catalog & Data Migration

**Goal:** Move monster data into system catalog; wire into `buildCampaignCatalog` and patching.

### 2.1 Create systemCatalog.monsters.ts

- **File:** `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts`
- Pattern: mirror `systemCatalog.races.ts`
- `toSystemMonster(systemId, raw: MonsterFields): Monster` — adds `source: 'system'`, `systemId`, `patched: false`, `imageKey`, `accessPolicy`
- `MONSTERS_RAW: readonly MonsterFields[]` — migrate data from `src/data/monsters/monsters.ts`
- `getSystemMonsters(systemId)`, `getSystemMonster(systemId, id)`
- `SYSTEM_MONSTERS_BY_SYSTEM_ID` registry

### 2.2 Migrate Monster Data

- Copy all entries from `src/data/monsters/monsters.ts` into `MONSTERS_RAW`
- Transform each to `MonsterFields` (ensure `id`, `name`, `mechanics`, `lore` present)
- **Note:** Legacy data has no `source`/`systemId`; `toSystemMonster` adds these

### 2.3 Update systemCatalog.ts

- **File:** `src/features/mechanics/domain/core/rules/systemCatalog.ts`
- Replace `import { monsters } from '@/data/monsters'` with `getSystemMonsters(DEFAULT_SYSTEM_RULESET_ID)`
- `monstersById: keyBy(getSystemMonsters(...))`

### 2.4 Campaign Catalog & Patching

- **buildCampaignCatalog:** Already has `monsters` in `CATALOG_CATEGORY_CONFIG`; no change if system catalog provides `monstersById`
- **loadCampaignCatalogOverrides:** Add `listCampaignMonsters(campaignId)` and merge into `monstersById` (Phase 5)
- **contentPatchRepo / applyContentPatch:** `ContentTypeKey` already includes `'monsters'`; patches work once `monsterRepo.getEntry` applies them

### 2.5 Deprecate Legacy Data

- **File:** `src/data/monsters/index.ts` — update to re-export from system catalog for backward compatibility during migration, or remove after all consumers updated
- **File:** `src/data/monsters/monsters.ts` — delete or keep as `monsters.legacy.ts` for reference until migration verified

**Out of scope (no action):**
- `monsters.lankhmar.ts` and `monsters.lankhmar.legacy.ts` — out of scope; no action.

**Legacy (can break):**
- `src/features/mechanics/domain/adapters/monsters/` — legacy; no need to support; adapters can break.

---

## Phase 3: Monster Repo & List/Detail Domain

**Goal:** Implement `monsterRepo` with system + campaign merge and patching; define list columns and filters.

### 3.1 Monster Repo

- **File:** `src/features/content/monsters/domain/repo/monsterRepo.ts`
- Implement `CampaignContentRepo<Monster, MonsterSummary, MonsterInput>`
- `listSummaries`: use catalog when available (`monstersAllById`, `monsterAllowedIds`); else fetch system + campaign + patches, merge, apply patches
- `getEntry`: campaign first, then system + patch
- `createEntry`, `updateEntry`, `deleteEntry`: call campaign API (Phase 5)

### 3.2 List Columns

- **File:** `src/features/content/monsters/domain/list/monsterList.columns.tsx`
- **Custom columns** (in addition to default campaign content columns):
  - Hit Points: `formatHitPointsWithAverage(mechanics.hitPoints)` → `{count}d{die}{modifier} ({average})` (same format as detail)
  - Armor Class: empty for now (will calculate later)
  - Actions: if `kind === 'weapon'` → `weaponRef` else `name`; comma-separated
  - Bonus Actions: `bonusActions.map(b => b.name).join(', ')`
  - Traits: `traits.map(t => t.name).join(', ')`
  - Challenge Rating: `lore.xpValue`
  - Equipment: keys from `equipment.weapons` and `equipment.armor`, comma-separated

### 3.3 List Filters

- **File:** `src/features/content/monsters/domain/list/monsterList.filters.ts`
- Size Category: select filter (tiny, small, medium, large, huge, gargantuan)
- Plus default filters (source, allowed, search)

### 3.4 Detail Specs

- **File:** `src/features/content/monsters/domain/details/monsterDetail.spec.tsx`
- All `MonsterFields` except `id`, `description.short`
- Non-standard array/object fields → render in **JsonPreviewField**
- Hit Points: `formatHitPointsWithAverage` → `2d6+4 (10)` (same formula used in list column)

**Note:** Use the same `formatHitPointsWithAverage` formula in both MonsterDetailRoute and MonsterListRoute for consistency.

**Ambiguities:**
- "Non-standard array and object fields" — define explicitly: e.g. `mechanics.actions`, `mechanics.bonusActions`, `mechanics.traits`, `mechanics.equipment`, `languages`, etc. Standard = scalar or simple key-value.
- "Default columns" — use `buildCampaignContentColumns` from shared; custom columns inserted via `customColumns`.

---

## Phase 4: Client Routes

**Goal:** Create 4 routes; delete legacy routes; wire router and AuthLayout.

### 4.1 MonsterListRoute

- **File:** `src/features/content/monsters/routes/MonsterListRoute.tsx`
- Mirror `RaceListRoute.tsx`
- Use `useCampaignContentListController` with `monsterRepo.listSummaries`, `contentKey: 'monsters'`, `basePath: /campaigns/:id/world/monsters`
- `buildMonsterCustomColumns`, `buildMonsterCustomFilters`
- Size Category filter + default filters

### 4.2 MonsterDetailRoute

- **File:** `src/features/content/monsters/routes/MonsterDetailRoute.tsx`
- Mirror `RaceDetailRoute.tsx`
- Use `useCampaignContentEntry` with `monsterRepo.getEntry`
- `ContentDetailScaffold` + `buildDetailItemsFromSpecs(MONSTER_DETAIL_SPECS, monster, {})`
- Exclude `id`, `description.short`; non-standard arrays/objects in JSON field

### 4.3 MonsterEditRoute

- **File:** `src/features/content/monsters/routes/MonsterEditRoute.tsx`
- Mirror `RaceEditRoute.tsx`
- System: patch form via `useSystemPatchActions`, `useSystemEntryPatchState`, `PatchDriver`
- Campaign: full form with delete
- Non-standard array/object fields → **JsonPreviewField** (from `@/ui/patterns`)

### 4.4 MonsterCreateRoute

- **File:** `src/features/content/monsters/routes/MonsterCreateRoute.tsx`
- Mirror `RaceCreateRoute.tsx`
- Campaign-only (system monsters not created via UI)
- Non-standard array/object fields → **JsonPreviewField** (from `@/ui/patterns`)

### 4.5 Route Cleanup

- Delete `MonsterRoute.tsx`, `MonstersRoute.tsx`
- Update `src/features/content/monsters/routes/index.ts`: export `MonsterListRoute`, `MonsterDetailRoute`, `MonsterEditRoute`, `MonsterCreateRoute`
- Update `src/app/routes/auth/index.ts`: export new routes
- Update `src/app/routes/index.ts`: export new routes
- Update `src/app/router.tsx`:
  - Replace `MonstersRoute` with `MonsterListRoute` for `path: 'monsters'`
  - Add `path: 'monsters/:monsterId', element: <MonsterDetailRoute />`
  - Add under `ContentManageGuard`: `monsters/new` → `MonsterCreateRoute`, `monsters/:monsterId/edit` → `MonsterEditRoute`

### 4.6 AuthLayout

- **File:** `src/app/layouts/AuthLayout.tsx`
- Menu already links to `ROUTES.WORLD_MONSTERS`; no change needed if path stays `/campaigns/:id/world/monsters`
- Verify menu item "Monsters" still works with new routes

---

## Phase 5: Server Routes & Campaign Monsters

**Goal:** CRUD API for campaign-owned monsters; load into `loadCampaignCatalogOverrides`.

### 5.1 Server Structure

Create under `server/features/content/monsters/`:

| Path | Purpose |
|------|---------|
| `routes/monsters.routes.ts` | GET /, GET /:monsterId, POST /, PATCH /:monsterId, DELETE /:monsterId |
| `controllers/monsters.controller.ts` | listCampaignMonsters, getCampaignMonster, createCampaignMonster, updateCampaignMonster, deleteCampaignMonster |
| `services/monsters.service.ts` | DB operations; model for CampaignMonster |
| `models/CampaignMonster.model.ts` | Mongoose schema (or equivalent) |

### 5.2 Campaign Monster Model

- `campaignId`, `monsterId` (slug), `name`, `data` (JSON for full MonsterFields), `accessPolicy`, `createdAt`, `updatedAt`
- Match pattern used for races: `CampaignRace`-style schema

### 5.3 Mount Routes

- Mount monsters routes at `/api/campaigns/:id/monsters`
- Follow `server/features/content/races` pattern

### 5.4 loadCampaignCatalogOverrides

- **File:** `src/features/mechanics/domain/core/rules/loadCampaignCatalogOverrides.ts`
- Add `listCampaignMonsters(campaignId)` to `Promise.all`
- Merge into `result.monstersById = keyById(monsters)` (transform to catalog shape with `source: 'campaign'`)

**Concerns:**
- Monster documents can be large (nested mechanics). Consider storage limits and indexing.
- Validation: ensure `data` conforms to `MonsterFields`; server-side schema validation.

---

## Phase 6: Patching Verification & Cleanup

**Goal:** Ensure system monster patching works; remove legacy code.

### 6.1 Patching Flow

- `getContentPatch(campaignId)` returns `patches.monsters[monsterId]`
- `monsterRepo.getEntry` for system monster: fetch system entry, apply `applyContentPatch(systemMonster, patch)`, set `patched: true`
- `useSystemPatchActions` + `PatchDriver` in `MonsterEditRoute` for system entries
- Verify `contentPatch.service` accepts `monsters` (already in `VALID_CONTENT_TYPE_KEYS`)

### 6.2 Remove Legacy Imports

- Grep for `@/data/monsters` and `from '@/data/monsters'`; update or remove
- Delete `src/data/monsters/monsters.ts` (or keep `monsters.legacy.ts` temporarily)
- Update `src/data/monsters/index.ts` to re-export from system catalog if any external consumers remain

### 6.3 Tests & Manual Verification

- Manual: create campaign, view monster list, open detail, edit system monster (patch), create campaign monster
- Verify list columns render correctly
- Verify filters work (Size Category, search)

---

## Concerns & Ambiguities

### Concerns

1. **Monster data size:** Monster entries are large. Ensure list summaries are lightweight; avoid loading full mechanics in list.
2. **Hit Points average:** Formula `average = count * ((die+1)/2) + (modifier ?? 0)`. Confirm.
3. **Armor Class "empty for now":** Column exists but values empty; placeholder for future calculation.
4. **Actions column:** `kind === 'weapon'` → `weaponRef`; `kind === 'natural'` or `'special'` → `name`. Ensure all action kinds covered.
5. **Equipment column:** "weapons & armor keys" — use `Object.keys(equipment.weapons ?? {}).concat(Object.keys(equipment.armor ?? {}))`.
6. **Legacy edition files:** `monsters.lankhmar.ts`, `monsters.lankhmar.legacy.ts` — **out of scope; no action.**
7. **Monster adapters:** `src/features/mechanics/domain/adapters/monsters/` — **legacy; no need to support; can break.**

### Ambiguities

1. **"Default filters":** Assumed: source (system/campaign), allowed in campaign, search. Align with `buildCampaignContentFilters`.
2. **"Default columns":** Assumed: name, source, visibility, allowed toggle, actions. From `buildCampaignContentColumns`.
3. **"Non-standard array and object fields":** Proposed: `languages`, `mechanics.traits`, `mechanics.actions`, `mechanics.bonusActions`, `mechanics.equipment`, `mechanics.proficiencies`, `mechanics.senses`, `mechanics.savingThrows`, etc. Standard: `name`, `type`, `sizeCategory`, `lore.xpValue`, etc.
4. **JSON field UX:** Use **JsonPreviewField** (from `@/ui/patterns`) for objects and arrays in Create and Edit routes.
5. **System catalog path:** User wrote `src/features/features/mechanics/...`; using `src/features/mechanics/...`.

---

## Dependency Order

```
Phase 1 (Domain) → Phase 2 (Catalog) → Phase 3 (Repo/List) → Phase 4 (Routes) → Phase 5 (Server) → Phase 6 (Verify)
```

- Phase 2 depends on Phase 1 (Monster type with ContentItem).
- Phase 3 depends on Phase 2 (system catalog provides monsters).
- Phase 4 depends on Phase 3 (repo, columns, filters).
- Phase 5 can start in parallel with Phase 4; `loadCampaignCatalogOverrides` needs Phase 5 for campaign monsters.
- Phase 6 after all phases complete.

---

## File Checklist

| Action | Path |
|--------|------|
| Create | `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts` |
| Create | `src/features/content/monsters/domain/validation/validateMonsterChange.ts` |
| Create | `src/features/content/monsters/domain/repo/monsterRepo.ts` |
| Create | `src/features/content/monsters/domain/list/*` |
| Create | `src/features/content/monsters/domain/details/monsterDetail.spec.tsx` |
| Create | `src/features/content/monsters/domain/forms/*` |
| Create | `src/features/content/monsters/routes/MonsterListRoute.tsx` |
| Create | `src/features/content/monsters/routes/MonsterDetailRoute.tsx` |
| Create | `src/features/content/monsters/routes/MonsterEditRoute.tsx` |
| Create | `src/features/content/monsters/routes/MonsterCreateRoute.tsx` |
| Create | `server/features/content/monsters/*` |
| Modify | `src/features/content/monsters/domain/types/monster.types.ts` |
| Modify | `src/features/content/monsters/utils/formatters.ts` |
| Modify | `src/features/mechanics/domain/core/rules/systemCatalog.ts` |
| Modify | `src/features/mechanics/domain/core/rules/loadCampaignCatalogOverrides.ts` |
| Modify | `src/app/router.tsx` |
| Modify | `src/app/routes/auth/index.ts` |
| Modify | `src/app/routes/index.ts` |
| Delete | `src/features/content/monsters/routes/MonsterRoute.tsx` |
| Delete | `src/features/content/monsters/routes/MonstersRoute.tsx` |
| Deprecate/Delete | `src/data/monsters/monsters.ts` |
