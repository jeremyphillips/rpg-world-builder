---
name: Encounter UI theme pass
overview: Consolidate encounter active chrome (borders + opacity + layout) into `encounterUiStateTheme.ts` for review; relocate full `encounterActiveBarLayout.ts` from primitives; emphasize current/active turn styling; AppBadge styling explicitly excluded.
todos:
  - id: layout-move-from-primitives
    content: Relocate entire encounterActiveBarLayout.ts into encounterUiStateTheme.ts; delete primitives file; strip primitives/index; update EncounterActiveHeader, Sidebar, CombatPlayView imports
    status: completed
  - id: turn-order-surface
    content: Extend EncounterUiStateTheme with turnOrderRow borders + participation opacity tokens; add getEncounterTurnOrderRowOpacity(theme, input); wire TurnOrderList Paper borderColor + opacity (no AppBadge changes)
    status: completed
  - id: optional-directive
    content: "Optional: header directive resourcesExhausted text color token vs leave warning.main local"
    status: completed
  - id: docs
    content: Update encounter-ui-theme.md (turnOrderRow borders + participation opacity; AppBadge out of scope; layout in encounter theme not primitives)
    status: completed
isProject: false
---

# Encounter UI state theming — first follow-up pass

## Goals for this pass

- **Consolidate** a meaningful slice of encounter **active** chrome (especially **current turn / “active”** emphasis): borders, row opacity, and layout constants — into `[encounterUiStateTheme.ts](src/features/encounter/ui/theme/encounterUiStateTheme.ts)` so you can **review** and decide a refactor direction next.
- **In scope:** border colors, **opacity** (including turn-order row participation opacity), header layout (`ENCOUNTER_*`, `encounterActiveBarSx`), optional directive exhaustion color.
- **Out of scope:** **AppBadge** — do **not** change `STATUS_TONE`, `STATUS_LABEL`, badge `variant`, `filled` vs `outlined`, or any `AppBadge` props in `TurnOrderList` or elsewhere for this pass.

## Source of truth (already aligned)

- `[docs/reference/combat/client/encounter-ui-theme.md](docs/reference/combat/client/encounter-ui-theme.md)` — semantic layer by **surface** then **state**; no parallel flat color maps.
- `[src/features/encounter/ui/theme/encounterUiStateTheme.ts](src/features/encounter/ui/theme/encounterUiStateTheme.ts)` — `getEncounterUiStateTheme(theme)` + `EncounterUiStateTheme` with `header.default` / `header.activeTurn` only.

## Audit: what is scattered today


| Location                                                                                                                                                                                                        | Pattern                                                                                               | Verdict                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `[EncounterActiveHeader.tsx](src/features/encounter/components/active/layout/EncounterActiveHeader.tsx)`                                                                                                        | Uses theme mapping for Paper bg/border; `resourcesExhausted ? 'warning.main'` on directive Typography | Header chrome **done**; directive warning color is **encounter state** and still raw palette                                                                                                                                         |
| `[TurnOrderList.tsx](src/features/encounter/components/active/modals/TurnOrderList.tsx)`                                                                                                                        | `entry.status === 'current' ? 'primary.main' : 'divider'`                                             | **Same semantic** as “current combatant” emphasis; duplicates meaning with header/card borders, likely to drift                                                                                                                      |
| `[CombatantPreviewCard.tsx](src/features/combat/components/cards/CombatantPreviewCard.tsx)` (combat)                                                                                                            | `isCurrentTurn ? 'primary.main' : …`                                                                  | Same “current turn” meaning; **combat does not import encounter** today — folding here implies a new dependency or a later shared layer; **defer** for this pass unless you explicitly want `features/combat` → `features/encounter` |
| `[CombatTargetSelectModal.tsx](src/features/encounter/components/active/modals/CombatTargetSelectModal.tsx)`                                                                                                    | `isSelected ? 'primary.main' : 'divider'`                                                             | **Selection** in a modal, not turn/active-combatant chrome — **keep local**                                                                                                                                                          |
| `[EncounterSetupHeader.tsx](src/features/encounter/components/setup/layout/EncounterSetupHeader.tsx)`, `[EncounterActiveFooter.tsx](src/features/encounter/components/active/layout/EncounterActiveFooter.tsx)` | `borderColor: 'divider'`                                                                              | Generic shell chrome — **keep local**                                                                                                                                                                                                |
| `[CombatPlayView.tsx](src/features/combat/components/CombatPlayView.tsx)`, `[EncounterActiveSidebar.tsx](src/features/encounter/components/active/grid/EncounterActiveSidebar.tsx)`                             | `ENCOUNTER_ACTIVE_HEADER_*` + calcs                                                                   | Layout coordination, not palette state                                                                                                                                                                                               |


