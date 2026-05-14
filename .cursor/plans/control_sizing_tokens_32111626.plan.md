---
name: Control sizing tokens
overview: Full support — CONTROL_SIZES split into box (outer sizing) vs content (typography), theme wiring for MuiButton + MuiOutlinedInput, MUI augmentation for size large, AppTextField + AppSelect, multiline preserved.
todos:
  - id: add-control-sizes
    content: Create controlSizes.ts — box (height, px) + content (fontSize, lineHeight) per tier; export ControlSize
    status: pending
  - id: refactor-mui-button
    content: Wire MuiButton sizes to CONTROL_SIZES.box + .content (minHeight, horizontal px, label typography)
    status: pending
  - id: refactor-outlined-input
    content: MuiOutlinedInput — box.height + content on input slot; multiline skip; no misuse of content for labels
    status: pending
  - id: mui-size-augmentation
    content: "Module augmentation: FormControl + TextField + Select (+ InputBase/OutlinedInput if TS requires) for size large"
    status: pending
  - id: primitives-app-text-app-select
    content: AppTextField + AppSelect — size union includes large; forward to MUI; no sx duplication for large
    status: pending
  - id: theme-exports-verify
    content: Re-export CONTROL_SIZES from theme index; run typecheck; manual verify large + multiline
    status: pending
isProject: false
---

# Control sizing token layer (full support)

## Token shape — `box` vs `content`

Split **`CONTROL_SIZES`** so intent is obvious at import sites and **content tokens are not mistaken** for **InputLabel**, **FormHelperText**, or other supporting typography.

| Namespace | Purpose |
|-----------|--------|
| **`box`** | Outer **control box** metrics: **`height`**, horizontal **`px`** (padding-inline for components where that applies, e.g. buttons). |
| **`content`** | Typography for **control content only**: **input value**, **placeholder**, **select display value**, **button label**. Not for floating labels, helper text, or captions. |

Implementation maps **`box`** to **`minHeight`** / horizontal padding where the component matches; maps **`content`** to **`fontSize`** / **`lineHeight`** on the **input slot** or **button root** as appropriate.

### Canonical example ([`controlSizes.ts`](src/app/theme/controlSizes.ts))

```ts
export const CONTROL_SIZES = {
  small: {
    box: {
      height: 32,
      px: 12,
    },
    content: {
      fontSize: '0.8125rem',
      lineHeight: 1.25,
    },
  },
  medium: {
    box: {
      height: 44,
      px: 16,
    },
    content: {
      fontSize: '0.875rem',
      lineHeight: 1.4,
    },
  },
  large: {
    box: {
      height: 52,
      px: 20,
    },
    content: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
  },
} as const;

export type ControlSize = keyof typeof CONTROL_SIZES;
```

**Outlined inputs:** Prefer **`box.height`** + **`content`** on the **`.MuiOutlinedInput-input`** (or equivalent slot). **`box.px`** is primarily for **button** horizontal padding; outlined fields use MUI’s own horizontal padding for the notch/border — do **not** force **`box.px`** onto inputs if it fights the outline; the important split is **box vs content semantics**, not identical padding everywhere.

---

## Full support — definition

**Full support** means every layer below is implemented and verified. Nothing in this list is optional for the core sizing + `large` story.

| Layer | Requirement |
|-------|----------------|
| **1. Tokens** | [`src/app/theme/controlSizes.ts`](src/app/theme/controlSizes.ts) — **`box`** (`height`, `px`) + **`content`** (`fontSize`, `lineHeight`) per tier; **`ControlSize`** type. Semantic split prevents reuse of **`content`** for labels/helpers. |
| **2. Theme — buttons** | [`src/app/theme/components.ts`](src/app/theme/components.ts) **`MuiButton`** — **`sizeSmall` / `sizeMedium` / `sizeLarge`** use **`CONTROL_SIZES[tier].box`** + **`CONTROL_SIZES[tier].content`** (no unrelated hardcoded sizing). |
| **3. Theme — outlined inputs** | Same file **`MuiOutlinedInput`** — **non-multiline**: **`box.height`** + **`content`** on input value/placeholder; **`small` / `medium` / `large`**. **Multiline** → no fixed **`box.height`**. Do **not** apply **`content`** to **`InputLabel`** / **`FormHelperText`**. |
| **4. TypeScript** | **Module augmentation** so `size="large"` is valid on **`FormControl`**, **`TextField`**, **`Select`** (and **`InputBase` / `OutlinedInput`** if required). No `as any` on `size`. |
| **5. Primitives** | [`AppTextField`](src/ui/primitives/forms/AppTextField.tsx), [`AppSelect`](src/ui/primitives/forms/AppSelect.tsx) — **`size?: 'small' \| 'medium' \| 'large'`** forwarded; no duplicated token **`sx`**. |
| **6. Barrel** | Re-export **`CONTROL_SIZES`** from [`src/app/theme/index.ts`](src/app/theme/index.ts). |

