import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useDebouncedPersistableField } from './useDebouncedPersistableField';

describe('useDebouncedPersistableField', () => {
  it('debounces commits during ordinary typing', () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    const { rerender } = renderHook(
      ({ value }: { value: string }) =>
        useDebouncedPersistableField({ value, delayMs: 300, onCommit }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'ab' });
    rerender({ value: 'abc' });
    expect(onCommit).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('abc');
    vi.useRealTimers();
  });

  it('flush commits latest value immediately and clears pending debounce', () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) =>
        useDebouncedPersistableField({ value, delayMs: 300, onCommit }),
      { initialProps: { value: 'x' } },
    );

    rerender({ value: 'final' });
    act(() => {
      result.current.flush();
    });
    expect(onCommit).toHaveBeenCalledWith('final');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onCommit).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('cancelPendingTimer clears timer without extra commit beyond flush semantics', () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) =>
        useDebouncedPersistableField({ value, delayMs: 300, onCommit }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => {
      result.current.cancelPendingTimer();
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onCommit).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
