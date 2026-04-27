---
name: Dice forms evaluation
overview: "Original evaluation; Phase 1–3 implementation steps are in the appendix. Apply in Agent mode if edits are blocked."
todos:
  - id: phase-1-3-impl
    content: "Apply Phase 1–3 (see appendix) — dice tests, diceOptions, dicePatchBindings, weapon registry/mappers, spell import, remove shared DIE_FACE_OPTIONS export."
    status: completed
  - id: read-only-complete
    content: Superseded by phase-1-3-impl.
    status: cancelled
isProject: false
---

# Dice / damage / hit-dice form implementation — evaluation report

## Executive summary

The codebase already centralizes **polyhedral XdY parsing and string building** in [`shared/domain/dice/dice.parse.ts`](shared/domain/dice/dice.parse.ts) and **die-face vocab** in [`shared/domain/dice/dice.definitions.ts`](shared/domain/dice/dice.definitions.ts), with [`packages/mechanics/src/dice/index.ts`](packages/mechanics/src/dice/index.ts) re-exporting the shared module. **Weapons** are the only content form that wires **count/die** through **`FieldSpec.patchBinding`** on nested paths (`damage.default` / `damage.versatile`). **Spell damage** uses a **separate stack**: RHF or patch-driven `FieldConfig` rows built in [`SpellEffectPayloadFields.tsx`](src/features/content/spells/domain/forms/components/SpellEffectPayloadFields.tsx) with **assembly/serialization in [`spellEffectRow.assembly.ts`](src/features/content/spells/domain/forms/assembly/spellEffectRow.assembly.ts)** (dice+modifier and flat, **not** `levelScaling`). **Monsters** store **hit points** and **actions** as **JSON** text; there is no structured dice field group in the form—authors edit raw JSON.

**Main maintainability gaps:** (1) **Dual form config APIs** — `FieldSpec`+`kind` (content registries) vs `FieldConfig`+`type` (UI `DynamicFormRenderer`); (2) **Spell damage draft parsing** duplicates concerns of `parseXdY` (regex in `damageToDraftFields` vs strict `parseXdY` for plain XdY); (3) **`DIE_FACE_OPTIONS` lives in shared/dice** though it is RHF/select-oriented; (4) **Versatile damage fallback** inconsistency: registry defaults versatile die to **8** but [`toWeaponInput`](src/features/content/equipment/weapons/domain/forms/mappers/weaponForm.mappers.ts) uses `toDieFace(..., 6)` for versatile; (5) **No tests** for `shared/domain/dice` parse/build or weapon round-trips. **No `levelScaling` editing** in the spell form today—data exists in mechanics only.

**Safest direction** (aligned with your constraints): keep **pure** `parseXdY` / `buildXdY` / `DIE_FACES` in `shared/domain/dice`; add **UI option lists, field-group builders, and patch-binding factories** under `src/features/content/shared/forms/dice/` (or similar), without normalizing all persisted damage shapes.

---

## 1. Current usage inventory

### 1.1 Symbol-level grep results (app + shared)

