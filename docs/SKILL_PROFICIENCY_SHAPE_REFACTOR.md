# Phased Plan: Skill Proficiency Shape Refactor

This document outlines the migration from `proficiencies.skills` as `string[]` to a `Record<string, ProficiencyAdjustment>` shape. Legacy `skills?: string[]` support will be removed entirely. Data migration uses a one-time DB script.

---

## Target Shape

```ts
type ProficiencyAdjustment = {
  proficiencyLevel?: 0 | 1 | 2;
  bonus?: number;
  fixedBonus?: number;
  advantage?: boolean;
  disadvantage?: boolean;
};

// proficiencies.skills becomes:
proficiencies: {
  skills: {
    [skillId: string]: ProficiencyAdjustment;
    // e.g. perception: { proficiencyLevel: 1 }
  }
}
```

- `proficiencyLevel: 1` = default when proficiency is added
- `bonus`, `fixedBonus`, `advantage`, `disadvantage` reserved for future use (not integrated yet)

---

## Phase 1: Define Types & Helpers

**Goal:** Introduce new types and helpers. No legacy support yet; code still uses array shape.

### 1.1 Add ProficiencyAdjustment and update CharacterProficiencies

**File:** `src/features/character/domain/types/character.types.ts`

- Add `ProficiencyAdjustment` type
- Change `CharacterProficiencies.skills` from `string[]` to `Record<string, ProficiencyAdjustment>`

### 1.2 Create migration helpers

**New file:** `src/features/character/domain/utils/character-proficiency.utils.ts` (or similar)

- `getSkillIds(proficiencies: CharacterProficiencies | undefined): string[]` — extract skill IDs from the new shape (used during transition and after)
- `toSkillProficienciesRecord(ids: string[]): Record<string, ProficiencyAdjustment>` — convert array to record with `proficiencyLevel: 1` per entry

---

## Phase 2: Write Path (ProficiencyStep & Save Flow)

**Goal:** All writes produce the new shape.

### 2.1 ProficiencyStep.tsx

- Derive `selectedSkills` via `getSkillIds(proficiencies)` (or equivalent)
- `toggleSkill` writes new shape:
  - Add: `{ ...skills, [skillId]: { proficiencyLevel: 1 } }`
  - Remove: delete key from record
- `lockedSelections['skills']` remains `string[]` (IDs only)

### 2.2 CharacterBuilderProvider.tsx

- `existingSkills` from `getSkillIds(character.proficiencies)` when loading for edit
- Initial empty state: `{ skills: {} }`

### 2.3 characterBuilder.constants.ts

- Proficiencies step selector: `getSkillIds(state.proficiencies).length > 0`

### 2.4 ConfirmationStep.tsx

- Use `getSkillIds(state.proficiencies)` instead of `state.proficiencies?.skills ?? []`

### 2.5 NewCharacterRoute.tsx

- No change if it passes through `builderState.proficiencies` (builder already writes new shape)

---

## Phase 3: Read Path (Mappers & UI)

**Goal:** Read new shape and produce same DTO/UI output.

### 3.1 character-read.mappers.ts

- `toCharacterDetailDto`: derive `skillIds` via `getSkillIds(char.proficiencies)`; keep rest of mapping (resolve to `{ id, name }[]`)
- `toCharacterForEngine`: build new shape from DTO:
  ```ts
  proficiencies: {
    skills: Object.fromEntries(
      dto.proficiencies.map((p) => [p.id, { proficiencyLevel: 1 }])
    )
  }
  ```

### 3.2 character-read.types.ts

- `CharacterReadSource.proficiencies` and `CharacterDocForDetail.proficiencies`: use `{ skills?: Record<string, ProficiencyAdjustment> }` only (no `string[]`)

### 3.3 ProficienciesCard.tsx

- Accept resolved `ProficiencyItem[]` from parent (no change if CharacterView passes DTO shape)
- If card ever receives raw proficiencies, support `{ skills: Record<string, ProficiencyAdjustment> }` and resolve IDs to names via context/props

### 3.4 CharacterView.tsx

- `getProficiencySlotSummary`: pass `character.proficiencies` (already `CharacterProficiencies`); ensure `proficiencySlots.ts` uses `getSkillIds` internally

---

## Phase 4: Supporting Consumers

**Goal:** Update all consumers to use new shape.

### 4.1 proficiencySlots.ts

- `filled = getSkillIds(proficiencies).length`

### 4.2 validateSkillProficiencyChange.ts

- Matcher: `skillProficiencyId in (c.proficiencies?.skills ?? {})`

### 4.3 useViewerProficiencies.ts

