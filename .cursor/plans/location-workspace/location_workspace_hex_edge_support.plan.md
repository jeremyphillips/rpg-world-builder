---
name: Hex edge support / constraint
overview: Resolve the hex-edge ambiguity in the location editor. Audit current hex edge storage/rendering/authoring behavior, choose an explicit product path (full support now vs explicit constrained support), preserve stored data, and ensure users cannot end up with silently invisible authored hex edge data.
todos:
  - id: audit-current-hex-edge-behavior
    content: Trace current hex edge storage, load, render, hit-testing, selection, and authoring behavior; identify where square-edge assumptions break hex visibility/editing
    status: completed
  - id: choose-product-path
    content: Document chosen option (A or B) with rationale before implementation; no coding until decision record is filled
    status: completed
  - id: implement-supported-or-constrained-path
    content: Implement the chosen path cleanly so hex edge data is either visible/editable or explicitly constrained without silent disappearance
    status: completed
  - id: preserve-data-integrity
    content: Ensure existing stored hex edge data is preserved and surfaced safely; no DB migration or silent dropping
    status: completed
  - id: tests-and-docs
    content: Add focused tests and document the current hex edge support level and constraints
    status: completed
isProject: true
---

# Hex edge support / constraint

**Parent context:** The location workspace dirty/save architecture has been stabilized, persistable slice participation has been hardened, and normalization policy has been documented. This pass is **not** about dirty state; it is about a remaining map-editor/product integrity gap: **hex edges**.

**Reference:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md) (**Open issues §1 — Hex maps: constrained boundary-edge support**).

**Status:** **Done** (Option B — April 2026). Implementation: `computeHexEdgeConstraintPatch`, hex `skipEdgeTargets` erase, grid alert for stored edges, tests + doc update.

## Problem

Hex maps appear to be in an ambiguous middle state:

- edge data may exist for hex geometry
- square-edge assumptions may still dominate overlay/rendering/interaction
- stored hex edge data may become invisible or not meaningfully editable

That is worse than either:

- fully supporting hex edges, or
- explicitly not supporting them yet

because it creates the risk of **silent invisible authored data**.

## Objective

This pass must explicitly choose **one** support level (**Option A** or **Option B** below), record that choice and rationale **before implementation**, then deliver that path completely enough that users are not left with ambiguous hex-edge behavior. Full definitions, required outcomes, and the acceptance gate live in **Required product decision** — do not treat Option A/B as separate informal summaries elsewhere in this document.

## Core principle

Prefer an **explicit support boundary** over ambiguous partial behavior.

The editor must make one of these truths clear:

- “hex edges are supported here”
- or “hex edges are not yet fully supported here, and the editor is protecting you accordingly”

## Constraints

- No DB migration
- No schema rename
- Preserve existing stored edge data
- Keep square-grid edge behavior intact
- Do not broaden into unrelated map-editor redesign
- Do not conflate this with dirty/save architecture work
- Prefer clarity and data integrity over partial hidden support

## Required product decision: choose one support level before implementation

This pass must explicitly choose **one** of the following outcomes and implement it completely enough that users are not left with ambiguous hex-edge behavior.

### Option A — first-class hex edge support now

Choose this only if the audit shows hex edges can be implemented as a coherent first-class geometry/editor feature in this pass.

**Required outcomes:**

- visible hex edge overlays for authored data
- correct hex edge geometry model
- reliable hit-testing for hover / selection / placement
- selection and inspector/editing flows that work for hex edges
- authored data rendering parity with square-edge behavior where appropriate
- no silent invisible stored hex edge state

**Implementation expectation:**

- treat hex edges as a first-class hex geometry problem
- centralize edge geometry / render / hit-test logic
- do not solve this through square-edge exceptions or fragile per-component hacks

**Eligibility:** Only choose Option A if the pass can deliver a **user-trustworthy result end-to-end**.

### Option B — explicit constrained support

Choose this if full first-class hex edge support is too large, too risky, or too incomplete for this pass.

**Required outcomes:**

- no silent invisible hex edge data
- existing stored hex edge data is surfaced safely if technically feasible, even if read-only or via fallback treatment
- unsupported hex edge authoring/editing flows are blocked, gated, or clearly disabled
- the editor makes the limitation explicit in behavior and docs
- square-edge support remains intact

**Implementation expectation:**

- prefer honest constraints over ambiguous half-support
- protect users from creating or relying on hex edge data that the editor cannot reliably render/manage

### Decision rule

Do **not** leave the pass in a mixed state where:

- some hex edge data can exist
- but users cannot reliably see, select, or manage it

Before implementation, document which option is being chosen and why.

### Decision record (required before implementation)

Fill this **after** the audit (`audit-current-hex-edge-behavior`) and **before** `implement-supported-or-constrained-path`. No implementation work until this block is completed.


