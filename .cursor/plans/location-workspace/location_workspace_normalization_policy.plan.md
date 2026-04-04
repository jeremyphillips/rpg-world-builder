---
name: Location workspace normalization policy
overview: Define explicit normalization rules for persistable workspace dirty/save (compare vs save, whitespace intent). Audit current trim/map/location mappers; document policy; add focused tests. No DB schema or persistence-strategy change.
todos:
  - id: audit-normalization
    content: Audit toLocationInput, map/grid normalizers, snapshot vs save paths; document per-field/slice behavior
    status: pending
  - id: policy-shape
    content: Introduce documented convention (table + helpers or normalize-for-compare vs normalize-for-save)
    status: pending
  - id: codify-current-behavior
    content: Mark spacing-insensitive fields intentional; preserve behavior unless policy explicitly changes a field
    status: pending
  - id: tests
    content: Tests for spacing-only dirty where policy says ignore; future raw-field pattern
    status: pending
  - id: docs-checklist
    content: Extend docs/reference/location-workspace.md — contributor questions for new persistable fields
    status: pending
isProject: true
---

# Location workspace: normalization policy (dirty / save)

**Parent context:** [location_workspace_dirty_state_4d54eedc.plan.md](location_workspace_dirty_state_4d54eedc.plan.md) (snapshot + baseline), [location_workspace_persistable_slice_participation.plan.md](location_workspace_persistable_slice_participation.plan.md) (shared map assembly). **Reference doc:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md).

## Problem

Normalization and trimming in persistence paths can make **spacing-only** edits not dirty the workspace snapshot. That may be **intentional** (e.g. trimmed display names) or **accidental** for a future field where whitespace matters. Today the behavior is easy to misread in code review.

## Objective

Make normalization **explicit, field-aware, and documented** so contributors can answer:

- Which values are normalized before **dirty comparison**
- Which before **save mapping**
- Which preserve **raw whitespace / formatting**
- **Where** those rules live
- How to **extend** them safely

## Constraints (non-negotiable)

- No DB schema change, no persisted storage shape change
- No unrelated workspace/tool redesign
- Keep **`LocationWorkspaceAuthoringContract`** and **system vs homebrew** strategies as today
- Prefer **explicit, boring** rules over implicit trim scattered in mappers

## Design rule (required taxonomy)

For each persistable field or slice, declare policy in one of:

| Policy | Meaning |
|--------|--------|
| **normalized for compare and save** | Same shaping for `isDirty` snapshot and `handleHomebrewSubmit` (typical default for trimmed strings) |
| **normalized for save only** | Compare uses rawer input; save applies cleanup (rare; document why) |
| **raw / whitespace-significant** | Dirty if spacing changes; save persists formatting |
| **custom** | Document compare + save behavior in one place |

Avoid “whatever `toLocationInput` happens to do” as the only description.

## Implementation goals

### 1. Audit current normalization points

Trace behavior that affects **homebrew** `serializeLocationWorkspacePersistableSnapshot` vs **save** (`buildHomebrewWorkspacePersistableParts`, `handleHomebrewSubmit`) and **map** `normalizedAuthoringPayloadFromGridDraft` / `gridDraftPersistableEquals` / shared `normalizeLocationMapAuthoringFields`.

Produce a short **inventory** (table or bullet list): field/slice → trim/normalize sites → current effective dirty/save behavior.

**Likely touchpoints (verify in repo):**

- [`toLocationInput`](../../../src/features/content/locations/domain) and related location form mapping
- [`workspacePersistableSnapshot.ts`](../../../src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts)
- [`locationGridDraft.utils.ts`](../../../src/features/content/locations/components/locationGridDraft.utils.ts) (`normalizedAuthoringPayloadFromGridDraft`, `gridDraftPersistableEquals`)
- Shared [`normalizeLocationMapAuthoringFields`](../../../shared/domain/locations) (or equivalent)

### 2. Policy shape (lightweight)

Choose one **visible** structure (not a heavy framework), for example:

- **`docs/reference/location-workspace.md`** subsection **Normalization policy** with a table of persistable fields/slices and their policy row; **or**
- Small **`locationWorkspaceNormalizationPolicy.ts`** (or section in `workspacePersistableSnapshot.ts`) exporting named helpers **`normalizeForWorkspaceCompare`** / **`normalizeForSave`** only where compare ≠ save; **or**
- Field-level JSDoc `@workspacePersist` tags pointing to the doc table

Pick the smallest approach that keeps rules **grepable** and **reviewable**.

### 3. Compare vs save separation

Where compare and save **must** differ, implement **two** explicit functions (or two clearly named code paths) and document why. Default: **one** normalized form feeds both snapshot and save (matches current “no drift” goal from dirty-state work).

### 4. Preserve acceptable current behavior

Do **not** churn product behavior for fields where **ignoring spacing-only edits** is desired. **Codify** that as **normalized for compare and save** (or equivalent) in the policy table.

### 5. Contributor checklist

Extend **[Adding persisted workspace state](../../../docs/reference/location-workspace.md)** (or adjacent section) so new fields must answer:

- Does whitespace matter?
- Compare policy vs save policy?
- Where declared?
- Which test covers spacing / normalization?

## Suggested tests

- At least one **intentional** case: spacing-only change on a **trimmed** field does **not** dirty (or does not change snapshot), matching declared policy
- One **documented** pattern for a **raw** field (can be hypothetical fixture if no production field yet) so future slices have a template
- Stability: snapshot string and save payload still align for shared normalization path

Avoid large snapshot golden-file churn.

## Acceptance criteria

- [ ] Normalization affecting dirty/save is **documented**, not only implied by mappers
- [ ] Current persistable fields/slices have a **declared** rule in the chosen policy artifact
- [ ] Spacing-only behavior is **intentional** (ignored or preserved), not ambiguous
- [ ] Extension path for whitespace-sensitive fields is clear
- [ ] No DB migration; system/homebrew persistence strategies unchanged

## Non-goals

- No migration, no schema rename
- No persistence strategy rewrite
- No broad editor redesign
- No default of “everything raw” unless product requires it

## Related plans (this directory)

See [README.md](README.md).