| Symbol | Where used (representative) |
|--------|----------------------------|
| `parseXdY` | [`weaponForm.registry.ts`](src/features/content/equipment/weapons/domain/forms/registry/weaponForm.registry.ts) (all `patchBinding.parse`/`serialize` for default + versatile) |
| `buildXdY` | `weaponForm.registry`, [`weaponForm.mappers.ts`](src/features/content/equipment/weapons/domain/forms/mappers/weaponForm.mappers.ts), [`spellEffectRow.assembly.ts`](src/features/content/spells/domain/forms/assembly/spellEffectRow.assembly.ts) (`assembleDiceDamageString`) |
| `toCount` / `toDieFace` | `weaponForm` registry + mappers; `spellEffectRow.assembly` |
| `toCountOrZero` | `weaponForm` (versatile only) |
| `DIE_FACES` | Used inside [`dice.parse.ts`](shared/domain/dice/dice.parse.ts) only (validation); re-exported from [`dice/index.ts`](shared/domain/dice/index.ts) |
| `DIE_FACE_OPTIONS` | [`weaponForm.registry.ts`](src/features/content/equipment/weapons/domain/forms/registry/weaponForm.registry.ts), [`SpellEffectPayloadFields.tsx`](src/features/content/spells/domain/forms/components/SpellEffectPayloadFields.tsx) |
| `damageFormat`, `damageDiceCount`, `damageDieFace`, `damageModifier`, `damageFlatValue`, `damageType` | [`spellForm.types.ts`](src/features/content/spells/domain/forms/types/spellForm.types.ts), `SpellEffectPayloadFields`, `spellEffectRow.assembly` — **not** in spell `FieldSpec` list (custom node) |
| `damageBonus` | **Monster action** domain types ([`monster-actions.types.ts`](src/features/content/monsters/domain/types/monster-actions.types.ts)), mechanics data, not content form field names |
| `hitPoints` / `hitDice` | Monster: [`monsterForm.registry.ts`](src/features/content/monsters/domain/forms/registry/monsterForm.registry.ts) `jsonField('hitPoints', …)`; legacy [`src/data/monsters/monsters.lankhmar.ts`](src/data/monsters/monsters.lankhmar.ts) uses `hitDice` number; **5e-style mechanics** use `mechanics.hitPoints: { count, die, modifier? }` |

**Not found in `scripts/`:** any imports of `parseXdY` / shared dice (grep empty).

### 1.2 Manual / duplicate dice logic (outside `parseXdY`)

- [`spellEffectRow.assembly.ts`](src/features/content/spells/domain/forms/assembly/spellEffectRow.assembly.ts) **`damageToDraftFields`**: regex `^(\d+)d(\d+)([+-]\d+)?$` to split count, die, optional modifier. **Differs** from `parseXdY` (no modifiers, strict `^\\d+d\\d+$`). Intentional for extended spell **XdY+mod** and flat/number.
- **No other file** reimplements `parseXdY` for plain XdY; weapons rely entirely on shared helpers.

### 1.3 Content types with dice-like groups today

- **Weapon:** two XdY groups (default + optional versatile) + `damageType`; **implemented in registry** with `patchBinding`.
- **Spell effect (damage):** count/face/modifier/flat + type; **custom component** + **assembly** (no registry `FieldSpec` per inner field).
- **Monster hit points / actions:** **JSON textarea**; no per-field dice UI. [`monsterForm.mappers.ts`](src/features/content/monsters/domain/forms/mappers/monsterForm.mappers.ts) `parseJson` / `formatJson` for `hitPoints` and `actions`.
- **Classes:** `DieFace` in progression types; list options for hit die — **not** a full dice field group in the class form scope searched.

---

## 2. Boundary evaluation

### 2.1 Import-safety (conceptual)

- **`src/features/content` → `shared/domain/dice`:** Used directly (weapons, spells UI/assembly, types). **Safe** if `shared` stays free of `src/features` imports (it does today).
- **`packages/mechanics` → `@/shared/domain/dice`:** Types and re-export ([`packages/mechanics/src/dice/index.ts`](packages/mechanics/src/dice/index.ts), [`effects.types.ts`](packages/mechanics/src/effects/effects.types.ts), etc.). Depends on the repo’s path alias for `@/shared` in the mechanics package; **not** a runtime circular import from `src` **if** `shared` has no reverse dependency.
- **Server / scripts:** No dice parser usage found in `scripts/`. If server only receives already-shaped JSON, no issue.

### 2.2 Circular dependency risks

- **Low** for `shared/domain/dice` (leaf module).
- **Higher** for future “form helpers” if they import feature-specific types; keep helpers **generic** (string paths, `unknown` values) to avoid pulling registries into shared.

