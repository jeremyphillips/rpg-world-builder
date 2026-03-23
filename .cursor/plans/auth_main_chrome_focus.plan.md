---
name: ""
overview: ""
todos: []
isProject: false
---

# AuthMainChrome / AuthMainFocus / Encounter

## Context

- **AuthMainChrome** — Standard padded `main` region (current behavior).
- **AuthMainFocus** — Full-bleed / minimal padding for encounter-style views; **uncommon** (outlier).
- **Encounter integration** is imminent; Focus will not be a common pattern across the app.

## Recommendation: nested router vs flat

**Prefer a flat router + conditional `main` wrapper inside `AuthLayout`**, not a nested `AuthChromeLayout` route.


| Approach                                                | Pros                                                                     | Cons                                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Nested** (`AuthLayout` → `AuthChromeLayout` → routes) | Explicit in `router.tsx`; each branch owns its `main` variant            | Extra nesting for **every** auth route for the lifetime of the app; more boilerplate for an outlier |
| **Flat + conditional in `AuthLayout`**                  | No router churn for 99% of routes; one place to special-case the outlier | `AuthLayout` knows one (or few) path patterns for Focus                                             |


Because Focus is **rare** and Encounter is **one** primary consumer, **do not** introduce nested layout routes solely to separate Chrome vs Focus. Keep authenticated routes as **direct children** of `AuthLayout` as they are today.

When Encounter should use Focus:

- In `AuthLayout`, derive a boolean, e.g. `isFocusMain`, from `useLocation()` + `matchPath()` (or a small helper) against the campaign encounter path pattern.
- Render:

```tsx
  {isFocusMain ? <AuthMainFocus><Outlet /></AuthMainFocus> : <AuthMainChrome><Outlet /></AuthMainChrome>}
  

```

- Keep drawer / AppBar / notifications behavior in a **follow-up decision** (hide bar for true fullscreen, or keep minimal chrome); this plan only covers the `main` region split.

**When to reconsider nested layouts:** If you later have **many** unrelated “focus” subtrees with different rules, refactor to nested layout routes or a registry. Until then, conditional `main` is simpler.

## Implementation order

1. Add `AuthMainChrome.tsx` — extract current `Box component="main"` styles from `AuthLayout`.
2. Add `AuthMainFocus.tsx` — `p: 0`, flex growth, `overflow: hidden` (tune when Encounter lands).
3. Wire `AuthLayout` to wrap `<Outlet />` with `AuthMainChrome` by default.
4. After Encounter route shape is stable, add `isFocusMain` + `AuthMainFocus` for that path only.

## Files (expected)

- `src/app/layouts/auth/AuthMainChrome.tsx`
- `src/app/layouts/auth/AuthMainFocus.tsx`
- `src/app/layouts/auth/AuthLayout.tsx` — compose + conditional when ready
- `src/app/layouts/auth/index.ts` — export primitives as needed

## Router

- **No change** to `router.tsx` nesting for Chrome vs Focus (unless you independently want structural grouping unrelated to this).

## Verification

- Spot-check scroll and padding on a long page (Chrome).
- After Focus is wired, verify Encounter fills the main region as intended without double scroll containers.

