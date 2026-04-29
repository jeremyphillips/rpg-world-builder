---
name: Spell form registry refactor
overview: Full-stack alignment — spell forms use flat UI fields + composite assembly to produce SpellInput; campaign spell API, Mongoose persistence, and read-path normalization match SpellBase/SpellInput in one branch. Textarea (not WYSIWYG) for description.full. Backend persistence is required, not deferred.
todos:
  - id: server-schema-normalize
    content: Extend CampaignSpell Mongoose schema; add normalizeCampaignSpellDoc (legacy → SpellBase); use in spells.service + gameSession catalog
    status: pending
  - id: server-validation-crud
    content: Replace validateInput with full-shape validation; update create/update $set; align CampaignSpellDoc export type
    status: pending
  - id: spell-form-values
    content: Expand SpellFormValues; descriptionFull/descriptionSummary textarea; spell-specific base fields (no generic description string)
    status: pending
  - id: assembly-modules
    content: Add forms/assembly/* for castingTime, duration, range, components, description + spellPayload build/split
    status: pending
  - id: options-helpers
    content: Add forms/options/* mapping vocab definitions to FieldSpecOption[]
    status: pending
  - id: registry-visibleWhen
    content: Refactor spellForm.registry — vocab options, flat fields, visibleWhen; split simple FieldSpecs for buildToInput
    status: pending
  - id: mappers-orchestrate
    content: spellForm.mappers orchestrates buildToInput(simple) + assembly; align spellRepo DTO with server
    status: pending
  - id: tests-full-stack
    content: Assembly + mapper + server validation + normalization + optional legacy-doc fixture tests
    status: pending
isProject: false
---

# Spell form registry + campaign spell persistence — refined plan

## Refined architecture summary

- **Single domain shape**: [`SpellBase`](src/features/content/spells/domain/types/spell.types.ts) / [`SpellInput`](src/features/content/spells/domain/types/spell.types.ts) (omit `id` for writes) remains the source of truth for what a spell *is*.
- **Form layer**: Expanded **flat** `SpellFormValues` for every control; [`FieldSpec`](src/features/content/shared/forms/registry/fieldSpec.types.ts) registry stays **declarative** for 1:1 fields and wiring (`visibleWhen`, options).
- **Composite assembly**: Explicit modules under `forms/assembly/` build nested `description`, `castingTime`, `duration`, `range`, `components` from the full form object (because [`buildToInput`](src/features/content/shared/forms/registry/buildMappers.ts) only sees one field value per spec).
- **Mapper orchestration**: [`spellForm.mappers.ts`](src/features/content/spells/domain/forms/mappers/spellForm.mappers.ts) runs `buildToInput(simpleSpecs)` and merges **`assembleSpellInput(values)`**; reverse path uses `buildToFormValues(simpleSpecs)` + **`splitSpellToFormValues(spell)`**.
- **Presentation**: **`description.full` and `description.summary` use `textarea`** (not WYSIWYG) until a dedicated rich-text field kind exists.
- **Legacy quarantine**: No legacy API quirks inside form assembly. Any adaptation for old DB documents lives in **server read normalization** (and optionally one migration script), not in the form.
- **Backend lockstep**: Mongoose schema, HTTP validation, create/update mapping, and **both** HTTP responses and [`resolveCampaignRulesAndCatalog.server.ts`](server/features/gameSession/services/resolveCampaignRulesAndCatalog.server.ts) expose the **same** canonical nested shape.

---

## Exact scope for this pass

### In scope — nested objects that must round-trip (form ↔ API ↔ DB)

Target assembly matches **`SpellInput`** fields that are composite or structured:

| Domain field | Notes |
|--------------|--------|
| `description` | `{ full: string; summary: string }` — both **textarea** in UI |
| `castingTime` | [`SpellCastingTime`](src/features/content/spells/domain/types/spell.types.ts) — `normal`, `canBeCastAsRitual`; optional `trigger` when unit is reaction |
| `duration` | [`SpellDuration`](src/features/content/spells/domain/types/spell.types.ts) — support **MVP kinds** in the form (see below) |
| `range` | [`SpellRange`](src/features/content/spells/domain/types/spell.types.ts) discriminated union |
| `components` | [`SpellComponents`](src/features/content/spells/domain/types/spell.types.ts) + material sub-fields per domain |

Also **1:1** fields that already map cleanly: `name`, `school`, `level`, `classes`, `effects` (JSON array in form), `imageKey`, `accessPolicy`.

**Optional on `SpellInput` (persist if present, form may omit or use JSON/advanced later)**: `scaling`, `resolution`, `deliveryMethod` — store in Mongoose if in domain type; **do not** block shipping full round-trip for the core composites if the form leaves them undefined/empty and defaults apply.

### Explicitly out of scope

- **`tags`**: omit from form and persistence unless already required elsewhere.
- **AoE / “size in feet” at spell top level**: **not** in `SpellBase` today — keep out unless the domain type gains a field in a separate change.
- **Advanced authoring for every `SpellDuration` / `SpellCastingTime` branch**: schema and API accept full discriminated unions; the **form MVP** may only expose a **subset** of kinds (e.g. `instantaneous`, `timed`, `special`, `until-dispelled`; defer `until-turn-boundary` UI until designed) while still producing **valid** domain objects for supported cases.
- **`SpellCastingTime.alternate`**: out of form MVP unless a product requirement appears; persisted spells may still carry `alternate` if imported/edited elsewhere later.

---

## Domain/client target shape (confirm)

Authoritative definitions: [`spell.types.ts`](src/features/content/spells/domain/types/spell.types.ts).

- **`SpellInput`** = `Omit<SpellBase, 'id'> & { accessPolicy? }`.
- **No** top-level `ritual` or `concentration` on `SpellBase` — ritual lives on **`castingTime.canBeCastAsRitual`**; concentration on **duration** (and related variants) per union members.

---

## Exact current mismatch (SpellBase vs persisted campaign spell)

| Area | `SpellBase` / `SpellInput` | Current Mongoose + [`CampaignSpellDoc`](server/features/content/spells/services/spells.service.ts) |
|------|---------------------------|---------------------------------------------------------------------------------------------------|
| `description` | Nested `{ full, summary }` | Single **string** only |
| `castingTime` | Required `SpellCastingTime` | **Absent** |
| `range` | Required `SpellRange` | **Absent** |
| `duration` | Required `SpellDuration` | **Absent** |
| `components` | Required `SpellComponents` | **Absent** |
| `scaling` | Optional array | **Absent** |
| Legacy | *(none)* | Top-level **`ritual`**, **`concentration`** |
| Client [`CampaignSpellDto`](src/features/content/spells/domain/repo/spellRepo.ts) | Declares full nested shape | **Never** populated by server — runtime mismatch |

Secondary consumer: [`campaignSpellDocToSpell`](server/features/gameSession/services/resolveCampaignRulesAndCatalog.server.ts) casts legacy docs to `Spell` and injects **`ritual` / `concentration`** — not valid `SpellBase` fields; must be replaced by normalization into canonical nested fields.

---

## Backend alignment plan

### Files to inspect and update

| File | Change |
|------|--------|
| [`server/shared/models/CampaignSpell.model.ts`](server/shared/models/CampaignSpell.model.ts) | Replace legacy-only fields with schema matching persisted `SpellInput` (nested `description`, `castingTime`, `range`, `duration`, `components`, optional `scaling`, etc.). Use `Schema.Types.Mixed` only where unavoidable, prefer subschemas for stability. |
| [`server/features/content/spells/services/spells.service.ts`](server/features/content/spells/services/spells.service.ts) | New **`CampaignSpellDoc`** type = canonical API shape; **`normalizeRawDocToSpellInput`/`normalizeDocToSpell`** for reads; **`validateInput`** validates full body; **`create`/`update`** read/write nested fields; remove reliance on top-level `ritual`/`concentration` **as the source of truth** (see compatibility). |
| [`server/features/content/spells/controllers/spells.controller.ts`](server/features/content/spells/controllers/spells.controller.ts) | Likely unchanged (pass-through `req.body`) — verify content-type / no extra assumptions. |
| [`server/features/gameSession/services/resolveCampaignRulesAndCatalog.server.ts`](server/features/gameSession/services/resolveCampaignRulesAndCatalog.server.ts) | Replace ad-hoc `campaignSpellDocToSpell` with **same normalization** as HTTP API so game catalog spells match client `Spell`. |
| [`src/features/content/spells/domain/repo/spellRepo.ts`](src/features/content/spells/domain/repo/spellRepo.ts) | Keep **`CampaignSpellDto`** aligned **exactly** with server JSON; ensure `toSpell` matches normalized response. |

Optional: extract **shared validation** (Zod or similar) into a module importable from server and (if desired) client mapper boundary — e.g. `server/features/content/spells/validation/spellInput.schema.ts` re-exporting or mirroring types from `spell.types.ts`.

### Read-path normalization (legacy data)

- Implement **`normalizeCampaignSpellDocument(raw: Record<string, unknown>): SpellInput`** (or “full spell payload” without `id`) used by:
  - `toDoc` / list/get responses
  - game session catalog mapping
- Rules (example direction — finalize in implementation):
  - If `description` is **string** → `{ full: description, summary: '' }` (or split if you stored a convention).
  - If **`castingTime` / `duration` / `range` / `components` missing** → supply **defaults** consistent with system spell minimums (document the defaults in code comments), merging **`ritual`** into `castingTime.canBeCastAsRitual` and mapping **`concentration`** into the closest valid `duration` representation only where unambiguous; **lossy** cases should be documented.
- **Writes**: always persist **canonical** nested fields; **`$unset` legacy keys** on update when safe (see compatibility).

---

## Compatibility / migration recommendation

**Recommended: soft compatibility reads + new writes in canonical shape**, plus an **optional one-time migration script** for production cleanliness.

| Strategy | When to use |
|----------|-------------|
| **Hard cutover + migration** | Small/empty DBs or full control over all environments — simplest mental model, one shape in DB. |
| **Soft reads + canonical writes** *(recommended here)* | Existing campaign spell documents may exist; avoids downtime; normalization guarantees API consumers always see `SpellBase`. |
| **Dual-read / single-write** | Usually redundant if normalization covers legacy reads; only if you must preserve raw legacy blobs for audit. |

**Why this fits the codebase**: Two consumers (HTTP + game session) already transform docs; centralizing normalization avoids drift. Legacy top-level **`ritual` / `concentration` / string `description`** should be **removed from authoritative responses** once normalized — do **not** expose duplicate sources of truth long-term. Short term: **read** legacy fields only inside **`normalize*`**; **stop writing** them after cutover; migration can `$unset` them.

**Breaking change for external API clients**: Unlikely — only in-app `spellRepo` and server-side catalog use these routes today. **Internal** code that assumed `CampaignSpellDoc` had `ritual`/`concentration` must move to nested fields (game session path).

---

## Validation strategy (where it lives)

| Layer | Responsibility |
|-------|------------------|
| **RHF + FieldSpec** | Required fields, **conditional** visibility rules co-located with `visibleWhen` — user-facing fast feedback. |
| **Mapper boundary** | After `assembleSpellInput`, run **shared schema validation** (e.g. Zod) so invalid combinations never hit the wire; surface errors to the form. |
| **Server** | **Authoritative** for persisted shape — reject malformed bodies with structured `errors[]` (existing pattern in [`validateInput`](server/features/content/spells/services/spells.service.ts)). |

**Preference**: Introduce **one shared validator module** (types derived from or aligned with `SpellInput`) used server-side; optionally imported in the client mapper for parity. Avoid duplicating two different validation rules.

---

## Step-by-step implementation phases (smallest safe sequence)

Single branch, but **order** reduces thrash:

1. **Server: schema + types** — Extend Mongoose model with nested fields; keep old keys in schema temporarily if needed for reads.
2. **Server: normalize + validate** — Implement `normalizeRawDoc…` + full `validateInput`; unit-test normalization against legacy-shaped fixtures.
3. **Server: create/update** — Read body into `SpellInput` shape; `$set` nested fields; `$unset` legacy fields when appropriate.
4. **Server: consumers** — Update `CampaignSpellDoc` type, HTTP responses, and `resolveCampaignRulesAndCatalog.server.ts` to use normalization (no `as Spell` with fake fields).
5. **Client: `SpellFormValues` + assembly + options** — Add `forms/options/*`, `forms/assembly/*`, expand registry, **textarea** descriptions.
6. **Client: mappers + repo DTO** — Orchestrate simple + composite; align `CampaignSpellDto` with server JSON; verify `spellRepo` `toSpell`.
7. **Optional migration script** — Batch-update DB documents to canonical shape and remove legacy keys.
8. **Polish** — Remove temporary dual-schema bits once migration (or confidence in normalize-only path) is complete.

---

## Test plan (in scope — not hand-waved)

| Area | Tests |
|------|--------|
| **Assembly** | Unit tests per `forms/assembly/*.ts`: round-trip `split(build(values))` for supported MVP branches (casting time, duration kinds in scope, range, components, description). |
| **Mapper** | `spellForm.mappers.ts`: `toSpellInput` / `spellToFormValues` integration with fixtures; assert no UI-only keys in `SpellInput`. |
| **Server validation** | `validateInput` accepts valid full payloads; rejects malformed nested unions. |
| **Normalization** | Legacy document fixtures (string `description`, `ritual`/`concentration` only) → normalized output matches `SpellBase` expectations for catalog/game use. |
| **Persistence** | Integration test: create → read from DB (or service) → JSON matches; update preserves nested fields. |
| **Game session** | Regression: `campaignSpellDocToSpell` replacement produces same shape as HTTP client path for same raw doc. |

Place tests near code (`*.test.ts`) or under `server/features/content/spells/__tests__/` and `src/features/content/spells/domain/forms/__tests__/` per repo convention.

---

## Risks / tradeoffs

- **Lossy legacy migration**: String-only description and boolean flags cannot always reconstruct exact `duration`/`range` — document defaults and accept imperfect migration or require manual re-save in UI.
- **Schema size**: Full spell JSON is larger; acceptable for campaign-scoped content.
- **Dual maintenance**: Until migration runs, normalization + new fields coexist — keep normalization in **one module** to avoid drift.
- **Form MVP vs full union**: API accepts full `SpellDuration`/`SpellRange` variants; form may author a subset — document which kinds are UI-supported.

---

## Recommended next step

Implement **server-side `CampaignSpellDoc` + Mongoose schema + `normalizeRawDocToSpellInput` + `validateInput`** first, with **normalization unit tests** and legacy fixtures — then build the form assembly against a stable, truthful API.

---

## Planning Q&A (grounded in current code)

**What is the exact mismatch?** See table above: nested `description` vs string; missing `castingTime`, `range`, `duration`, `components`, `scaling`; legacy `ritual`/`concentration`; client DTO ahead of server.

**Which backend files must change?** [`CampaignSpell.model.ts`](server/shared/models/CampaignSpell.model.ts), [`spells.service.ts`](server/features/content/spells/services/spells.service.ts), [`resolveCampaignRulesAndCatalog.server.ts`](server/features/gameSession/services/resolveCampaignRulesAndCatalog.server.ts); verify [`spells.controller.ts`](server/features/content/spells/controllers/spells.controller.ts).

**Would any API consumer break if legacy flattened fields disappear from responses?** External consumers unlikely; **internal** [`campaignSpellDocToSpell`](server/features/gameSession/services/resolveCampaignRulesAndCatalog.server.ts) **must** change — it currently depends on `ritual`/`concentration` on the doc object. **Client** [`spellRepo`](src/features/content/spells/domain/repo/spellRepo.ts) expects nested shape — today it **never** received it from the server; fixing the server is aligning reality with types.

**Legacy fields in responses vs repo adaptation?** Prefer **normalize on server** so **all** consumers (browser + game session) see one shape; **avoid** client-only adapters for persistence quirks.

**Smallest safe sequence?** Schema + normalize + validate + create/update → game session + repo DTO → form assembly + tests → optional migration.