### 2.3 UI constants in domain

- [`dice.definitions.ts`](shared/domain/dice/dice.definitions.ts) documents `DIE_FACE_OPTIONS` as **“RHF / select-friendly”** — UI-shaped, co-located with `DIE_FACES`. For your preferred split, **`DIE_FACES` + numeric validation stay in `shared/domain/dice`**, and **`DIE_FACE_OPTIONS` could move to `src/features/content/shared/forms/dice/diceOptions.ts`** (re-exporting labels from a single source of truth or building from the same `DIE_FACE_DEFINITIONS` if moved).

---

## 3. Data-shape inventory (persisted / domain)

| Shape | Example | Where |
|--------|---------|--------|
| String dice `"XdY"` | `"1d8"`, `damage.default` | Weapon [`weapon.types.ts`](src/features/content/equipment/weapons/domain/types/weapon.types.ts) `damage: { default, versatile? }` as `DiceOrFlat` — typically string XdY |
| Nested weapon damage | `damage.default` / `damage.versatile` | As above |
| `damage` + `damageBonus` (separate) | `damage: "2d10"`, `damageBonus: 6` | [`monster-actions.types.ts`](src/features/content/monsters/domain/types/monster-actions.types.ts) `MonsterNaturalAttackAction` / `MonsterSpecialAction` |
| Flat or numeric | `damage: 8` or `"8"` | `DiceOrFlat` in [`dice.types.ts`](shared/domain/dice/dice.types.ts); spell assembly maps flat to number when parseable |
| `XdY+N` | `"1d8+3"` | Spell `assembleDiceDamageString`; mechanics spell data |
| `levelScaling.thresholds[].damage` | Per [`DamageEffect`](packages/mechanics/src/effects/effects.types.ts) | Authored in **mechanics** spell data (e.g. [`cantrips-a-l.ts`](packages/mechanics/src/rulesets/system/spells/data/cantrips-a-l.ts)); **not** in spell content form pipeline |
| Monster HP | `{ count, die, modifier? }` | [`monster.types.ts`](src/features/content/monsters/domain/types/monster.types.ts), JSON in form |

**Naming inconsistency (cross-feature):** `damageModifier` (spell form draft) vs `damageBonus` (monster attack) for **static add** to damage—same concept, different names.

---

## 4. Form-field API compatibility

### 4.1 Two pipelines

- **Content registry:** [`FieldSpec`](src/features/content/shared/forms/registry/fieldSpec.types.ts) uses **`kind`** (`text`, `select`, `numberText`, …), **`parse`/`format`** for mappers, optional **`patchBinding`**. Converted to UI via [`fieldSpecToFieldConfig`](src/features/content/shared/forms/registry/buildFieldConfigs.ts) → yields **`type`** (e.g. `text`, `select`).
- **Spell effect payload:** [`SpellEffectPayloadFields`](src/features/content/spells/domain/forms/components/SpellEffectPayloadFields.tsx) builds plain **`FieldConfig[]`** with **`type`** directly (no `FieldSpec`).

**Implication:** Shared **field-group** helpers should either (a) emit **`FieldConfig` fragments** for the spell/DynamicFormRenderer path, or (b) emit **`FieldSpec` fragments** for the registry path, or (c) define a **small internal “dice field descriptor”** and two thin adapters. **Not** a single TypeScript `FieldConfig` type shared as-is for both if spell rows stay in `type`-first UI config.

### 4.2 Blockers for one universal “builder”

- `kind` vs `type` is a **naming** difference resolved by `fieldSpecToFieldConfig`; the **structural** blocker is **spell nested paths** (`namePrefix` + `joinPrefix`) vs **weapon flat keys** on root form values.
- **Patch driver:** `patchBinding` shape is the **same** between [`fieldSpec.types`](src/features/content/shared/forms/registry/fieldSpec.types.ts) and [`form.types.ts`](src/ui/patterns/form/form.types.ts) (`domainPath` + `parse` + `serialize`).

