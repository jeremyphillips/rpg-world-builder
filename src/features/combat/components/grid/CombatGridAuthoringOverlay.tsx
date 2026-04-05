import type { Theme } from '@mui/material/styles'
import Box from '@mui/material/Box'

import type { EncounterAuthoringPresentation } from '@/features/mechanics/domain/combat/space'
import { resolveLocationMapUiStyles } from '@/features/content/locations/domain/presentation/map/locationMapUiStyles'
import { LocationMapPathSvgPaths } from '@/features/content/locations/components/mapGrid/LocationMapPathSvgPaths'
import { polylinePoint2DToSmoothSvgPath } from '@/features/content/locations/components/authoring/geometry/pathOverlayRendering'
import type { LocationMapPathAuthoringEntry } from '@/shared/domain/locations/map/locationMap.types'
import { edgeEntriesToSegmentGeometrySquare } from '@/shared/domain/locations/map/locationMapEdgeGeometry.helpers'
import { pathEntryToPolylineGeometry } from '@/shared/domain/locations/map/locationMapPathPolyline.helpers'
import { squareCellCenterPx } from '@/shared/domain/grid/squareGridOverlayGeometry'

type PathSvgItem = { pathId: string; kind: string; d: string }

export const COMBAT_GRID_GAP_PX = 1

type CombatGridAuthoringOverlayProps = {
  theme: Theme
  authoringPresentation: EncounterAuthoringPresentation
  columns: number
  rows: number
  cellPx: number
}

/**
 * Read-only authored base map SVG: paths + edges only. Authored object icons render inside each
 * {@link CombatGrid} cell so they stack with tokens/obstacles (see `LocationMapAuthoredObjectIconsCellInline`).
 * Pointer-events none; stacks above cell fills (`z-index` in parent) so edge strokes are visible;
 * blind veil and viewer-lifted cells in `CombatGrid` sit above this layer.
 */
export function CombatGridAuthoringOverlay({
  theme,
  authoringPresentation,
  columns,
  rows,
  cellPx,
}: CombatGridAuthoringOverlayProps) {
  const gapPx = COMBAT_GRID_GAP_PX
  const mapUi = resolveLocationMapUiStyles(theme)

  const edgeGeoms = edgeEntriesToSegmentGeometrySquare(authoringPresentation.edgeEntries, cellPx, gapPx)

  const centerFn = (authorCellId: string) => {
    const p = squareCellCenterPx(authorCellId, cellPx, gapPx)
    if (!p) return null
    return { cx: p.cx, cy: p.cy }
  }

  const pathEntries = authoringPresentation.pathEntries as LocationMapPathAuthoringEntry[]
  const pathSvgData: PathSvgItem[] = []
  for (const entry of pathEntries) {
    const poly = pathEntryToPolylineGeometry(entry, centerFn)
    if (!poly || poly.points.length < 2) continue
    pathSvgData.push({
      pathId: entry.id,
      kind: entry.kind,
      d: polylinePoint2DToSmoothSvgPath(poly.points),
    })
  }

  const w = columns * cellPx + (columns - 1) * gapPx
  const h = rows * cellPx + (rows - 1) * gapPx

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        height: h,
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      <svg
        width={w}
        height={h}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          display: 'block',
        }}
        aria-hidden
      >
        <LocationMapPathSvgPaths
          pathSvgData={pathSvgData}
          mapUi={mapUi}
          mapSelection={{ type: 'none' }}
          selectHoverTarget={{ type: 'none' }}
        />
        {edgeGeoms.map((g) => {
          const st = mapUi.edgeCommittedStrokeByKind[g.kind]
          const seg = g.segment
          return (
            <line
              key={g.edgeId}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke={st.stroke}
              strokeWidth={st.strokeWidth}
              strokeLinecap="square"
              {...('strokeDasharray' in st && st.strokeDasharray != null ? { strokeDasharray: st.strokeDasharray } : {})}
            />
          )
        })}
      </svg>
    </Box>
  )
}
