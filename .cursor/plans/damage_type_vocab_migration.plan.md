# Damage type vocab migration (vocab `damage/` subdir)

## Layout

- New directory: [`src/features/content/shared/domain/vocab/damage/`](../../src/features/content/shared/domain/vocab/damage/) containing all damage vocab modules and a local [`index.ts`](../../src/features/content/shared/domain/vocab/damage/index.ts) barrel.
- Parent [`vocab/index.ts`](../../src/features/content/shared/domain/vocab/index.ts) adds `export * from './damage';` (replaces per-file `damageTypesSelect` export once moved here).

## Files in `vocab/damage/`

- `physicalDamageTypes.vocab.ts` — bludgeoning, piercing, slashing + SRD 5.2.1–aligned `description` strings
- `elementalDamageTypes.vocab.ts` — fire, cold, acid, lightning, thunder, poison + descriptions
- `planarDamageTypes.vocab.ts` — radiant, necrotic, force, psychic + descriptions
- `energyDamageTypes.vocab.ts` — `[...ELEMENTAL, ...PLANAR] as const`, `EnergyDamageType`, `ENERGY_DAMAGE_TYPE_IDS`
- `damageTypeDisplay.vocab.ts` — `DAMAGE_TYPE_ROWS`, `getDamageTypeDisplayName`, `DAMAGE_TYPE_SELECT_OPTIONS` (full list), `DamageTypeRowId`
- `damageTypesSelect.vocab.ts` — energy-only select (moved from parent `vocab/`)
- `index.ts` — re-exports

## Mechanics

- `elementalDamageTypes.ts` / `planarDamageTypes.ts` / `energyDamageTypes.ts` — re-export from `@/features/content/shared/domain/vocab/damage/...`
- `damageTypeUi.ts` — keep only `RESISTANCE_SPELL_*` imports; import `DAMAGE_TYPE_ROWS` from shared display
- `damage.types.ts` — unchanged public API, still re-exporting via mechanics barrel

## Other updates

- `weapons.vocab.ts` — `WEAPON_DAMAGE_TYPE_OPTIONS` from shared physical + `none`
- All imports of old paths updated to `.../vocab/damage/...` or parent barrel
- Remove deprecated file at `vocab/damageTypesSelect.vocab.ts` after move (if duplicating, delete)
