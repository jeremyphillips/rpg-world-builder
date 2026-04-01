# Phased Plan: Content Domain Relocation

This document outlines a phased migration to relocate feature-specific types, vocab, and enchantment from `content/shared` into their respective feature boundaries. All paths use `src/features/content/` as the base.

---

## Phase 1: Relocate Feature-Specific Types

**Goal:** Move feature-specific types from `shared/domain/types` into their owning features. Types that remain in shared: `alignment.types.ts`, `content.types.ts`.

### 1.1 Equipment Types

| Current Path | New Path |
|-------------|----------|
| `shared/domain/types/equipment.types.ts` | `equipment/shared/domain/types/equipment.types.ts` |
| `shared/domain/types/armor.types.ts` | `equipment/armor/domain/types/armor.types.ts` |
| `shared/domain/types/weapon.types.ts` | `equipment/weapons/domain/types/weapon.types.ts` |
| `shared/domain/types/gear.types.ts` | `equipment/gear/domain/types/gear.types.ts` |
| `shared/domain/types/magicItem.types.ts` | `equipment/magicItems/domain/types/magicItem.types.ts` |

**Dependency notes:**
- `equipment.types.ts` imports `Armor`, `Weapon`, `Gear`, `MagicItem` from subtype files → update to relative imports from `../armor/domain/types`, `../weapons/domain/types`, etc.
- `armor.types.ts` imports `EquipmentBase` from `equipment.types` → update to `@/features/content/equipment/shared/domain/types` or relative path.
- Each subtype imports `content.types` (stays in shared) and its vocab (Phase 3).

**Order:** Create `equipment/shared/domain/types/` first, move `equipment.types.ts`, then move subtypes (armor → weapons → gear → magicItems) so equipment.types can resolve its union.

### 1.2 Race Types

| Current Path | New Path |
|-------------|----------|
| `shared/domain/types/race.types.ts` | `races/domain/types/race.types.ts` |

### 1.3 Spell Types

| Current Path | New Path |
|-------------|----------|
| `shared/domain/types/spell.types.ts` | `spells/domain/types/spell.types.ts` |

**Note:** `spell.types.ts` imports `MagicSchool` from `../vocab` → update to shared vocab (magicSchools stays in shared).

### 1.4 Skill Proficiency Types

| Current Path | New Path |
|-------------|----------|
| `shared/domain/types/skillProficiency.types.ts` | `skillProficiencies/domain/types/skillProficiency.types.ts` |

### 1.5 Barrel Exports (Exception to Barrel Rule)

Add `index.ts` barrel to each new `domain/types` directory:

- `equipment/shared/domain/types/index.ts`
- `equipment/armor/domain/types/index.ts`
- `equipment/weapons/domain/types/index.ts`
- `equipment/gear/domain/types/index.ts`
- `equipment/magicItems/domain/types/index.ts`
- `races/domain/types/index.ts`
- `spells/domain/types/index.ts`
- `skillProficiencies/domain/types/index.ts`

### 1.6 Update Shared Types Index

After moves, `shared/domain/types/index.ts` should export only:

- `content.types`
- `alignment.types`
- Re-exports from feature types (for backward compatibility during migration) **OR** update all consumers (Phase 4).

**Recommendation:** Prefer updating consumers in Phase 4 rather than re-exporting from shared to avoid "export tunnels" and preserve clear ownership.

---

## Phase 2: Migrate Enchantment to Feature

**Goal:** Promote enchantment from shared to its own feature at `content/enchantments/`.

### 2.1 Create Enchantments Feature Structure

```
src/features/content/enchantments/
├── domain/
│   ├── types/
│   │   ├── enchantment.types.ts
│   │   └── index.ts
│   └── repo/
│       ├── enchantmentRepo.ts
│       └── index.ts
```

### 2.2 File Moves

| Current Path | New Path |
|-------------|----------|
| `shared/domain/types/enchantment.types.ts` | `enchantments/domain/types/enchantment.types.ts` |
| `shared/domain/repo/enchantmentRepo.ts` | `enchantments/domain/repo/enchantmentRepo.ts` |

### 2.3 Dependency Updates

- `enchantment.types.ts` imports `MagicItemRarity` from `magicItem.types` → update to `@/features/content/equipment/magicItems/domain/types`.
- `enchantmentRepo.ts` imports `EnchantmentTemplate` from `../types` → update to local `./types` or `../types/enchantment.types`.

### 2.4 Update Shared Repo Index

Remove `enchantmentRepo` from `shared/domain/repo/index.ts`. Export only `contentRepo.types` (and any other non-enchantment repos).

### 2.5 Consumer Updates (Partial List)

- `mechanics/domain/effects/sources/enchantments-to-effects.ts`
- `mechanics/domain/core/rules/systemCatalog.enchantments.ts`
- `mechanics/domain/core/rules/loadCampaignCatalogOverrides.ts`
- `characterBuilder/steps/MagicItemsStep/MagicItemsStep.tsx` (EnchantableSlot, etc.)

---

## Phase 3: Migrate Feature-Specific Vocab Files

**Goal:** Move equipment-specific vocab into their owning features. Keep `alignment.vocab.ts` and `magicSchools.vocab.ts` in shared.

### 3.1 Vocab Relocations

