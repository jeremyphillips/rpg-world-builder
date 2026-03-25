# Line of sight (first pass) — scope

## In scope (implemented + documented)

- `space.sight.ts`: Amanatides & Woo–style supercover, `cellBlocksSight`, `hasLineOfSight`, `traceLineOfSightCells`
- `visibility-seams.ts`: `lineOfSightClear` / `lineOfEffectClear` wired to `hasLineOfSight` when space exists
- Unit tests in `space/__tests__/space.sight.test.ts`
- **`docs/reference/space.md`**: directory entry, LOS section (algorithm, blocking rules, targeting composition), limitations table update, key types row

## Out of scope (later)

- Cover levels, obscurement, special senses, spell metadata flags, rich LoS UI overlays
