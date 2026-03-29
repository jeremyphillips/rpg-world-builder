---
name: Hex Grid Domain Extension
overview: Add hex as a first-class grid geometry option in `shared/domain/grid/` with geometry-aware helpers, while preserving all existing square-grid behavior and encounter APIs unchanged.
todos: []
isProject: false
---

# Hex Grid Domain Extension

## Current State

`shared/domain/grid/` has three files:

- `[gridCellIds.ts](shared/domain/grid/gridCellIds.ts)` -- `GridPoint`, `makeGridCellId("x,y")`, `parseGridCellId`

