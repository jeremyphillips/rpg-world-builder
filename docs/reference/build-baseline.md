# Frontend bundle baseline

Evidence for [entry chunk reduction](../../.cursor/plans/entry_chunk_reduction_f3a82b91.plan.md). Regenerate after each phase.

## Commands

```bash
npm run build:analyze    # vite build + dist/stats.html + dist/stats-data.json
npm run bundle:baseline  # print entry chunk sizes + top modules (requires analyze output)
```

Open `dist/stats.html` in a browser for the interactive treemap.

## Historical (pre–Phase 1 async catalog)

After route splitting + vendor `manualChunks`, before deferring `systemCatalog`:

| Chunk | Raw | Gzip |
|-------|-----|------|
| `index-*.js` (entry) | ~1,206 KB | ~279 KB |
| `vendor-mui-*.js` | ~535 KB | ~156 KB |
| `vendor-mui-x-data-grid-*.js` | ~424 KB | ~126 KB |
| `vendor-react-*.js` | ~396 KB | ~119 KB |

SRD data (spells/monsters) lived inside the entry graph via static `systemCatalog` import.

## Baseline — 2026-05-20 (Phase 0 capture, after Phase 1 catalog split)

| Chunk | Raw | Gzip | Notes |
|-------|-----|------|--------|
| **`index-vBT-joNl.js`** (entry) | **517.4 KB** | **125.7 KB** | App shell, router, providers, character builder, auth layout |
| `system-catalog-*.js` | 662.1 KB | 146.3 KB | Deferred SRD; `loadSystemCatalog()` |
| `vendor-mui-*.js` | 522.8 KB | 152.1 KB | Cacheable |
| `vendor-mui-x-data-grid-*.js` | 414.4 KB | 123.2 KB | Cacheable |
| `vendor-react-*.js` | 386.3 KB | 115.9 KB | Cacheable |
| `vendor-mui-x-date-pickers-*.js` | 208.2 KB | 58.4 KB | Cacheable |
| `vendor-mui-icons-*.js` | 14.6 KB | 5.7 KB | Cacheable |

**Entry gzip change vs pre–Phase 1:** ~279 KB → ~126 KB (~55% reduction).

### Top 15 modules in entry chunk (gzip)

| # | Gzip | Module |
|---|------|--------|
| 1 | 45.8 KB | `react-router` (dev chunk in analyze build) |
| 2 | 20.8 KB | `react-hook-form` |
| 3 | 5.6 KB | `socket.io-client` |
| 4 | 5.5 KB | `engine.io-client` |
| 5 | 4.5 KB | `CharacterBuilderProvider.tsx` |
| 6 | 4.1 KB | `MagicItemsStep.tsx` |
| 7 | 3.8 KB | `ClassStep.tsx` |
| 8 | 3.3 KB | `router.tsx` |
| 9 | 3.2 KB | `ConfirmationStep.tsx` |
| 10 | 3.1 KB | `ChatContainer.tsx` |
| 11 | 3.1 KB | `DriverField.tsx` |
| 12 | 3.0 KB | `AuthLayout.tsx` |
| 13 | 2.9 KB | `RepeatableGroupField.tsx` |
| 14 | 2.8 KB | `socket.io-parser` |
| 15 | 2.8 KB | `AppModal.tsx` |

### Phase 2+ targets (from treemap)

- Route-scope **`CharacterBuilderProvider`**, **`MessagingProvider`**, **`SocketConnectionProvider`**
- Lazy **home** builder (`HomeRoute` → `ChatContainer` / wizard)
- Shared **form/patterns** imports still in entry (`DriverField`, `RepeatableGroupField`, `AppModal`)

### Success target (program)

- Entry **`index-*.js` gzip** &lt; **200 KB** excluding vendors (stretch; re-measure after Phase 2–3)
- Initial load should not require **`system-catalog`** chunk until campaign/catalog is needed (achieved for entry parse; chunk prefetched on provider mount)
