---
name: Select mode interaction hardening
overview: Improve reliability and consistency of Select mode interactions in the location editor. Focus this pass on preventing accidental placement/clicks during pan/drag gestures and resolving region-vs-cell hover/selection chrome inconsistencies. Keep scope limited to interaction semantics and feedback; no geometry-model, dirty/save, or broad map-editor redesign.
todos:
  - id: audit-select-mode-interactions
    content: Audit current Select mode pointer lifecycle, click/drag/pan transitions, hover targets, and chrome ownership (cell vs region)
    status: completed
  - id: harden-pan-vs-click
    content: Implement pointerup-based placement/selection with movement threshold and clear gesture classification to prevent accidental edits during pan/drag
    status: completed
  - id: unify-hover-chrome
    content: Define and implement a consistent Select mode hover/selection chrome priority between region and cell targets
    status: completed
  - id: preserve-existing-authoring-behavior
    content: Keep legitimate select/place/edit flows intact while reducing accidental interaction side effects
    status: completed
  - id: tests-and-docs
    content: Add focused interaction tests and document Select mode gesture/chrome rules
    status: completed
isProject: true
---

# Select mode interaction hardening

**Status:** **Done** (April 2026). `useCanvasPan` exposes `consumeClickSuppressionAfterPan`; location map + combat grid gate cell clicks; `GridEditor` mirrors `:hover` when Select chrome is suppressed; `selectModeChrome.policy.ts` + doc updates.

**Parent context:** Dirty/save architecture, persistable slice participation, and normalization policy are already stabilized. This pass is not about persistence; it is about improving **interaction reliability** in Select mode.

**Reference:** [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md) (e.g. **Select mode**, **Open issues §2 / §4**).

---

## Implementation summary (audit)

- **Pan vs click:** `hasDragMoved()` stayed true until the next `pointerdown`, so after `pointerup` the following `click` could read a stale “no drag” if timing differed. **Fix:** `useCanvasPan` now sets `suppressNextClickAfterPanRef` on `pointerUp` when the gesture exceeded the drag threshold, resets `dragMovedRef`, and exposes `**consumeClickSuppressionAfterPan()`** (one-shot). **LocationGridAuthoringSection** and **CombatGrid** use it at the start of cell click handlers.
- **Chrome:** `shouldApplyCellHoverChrome` already encoded a single winner; **GridEditor** now mirrors idle border/background on `:hover` when Select mode suppresses cell hover **and** the hover target is not `{ type: 'none' }`, so region-primary hovers do not flash competing native button styling.
- **Policy doc:** `[selectModeChrome.policy.ts](../../../src/features/content/locations/domain/mapEditor/select-mode/selectModeChrome.policy.ts)` (`SELECT_MODE_CHROME_POLICY_DOC`).

---

The sections below preserve the **original plan spec** (requirements, constraints, acceptance criteria) for reference.

## Problem

Two known Select mode gaps remain:

1. **Canvas pan vs clicks**
  - current interaction flow can still allow accidental place/select/edit behavior during drag/pan gestures
  - pointer lifecycle handling can be hardened so pan intent and click intent are distinguished more reliably
2. **Region vs cell hover chrome**
  - Select mode can show inconsistent or conflicting hover/selection feedback between region and cell targets
  - target priority and ownership of visual chrome are not explicit enough

These are not broad editor redesign issues. They are **interaction semantics and feedback consistency** problems.

## Objective

Make Select mode feel reliable and predictable by:

- preventing accidental click/place/select actions during pan/drag gestures
- making gesture classification explicit and stable
- defining a consistent hover/selection priority between region and cell targets
- preserving legitimate editing behavior while reducing ambiguity and accidental side effects

## Core principle

Select mode should behave according to **clear interaction intent**:

- a **click/tap** should select or act on the intended target
- a **drag/pan** should not accidentally trigger click/placement semantics
- hover/selection chrome should reflect one clear target model, not competing ones

## Constraints

- No DB/schema changes
- No dirty/save architecture changes
- No broad map-editor redesign
- No hex-edge / geometry model work in this pass
- No path-preview performance work in this pass
- Keep square/hex map support behavior stable except where interaction semantics are intentionally improved
- Prefer centralized gesture/chrome rules over ad hoc component-level fixes

## Scope

This pass should focus specifically on:

### In scope

- pointer lifecycle for Select mode
- gesture classification (click vs drag/pan)
- movement threshold handling
- pointerup-based commit/selection where appropriate
- hover/selection chrome priority and ownership between region and cell
- focused docs/tests for Select mode rules

