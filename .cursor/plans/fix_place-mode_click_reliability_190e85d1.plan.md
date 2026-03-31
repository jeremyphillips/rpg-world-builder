---
name: Fix Place-Mode Click Reliability
overview: Fix residual flaky path/edge placement in the location map editor caused by canvas pan state stranding, missing click-vs-drag guards, and the hex overlay gap.
todos:
  - id: fix-canvas-pan-stranding
    content: Add window-level pointerup listener to useCanvasPan to prevent stranded drag state when pointerup is intercepted by child stopPropagation
    status: completed
  - id: add-drag-guard
    content: Destructure hasDragMoved in LocationEditRoute, pass to LocationGridAuthoringSection, gate onCellClick dispatch to skip when hasDragMoved() is true
    status: completed
  - id: hide-hex-path-edge
    content: Filter path/edge palette items from the place panel when grid geometry is hex, preventing selection of tools with no visual feedback
    status: completed
  - id: update-docs
    content: Update location-workspace.md open issues to reflect fixes and remaining hex overlay scope
    status: completed
isProject: false
---

# Fix Place-Mode Path/Edge Placement Reliability

## Root cause analysis

Three independent issues combine to produce the residual flaky behavior:

### Issue 1 -- Canvas pan state stranding

`useCanvasPan` has no safety net for when `pointerup` is intercepted by a child. In place mode, cell handlers call `e.stopPropagation()` on `pointerup`, which prevents the canvas wrapper from receiving the event. Result: `dragState.current` is never cleared, `isDragging` stays `true`, cursor stays `grabbing`, and subsequent `pointermove` events continue moving the canvas.

Concrete failure path:

1. User is in place mode with an anchor set.
2. `pointerdown` lands slightly off-cell (grid gap, Paper padding) -- canvas pan starts.
3. User drags toward the target cell (canvas pans unexpectedly).
4. `pointerup` lands on a cell -- cell stops propagation.
5. Canvas `onPointerUp` never fires; `isDragging` is stuck.
6. Browser may not fire `click` on the cell (pointer moved too far), so the segment is never committed.

### Issue 2 -- No click-vs-drag guard on location map cell clicks

The encounter grid checks `hasDragMoved()` before dispatching `onCellClick`:

```297:301:src/features/encounter/components/active/grid/EncounterGrid.tsx
                onClick={
                  clickable
                    ? () => {
                        if (!hasDragMoved()) onCellClick?.(cell.cellId)
                      }
                    : undefined
                }
```

The location map's `GridEditor` fires `onClick` unconditionally:

```105:105:src/ui/patterns/grid/GridEditor.tsx
            onClick={() => !disabled && onCellClick?.(cell)}
```

`hasDragMoved` is not even destructured in `LocationEditRoute`:

```155:155:src/features/content/locations/routes/LocationEditRoute.tsx
  const { pan, isDragging, pointerHandlers, resetPan } = useCanvasPan();
```

In `select` mode (no `stopPropagation`), a pan gesture that ends on a cell fires both a pan update and an unwanted cell selection.

### Issue 3 -- Hex maps: no path/edge SVG overlay

The SVG overlay in `LocationGridAuthoringSection` is gated on `squareGridGeometry && !isHex`. Hex grids store path/edge data in the draft but never render it. Additionally, `handlePlaceCell` in `LocationEditRoute` uses `|dx|+|dy| === 1` (Manhattan distance) for adjacency, which is incorrect for hex grids (6 neighbors in odd-q layout). The place palette is scale-filtered, not geometry-filtered, so hex grids still show path/edge entries.

---

## Changes

### 1. Harden `useCanvasPan` with window-level `pointerup`

**File:** [src/ui/hooks/useCanvasPan.ts](src/ui/hooks/useCanvasPan.ts)

- Add a `useEffect` that attaches a `window`-level `pointerup` listener to always clear `dragState` and set `isDragging(false)`, ensuring pan state is never stranded regardless of where the pointer was released or which child stopped propagation.
- Remove the inline `onPointerUp` from `pointerHandlers` (or keep it as a redundant fast-path). The window listener is the authoritative cleanup.
- This is a shared hook (also used by `EncounterActiveRoute`), so the fix benefits both features.

### 2. Add `hasDragMoved` guard to location map cell clicks

**Files:**

- [src/features/content/locations/routes/LocationEditRoute.tsx](src/features/content/locations/routes/LocationEditRoute.tsx) -- destructure `hasDragMoved` and pass it down.
- [src/features/content/locations/components/LocationGridAuthoringSection.tsx](src/features/content/locations/components/LocationGridAuthoringSection.tsx) -- accept `hasDragMoved` prop; gate `onCellClick` dispatch so it returns early when `hasDragMoved()` is true.

This matches the pattern already established by the encounter grid. In place mode, `stopPropagation` on `pointerdown` already prevents the canvas pan from starting, so `hasDragMoved()` will be `false` for normal cell clicks -- the guard only blocks accidental clicks from drag gestures that started outside cells.

### 3. Hide path/edge palette entries on hex grids (short-term) or add hex overlay (long-term)

**Short-term (recommended for this pass):**

- **File:** [src/features/content/locations/components/LocationGridAuthoringSection.tsx](src/features/content/locations/components/LocationGridAuthoringSection.tsx) or the palette panel -- filter out `category: 'path'` and `category: 'edge'` palette items when `gridGeometry === 'hex'`.
- Alternatively, pass `gridGeometry` to the place panel and filter there. This prevents users from selecting tools that have no visual feedback.
- Update [docs/reference/location-workspace.md](docs/reference/location-workspace.md) to note this filter under the existing Open Issues section.

**Long-term (follow-up):**

- Create `hexGridMapOverlayGeometry.ts` with `hexCellCenterPx(cellId, hexW, hexH)` and `hexSharedEdgeSegmentPx(cellA, cellB, hexW, hexH)` using the odd-q layout from `HexGridEditor` (`px = x * hexW * 0.75`, `py = y * hexH + (isOddCol ? hexH * 0.5 : 0)`, center at `px + hexW/2, py + hexH/2`).
- Use `getNeighborPoints` from [shared/domain/grid/gridHelpers.ts](shared/domain/grid/gridHelpers.ts) (which already has hex neighbor tables) in `handlePlaceCell` instead of the hardcoded Manhattan distance check.
- Add a hex SVG overlay branch in `LocationGridAuthoringSection`.

---

## Files touched (summary)


| File                                                                         | Change                              |
| ---------------------------------------------------------------------------- | ----------------------------------- |
| `src/ui/hooks/useCanvasPan.ts`                                               | Window-level pointerup cleanup      |
| `src/features/content/locations/routes/LocationEditRoute.tsx`                | Destructure and pass `hasDragMoved` |
| `src/features/content/locations/components/LocationGridAuthoringSection.tsx` | Accept + use `hasDragMoved` guard   |
| Place palette panel or `LocationEditRoute.tsx`                               | Filter path/edge entries on hex     |
| `docs/reference/location-workspace.md`                                       | Update open issues                  |