**Inheritance:** Native **`TextField`**, **`Select`**, **`Autocomplete`** (outlined), etc. inherit **(3)** + **(4)** once implemented.

**Out of scope:** IconButton/chip/toolbar rows; **explicit** label/helper typography (leave default unless it falls out naturally).

---

## Canonical control heights (locked)

| Tier | `box.height` (px) | `box.px` (px) |
|------|-------------------|---------------|
| small | **32** | **12** |
| medium | **44** | **16** |
| large | **52** | **20** |

**Density:** Replaces old ~56px medium outlined default with **44px** — intentional.

---

## Pre-build analysis (historical context)

### 1. Theme-level alignment

- **`MuiButton`** — **`box` + `content`** per size.
- **`MuiOutlinedInput`** — **`box.height`** + **`content`** on input slot; **Select** inherits.
- **`MuiTextField` defaultProps** — `outlined` + `medium`; **`large`** via augmentation.

### 2. Still later

- Toolbar mixes; label/helper styling as a separate concern from **`content`**.

### 3. Conflicts

- Remove legacy **56** / **small → {}** in favor of tokens.
- Reconcile **`box.height`** with button padding so labels do not clip.

### 4. Density

- **44px** medium vs old **56px** — visible shift.

---

## Why primitives alone are not enough

Theme **`MuiOutlinedInput`** for **`ownerState.size === 'large'`** must apply **`CONTROL_SIZES.large`** once. Primitives only forward **`size`**.

---

## Implementation plan

### A. [`controlSizes.ts`](src/app/theme/controlSizes.ts)

- Implement **`CONTROL_SIZES`** exactly in the **box / content** shape above (values as specified unless a tiny theme tweak is required for clipping).

### B. [`components.ts`](src/app/theme/components.ts)

- **`MuiButton`**: **`minHeight`/`padding`** from **`box`**; **`fontSize`/`lineHeight`** from **`content`**.
- **`MuiOutlinedInput`**: multiline → `{}`; else map **`size`** → **`box.height`** + **`content`** on input slot only.

### C. Multiline

- Never force **`box.height`** when **`ownerState.multiline`**.

### D. Module augmentation

- [`src/types/mui-size-large.d.ts`](src/types/mui-size-large.d.ts) (or equivalent): **FormControl**, **TextField**, **Select**; add **InputBase** / **OutlinedInput** if **`tsc`** requires.

### E. Primitives

- **`AppSelect`**, **`AppTextField`** — **`size`** includes **`large`**, forward to MUI.

### F. [`index.ts`](src/app/theme/index.ts)

- **`export { CONTROL_SIZES } from './controlSizes'`**.

---

## Verification (full support)

- **`tsc`**: no **`size`** errors.
- Visual row: **32 / 44 / 52** **box** heights; **content** typography on values/placeholders/buttons, **not** on helper text by design.
- **`size="large"`** → **~52px** min height (non-multiline).
- **Multiline** still grows.

---

## Deliverables summary

| Item | Outcome |
|------|--------|
| Tokens | [`controlSizes.ts`](src/app/theme/controlSizes.ts) — **`box` + `content`** |
| Theme | [`components.ts`](src/app/theme/components.ts) — `MuiButton`, `MuiOutlinedInput` |
| TS | Module augmentation |
| Primitives | [`AppTextField`](src/ui/primitives/forms/AppTextField.tsx), [`AppSelect`](src/ui/primitives/forms/AppSelect.tsx) |
| Barrel | [`index.ts`](src/app/theme/index.ts) re-exports **`CONTROL_SIZES`** |

---

## Refinement — outlined input sizing (post-`minHeight` learnings)

**Do not** use **`minHeight`** as the primary sizing lever for outlined inputs. It only sets a floor; MUI’s default **inner vertical padding** plus the line box still pushes the rendered height above **`CONTROL_SIZES.box.height`**.

**Preferred approach for single-line outlined controls:**

1. Use a **fixed `height`** on the **`OutlinedInput` root** (with **`box-sizing: border-box`**) matching **`box.height`**, so the outer control box matches the token scale (**32 / 44 / 52**).
2. **Fully control** vertical padding on **`.MuiOutlinedInput-input`** and **`.MuiSelect-select`** — override MUI defaults so padding + **`content`** line box + outline border reconcile to that height (derive vertical padding from **`box.height`**, border width, **`content.fontSize`**, and **`content.lineHeight`**; assume root **16px** for **`rem`** math unless the theme changes `html` font size).
3. **Exclude multiline** — when **`ownerState.multiline`** is true, **do not** apply fixed height or the single-line padding overrides; keep prior “no fixed trap” behavior.

Buttons may continue using **`minHeight` + `padding: 0 …`** as today; this refinement applies to **`MuiOutlinedInput`** (and **`Select`** via the same slots).
