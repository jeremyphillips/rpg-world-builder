import { useMemo, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { BREADCRUMB_CONFIG } from '@/app/breadcrumbs'
import type { BreadcrumbItem } from '@/ui/elements'

// ---------------------------------------------------------------------------
// Label cache — shared across all hook instances, survives re-renders.
// Keyed by the resolved URL path (e.g. "/campaigns/abc").
// ---------------------------------------------------------------------------

const labelCache = new Map<string, string>()

// ---------------------------------------------------------------------------
// Pattern matching utilities
// ---------------------------------------------------------------------------

/** Convert a route pattern like "/campaigns/:id/world" into a regex + param names */
function patternToRegex(pattern: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = []
  const regexStr = pattern
    .split('/')
    .map((seg) => {
      if (seg.startsWith(':')) {
        paramNames.push(seg.slice(1))
        return '([^/]+)'
      }
      return seg
    })
    .join('/')
  return { regex: new RegExp(`^${regexStr}$`), paramNames }
}

/** Try to match a concrete path against a route pattern. Returns params if matched. */
function matchPattern(
  path: string,
  pattern: string,
): Record<string, string> | null {
  const { regex, paramNames } = patternToRegex(pattern)
  const match = path.match(regex)
  if (!match) return null
  const params: Record<string, string> = {}
  paramNames.forEach((name, i) => {
    params[name] = match[i + 1]
  })
  return params
}

// ---------------------------------------------------------------------------
// Build ancestor paths
//
// "/campaigns/abc/world/locations/xyz"
// → ["/campaigns/abc", "/campaigns/abc/world",
//    "/campaigns/abc/world/locations", "/campaigns/abc/world/locations/xyz"]
// ---------------------------------------------------------------------------

function getAncestorPaths(pathname: string): string[] {
  const segments = pathname.split('/').filter(Boolean)
  const paths: string[] = []
  for (let i = 1; i <= segments.length; i++) {
    paths.push('/' + segments.slice(0, i).join('/'))
  }
  return paths
}

const humanizeSegment = (seg: string) =>
  decodeURIComponent(seg)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Derives breadcrumb items from the current URL by matching against
 * BREADCRUMB_CONFIG. Dynamic labels (e.g. campaign name) are resolved
 * asynchronously and cached.
 */
export default function useBreadcrumbs(): BreadcrumbItem[] {
  const { pathname } = useLocation()
  const [resolvedLabels, setResolvedLabels] = useState<Map<string, string>>(
    () => new Map(labelCache),
  )

  // Build the static breadcrumb trail from the current path
  const { trail, pendingResolvers } = useMemo(() => {
    const ancestors = getAncestorPaths(pathname)
    const patterns = Object.keys(BREADCRUMB_CONFIG)
    const items: { path: string; label: string; pattern: string }[] = []
    const pending: { path: string; params: Record<string, string>; pattern: string }[] = []

    for (const ancestorPath of ancestors) {
      let matched = false

      for (const pattern of patterns) {
        const params = matchPattern(ancestorPath, pattern)
        if (!params) continue

        const config = BREADCRUMB_CONFIG[pattern]
        // Use cached/resolved label if available, else static fallback
        const label = labelCache.get(ancestorPath) ?? config.label
        items.push({ path: ancestorPath, label, pattern })

        // Queue async resolution if needed and not yet cached
        if (config.resolveLabel && !labelCache.has(ancestorPath)) {
          pending.push({ path: ancestorPath, params, pattern })
        }
        matched = true
        break // first match wins
      }

      if (!matched) {
        const seg = ancestorPath.split('/').filter(Boolean).slice(-1)[0];
        if (seg) {
          items.push({
            path: ancestorPath,
            label: humanizeSegment(seg),
            pattern: '__fallback__',
          });
        }
      }
    }

    return { trail: items, pendingResolvers: pending }
  }, [pathname])

  // Resolve async labels
  useEffect(() => {
    if (pendingResolvers.length === 0) return
    let cancelled = false

    for (const { path, params, pattern } of pendingResolvers) {
      const config = BREADCRUMB_CONFIG[pattern]
      if (!config.resolveLabel) continue

      config.resolveLabel(params).then((resolved) => {
        if (cancelled) return
        labelCache.set(path, resolved)
        setResolvedLabels((prev) => {
          const next = new Map(prev)
          next.set(path, resolved)
          return next
        })
      }).catch(() => {
        // Keep static fallback on failure
      })
    }

    return () => { cancelled = true }
  }, [pendingResolvers])

  // Build final BreadcrumbItem[] — last item has no link
  return useMemo(() => {
    return trail.map((item, i) => {
      const isLast = i === trail.length - 1
      const label = resolvedLabels.get(item.path) ?? item.label
      return {
        label,
        to: isLast ? undefined : item.path,
      }
    })
  }, [trail, resolvedLabels])
}