**Recommendation:** Prefer **one patch-binding factory** (plain objects) + **separate** thin wrappers: “append to `FieldSpec` for weapon” vs “prefix `name` in `FieldConfig` for spell.” Standardizing the entire `FieldSpec` union is **not** a prerequisite for dice extraction.

---

## 5. Patch-binding evaluation (weapons)

Current behavior in [`weaponForm.registry.ts`](src/features/content/equipment/weapons/domain/forms/registry/weaponForm.registry.ts):

- **Default damage:** `parse` from domain string → count/die strings; `serialize` merges with `current` to preserve the sibling axis (count change keeps die from `current`).
- **Versatile:** `optional` semantics: `toCountOrZero` + **`serialize` returns `undefined` when count is 0**; die change when count is 0 is guarded (returns `undefined`).

**Edge cases to preserve in helpers:**

- **Optional XdY → `undefined`:** already implemented for versatile.
- **Die change when count 0:** does not “resurrect” optional damage (lines 156–160 only build when `vCount > 0`).
- **Invalid / empty domain string:** `parseXdY` returns defaults (default `1d6` for default, `0d8` for versatile opts)—predictable but **may differ** from what authors typed if data is non-XdY (e.g. `2d6+1` would fail regex and **reset** in UI to defaults—**hazard** for any future weapon damage with modifiers, though weapons are dice-only today).

**Recommended helper signatures (sketches only, not implemented):**

```ts
// Returns patchBinding for a single "count" or "die" subfield, given full XdY string on domainPath
export function createRequiredXdYCountBinding(opts: {
  domainPath: string
  countFallback: number
  dieFallback: DieFace
}): { domainPath: string; parse: ...; serialize: ... }

export function createRequiredXdYDieBinding(opts: {
  domainPath: string
  dieFallback: DieFace
}): { domainPath: string; parse: ...; serialize: ... }

export function createOptionalXdYCountBinding(opts: {
  domainPath: string
  whenZero: 'undefined'
  defaultCount: number
  defaultDie: DieFace
}): ...

export function createOptionalXdYDieBinding(opts: {
  domainPath: string
  whenZero: 'undefined'
  defaultCount: number
  defaultDie: DieFace
}): ...
```

**Spell effect groups** use a **single** `patchBinding` on the whole `effectGroups` array (serialize `ui` as domain), not per-dice subfields—**different** from weapons; patch-binding factories are **most valuable for weapons** and any future **path-based** scalar fields.

---

## 6. Candidate shared helpers (`src/features/content/shared/forms/dice/`)

| File | Responsibility | Do **not** put here |
|------|----------------|---------------------|
| `diceOptions.ts` | `DIE_FACE_OPTIONS` (and any select labels); optional `count` presets | Parsing rules, `parseXdY` |
| `diceFieldGroups.ts` | Building **FieldSpec** or **FieldConfig** fragments for “count + die” rows (default path prefixing) | Domain types (`WeaponInput`), mechanics |
| `damageFieldGroups.ts` | Spell-oriented: format toggle, flat field, type picker wiring **names** | `formRowToSpellEffect` (stays in assembly) |
| `hitDiceFieldGroups.ts` | Future: `count`/`die`/`modifier` for **monster HP** or class hit die, once JSON is not the only editor | JSON serialization |
| `dicePatchBindings.ts` | Factories in §5; unit-tested against real weapon paths | `DIE_FACES` definitions |

**`DIE_FACE_OPTIONS` vs `DIE_FACES`:** Yes—**keep** numeric validation + `DieFace` in `shared/domain/dice`, **move** option arrays to form space (or re-export from shared definitions in one place to avoid label drift).

---

## 7. Refactor phases (proposed, low risk)

