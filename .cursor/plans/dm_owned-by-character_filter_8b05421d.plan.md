---
name: DM owned-by-character filter
overview: "Mandatory prerequisite cleanup (extended useViewerCharacterQuery, dmViewerOnly visibility, shared owned-ids-by-content-key helper, role-aware toolbar layouts) plus DM-only Owned by character filter for six campaign content lists. Cleanup is in scope, not optional follow-up."
todos:
  - id: phase-a-hook
    content: "Phase A.1: Extend useViewerCharacterQuery (eligiblePartyCharacterIds + fetchIds)"
    status: completed
  - id: phase-a-visibility
    content: "Phase A.2: dmViewerOnly + visibility resolver + tests"
    status: completed
  - id: phase-a-owned-ids
    content: "Phase A.3: Shared getOwnedIdsForCampaignContentListKey helper"
    status: completed
  - id: phase-a-toolbar
    content: "Phase A.4: Role-aware campaign toolbar layout helper"
    status: completed
  - id: phase-b-filter
    content: "Phase B: DM filter factory, makePostFilters, six layouts + routes, hook"
    status: completed
isProject: false
---

# DM-only “Owned by character” — refined scope

## Mandatory prerequisite cleanup (Phase A)

Included **in feature scope**, not optional:

1. **Extend `useViewerCharacterQuery`** — `eligiblePartyCharacterIds` + single-character fetch for DM-selected party PC; preserve merged/single viewer behavior for PCs.
2. **`dmViewerOnly`** — AppDataGrid visibility type, `isAppDataGridVisibleToViewer`, tests.
3. **One shared helper** — `CharacterQueryContext` → owned ids for campaign content list key (spells, skillProficiencies, weapons, armor, gear, magicItems).
4. **Role-aware toolbar layout helper** — strip `owned` vs `dmOwnedByCharacter` by `canManage` so layout ids match post-visibility filters (no dev warnings).

## Phase B — Feature

5. DM-only filter id `dmOwnedByCharacter`, secondary row, badge `Owned: {character name}`, wire six routes via shared hook/composition.

## Design confirmations (implementation)

- **Hook API:** `UseViewerCharacterQueryOptions` adds optional `eligiblePartyCharacterIds?: readonly string[] | null`. Fetch union semantics: single fetch when `characterId` is in `(viewerCharacterIds ∪ eligiblePartyCharacterIds)`; merged fetch all **viewer** ids when no `characterId` and viewer ids exist; no bulk party fetch when viewer list empty.
- **DM visibility:** [`appDataGridVisibility.types.ts`](src/ui/patterns/AppDataGrid/types/appDataGridVisibility.types.ts) + [`visibilityForViewer.ts`](src/ui/patterns/AppDataGrid/viewer/visibilityForViewer.ts).
- **Owned ids helper:** [`src/features/character/domain/query/ownedIdsForCampaignContentList.ts`](src/features/character/domain/query/ownedIdsForCampaignContentList.ts) (re-export from query barrel if present).
- **Toolbar helper:** [`src/features/content/shared/toolbar/campaignContentListToolbarLayoutForRole.ts`](src/features/content/shared/toolbar/campaignContentListToolbarLayoutForRole.ts) (or adjacent to [`campaignContentListToolbarLayouts.ts`](src/features/content/shared/toolbar/campaignContentListToolbarLayouts.ts)).
- **Party hooks:** Leave `useCampaignPartyCharacterNameMap` as-is; DM filter uses `approvedCharacters` from `useCampaignMembers` (no consolidation in this change).

## Implementation order

Phase A → Phase B as specified in user request.
