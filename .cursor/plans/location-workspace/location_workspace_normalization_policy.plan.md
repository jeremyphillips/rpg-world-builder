---
name: Location workspace normalization policy
overview: Make dirty/save normalization explicit for persistable workspace state. Audit compare/save shaping, define a lightweight normalization policy artifact, preserve intentional spacing-insensitive behavior, document extension rules, and add focused tests. No DB schema or persistence-strategy changes.
todos:
  - id: audit-current-behavior
    content: Audit current compare/save normalization touchpoints and produce a concise inventory by persistable field/slice
    status: completed
  - id: choose-policy-artifact
    content: Introduce one lightweight, grepable policy artifact for normalization rules (doc table and/or small helper module)
    status: completed
  - id: align-compare-save
    content: Default fields/slices to one shared normalized form for compare+save unless a documented exception is required
    status: completed
  - id: codify-intent
    content: Mark current spacing-insensitive behavior as intentional where preserved; define explicit path for raw/whitespace-significant fields
    status: completed
  - id: tests-and-checklist
    content: Add focused tests and extend contributor checklist for new persistable fields/slices
    status: completed
isProject: true
---

# Location workspace: normalization policy (dirty / save) — **done**

**Parent context:** dirty/save snapshot alignment, shared authoring contract, persistable slice participation, and debounced persistable flush behavior are already in place. This pass closed the normalization policy gap.

**Reference doc:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md) (**Normalization policy** subsection).

**Implementation:**

- **Policy artifact:** `LOCATION_WORKSPACE_NORMALIZATION` in [`locationWorkspaceNormalizationPolicy.ts`](../../../src/features/content/locations/routes/locationEdit/locationWorkspaceNormalizationPolicy.ts) (re-exported from [`locationEdit/index.ts`](../../../src/features/content/locations/routes/locationEdit/index.ts)).
- **Single map payload:** [`buildPersistableMapPayloadFromGridDraft`](../../../src/features/content/locations/components/locationGridDraft.utils.ts) — used by [`gridDraftPersistableEquals`](../../../src/features/content/locations/components/locationGridDraft.utils.ts), [`buildMapWorkspacePersistablePayloadFromGridDraft`](../../../src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.ts), and homebrew snapshot serialization.
- **Tests:** [`locationGridDraft.utils.test.ts`](../../../src/features/content/locations/components/locationGridDraft.utils.test.ts), [`workspacePersistableSnapshot.test.ts`](../../../src/features/content/locations/routes/locationEdit/workspacePersistableSnapshot.test.ts).

---

## Audit inventory (persistable slice → behavior)

| Slice | Compare (dirty) | Save (persist) | Effective policy | Notes |
|-------|-------------------|----------------|-------------------|--------|
| **Location form** (`toLocationInput`) | `serializeLocationWorkspacePersistableSnapshot` → `toLocationInput` | Same via `buildHomebrewWorkspacePersistableParts` | **normalized for compare and save** | Name/description trimmed via form registry `parse` (`getNameDescriptionFieldSpecs`). Building profile strings trimmed in `toLocationInput`. |
| **Map** | `stableStringify(buildPersistableMapPayloadFromGridDraft(a))` vs baseline snapshot (same map half) | `handleHomebrewSubmit` / bootstrap uses same `buildMapWorkspacePersistablePayloadFromGridDraft` | **normalized for compare and save** | `normalizeLocationMapAuthoringFields` + `normalizeRegionAuthoringEntry`; `cellDraftToCellEntries` trims object labels; path/edge/region arrays **sorted by id** in `buildPersistableMapPayloadFromGridDraft`. |
| **System grid dirty** | `gridDraftPersistableEquals` | N/A (patch path separate) | **normalized for compare and save** | Map token in `buildSystemLocationWorkspaceAuthoringContract` uses `mapWorkspacePersistableTokenFromGridDraft` — same `buildPersistableMapPayloadFromGridDraft` shape. |
| **Building stairs** | `mergeBuildingProfileForSave` in snapshot | Same | **normalized for compare and save** | Structural merge; no string trim. |

**Exception:** None — no split compare-vs-save paths for current fields.

**Future raw field:** Document in `LOCATION_WORKSPACE_NORMALIZATION` + reference doc; use explicit parse/identity; add regression test.

---

## Objective (original)

Define and codify an explicit normalization policy for persistable workspace fields/slices so contributors can answer, for any persistable value:

- what representation is used for **dirty comparison**
- what representation is used for **save mapping**
- whether whitespace/formatting is **insignificant** or **meaningful**
- where that rule is declared
- how future fields extend the rule safely

The goal is not to remove all normalization. The goal is to make normalization **intentional, visible, and reviewable**.

## Core rule

Default to **one shared normalized form** for both:

- workspace dirty comparison
- save payload construction

Only allow compare-vs-save divergence when there is a **documented field/slice-specific reason**.

## Constraints (unchanged)

- No DB schema change
- No persisted storage shape change
- No persistence-strategy rewrite
- No unrelated workspace/tool redesign
- Keep shared workspace authoring contract intact
- Keep system vs homebrew strategies intact
- Prefer explicit, boring rules over implicit trim scattered through mappers

## Non-goals

- no DB migration
- no schema rename
- no persistence strategy rewrite
- no broad editor redesign
- no default move to “everything raw” unless product explicitly requires it

## Related plans (this directory)

See [README.md](README.md).
