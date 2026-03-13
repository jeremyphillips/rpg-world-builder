/**
 * Provides the set of spell IDs owned by the current viewer's characters
 * in the active campaign. Used by spell list routes for makeOwnedColumn /
 * makeOwnedFilter.
 *
 * Returns an empty set when the viewer has no characters or data hasn't
 * loaded yet, so callers never need null-checks.
 */
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/app/api';
import { useCampaignMembers } from './useCampaignMembers';
type CharacterSpellsResponse = {
  character: { spells?: string[] };
};

export function useViewerSpells(): ReadonlySet<string> {
  const { viewerCharacterIds } = useCampaignMembers();
  const [spellIds, setSpellIds] = useState<string[]>([]);

  useEffect(() => {
    if (viewerCharacterIds.length === 0) {
      setSpellIds([]);
      return;
    }

    let cancelled = false;

    Promise.all(
      viewerCharacterIds.map((id) =>
        apiFetch<CharacterSpellsResponse>(`/api/characters/${id}`)
          .then((d) => d.character?.spells ?? [])
          .catch(() => []),
      ),
    ).then((results) => {
      if (!cancelled) {
        const ids = new Set<string>();
        for (const arr of results) {
          for (const id of arr) ids.add(id);
        }
        setSpellIds([...ids]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [viewerCharacterIds]);

  return useMemo(() => new Set(spellIds), [spellIds]);
}