| Phase | Focus | Target files | Expected behavior | Risks | Tests | Rollback |
|-------|--------|--------------|-------------------|-------|--------|----------|
| **1** | **Inventory + contract tests** for `parseXdY` / `buildXdY` / `toCount` / `toDieFace` (document `defaultCount: 0` behavior) | `shared/domain/dice` + new `dice.parse.test.ts` | **None** (tests only) | Test expectations codify current quirks | `vitest` unit | Delete test file |
| **2** | **Extract** `dicePatchBindings` factories; **replace** inline verbose bindings in weapon registry | `weaponForm.registry.ts`, new `.../shared/forms/dice/dicePatchBindings.ts` | **None** if factories match | Subtle `serialize` drift | **Snapshot or table-driven** tests + manual weapon save in UI | Revert factory use, keep helpers unused |
| **3** | **Weapon default/versatile** uses factories only; fix **versatile `toDieFace` fallback** (6 vs 8) *if* desired as behavior fix | `weaponForm.mappers.ts` + registry | **Possible** 1-line fix: align fallback with `defaultValue` for versatile die | Authors relying on old fallback | Mappers + integration test: “versatile 0 count omits `versatile`” | Revert mappers only |
| **4** | **Field group builders** (`diceFieldGroups`) for count+die+group metadata; wire weapon registry to use them | `weaponForm.registry` | **None** | Indirection | Same as phase 2 | Revert to inline field arrays |
| **5** | **Spell** — optionally use shared **options** and shared **FieldConfig** builders for `SpellEffectPayloadFields` (names still `namePrefix`); **not** `levelScaling` until product scope exists | `SpellEffectPayloadFields.tsx`, `diceOptions` | **None** if names unchanged | Accidentally breaking RHF `name` paths | `spellEffectRow.assembly.test`, `SpellEffectPayloadFields.test`, `spellForm.effectGroups.test` | Revert component |
| **6** | **Docs** (only if you explicitly want): short `AGENTS.md` or design note in agreed location | (your choice) | N/A | — | — | — |

**Monster actions / hit dice structured UI** is a **larger** step (JSON → repeatable groups or subforms); keep out of “safe” early phases or scope as a **separate** epic.

---

## 8. Testing recommendations

**Existing tests:**

- [`spellEffectRow.assembly.test.ts`](src/features/content/spells/domain/forms/assembly/spellEffectRow.assembly.test.ts) — dice with modifier, flat, round-trip groups
- [`spellForm.effectGroups.test.ts`](src/features/content/spells/domain/forms/__tests__/spellForm.effectGroups.test.ts) — `toSpellInput` from nested form values
- [`SpellEffectPayloadFields.test.tsx`](src/features/content/spells/domain/forms/components/SpellEffectPayloadFields.test.tsx) — UI smoke (e.g. flat format)
- **No** `weaponForm` mappers / registry tests found
- **No** `shared/domain/dice` unit tests

**Recommended new tests:**

- **`parseXdY`:** empty, invalid, `0d8`, `defaultCount: 0`, die not in `DIE_FACES`
- **`toCountOrZero` / optional versatile** end-to-end with **`patchBinding` factories** (mock domain values)
- **Weapon** `weaponToFormValues` ↔ `toWeaponInput` for default + versatile, including `versatile` omitted when 0
- **Monster** (if/when structured): `damage` + `damageBonus` display/encoding—not covered until JSON is replaced or validated
- **Spell:** dice/flat switch **already** partially covered; add **`damageToDraftFields` for `1d4+1`** and **non-integer flat strings** if those are supported in prod data
- **`levelScaling`:** no form tests until editing exists; mechanics data tests stay in mechanics/encounter

**Infrastructure:** Standard **Vitest** is present; no new harness required for unit tests.

---

## 9. Architecture concerns (hazards)

