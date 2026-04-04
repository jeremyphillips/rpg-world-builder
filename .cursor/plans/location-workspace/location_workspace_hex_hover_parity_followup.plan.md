---
name: Hex hover parity follow-up
overview: Bring HexGridEditor hover behavior into parity with the recent square-grid Select mode interaction hardening where appropriate. Focus narrowly on mirroring the same suppressed-hover fallback behavior so square and hex do not feel inconsistent for equivalent interaction states. Do not broaden into general hex interaction redesign or pointerup placement for other tools.
todos:
  - id: audit-square-vs-hex-hover
    content: Compare the recent square-grid suppressed-hover behavior with current HexGridEditor hover behavior; identify the exact parity gap
    status: completed
  - id: define-parity-scope
    content: Confirm the parity target is only the same idle-hover mirroring/fallback behavior under suppressed-hover conditions, not broader interaction redesign
    status: completed
  - id: implement-hex-hover-parity
    content: Apply the square-grid suppressed-hover fallback behavior to HexGridEditor where interaction semantics should match
    status: completed
  - id: preserve-geometry-specific-behavior
    content: Keep legitimate hex-specific geometry/targeting behavior intact; only align equivalent hover feedback semantics
    status: completed
  - id: tests-and-docs
    content: Add focused tests and a short note documenting square/hex hover parity expectations
    status: completed
isProject: true
---

# Hex hover parity follow-up

**Status:** **Done** (April 2026).

## Audit summary (parity gap)

- **Square (`GridEditor`):** When `isSelectHoverChromeSuppressed` (Select mode, non-`none` winner, not this cell’s cell-hover), `:hover` mirrors idle border/background (and selected shadow when selected). When `selectHoverTarget.type === 'none'`, `:hover` rules are omitted.
- **Hex (`HexGridEditor`) before fix:** For `!allowHover`, hover blocks were `{}`, so non-winning cells did not mirror idle ring/fill on hover—visual drift vs square.

## Parity target

- Shared rule: `isSelectHoverChromeSuppressed` in `mapGridCellVisualState.ts`.
- Hex mirrors **idle** outer ring (`outerRingColor`) and inner fill (`innerFillColor`) on `:hover` when suppressed; same `type === 'none'` and `allowHover` branching as square.

## References

- `docs/reference/location-workspace.md` — Open issues §4, shared hooks table.
- `selectModeChrome.policy.ts`, `mapGridCellVisualState.ts`.
