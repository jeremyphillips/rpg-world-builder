import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useCanvasPan } from './useCanvasPan';

function pe(
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  x: number,
  y: number,
): React.PointerEvent {
  return {
    button: 0,
    clientX: x,
    clientY: y,
  } as React.PointerEvent;
}

describe('useCanvasPan', () => {
  it('consumeClickSuppressionAfterPan suppresses the next click after a drag past threshold', () => {
    const { result } = renderHook(() => useCanvasPan({ dragThreshold: 3 }));

    act(() => {
      result.current.pointerHandlers.onPointerDown(pe('pointerdown', 0, 0));
    });
    act(() => {
      result.current.pointerHandlers.onPointerMove(pe('pointermove', 10, 0));
    });
    act(() => {
      result.current.pointerHandlers.onPointerUp();
    });

    expect(result.current.consumeClickSuppressionAfterPan()).toBe(true);
    expect(result.current.consumeClickSuppressionAfterPan()).toBe(false);
  });

  it('does not set suppress when movement stays within threshold', () => {
    const { result } = renderHook(() => useCanvasPan({ dragThreshold: 10 }));

    act(() => {
      result.current.pointerHandlers.onPointerDown(pe('pointerdown', 0, 0));
    });
    act(() => {
      result.current.pointerHandlers.onPointerMove(pe('pointermove', 2, 2));
    });
    act(() => {
      result.current.pointerHandlers.onPointerUp();
    });

    expect(result.current.consumeClickSuppressionAfterPan()).toBe(false);
  });
});
