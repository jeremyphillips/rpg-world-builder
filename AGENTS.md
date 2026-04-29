# Agent / contributor notes

## Dice in content forms

- **Parsing and polyhedral validation:** [`shared/domain/dice`](shared/domain/dice) — `parseXdY`, `buildXdY`, `DIE_FACES`, `DIE_FACE_DEFINITIONS`.
- **Select options (RHF / forms):** [`src/features/content/shared/forms/dice/diceOptions.ts`](src/features/content/shared/forms/dice/diceOptions.ts) — `DIE_FACE_OPTIONS`. Do not re-add `DIE_FACE_OPTIONS` to `shared/domain/dice` exports.
- **Patch driver bindings for split count/die UI:** [`src/features/content/shared/forms/dice/dicePatchBindings.ts`](src/features/content/shared/forms/dice/dicePatchBindings.ts).
- **Spell effect damage rows:** `damageToDraftFields` in [`spellEffectRow.assembly.ts`](src/features/content/spells/domain/forms/assembly/spellEffectRow.assembly.ts) uses `parseXdY` for **plain** `XdY` strings; strings with a modifier (`XdY+N`) use the existing regex path.

**Tests for this area:** `npx vitest run shared/domain/dice/dice.parse.test.ts src/features/content/shared/forms/dice/ src/features/content/equipment/weapons/domain/forms/ src/features/content/spells/domain/forms/assembly/spellEffectRow.assembly.test.ts src/features/content/spells/domain/forms/__tests__/spellForm.effectGroups.test.ts` — A full `npx vitest run` may report unrelated failures elsewhere in the monorepo; use the slice above when working on dice/forms.