- `getSkillIds(d.character.proficiencies)` instead of `d.character.proficiencies?.skills ?? []`

### 4.4 ChatContainer.tsx

- `mergeCharacterData`: `getSkillIds(builderState?.proficiencies)` for builder skills
- Ensure merged `proficiencies` uses new shape when builder state present

---

## Phase 5: One-Time DB Migration Script

**Goal:** Migrate all existing character documents from `skills: string[]` to `skills: Record<string, ProficiencyAdjustment>`.

### 5.1 Script location and approach

- **Location:** `scripts/migrateSkillProficiencies.ts` (follows `scripts/migrateCampaignStructure.ts` pattern)
- **Approach:** Connect to MongoDB via mongoose, find characters with `proficiencies.skills` as array, convert to record shape, update in place
- **Conversion:** For each `id` in `skills` array → `{ [id]: { proficiencyLevel: 1 } }`

### 5.2 Script requirements

- Idempotent: safe to run multiple times (skip docs where `proficiencies.skills` is already an object)
- Dry-run mode: `DRY_RUN=1` env var to log changes without writing
- Use `MONGO_URI` and `DB_NAME` from env (dotenv), same as `migrateCampaignStructure.ts`
- Run **before** deploying code that removes legacy support

### 5.3 Detection logic

- Legacy: `Array.isArray(doc.proficiencies?.skills)`
- New shape: `doc.proficiencies?.skills && typeof doc.proficiencies.skills === 'object' && !Array.isArray(doc.proficiencies.skills)`

### 5.4 Execution order

1. Run migration script with `DRY_RUN=1`
2. Verify sample of migrated documents
3. Run migration script without dry-run
4. Deploy code changes (Phases 1–4)
5. Phase 6: remove legacy support

---

## Phase 6: Remove Legacy Support

**Goal:** Remove all support for `skills?: string[]`.

- Remove any dual-shape handling in mappers, utils, or UI
- Ensure `CharacterProficiencies.skills` is typed strictly as `Record<string, ProficiencyAdjustment>` (no union with `string[]`)
- Delete migration helpers that converted array → record (keep only `getSkillIds` if still needed for consumers)

---

## File Checklist

| File | Phases | Change |
|------|--------|--------|
| `character.types.ts` | 1 | Add `ProficiencyAdjustment`, change `CharacterProficiencies.skills` |
| `character-proficiency.utils.ts` (new) | 1 | `getSkillIds`, `toSkillProficienciesRecord` |
| `character-read.types.ts` | 3 | `CharacterReadSource` / doc types use new shape only |
| `character-read.mappers.ts` | 3 | Use helpers, update `toCharacterDetailDto`, `toCharacterForEngine` |
| `ProficiencyStep.tsx` | 2 | Write new shape, use `getSkillIds` |
| `CharacterBuilderProvider.tsx` | 2 | `existingSkills` via `getSkillIds`, empty `{ skills: {} }` |
| `characterBuilder.constants.ts` | 2 | Proficiencies step selector |
| `ConfirmationStep.tsx` | 2 | Use `getSkillIds` |
| `ProficienciesCard.tsx` | 3 | Support new shape if needed |
| `CharacterView.tsx` | 3 | Use `getSkillIds` for slot summary |
| `proficiencySlots.ts` | 4 | `filled` via `getSkillIds` |
| `validateSkillProficiencyChange.ts` | 4 | Matcher for record shape |
| `useViewerProficiencies.ts` | 4 | Use `getSkillIds` |
| `ChatContainer.tsx` | 4 | Use `getSkillIds` in merge |
| `scripts/migrate-skill-proficiencies.ts` (new) | 5 | One-time DB migration |

---

## Concerns & Ambiguities

### proficiencyLevel semantics

- `0` = none, `1` = proficient, `2` = expertise (or equivalent). Document for future mechanics.

### Skill ID format

- System skills use kebab-case (`perception`, `sleight-of-hand`). Campaign-specific skills may differ. Ensure consistent ID handling.

### Monsters / NPCs

- `monsters.ts` uses `proficiencies: { skills: ["stealth"], ... }`. `npcs.lankhmar.ts` uses `proficiencies: []`. Decide whether monsters/NPCs migrate to new shape or remain on array format. If they stay, shared helpers must handle both or live in separate code paths.

### Mechanics / engine

- Search for `character.proficiencies` or `proficiencies.skills` in mechanics/engine and update to new shape or `getSkillIds`.

### Empty state

- Empty: `{ skills: {} }`. `getSkillIds` returns `[]` for `undefined` or empty record.
