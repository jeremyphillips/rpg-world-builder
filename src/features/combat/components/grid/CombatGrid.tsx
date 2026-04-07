/**
 * Grid presentation only. Tactical overlays come from the grid view model; viewer visibility comes from
 * `cell.perception` (domain projection) plus `viewerPerceivesOccupantToken` /
 * `viewerOccupantPresentationKind` on the view model (`deriveViewerCombatantPresentationKind`).
 * Do not infer perception rules here.
 */
import { Fragment, type ReactNode, useCallback, useMemo, useRef, useState } from 'react'

import Box from '@mui/material/Box'
import Popover from '@mui/material/Popover'
import Tooltip from '@mui/material/Tooltip'
import { alpha, keyframes, useTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import { AppAvatar } from '@/ui/primitives'
import { resolveImageUrl } from '@/shared/lib/media'
import type { GridViewModel, GridCellViewModel } from '@/features/mechanics/domain/combat/space/selectors/space.selectors'
import { DEFEATED_PARTICIPATION_OPACITY } from '@/features/mechanics/domain/combat/presentation/participation/presentation-defeated'
import { getCellVisualState, mergePerceptionIntoCellVisualState } from './cellVisualState'
import { getCellVisualSx, mergeAuthoringMapUnderlayIntoCellSx } from './cellVisualStyles'
import GridCellHost from '@/features/content/locations/components/mapGrid/GridCellHost'
import GridCellVisual, {
  GRID_CELL_VISUAL_CLASS,
} from '@/features/content/locations/components/mapGrid/GridCellVisual'
import { CombatGridAuthoringOverlay } from './CombatGridAuthoringOverlay'
import { LocationMapAuthoredObjectIconsCellInline } from '@/features/content/locations/components/mapGrid/LocationMapAuthoredObjectIconsLayer'
import { PlacedObjectCellVisualCentered } from '@/features/content/locations/domain/presentation/map/PlacedObjectCellVisualDisplay'
import { resolveLocationMapUiStyles } from '@/features/content/locations/domain/presentation/map/locationMapUiStyles'
import { filterAuthoredObjectRenderItemsForGrid } from './combatGridAuthoredObjects'
import { resolveCombatCellAffordance } from './combatCellAffordance'

const BASE_CELL_SIZE = 48
const HOVER_DELAY_MS = 350

export type CombatGridProps = {
  grid: GridViewModel
  zoom: number
  pan: { x: number; y: number }
  panPointerHandlers: {
    onPointerDown: (e: React.PointerEvent) => void
    onPointerMove: (e: React.PointerEvent) => void
    onPointerUp: () => void
  }
  isDragging: boolean
  /** From {@link useCanvasPan}; returns true once if the prior gesture was a pan drag — skip cell click. */
  consumeClickSuppressionAfterPan: () => boolean
  onCellClick?: (cellId: string) => void
  onCellHover?: (cellId: string | null) => void
  renderTokenPopover?: (occupantId: string) => ReactNode
  hoveredCellId?: string | null
  movementHighlightActive?: boolean
  hasMovementRemaining?: boolean
  creatureTargetingActive?: boolean
  /** When selecting a single map cell (placement), not AoE. */
  singleCellPlacementPickActive?: boolean
  /** When selecting a grid obstacle for object-anchored attached emanations. */
  objectAnchorPickActive?: boolean
}

function tokenRingColor(cell: GridCellViewModel, palette: Theme['palette']) {
  if (cell.occupantSide === 'party') return palette.primary.main
  if (cell.occupantSide === 'enemies') return palette.error?.main ?? '#d32f2f'
  return palette.grey[500]
}

function shouldRenderOccupantToken(
  cell: GridCellViewModel,
  viewerCombatantId: string | undefined,
): boolean {
  if (!cell.occupantRendersToken) return false
  if (cell.viewerPerceivesOccupantToken === false) return false
  if (!cell.perception) return true
  switch (cell.perception.occupantTokenVisibility) {
    case 'all':
      return true
    case 'none':
      return false
    case 'self-only':
      return cell.occupantId === viewerCombatantId
    default:
      return true
  }
}

export function CombatGrid({
  grid,
  zoom,
  pan,
  panPointerHandlers,
  isDragging,
  consumeClickSuppressionAfterPan,
  onCellClick,
  onCellHover,
  renderTokenPopover,
  hoveredCellId = null,
  movementHighlightActive = false,
  hasMovementRemaining = false,
  creatureTargetingActive = false,
  singleCellPlacementPickActive = false,
  objectAnchorPickActive = false,
}: CombatGridProps) {
  const theme = useTheme()
  const { palette } = theme
  const cellSizePx = BASE_CELL_SIZE

  const activeTurnPulse = useMemo(
    () =>
      keyframes`
        0%, 100% {
          box-shadow: 0 0 0 3px ${alpha(palette.secondary.main, 0.98)},
            0 0 16px ${alpha(palette.secondary.main, 0.55)},
            0 0 28px ${alpha(palette.secondary.main, 0.28)};
        }
        50% {
          box-shadow: 0 0 0 4px ${alpha(palette.secondary.main, 0.9)},
            0 0 22px ${alpha(palette.secondary.main, 0.65)},
            0 0 36px ${alpha(palette.secondary.main, 0.35)};
        }
      `,
    [palette.secondary.main],
  )

  const legalTargetRedPulse = useMemo(
    () =>
      keyframes`
        0%, 100% {
          box-shadow: 0 0 0 3px ${alpha(palette.error.main, 0.98)},
            0 0 16px ${alpha(palette.error.main, 0.55)},
            0 0 28px ${alpha(palette.error.main, 0.28)};
        }
        50% {
          box-shadow: 0 0 0 4px ${alpha(palette.error.main, 0.9)},
            0 0 22px ${alpha(palette.error.main, 0.65)},
            0 0 36px ${alpha(palette.error.main, 0.35)};
        }
      `,
    [palette.error.main],
  )

  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null)
  const [hoveredOccupantId, setHoveredOccupantId] = useState<string | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTokenMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>, occupantId: string) => {
      if (!renderTokenPopover) return
      const anchor = e.currentTarget
      hoverTimer.current = setTimeout(() => {
        setPopoverAnchor(anchor)
        setHoveredOccupantId(occupantId)
      }, HOVER_DELAY_MS)
    },
    [renderTokenPopover],
  )

  const handleTokenMouseLeave = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
    setPopoverAnchor(null)
    setHoveredOccupantId(null)
  }, [])

  const popoverOpen = Boolean(popoverAnchor) && Boolean(hoveredOccupantId)

  const battlefieldRender = grid.perception?.battlefieldRender
  const viewerCellId = grid.perception?.viewerCellId
  const viewerCombatantId = grid.perception?.viewerCombatantId

  const visibleAuthoredObjectItems = useMemo(
    () =>
      filterAuthoredObjectRenderItemsForGrid(
        grid.cells,
        grid.authoringPresentation?.authoredObjectRenderItems,
      ),
    [grid.cells, grid.authoringPresentation?.authoredObjectRenderItems],
  )

  const mapUi = useMemo(() => resolveLocationMapUiStyles(theme), [theme])

  return (
    <Box
      {...panPointerHandlers}
      onPointerLeave={() => onCellHover?.(null)}
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'inline-grid',
            gridTemplateColumns: `repeat(${grid.columns}, ${cellSizePx}px)`,
            gridTemplateRows: `repeat(${grid.rows}, ${cellSizePx}px)`,
            gap: '1px',
            bgcolor: 'grey.500',
            border: 1,
            borderColor: 'grey.500',
            borderRadius: 1,
          }}
        >
          {grid.authoringPresentation ? (
            <CombatGridAuthoringOverlay
              theme={theme}
              authoringPresentation={grid.authoringPresentation}
              columns={grid.columns}
              rows={grid.rows}
              cellPx={cellSizePx}
            />
          ) : null}
          {grid.cells.map((cell) => {
            const isWall = cell.kind === 'wall' || cell.kind === 'blocking'
            const affordance = resolveCombatCellAffordance({
              cell,
              hoveredCellId,
              hasCellClickHandler: Boolean(onCellClick),
              movementHighlightActive,
              hasMovementRemaining,
              creatureTargetingActive,
              singleCellPlacementPickActive,
              objectAnchorPickActive,
            })
            const showOccupantToken = shouldRenderOccupantToken(cell, viewerCombatantId)
            const hasPopover = Boolean(showOccupantToken && renderTokenPopover)
            const tokenSrc = resolveImageUrl(cell.occupantPortraitImageKey)
            const isHoverCell = hoveredCellId === cell.cellId
            const ring = tokenRingColor(cell, palette)

            const tacticalVisual = getCellVisualState(cell, {
              hoveredCellId,
              movementHighlightActive,
              hasMovementRemaining,
              combatHoverMode: affordance.hoverMode,
            })
            const visual = mergePerceptionIntoCellVisualState(tacticalVisual, cell.perception, {
              immersionAllowsPerceptionOverCastRangeBands: Boolean(
                battlefieldRender?.suppressAoeTemplateOverlay,
              ),
            })
            const liftAboveBlindVeil =
              Boolean(battlefieldRender?.useBlindVeil) && viewerCellId != null && cell.cellId === viewerCellId
            const cellVisualSx = mergeAuthoringMapUnderlayIntoCellSx(
              theme,
              getCellVisualSx(theme, visual),
              cell,
              visual,
            )

            const legalTarget = cell.isLegalTargetForSelectedAction
            const showLegalTargetRedPulse =
              legalTarget &&
              !cell.isActive &&
              (isHoverCell || cell.isSelectedTarget)

            const cellAuthoredItems = grid.authoringPresentation
              ? visibleAuthoredObjectItems.filter((it) => it.combatCellId === cell.cellId)
              : []

            const cellBox = (
              <GridCellHost
                interactive={affordance.interactive}
                disabled={affordance.disabled}
                showAuthoringFocusRing={false}
                onPointerEnter={
                  onCellHover && !isWall ? () => onCellHover(cell.cellId) : undefined
                }
                onClick={
                  affordance.interactive
                    ? () => {
                        if (consumeClickSuppressionAfterPan()) return
                        onCellClick?.(cell.cellId)
                      }
                    : undefined
                }
                sx={{
                  width: cellSizePx,
                  height: cellSizePx,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  justifyContent: 'stretch',
                  cursor: affordance.cursor,
                  position: 'relative',
                  zIndex: liftAboveBlindVeil ? 4 : 1,
                  '&:focus-visible': {
                    outline: 'none',
                  },
                  [`&:focus-visible .${GRID_CELL_VISUAL_CLASS}`]: {
                    outline: `2px solid ${palette.primary.main}`,
                    outlineOffset: 2,
                  },
                }}
              >
                <GridCellVisual sx={cellVisualSx}>
                  {cellAuthoredItems.length > 0 ? (
                    <LocationMapAuthoredObjectIconsCellInline
                      items={cellAuthoredItems}
                      cellPx={cellSizePx}
                      mapUi={mapUi}
                    />
                  ) : null}
                  {showOccupantToken && (
                    <Box
                      onPointerEnter={() => onCellHover?.(cell.cellId)}
                      onMouseEnter={
                        hasPopover
                          ? (e) => handleTokenMouseEnter(e, cell.occupantId!)
                          : undefined
                      }
                      onMouseLeave={hasPopover ? handleTokenMouseLeave : undefined}
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                        border: '3px solid',
                        borderColor: ring,
                        bgcolor: tokenSrc ? 'transparent' : ring,
                        zIndex: 1,
                        ...(cell.occupantIsDefeated ? { opacity: DEFEATED_PARTICIPATION_OPACITY } : {}),
                        animation: cell.isActive
                          ? `${activeTurnPulse} 2.4s ease-in-out infinite`
                          : showLegalTargetRedPulse
                            ? `${legalTargetRedPulse} 2.4s ease-in-out infinite`
                            : undefined,
                      }}
                    >
                      <AppAvatar
                        src={tokenSrc}
                        name={cell.occupantLabel ?? undefined}
                        size="sm"
                      />
                    </Box>
                  )}
                  {cell.placedObjectVisual && cell.perception?.showObstacleGlyph !== false ? (
                    <PlacedObjectCellVisualCentered
                      visual={cell.placedObjectVisual}
                      variant="tactical"
                      mapUi={mapUi}
                    />
                  ) : null}
                </GridCellVisual>
              </GridCellHost>
            )

            // `LocationMapAuthoredObjectIconsCellInline` wraps each authored icon in its own Tooltip.
            // Do not wrap the whole cell — that would stack a second tooltip on the same hover.
            if (cellAuthoredItems.length > 0) {
              return <Fragment key={cell.cellId}>{cellBox}</Fragment>
            }

            if (cell.placedObjectVisual && cell.perception?.showObstacleGlyph !== false) {
              return (
                <Tooltip key={cell.cellId} title={cell.placedObjectVisual.tooltip} placement="top" arrow>
                  {cellBox}
                </Tooltip>
              )
            }

            if (!hasPopover && cell.occupantRendersToken && cell.occupantLabel) {
              return (
                <Tooltip key={cell.cellId} title={cell.occupantLabel} placement="top" arrow>
                  {cellBox}
                </Tooltip>
              )
            }

            return <Fragment key={cell.cellId}>{cellBox}</Fragment>
          })}
          {battlefieldRender?.useBlindVeil ? (
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                pointerEvents: 'none',
                bgcolor: alpha('#000000', battlefieldRender.blindVeilOpacity),
                borderRadius: 1,
              }}
            />
          ) : null}
        </Box>
      </Box>

      {renderTokenPopover && (
        <Popover
          open={popoverOpen}
          anchorEl={popoverAnchor}
          onClose={handleTokenMouseLeave}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          slotProps={{
            paper: { sx: { pointerEvents: 'none', maxWidth: 320 } },
          }}
          disableRestoreFocus
          sx={{ pointerEvents: 'none' }}
        >
          <Box sx={{ p: 1 }}>
            {hoveredOccupantId && renderTokenPopover(hoveredOccupantId)}
          </Box>
        </Popover>
      )}
    </Box>
  )
}
