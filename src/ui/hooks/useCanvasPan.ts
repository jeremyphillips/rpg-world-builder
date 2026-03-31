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
  /** Returns true if the pointer moved past the drag threshold during the current gesture. Read in click handlers to distinguish click from drag. */
  hasDragMoved: () => boolean
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
  const dragState = useRef<{
    startX: number
    startY: number
    startPanX: number
    startPanY: number
  } | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
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

  const onPointerUp = useCallback(() => {
    dragState.current = null
    setIsDragging(false)
  }, [])

  // Window-level safety net: clears drag state even when a child calls
  // stopPropagation on pointerup, which would prevent the wrapper's
  // onPointerUp from firing.
  useEffect(() => {
    const handleWindowPointerUp = () => {
      if (dragState.current) {
        dragState.current = null
        setIsDragging(false)
      }
    }
    window.addEventListener('pointerup', handleWindowPointerUp)
    return () => window.removeEventListener('pointerup', handleWindowPointerUp)
  }, [])

  const resetPan = useCallback(() => setPan({ x: 0, y: 0 }), [])
  const hasDragMoved = useCallback(() => dragMovedRef.current, [])

  return {
    pan,
    setPan,
    isDragging,
    hasDragMoved,
    pointerHandlers: { onPointerDown, onPointerMove, onPointerUp },
    resetPan,
  }
}
