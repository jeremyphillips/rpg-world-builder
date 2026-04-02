import type { Theme } from '@mui/material/styles'

import type { EncounterAuthoringPresentation } from '@/features/mechanics/domain/combat/space'
import { resolveLocationMapUiStyles } from '@/features/content/locations/domain/mapPresentation/locationMapUiStyles'
import { LocationMapPathSvgPaths } from '@/features/content/locations/components/mapGrid/LocationMapPathSvgPaths'
import { polylinePoint2DToSmoothSvgPath } from '@/features/content/locations/components/pathOverlayRendering'
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
 * Read-only authored map chrome (paths + wall/door/window edges) aligned to the combat grid.
 * Pointer-events none; rendered under combat tokens.
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
    <svg
      width={w}
      height={h}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        pointerEvents: 'none',
        zIndex: 0,
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
  )
}
