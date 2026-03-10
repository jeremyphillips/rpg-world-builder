# Barrel Removal Plan: Compatibility Barrels → Direct Imports

## Overview

Remove temporary compatibility barrels and update all consumers to import directly from source files. This improves tree-shaking, clarifies dependencies, and reduces indirection.

## Barrel Rule

- **Multiple files in a dir** → add a barrel (`index.ts`), consumers import from the dir
- **Single file in a dir** → no barrel, consumers import by filename

**Examples (weapons):**

| Dir | Barrel? | Consumer imports |
|-----|---------|-------------------|
| `domain/details` | No (single file) | `domain/details/weaponDetail.spec` |
| `domain/list` | Yes (multiple files) | `domain/list` |
| `domain/repo` | No (single file) | `domain/repo/weaponRepo` |
| `domain/forms` | Yes (multiple files + subdirs) | `domain/forms` |

---

## 1. Content Domain Barrels to Remove

### 1.1 `src/features/content/domain/repo/index.ts`

**Current role:** Aggregates repos and types from equipment, races, spells, shared, etc.

**Consumers (13 imports across 10 files):**

| File | Imports |
|------|---------|
| `equipment/armor/routes/ArmorEditRoute.tsx` | `armorRepo` |
| `equipment/armor/routes/ArmorCreateRoute.tsx` | `armorRepo` |
| `equipment/armor/routes/ArmorDetailRoute.tsx` | `armorRepo` |
| `equipment/gear/routes/GearEditRoute.tsx` | `gearRepo` |
| `equipment/gear/routes/GearCreateRoute.tsx` | `gearRepo` |
| `equipment/gear/routes/GearDetailRoute.tsx` | `gearRepo` |
| `equipment/weapons/routes/WeaponEditRoute.tsx` | `weaponRepo` |
| `equipment/weapons/routes/WeaponCreateRoute.tsx` | `weaponRepo` |
| `equipment/weapons/routes/WeaponDetailRoute.tsx` | `weaponRepo` |
| `equipment/magicItems/routes/MagicItemEditRoute.tsx` | `magicItemRepo` |
| `equipment/magicItems/routes/MagicItemCreateRoute.tsx` | `magicItemRepo` |
| `equipment/magicItems/routes/MagicItemDetailRoute.tsx` | `magicItemRepo` |
| `equipment/routes/EquipmentHubRoute.tsx` | `weaponRepo`, `armorRepo`, `gearRepo`, `magicItemRepo` |

**Note:** Races, spells, and skillProficiencies do NOT use this barrel. They import from their own domains (e.g. `@/features/content/races/domain`).

**Migration:** Replace each import with direct path to the repo file:

- `armorRepo` → `@/features/content/equipment/armor/domain/repo/armorRepo`
- `gearRepo` → `@/features/content/equipment/gear/domain/repo/gearRepo`
- `weaponRepo` → `@/features/content/equipment/weapons/domain/repo/weaponRepo`
- `magicItemRepo` → `@/features/content/equipment/magicItems/domain/repo/magicItemRepo`

**Dependency:** `content/domain` is being phased out. `content/domain/index.ts` re-exports from `./repo`; remove that export block when deleting the repo barrel (no consumers of `content/domain` root—only `content/domain/repo` and `content/domain/validation` are used).

---

### 1.2 `src/features/content/domain/validation/index.ts`

**Current role:** Aggregates validators from equipment, races, spells, shared, etc.

**Consumers (4 imports):**

| File | Imports |
|------|---------|
| `equipment/armor/routes/ArmorEditRoute.tsx` | `validateArmorChange` |
| `equipment/gear/routes/GearEditRoute.tsx` | `validateGearChange` |
| `equipment/weapons/routes/WeaponEditRoute.tsx` | `validateWeaponChange` |
| `equipment/magicItems/routes/MagicItemEditRoute.tsx` | `validateMagicItemChange` |

**Migration:** Replace each import with direct path:

- `validateArmorChange` → `@/features/content/equipment/armor/domain/validation/validateArmorChange`
- `validateGearChange` → `@/features/content/equipment/gear/domain/validation/validateGearChange`
- `validateWeaponChange` → `@/features/content/equipment/weapons/domain/validation/validateWeaponChange`
- `validateMagicItemChange` → `@/features/content/equipment/magicItems/domain/validation/validateMagicItemChange`

**Note:** Shared validation types (`validateCharacterReferenceChange`, `buildBlockedMessage`, etc.) are re-exported from this barrel but not used by equipment routes. Other content types (races, spells) import from their own domains. No other consumers of this barrel.