### Out of scope

- object palette redesign
- edge authoring redesign
- path tool performance
- map geometry changes
- workspace persistence/dirty state
- broad visual restyling outside what is required for clear interaction feedback

## Implementation goals

### 1. Audit current Select mode interaction flow

Trace the current Select mode behavior across:

- pointerdown / pointermove / pointerup
- pan initiation
- click/selection commit timing
- hover target resolution
- region vs cell targeting/chrome behavior
- any movement-threshold logic already present
- any differences between mouse and touch/pointer behavior if relevant

Identify the real current failure modes, for example:

- selection firing on pointerdown before drag intent is clear
- pointermove causing pan while pointerup still commits a click
- hover chrome attaching to cell while region should own the interaction
- region and cell both trying to present selection emphasis

**Deliverable:** concise summary of current gesture and chrome inconsistencies.

### 2. Harden pan vs click semantics

Implement a clearer gesture model for Select mode.

**Preferred direction:**

- classify interaction as click/select only on **pointerup**
- use a movement threshold to distinguish click/tap from drag/pan
- once movement exceeds threshold, treat the gesture as drag/pan and suppress click-like commit behavior
- avoid accidental select/place behavior during or after pan gestures

**Guidance:**

- keep the model simple and centralized
- avoid scattered local exceptions in leaf components
- if a gesture-state helper/controller is useful, add one
- preserve legitimate short-click selection behavior

The result should make accidental edits during canvas navigation materially less likely.

### 3. Define target priority for hover/selection chrome

Make the Select mode target model explicit.

Define:

- when region owns hover/selection chrome
- when cell owns hover/selection chrome
- whether one suppresses the other
- how mixed cases are resolved
- how selected target vs hovered target interact visually

The rule should be simple enough to document and test.

**Example direction:**

- one “primary interaction target” per pointer location
- chrome derives from that target priority
- secondary entities may still be inspectable, but should not compete visually in the same moment unless intentionally designed

Do not leave hover chrome as an incidental byproduct of multiple overlapping render layers.

### 4. Preserve legitimate authoring/editing flows

While hardening interaction behavior:

- do not break normal click selection
- do not regress intended inspector/open-selection flows
- do not make Select mode feel sluggish or overly hard to use
- do not block valid short interactions because thresholds are too aggressive

Use thresholds/commit timing that reduce accidents without making the editor frustrating.

### 5. Keep behavior centralized and explainable

Where practical:

- centralize gesture classification
- centralize target-priority/chrome rules
- avoid duplicating “if dragging then ignore click” logic in many separate components
- make the resulting rules easy to reason about in code review

## Suggested design rules

### Gesture rule

A Select mode interaction should only commit click/select behavior if:

- pointerup occurs
- total movement stays below the configured threshold
- no drag/pan state has claimed the gesture

### Chrome rule

At any moment, Select mode should present one clear primary hover target:

- either region
- or cell
- based on explicit priority rules

Any secondary context should not visually compete with the primary interaction target unless there is a deliberate design reason.

## Suggested deliverables

- audited summary of current Select mode interaction issues
- centralized or clearer gesture classification logic
- pointerup + movement-threshold based click/select hardening
- explicit region-vs-cell hover/selection chrome rule
- focused tests for gesture and chrome behavior
- short docs/reference note on Select mode interaction rules

## Suggested tests

Add focused interaction tests that prove:

### Pan vs click

- a short click/tap still selects as expected
- movement beyond threshold suppresses click/select commit
- pan/drag gestures do not accidentally trigger selection or placement on pointerup
- legitimate non-pan click selection still works

### Region vs cell chrome

- when both region and cell could compete, the declared priority rule wins
- hover chrome reflects one primary target model
- selected and hovered states remain understandable and non-conflicting
- changes do not regress intended inspector/open-selection behavior

Prefer behavior-focused tests over brittle visual snapshots where possible.

## Acceptance criteria

This pass is complete when all of the following are true:

- Select mode no longer accidentally commits click/select behavior during pan/drag gestures
- click vs drag/pan classification is explicit and reliable
- region-vs-cell hover/selection chrome follows a clear, documented priority rule
- legitimate Select mode editing/selection behavior remains intact
- the new behavior is centralized enough to be understandable and maintainable
- tests/docs reflect the hardened Select mode interaction model

## Non-goals

- no dirty/save architecture changes
- no DB/schema/storage changes
- no hex-edge support work
- no path-preview performance work
- no broad editor redesign
- no unrelated visual polish outside what is needed for interaction clarity

## Related plans (this directory)

See [README.md](README.md).