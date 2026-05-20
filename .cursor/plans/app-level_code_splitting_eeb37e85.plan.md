---
name: App-level code splitting
overview: Route-level lazy loading with App Suspense is in place; remaining work targets the largest eager graphs (campaign world, auth shell routes, vendor chunks) and bundler-safe import patterns.
todos:
  - id: app-suspense
    content: Add Suspense + minimal fallback wrapping RouterProvider in App.tsx
    status: completed
  - id: lazy-helper
    content: Add lazyRoute helper (default + optional named export) under src/app/routing/
    status: completed
  - id: pilot-route-chunk
    content: Lazy encounter + game-session routes in router; fix patterns barrel imports in those chunks
    status: completed
  - id: verify-build-chunks
    content: Run vite build and confirm new async chunks in dist/assets
    status: completed
  - id: phase2-world-routes
    content: "Phase 2: lazy-load WorldLayout subtree (equipment, content lists/editors under ContentManageGuard)"
    status: completed
  - id: phase3-auth-hub-routes
    content: "Phase 3: lazy-load remaining auth routes (dashboard, campaigns, characters, hub, messaging, party, sessions, rules, admin)"
    status: completed
  - id: phase4-public-split
    content: "Phase 4: router imports ./routes/public only; direct patterns/form imports; campaign admin inlined in campaign routes index"
    status: completed
  - id: phase5-manual-chunks
    content: "Phase 5: optional Rollup manualChunks for react / mui / x-data-grid (measure gzip + long-term cache)"
    status: completed
  - id: phase6-ux-prefetch
    content: "Phase 6: nested Suspense fallbacks + link-hover prefetch for hot paths"
    status: completed
isProject: false
---

# Code splitting (App + router)

## Reality check

[`src/app/App.tsx`](src/app/App.tsx) wraps [`RouterProvider`](src/app/App.tsx) in [`Suspense`](src/app/App.tsx) with [`RouteSuspenseFallback`](src/app/RouteSuspenseFallback.tsx). **`router.tsx` must not statically import routes only needed for authenticated surfaces** ([`routes/index`](src/app/routes/index.ts) / [`routes/auth`](src/app/routes/auth/index.ts)); **Phase 4** switches to [`routes/public`](src/app/routes/public/index.ts) only for those eagerly mounted public leaves.

```mermaid
flowchart LR
  main[main.tsx] --> App[App.tsx]
  App --> RouterProvider
  RouterProvider --> router[router.tsx]
  router --> routesPublic[routes/public]
```

## Done — Phase 1 (foundation + pilot)

- **Suspense boundary** around the router (required for lazy route components).
- **[`lazyRoute`](src/app/routing/lazyRoute.tsx)** — one implementation with optional second arg for named exports (esbuild disallows duplicate `export function lazyRoute` overload declarations; overload behavior is modeled via optional `exportName`).
- **Pilot splits:** encounter + game-session routes use dynamic `import()`.
- **Barrel hygiene:** For modules inside async chunks, prefer **direct imports** from defining files under `@/ui/patterns/...` instead of `@/ui/patterns` when Rollup warns about re-exports spanning chunks (same issue may recur for other barrels).

## Phase 2 — Campaign **world** subtree (highest route-level ROI)

**Target:** Everything under `path: 'world'` in [`router.tsx`](src/app/router.tsx) — [`WorldLayout`](src/features/campaign/routes) and all descendants (equipment hubs/lists/detail/edits, classes, races, locations, NPCs, monsters, spells, skill proficiencies), including routes wrapped in **`ContentManageGuard`**.

**Why high value:** This pulls in **`@/features/content/*`** and related UI — historically a large share of the main bundle; most users do not need it on first paint after login.

**How:**

- Replace static imports of those route components with `lazyRoute(() => import('…'))` pointing at the **same modules** the auth routes barrel re-exports (feature route files), not the barrel itself (avoid re-pulling the whole barrel into the router chunk).
- Keep **`ContentManageGuard`** eager unless it is tiny and profiling says otherwise; lazy **leaf** pages first.
- After each batch, run `vite build` and confirm new `dist/assets/*` chunks; re-check for Rollup circular-chunk warnings and switch any new `@/ui/patterns` barrel imports in those features to direct paths as needed.