---

## 2. Equipment Domain Barrel to Remove

### 2.1 Files to remove

- `equipment/armor/domain/index.ts`
- `equipment/gear/domain/index.ts`
- `equipment/weapons/domain/index.ts`
- `equipment/magicItems/domain/index.ts`

**Reason:** `domain/index.ts` is too broad. Per the barrel rule: single-file dirs have no barrel; multi-file dirs have a barrel. The domain dir has multiple subdirs (repo, validation, details, list, forms), but it's an aggregate, not a cohesive module—so no domain barrel.

### 2.2 Current structure

Each `domain/index.ts` re-exports from:

- `./repo/{type}Repo` — single file, no barrel
- `./validation/validate{Type}Change` — single file, no barrel
- `./details/{type}Detail.spec` — single file, no barrel
- `./list` — barrel (multiple files)
- `./forms` — barrel (multiple files + subdirs)

### 2.3 Consumers

Equipment routes import from `../domain` (the equipment domain barrel). After removing it, consumers import directly from each subdir:

| Import source | Before | After |
|---------------|--------|-------|
| Repo | `../domain` | `../domain/repo/armorRepo` (filename) |
| Validation | `../domain` | `../domain/validation/validateArmorChange` (filename) |
| Details | `../domain` | `../domain/details/armorDetail.spec` (filename) |
| List | `../domain` | `../domain/list` (barrel) |
| Forms | `../domain` | `../domain/forms` (barrel) |

### 2.4 Migration example (armor)

```ts
// Before (from ../domain):
import { armorRepo } from '@/features/content/domain/repo';
import { validateArmorChange } from '@/features/content/domain/validation';
import {
  type ArmorFormValues,
  getArmorFieldConfigs,
  ARMOR_FORM_DEFAULTS,
  armorToFormValues,
  toArmorInput,
} from '../domain';
import { ARMOR_DETAIL_SPECS } from '../domain';
import { armorListColumns, ... } from '../domain';

// After (direct from subdirs):
import { armorRepo } from '../domain/repo/armorRepo';
import { validateArmorChange } from '../domain/validation/validateArmorChange';
import {
  type ArmorFormValues,
  getArmorFieldConfigs,
  ARMOR_FORM_DEFAULTS,
  armorToFormValues,
  toArmorInput,
} from '../domain/forms';
import { ARMOR_DETAIL_SPECS } from '../domain/details/armorDetail.spec';
import { armorListColumns, ... } from '../domain/list';
```

Apply the same pattern for gear, weapons, and magicItems. **Forms keep their barrel** (`domain/forms`); it has multiple files and subdirs.

---

## 3. Execution Order

**Note:** `content/domain/repo` and `content/domain/validation` import from `equipment/{type}/domain`. Update equipment route consumers first so they no longer use those barrels, then delete barrels, then delete equipment `domain/index.ts`.

1. **Update repo consumers** — Change all 13 imports from `@/features/content/domain/repo` to direct paths (e.g. `../domain/repo/armorRepo`).
2. **Update validation consumers** — Change all 4 imports from `@/features/content/domain/validation` to direct paths (e.g. `../domain/validation/validateArmorChange`).
3. **Update equipment route domain imports** — Change each route from `../domain` to direct imports:
   - Forms → `../domain/forms` (barrel)
   - Details → `../domain/details/{type}Detail.spec` (filename)
   - List → `../domain/list` (barrel)
4. **Update `content/domain/index.ts`** — Remove the `export { ... } from './repo'` block (content/domain is being phased out).
5. **Delete** `content/domain/repo/index.ts` and `content/domain/validation/index.ts`.
6. **Delete** `equipment/{armor,gear,weapons,magicItems}/domain/index.ts`.
7. **Verify** — Run `pnpm build` and `pnpm test`.

---

## 4. Summary of File Changes

| Action | Path |
|--------|------|
| Edit | 10 equipment route files (repo imports) |
| Edit | 4 equipment edit routes (validation imports) |
| Edit | 1 EquipmentHubRoute (4 repo imports) |
| Edit | All equipment route files (domain → forms, details, list direct imports) |
| Edit | `content/domain/index.ts` (remove repo export block) |
| Delete | `content/domain/repo/index.ts` |
| Delete | `content/domain/validation/index.ts` |
| Delete | 4 equipment `domain/index.ts` files |

---

## 5. Scope

- **Equipment only.** Races, spells, and skillProficiencies use their own domains and are unaffected.