**Note:** Only `[encounterUiStateTheme.ts](src/features/encounter/ui/theme/encounterUiStateTheme.ts)` uses `alpha` / `lighten` inside the encounter feature; other encounter components use MUI palette **string keys** (`primary.main`, `divider`, `warning.main`).

---

## Recommended changes (consolidation-first)

### 1. Layout: entire `encounterActiveBarLayout.ts` belongs in encounter feature, not `ui/primitives`

**Scope:** This applies to the **whole** `[encounterActiveBarLayout.ts](src/ui/primitives/encounterActiveBarLayout.ts)` module — not a subset. Relocate **everything** in that file as one unit:

- `ENCOUNTER_ACTIVE_HEADER_LAYOUT_HEIGHT_PX`
- `ENCOUNTER_ACTIVE_HEADER_HEIGHT_CSS_VAR`
- `encounterActiveBarSx` (including `px`, `py`, `minHeight`, `boxSizing`)
- The `SxProps<Theme>` import from MUI (required for `encounterActiveBarSx`)
- **JSDoc** on each export (fix `@link` if paths referenced the old module)

**Rationale:** The file is a single concern — encounter active shell layout. None of it belongs in generic primitives.

**Approach:**

- **Move** the full contents into `[src/features/encounter/ui/theme/encounterUiStateTheme.ts](src/features/encounter/ui/theme/encounterUiStateTheme.ts)` (same module as `getEncounterUiStateTheme`, one entry point). Export all three symbols as named exports alongside the theme types and `getEncounterUiStateTheme`.
- **Remove entirely:** delete `[src/ui/primitives/encounterActiveBarLayout.ts](src/ui/primitives/encounterActiveBarLayout.ts)` — no stubs, no split of “only constants” vs “only sx” left in primitives.
- **Strip** encounter layout exports from `[ui/primitives/index.ts](src/ui/primitives/index.ts)` — **no re-exports** from primitives.
- **Update imports:** `[EncounterActiveHeader.tsx](src/features/encounter/components/active/layout/EncounterActiveHeader.tsx)`, `[EncounterActiveSidebar.tsx](src/features/encounter/components/active/grid/EncounterActiveSidebar.tsx)`, `[CombatPlayView.tsx](src/features/combat/components/CombatPlayView.tsx)` import from the encounter theme module. `**features/combat` → `features/encounter`** is acceptable here (play shell depends on encounter layout contract).

**Classification:** **Folded in fully** as encounter-owned layout: static exports for px/CSS var/sx; semantic colors and participation opacity live on the `getEncounterUiStateTheme(theme)` return object (see §2).

### 2. Semantic tokens: `turnOrderRow` — **borders + opacity** (active / current emphasis)

**Borders:** Add under `EncounterUiStateTheme`, e.g.:

- `turnOrderRow.current.borderColor` → `theme.palette.primary.main` (matches today’s “active” row)
- `turnOrderRow.default.borderColor` → `theme.palette.divider`

**Opacity (in scope):** Participation / visibility opacities for turn-order rows should live in the same mapping layer, not only ad hoc imports from mechanics in the component.

- Add a `**participation`** (or equivalently named) section on `EncounterUiStateTheme` with the numeric factors used for row opacity, aligned with `[presentation-participation.ts](packages/mechanics/src/combat/presentation/participation/presentation-participation.ts)` today — e.g. defeated, battlefield-absent, and unseen-viewer dim multiplier (`UNSEEN_FROM_VIEWER_DIM` / `PARTICIPATION_VISUALS` semantics).
- Export `**getEncounterTurnOrderRowOpacity(theme, input)**` from `encounterUiStateTheme.ts` with the **same inputs** as `getTurnOrderRowOpacity` (`status`, `isBattlefieldAbsent`, `nonVisibleViewerPresentation`) and the **same computed result**, implemented using `getEncounterUiStateTheme(theme).participation` so opacity is **first-class** in the encounter theme object (and can become theme-aware later without reshaping call sites).

**Mechanics package:** Avoid `packages/mechanics` depending on `features/encounter`. For this pass, **either** keep `getTurnOrderRowOpacity` in mechanics as a thin duplicate of the same math (follow-up: dedupe via shared module), **or** have mechanics re-export — only if dependency direction allows. **Preferred minimal churn:** implement the resolver in encounter; **TurnOrderList** uses `getEncounterTurnOrderRowOpacity` only; leave mechanics helper for other callers until a follow-up consolidates.