| Current Path | New Path |
|-------------|----------|
| `shared/domain/vocab/armor.vocab.ts` | `equipment/armor/domain/vocab/armor.vocab.ts` |
| `shared/domain/vocab/weapons.vocab.ts` | `equipment/weapons/domain/vocab/weapons.vocab.ts` |
| `shared/domain/vocab/gear.vocab.ts` | `equipment/gear/domain/vocab/gear.vocab.ts` |
| `shared/domain/vocab/magicItems.vocab.ts` | `equipment/magicItems/domain/vocab/magicItems.vocab.ts` |

**Remain in shared:**
- `alignment.vocab.ts`
- `magicSchools.vocab.ts`

### 3.2 Barrel Exports (Exception to Barrel Rule)

Add `index.ts` to each new `domain/vocab` directory:

- `equipment/armor/domain/vocab/index.ts`
- `equipment/weapons/domain/vocab/index.ts`
- `equipment/gear/domain/vocab/index.ts`
- `equipment/magicItems/domain/vocab/index.ts`

### 3.3 Update Shared Vocab Index

`shared/domain/vocab/index.ts` should export only:

- `alignment.vocab`
- `magicSchools.vocab`

### 3.4 Consumer Updates

**Armor vocab** (Material, ArmorCategory, DexContributionMode):
- `shared/domain/types/armor.types.ts` → now `equipment/armor/domain/types/armor.types.ts` (local `../vocab`)
- `equipment/armor/domain/forms/types/armorForm.types.ts`
- `equipment/armor/domain/forms/registry/armorForm.registry.ts`
- `classes/domain/types/proficiencies.types.ts` (Material)

**Weapons vocab** (WeaponDamageType, WeaponCategory, etc.):
- `equipment/weapons/domain/types/weapon.types.ts` (local `../vocab`)
- `equipment/weapons/domain/forms/*`
- `character/hooks/useCombatStats.ts`
- `mechanics/domain/resolution/attack-resolver.ts`

**Gear vocab**:
- `equipment/gear/domain/types/gear.types.ts`
- `equipment/gear/domain/forms/*`

**MagicItems vocab**:
- `equipment/magicItems/domain/types/magicItem.types.ts`
- `equipment/magicItems/domain/forms/*`
- `characterBuilder/steps/MagicItemsStep/MagicItemsStep.tsx`

---

## Phase 4: Imports & Exports Cleanup

**Goal:** Update all imports to use new paths. Add barrels where specified. Ensure no broken references.

### 4.1 Barrel Rule Exception

Per plan: add barrel (`index.ts`) to each `domain/types` and `domain/vocab` directory created in Phases 1–3. This is an explicit exception to the architecture barrel rule (Section 9) to improve import ergonomics for these domain boundaries.

### 4.2 Import Path Migration

**Types:** Replace `@/features/content/shared/domain/types` (or `/types/foo.types`) with feature-specific paths:

| Type | New Import Path |
|------|-----------------|
| Armor, ArmorFields | `@/features/content/equipment/armor/domain/types` |
| Weapon, WeaponFields | `@/features/content/equipment/weapons/domain/types` |
| Gear, GearFields | `@/features/content/equipment/gear/domain/types` |
| MagicItem, MagicItemFields | `@/features/content/equipment/magicItems/domain/types` |
| EquipmentBase, EquipmentItem | `@/features/content/equipment/shared/domain/types` |
| Race, RaceFields | `@/features/content/races/domain/types` |
| Spell, SpellBase | `@/features/content/spells/domain/types` |
| SkillProficiency | `@/features/content/skillProficiencies/domain/types` |
| EnchantmentTemplate, EnchantableSlot | `@/features/content/enchantments/domain/types` |
| AlignmentId, ContentSummary, etc. | `@/features/content/shared/domain/types` (unchanged) |

**Vocab:** Replace shared vocab imports with feature-specific paths where moved:

| Vocab | New Import Path |
|-------|-----------------|
| Armor vocab | `@/features/content/equipment/armor/domain/vocab` |
| Weapons vocab | `@/features/content/equipment/weapons/domain/vocab` |
| Gear vocab | `@/features/content/equipment/gear/domain/vocab` |
| MagicItems vocab | `@/features/content/equipment/magicItems/domain/vocab` |
| Alignment, MagicSchools | `@/features/content/shared/domain/vocab` (unchanged) |

### 4.3 Cross-Feature Imports

Some consumers (e.g. `mechanics`, `characterBuilder`, `character`) import from multiple content features. Update each to use the new paths. Key files (from grep):

- `mechanics/domain/core/rules/systemCatalog.ts` (many types)
- `mechanics/domain/core/rules/systemCatalog.*.ts` (per-content-type)
- `characterBuilder/*`
- `character/*`
- `content/equipment/*/routes/*`
- `content/races/routes/*`
- `content/spells/*`
- `content/skillProficiencies/*`
- `content/classes/*`

### 4.4 Verification

After each phase (or at end of Phase 4):

1. `npm run build` passes
2. TypeScript passes
3. Lint passes
4. No remaining imports from old paths (except shared types/vocab that stayed)

---

## Execution Order Summary

1. **Phase 1** – Types relocation (equipment shared first, then subtypes, then races/spells/skillProficiencies)
2. **Phase 2** – Enchantment feature extraction
3. **Phase 3** – Vocab relocation
4. **Phase 4** – Import updates and verification

Phases 1–3 can be done incrementally with temporary re-exports from shared if desired, but Phase 4 should remove those to avoid export tunnels and preserve clear ownership per architecture rules.