- **Duplicated “XdY+modifier” parsing** in `damageToDraftFields` vs **strict** `parseXdY` for plain XdY—risk of drift.
- **UI options** (`DIE_FACE_OPTIONS`) in **shared** dice folder—bleeds UI into domain package layout.
- **Two field config shapes** (`FieldSpec` vs `FieldConfig`)—composable **descriptors** or **two thin builders** avoid a big-bang unification.
- **Monster** `actions` / `hitPoints` as **JSON**—no structured validation at edit time; high typo risk; blocks reuse of shared dice widgets without a bridge layer.
- **Weapon versatile die fallback 6 vs default 8** in [`toWeaponInput`](src/features/content/equipment/weapons/domain/forms/mappers/weaponForm.mappers.ts) — real inconsistency to fix in a mapper-focused phase.
- **Flat damage** in spells: stored as `number` or string per `parseDiceOrFlat`—**acceptable**; document for shared helpers.
- **Non-XdY weapon strings** in data (if ever) would **reset** in UI through `parseXdY`—document as limitation for weapons staying dice-only.

---

## 10. Open questions / decisions

1. **Versatile `toDieFace` fallback:** Should the fallback be **6** or **8** to match the form default `'8'`?
2. **Move `DIE_FACE_OPTIONS`:** Approve move to `src/features/content/shared/forms/dice` with `shared` importing **only** `DIE_FACES` / definitions for validation?
3. **Spell `levelScaling`:** Out of scope for “form composition” until product requires authoring; confirm.
4. **Monster actions:** Is the next step **JSON validation (Zod)** only, or **full structured form**? That choice dominates Phase 5+ effort.
5. **Mechanics package path alias:** Confirm `@/shared/domain/dice` resolution for `packages/mechanics` in CI (single tsconfig or package-level paths).

---

## Key file index

| File | Role |
|------|------|
| [`shared/domain/dice/dice.parse.ts`](shared/domain/dice/dice.parse.ts) | `parseXdY`, `buildXdY`, `toCount`*, `toDieFace` |
| [`shared/domain/dice/dice.definitions.ts`](shared/domain/dice/dice.definitions.ts) | `DIE_FACES`, `DIE_FACE_OPTIONS` |
| [`weaponForm.registry.ts`](src/features/content/equipment/weapons/domain/forms/registry/weaponForm.registry.ts) | **Only** `patchBinding` for dice today |
| [`spellEffectRow.assembly.ts`](src/features/content/spells/domain/forms/assembly/spellEffectRow.assembly.ts) | Dice+flat+modifier **assembly** |
| [`SpellEffectPayloadFields.tsx`](src/features/content/spells/domain/forms/components/SpellEffectPayloadFields.tsx) | Dynamic `FieldConfig` for spell damage |
| [`monsterForm.registry.ts`](src/features/content/monsters/domain/forms/registry/monsterForm.registry.ts) | `hitPoints` + `actions` as **JSON** |
| [`FieldSpec` types](src/features/content/shared/forms/registry/fieldSpec.types.ts) / [`FieldConfig` types](src/ui/patterns/form/form.types.ts) | `patchBinding` contract (aligned) |

---

## Appendix: Phase 1–3 implementation (requested)

**Status:** File edits for `.ts` / `.tsx` were **blocked** in Plan mode; **switch to Agent mode** in Cursor and re-run the implementation (or paste the files below). The plan frontmatter tracks todo `phase-1-3-impl`.

### 1) `shared/domain/dice/dice.parse.test.ts` (new)

Add Vitest tests covering: `buildXdY`; `parseXdY` (empty, invalid, no modifiers, `defaultCount: 0`, invalid die, `0d6` clamp); `toDieFace`, `toCount`, `toCountOrZero` (as in the draft below).

### 2) `src/features/content/shared/forms/dice/diceOptions.ts` (new)

- `import { DIE_FACE_DEFINITIONS } from '@/shared/domain/dice'` (or `dice.definitions` if the barrel is avoided).
- Export `DIE_FACE_OPTIONS` with the same `map` as before.

