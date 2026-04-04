---
name: Location workspace UX refactor
overview: Placeholder parent plan for refactors to the location editor workspace shell and authoring UX (rail, header, canvas/tooling, modals, building floor strip, etc.). Replace this overview and todos when scope is defined. Does not supersede persistence/dirty-state architecture unless explicitly in scope.
todos:
  - id: define-ux-scope
    content: Define goals, non-goals, and acceptance criteria for workspace UX refactor; link to docs/reference/location-workspace.md sections
    status: pending
  - id: audit-current-shell
    content: Audit components/workspace/, LocationEditRoute composition, and open issues in location-workspace.md for UX debt
    status: pending
  - id: implement-ux-changes
    content: (Placeholder) Implement agreed UX changes behind clear boundaries
    status: pending
  - id: docs-and-regression
    content: Update reference doc and verify save/dirty/encounter-adjacent flows unchanged unless intended
    status: pending
isProject: true
---

# Location workspace UX refactor

**Status:** **Placeholder** — not scoped yet. Use this file as the **parent plan** link target from [README.md](README.md). When work begins, replace the overview, todos, and body below with a real spec.

## Intent (draft)

Improve **editor-facing UX** in the full-width location workspace: layout, discoverability, density, tool discoverability, rail behavior, header actions, building/floor affordances, and consistency with `docs/reference/location-workspace.md`.

## Constraints (typical)

- Preserve **dirty/save** and **authoring contract** semantics unless this plan explicitly includes persistence changes.
- Prefer **incremental** deliverables over a monolithic redesign.
- Coordinate with **Open issues** in the reference doc (hex, pan/click, path preview deferral, etc.) — do not silently contradict documented behavior.

## Related

- [README.md](README.md) — bundle index and reading order.
- [docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md) — canonical behavior and pointers.

---

*Delete this placeholder section when the real plan is written.*
