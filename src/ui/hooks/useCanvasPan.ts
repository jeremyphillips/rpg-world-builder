import { useCallback, useEffect, useRef, useState } from 'react'
import type { CanvasPoint } from './canvas.types'

const DEFAULT_DRAG_THRESHOLD = 3

export type UseCanvasPanOptions = {
  /** Dead-zone in px before drag is recognized (default 3). */
  dragThreshold?: number
}

export type UseCanvasPanReturn = {
  pan: CanvasPoint
  setPan: React.Dispatch<React.SetStateAction<CanvasPoint>>
  isDragging: boolean
  /**
   * Returns true if the pointer moved past the drag threshold during the current gesture (before
   * pointerup clears it). Prefer {@link consumeClickSuppressionAfterPan} in click handlers.
   */
  hasDragMoved: () => boolean
  /**
   * After a pan gesture that moved past the threshold, the following `click` should be ignored.
   * Call once from the cell/grid click handler; returns true once and clears the flag.
   */
  consumeClickSuppressionAfterPan: () => boolean
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent) => void
    onPointerMove: (e: React.PointerEvent) => void
    onPointerUp: () => void
  }
  resetPan: () => void
}

export function useCanvasPan(options?: UseCanvasPanOptions): UseCanvasPanReturn {
  const threshold = options?.dragThreshold ?? DEFAULT_DRAG_THRESHOLD

  const [pan, setPan] = useState<CanvasPoint>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragMovedRef = useRef(false)
  /** Set on pointerup when the pan gesture exceeded the drag threshold; consumed by the next click. */
  const suppressNextClickAfterPanRef = useRef(false)
  const dragState = useRef<{
    startX: number
    startY: number
    startPanX: number
    startPanY: number
  } | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      suppressNextClickAfterPanRef.current = false
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      }
      dragMovedRef.current = false
      setIsDragging(true)
    },
    [pan.x, pan.y],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current) return
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        dragMovedRef.current = true
      }
      setPan({
        x: dragState.current.startPanX + dx,
        y: dragState.current.startPanY + dy,
      })
    },
    [threshold],
  )

  const finalizePointerUp = useCallback(() => {
    if (dragMovedRef.current) {
      suppressNextClickAfterPanRef.current = true
    }
    dragMovedRef.current = false
    dragState.current = null
    setIsDragging(false)
  }, [])

  const onPointerUp = useCallback(() => {
    finalizePointerUp()
  }, [finalizePointerUp])

  // Window-level safety net: clears drag state even when a child calls
  // stopPropagation on pointerup, which would prevent the wrapper's
  // onPointerUp from firing.
  useEffect(() => {
    const handleWindowPointerUp = () => {
      if (dragState.current) {
        finalizePointerUp()
      }
    }
    window.addEventListener('pointerup', handleWindowPointerUp)
    return () => window.removeEventListener('pointerup', handleWindowPointerUp)
  }, [finalizePointerUp])

  const resetPan = useCallback(() => setPan({ x: 0, y: 0 }), [])
  const hasDragMoved = useCallback(() => dragMovedRef.current, [])

  const consumeClickSuppressionAfterPan = useCallback(() => {
    if (!suppressNextClickAfterPanRef.current) return false
    suppressNextClickAfterPanRef.current = false
    return true
  }, [])

  return {
    pan,
    setPan,
    isDragging,
    hasDragMoved,
    consumeClickSuppressionAfterPan,
    pointerHandlers: { onPointerDown, onPointerMove, onPointerUp },
    resetPan,
  }
}