| Field                          | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chosen option**              | **B** — explicit constrained support                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Rationale (audit findings)** | Full hex edge support requires hex boundary geometry, SVG overlay, and hit-testing beyond square `edgeEntriesToSegmentGeometrySquare` / `useSquareEdgeBoundaryPaint`. Current code already hides edge draw tools on hex and skips edge picking when `isHex`. Remaining gaps: stored `edgeEntries` invisible with no user messaging; erase could still remove edges via `resolveEraseTargetAtCell` square adjacency without visible feedback; edge selection could persist when switching grid to hex. Option B closes those gaps without a multi-week geometry project. |
| **Date or PR link**            | 2026-04                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |


### Acceptance gate for the chosen option

The chosen option is only complete when **all** of the following are true:

- users cannot end up with silently invisible authored hex edge data
- the editor behavior is explicit and consistent with the chosen support level (A or B)
- tests and docs reflect the chosen support boundary
- existing stored data is preserved (no silent drop or corruption)
- square edge behavior remains stable (overlay, hit-testing, authoring/editing)

## Implementation goals

### 1. Audit current hex edge behavior end-to-end

Trace current hex edge behavior across:

- data model / storage shape
- load / hydration path
- render / overlay path
- hit-testing / placement path
- selection / inspector path
- save / persistence round-trip as relevant

Identify specifically:

- whether stored hex edge data can already exist in real content
- where square-edge assumptions break on hex maps
- whether the current failure mode is:
  - invisible render
  - no hit targets
  - partial inspector support
  - partial save-only support
  - another mismatch

**Deliverable:** concise summary of the actual current hex edge failure mode(s).

### 2. Define the supported product contract

Write down the intended editor behavior for hex maps after this pass. **Must match** the recorded **Decision record** and the chosen option’s required outcomes.

Examples:

- Are hex edges fully supported?
- If yes, what counts as a selectable/renderable edge?
- If not, how does the editor block or gate unsupported flows?
- How are existing stored hex edge records surfaced or protected?

This should be explicit enough that a contributor or QA pass can tell whether behavior matches the contract.

### 3. Implement the chosen path cleanly

#### If choosing full support (Option A)

Implement hex edge behavior as a first-class geometry problem:

- visible edge overlay for hex cells
- centralized hex edge geometry logic
- correct hit-testing / hover / selection
- editing behavior consistent with supported square-edge behavior where appropriate

Do not solve hex edges as a fragile extension of square-edge assumptions.

#### If choosing constrained support (Option B)

Implement safe product constraints:

- block or hide unsupported hex edge authoring tools where necessary
- surface existing stored hex edge data in a fallback/read-only/warned form if feasible
- prevent silent disappearance
- make limitations explicit in UI/docs or guardrails where appropriate

### 4. Preserve stored data integrity

Regardless of chosen path:

- do not mutate or drop stored hex edge data just because the editor lacks full support
- do not corrupt round-trip behavior
- if fallback visibility is needed, prefer that over hidden loss

### 5. Keep square behavior stable

This pass must not regress:

- square edge overlay rendering
- square edge hit-testing
- square authoring/editing flows

Hex work should remain geometry-aware and not destabilize the already-supported square path.

### 6. Document the support boundary

Update docs/reference notes so the current support level is explicit:

- full hex edge support
- or constrained/not-yet-supported status with protections

If the result is constrained support, make the limitation visible enough that future contributors do not assume hex edges are done.

## Design guidance

- Prefer explicit support boundaries over half-working hidden behavior
- Keep geometry/rendering logic centralized rather than scattered through UI components
- If supporting hex edges, model them as first-class hex geometry, not “square edges with exceptions”
- If constraining support, make the product limitation protective and honest, not merely hidden
- Optimize for user trust: no authored data should silently disappear

## Suggested deliverables

- audit of current hex edge behavior
- **Decision record (filled)** — chosen option A or B with rationale
- explicit product contract aligned with the decision record
- implementation of chosen path
- preservation of stored data integrity
- focused tests
- docs/reference update describing current support level

## Suggested tests

Add focused tests that prove the chosen support level:

### If supporting hex edges (Option A)

- hex edge overlay renders for authored data
- hex edge hit-testing/selection works as intended
- square edge behavior remains unchanged
- stored hex edge data round-trips safely

### If constraining hex edges (Option B)

- unsupported authoring is blocked or gated on hex maps
- existing stored hex edge data is not silently invisible without explanation
- square edge behavior remains unchanged
- stored data is preserved and not corrupted

Do not rely only on broad snapshot tests; add behavior-focused coverage.

## Non-goals

- no DB migration
- no schema rename
- no broad map-editor redesign
- no unrelated dirty/save architecture work
- no path-preview or hover-chrome work in this pass

## Related plans (this directory)

See [README.md](README.md).