import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'

type ModuleRecord = Record<string, unknown>

/**
 * Lazy-load a route component from a dynamic import.
 *
 * - **Default export:** `lazyRoute(() => import('./Thing'))`
 * - **Named export:** `lazyRoute(() => import('./things'), 'Thing')`
 */
export function lazyRoute(
  loader: () => Promise<ModuleRecord>,
  exportName?: string,
): LazyExoticComponent<ComponentType<unknown>> {
  return lazy(async () => {
    const mod = await loader()
    const Comp = exportName === undefined ? mod.default : mod[exportName]
    if (typeof Comp !== 'function') {
      const label = exportName === undefined ? 'default' : `"${exportName}"`
      throw new Error(`lazyRoute: export ${label} is missing or not a component.`)
    }
    return { default: Comp as ComponentType<unknown> }
  })
}