## Phase 3 — Remaining **authenticated** routes (outside `world`)

**Target:** Dashboard, users, characters, campaign list, **campaign layout shell** (evaluate: lazy inner outlets vs whole [`CampaignLayoutRoute`](src/features/campaign/routes)), hub index, invite, messaging, party, live sessions, rules, campaign admin (invites/settings/ruleset).

**Why:** Shrinks the “logged-in but not in world tools” path and speeds transitions that never open world authoring.

**How:** Same `lazyRoute` pattern; consider **one chunk per major feature** (`character`, `campaign` hub, `message`) if the number of HTTP requests stays reasonable, or per-route if you need finer caching.

## Phase 4 — **Public vs authenticated** initial graph (**done**)

**Shipped:**

- **`router.tsx` → [`routes/public`](src/app/routes/public/index.ts)** only for `HomeRoute` / login / register / accept invite — no dependency on **`./routes/index`**, so the auth route barrel graph is excluded from the main chunk.
- **Bundlers:** Routed lazy content that imported **`DEFAULT_VISIBILITY_PUBLIC`**, **`buildDefaultValues`**, **`FieldConfig`**, **`when`**, and select encounter/combat **`SelectEntityModal` / `EntitySummaryCard` / `SelectEntityOption`** flows now resolve **canonical modules** (`@/ui/patterns/form/...`, `@/ui/patterns/modal/...`) instead of the kitchen-sink [`@/ui/patterns`](src/ui/patterns/index.ts) barrel — removes Rollup circular-chunk warnings after splitting.
- **Campaign barrel:** [`features/campaign/routes/index`](src/features/campaign/routes/index.ts) **re-exports admin routes directly from `./admin/*.tsx`** (not `./admin/index`) so `CampaignRulesetEditorRoute` is not statically grouped through the legacy admin barrel alongside `lazyRoute()`.

**Optional later:** Lazy-load **all** `AuthLayout` subtree in one deferred router module (beyond public-only splitting).

## Phase 5 — **Vendor** `manualChunks` (orthogonal, high payoff if main chunk stays huge)

**Target:** Separate stable dependencies from app code:

- `react` / `react-dom`
- `@mui/material` (+ optionally `@mui/icons-material` if still bloating one chunk)
- `@mui/x-data-grid`, `@mui/x-date-pickers` if they dominate size

**Caveats:** Must **dedupe** correctly (single React instance); verify production build and a smoke test pass. Tune for **gzip** and **cache headers**, not raw KB alone.

[`vite.config`](vite.config.ts) — `build.rollupOptions.output.manualChunks` (or Vite 5+ `modulePreload` / chunking strategy per docs).

## Phase 6 — **UX** — nested Suspense + prefetch

- **Nested `Suspense`:** Place a layout-level fallback (skeleton inside `AuthLayout` / campaign chrome) under the top-level [`RouteSuspenseFallback`](src/app/RouteSuspenseFallback.tsx) so full-page “Loading…” is rare.
- **Prefetch:** On pointer intent or `Link` visibility, preload likely next chunks (React Router / `import()` patterns) for high-traffic moves (e.g. campaign hub → world → equipment).

## Step — Keep providers and typing stable

- [`RootLayout`](src/app/router.tsx) + [`AppProviders`](src/app/providers/AppProviders.tsx) remain eager so context wraps lazy trees.
- Route `handle` (e.g. [`layoutWidth`](src/app/routing/layoutWidth.ts)) unchanged for lazy `element` migration.

## Success criteria (program-level)

- **Phase 1 (done):** Lazy encounter + game-session chunks visible in `dist/assets/`; production `vite build` clean of prior patterns-barrel circular chunk warnings for those surfaces.
- **Phase 2–3:** Meaningful reduction in primary **entry / main app** JS size (gzip) vs baseline; no regressions on navigation or guards.
- **Phase 5:** Vendor chunks cached across app deploys without breaking singletons.

## References in repo

- [`src/app/router.tsx`](src/app/router.tsx)
- [`src/app/routing/lazyRoute.tsx`](src/app/routing/lazyRoute.tsx)
- [`src/app/routes/auth/index.ts`](src/app/routes/auth/index.ts)
