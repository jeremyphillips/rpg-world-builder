/**
 * Lightweight full-router Suspense fallback (route-level lazy chunks).
 * Keep this dependency-light so App’s critical path stays small.
 */
export function RouteSuspenseFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '35vh',
        font: 'inherit',
        opacity: 0.75,
      }}
    >
      Loading…
    </div>
  )
}