### 3) `src/features/content/shared/forms/dice/dicePatchBindings.ts` (new)

Factories: `createRequiredXdYCountBinding`, `createRequiredXdYDieBinding`, `createOptionalXdYCountBinding`, `createOptionalXdYDieBinding` with `XdYScalarPatchBinding` type. Use `asDomainString` for `current` (handles `undefined`). Match existing weapon `serialize` logic exactly.

**Optional count binding** serialize must use `buildXdY({ count: vCount, die: parsed.die })` with `die` from `parseXdY` (same as old weapon registry) — do **not** run `toDieFace` on `parsed.die` for that path.

### 4) `shared/domain/dice/dice.definitions.ts`

- Remove the `DIE_FACE_OPTIONS` constant and its comment (moved to content).

### 5) `shared/domain/dice/index.ts`

- Remove `DIE_FACE_OPTIONS` from the export list from `./dice.definitions`.

### 6) `src/features/content/equipment/weapons/domain/forms/registry/weaponForm.registry.ts`

- `import { DIE_FACE_OPTIONS }` from `@/features/content/shared/forms/dice/diceOptions`.
- `import { createRequiredXdY* , createOptionalXdY* }` from `@/features/content/shared/forms/dice/dicePatchBindings`.
- `import { parseXdY, buildXdY, toCount, toCountOrZero, toDieFace }` — **only if still needed**; patch bindings can live entirely in helpers (remove unused imports).
- Replace `patchBinding` for `damageDefaultCount` with `createRequiredXdYCountBinding({ domainPath: 'damage.default', countFallback: 1, dieFallback: 6 })`.
- Replace `damageDefaultDie` with `createRequiredXdYDieBinding({ domainPath: 'damage.default', dieFallback: 6 })`.
- Versatile: `createOptionalXdYCountBinding({ domainPath: 'damage.versatile', parseOptions: { defaultCount: 0, defaultDie: 8 }, countZeroFallback: 0, dieFallback: 8 })` and `createOptionalXdYDieBinding` with the same `parseOptions` and `countZeroFallback: 0, dieFallback: 8`.

### 7) `src/features/content/equipment/weapons/domain/forms/mappers/weaponForm.mappers.ts`

- `toDieFace(values.damageVersatileDie, 8)` (was 6) for versatile in `toWeaponInput`.

### 8) `src/features/content/spells/domain/forms/components/SpellEffectPayloadFields.tsx`

- `DIE_FACE_OPTIONS` from `@/features/content/shared/forms/dice/diceOptions`.

### 9) `src/features/content/spells/domain/forms/types/spellForm.types.ts`

- JSDoc: reference `DIE_FACE_OPTIONS` in `@/features/content/shared/forms/dice/diceOptions`.

### 10) Tests

- `src/features/content/equipment/weapons/domain/forms/mappers/weaponForm.mappers.test.ts`: round-trip default `1d8`; versatile `1d10` with `properties: ['versatile']`; `versatile` omitted when `damageVersatileCount` is 0; when count 0, changing `damageVersatileDie` still yields no `versatile` in `toWeaponInput` (e.g. die `'10'` with count `'0'`).
- `src/features/content/shared/forms/dice/dicePatchBindings.test.ts` (optional but recommended): assert serialize edge cases for optional bindings vs `current` undefined/invalid strings.

### 11) Run

- `npx vitest run shared/domain/dice/dice.parse.test.ts src/features/content/.../weaponForm.mappers.test.ts src/features/content/shared/forms/dice/dicePatchBindings.test.ts`

### Behavior change (documented)

- **Versatile die fallback in `toWeaponInput`:** from **6** to **8** when the UI value is invalid; aligns with `defaultValue: '8'` and optional parse defaults.

### Rollback

- Revert the listed files; restore `DIE_FACE_OPTIONS` in `dice.definitions` + `index` if reverted wholesale.