`**TurnOrderList` wiring:** Paper `sx` uses `borderColor` from `getEncounterUiStateTheme` + `opacity` from `getEncounterTurnOrderRowOpacity`. **Do not** touch `AppBadge` / `STATUS_TONE` / status badge variants (explicitly out of scope).

Update `[encounter-ui-theme.md](docs/reference/combat/client/encounter-ui-theme.md)` — document `turnOrderRow` (borders + participation opacity) and note AppBadge styling is unchanged in this pass.

### 3. Optional small addition: directive exhaustion color

If you want one more piece of state-driven chrome in the header: add e.g. `header.directive.resourcesExhaustedTextColor` → `theme.palette.warning.main` and use it for the directive `Typography` when `resourcesExhausted` is true. This removes raw `warning.main` from the component while staying on-surface (`header`).

**If** this feels like scope creep for “consolidation only,” leave `warning.main` local and note as follow-up — the plan treats it as **optional**.

---

## Intentionally left local (this pass)

- **AppBadge** — all badge tone, labels, and variants in `TurnOrderList` and elsewhere (see Goals).
- **CombatTargetSelectModal** — selection affordance, not active-turn chrome.
- **Setup/footer** — generic `divider` borders, no encounter state mapping.
- **CombatantPreviewCard** + **EntitySummaryCard** “current turn” — lives under `features/combat`; avoid new cross-feature dependency until you define a shared boundary (or accept `combat` → `encounter` for preview cards only).
- **CombatActionPreviewCard** `alpha(primary)` — action preview emphasis in combat package; not encounter chrome.
- **Combat grid** (`[CombatGrid.tsx](src/features/combat/components/grid/CombatGrid.tsx)`, `[cellVisualStyles.ts](src/features/combat/components/grid/cellVisualStyles.ts)`) — tactical visualization; different product surface than header/sidebar list rows.

---

## Follow-up (later passes)

- **Dedupe** `getTurnOrderRowOpacity` (mechanics) vs `getEncounterTurnOrderRowOpacity` (encounter) — e.g. shared `packages/mechanics` or `shared/` constants + one function.
- Decide whether **CombatantPreviewCard** / initiative sidebar cards should consume the same `turnOrderRow` / participation tokens (requires dependency or shared module).
- Revisit **visual alignment**: header `activeTurn` border uses **alpha(primary)** while list/cards use **solid `primary.main`** — intentional hierarchy vs drift; only change if design wants unification.
- **CombatGrid** `activeTurnPulse` — secondary glow system; separate surface if ever unified.

---

## Files likely to change

- `[src/features/encounter/ui/theme/encounterUiStateTheme.ts](src/features/encounter/ui/theme/encounterUiStateTheme.ts)` — absorb **full** former `encounterActiveBarLayout.ts`; extend `EncounterUiStateTheme` + resolver for `turnOrderRow` borders, `participation` opacity factors, `getEncounterTurnOrderRowOpacity` (+ optional directive token).
- `[src/features/encounter/components/active/modals/TurnOrderList.tsx](src/features/encounter/components/active/modals/TurnOrderList.tsx)` — theme for Paper border + opacity helper; **no** AppBadge edits.
- Possibly `[packages/mechanics/.../presentation-participation.ts](packages/mechanics/src/combat/presentation/participation/presentation-participation.ts)` — only if deduping `getTurnOrderRowOpacity` in the same pass (optional; can defer).
- `[src/features/encounter/components/active/layout/EncounterActiveHeader.tsx](src/features/encounter/components/active/layout/EncounterActiveHeader.tsx)` — import from encounter theme module; optional directive color token.
- `[src/features/encounter/components/active/grid/EncounterActiveSidebar.tsx](src/features/encounter/components/active/grid/EncounterActiveSidebar.tsx)` — import layout constants from encounter theme module.
- `[src/features/combat/components/CombatPlayView.tsx](src/features/combat/components/CombatPlayView.tsx)` — import layout constants from encounter theme module.
- `[src/ui/primitives/index.ts](src/ui/primitives/index.ts)` — remove encounter layout exports.
- **Delete** `[src/ui/primitives/encounterActiveBarLayout.ts](src/ui/primitives/encounterActiveBarLayout.ts)`.
- `[docs/reference/combat/client/encounter-ui-theme.md](docs/reference/combat/client/encounter-ui-theme.md)` — document layout exports location + `turnOrderRow`.

No new modules/files required unless `encounterUiStateTheme.ts` grows unwieldy (optional split later).