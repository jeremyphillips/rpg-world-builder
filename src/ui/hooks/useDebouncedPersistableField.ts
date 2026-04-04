import { useCallback, useEffect, useRef } from 'react';

export type UseDebouncedPersistableFieldParams<T> = {
  /** Current buffered value (e.g. from `useWatch`). */
  value: T;
  delayMs: number;
  /** Called after debounce and when `flush()` runs; should write to workspace draft / persistable store. */
  onCommit: (value: T) => void;
};

export type UseDebouncedPersistableFieldReturn = {
  /** Clear pending timer and commit the latest value immediately. */
  flush: () => void;
  /** Clear pending timer without committing. */
  cancelPendingTimer: () => void;
};

/**
 * Debounced commit of a persistable field plus explicit **flush** for destructive boundaries
 * (save, selection change, tab switch, unmount) so the last buffered value is not lost.
 *
 * Call `flush()` from `useEffect` cleanup for unmount, before Save, and when switching away
 * from the editing context (e.g. `useLayoutEffect` when a scoped id changes).
 *
 * @see `docs/reference/location-workspace.md` — debounced persistable fields
 */
export function useDebouncedPersistableField<T>({
  value,
  delayMs,
  onCommit,
}: UseDebouncedPersistableFieldParams<T>): UseDebouncedPersistableFieldReturn {
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;
  const valueRef = useRef(value);
  valueRef.current = value;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    cancelPendingTimer();
    onCommitRef.current(valueRef.current);
  }, [cancelPendingTimer]);

  useEffect(() => {
    cancelPendingTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      onCommitRef.current(valueRef.current);
    }, delayMs);
    return cancelPendingTimer;
  }, [value, delayMs, cancelPendingTimer]);

  return { flush, cancelPendingTimer };
}
