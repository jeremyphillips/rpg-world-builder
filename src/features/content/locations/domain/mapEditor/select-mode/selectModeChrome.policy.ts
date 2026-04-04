/**
 * Select mode — hover / selection **chrome** rules (location map editor).
 *
 * **Single primary hover target** — `resolveSelectModeInteractiveTarget` produces at most one
 * {@link LocationMapSelection} for the pointer. Interior fallback uses
 * `resolveSelectModeAfterPathEdgeHits`: objects → linked location → **region** → bare cell (region
 * wins over bare cell for the same cell interior).
 *
 * **Cell button styling** — {@link shouldApplyCellHoverChrome} enables the enhanced `&:hover`
 * treatment only when the hover winner is `{ type: 'cell', cellId }` for that cell. For `region`,
 * `path`, `edge`, `object`, or `edge-run`, cell-level hover is disabled so cells do not visually
 * compete with SVG/region emphasis. When hover is `{ type: 'none' }`, cell hover chrome is off.
 *
 * **Mirrored `:hover`** — {@link GridEditor} and {@link HexGridEditor} apply base border/background
 * (square) or ring/fill (hex) on `:hover` when {@link isSelectHoverChromeSuppressed} is true, so
 * native `<button>` hover does not flash a competing treatment.
 *
 * **Selection chrome** — {@link shouldApplyCellSelectedChrome}: only `cell` and `object`
 * selections set `selectedCellId`; region/path/edge selections do not highlight a grid cell as
 * “selected” in the cell-chrome sense.
 */
export const SELECT_MODE_CHROME_POLICY_DOC = 'selectModeChrome.policy' as const;
