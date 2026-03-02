/**
 * Provides sets of equipment IDs owned by the current viewer's characters
 * in the active campaign. Each set is keyed by equipment type so list
 * routes can pass the relevant set to makeOwnedColumn / makeOwnedFilter.
 *
 * Returns empty sets (not undefined) when the viewer has no characters or
 * equipment data hasn't loaded yet, so callers never need null-checks.
 */
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/app/api';
import { useCampaignMembers } from './useCampaignMembers';
import type { Equipment } from '@/shared/types/character.core';

type CharacterEquipmentResponse = {
  character: {
    _id: string;
    equipment?: Equipment;
  };
};

export type ViewerEquipmentSets = {
  weapons: ReadonlySet<string>;
  armor: ReadonlySet<string>;
  gear: ReadonlySet<string>;
  magicItems: ReadonlySet<string>;
  loading: boolean;
};

const EMPTY_SET: ReadonlySet<string> = new Set();

const EMPTY: ViewerEquipmentSets = {
  weapons: EMPTY_SET,
  armor: EMPTY_SET,
  gear: EMPTY_SET,
  magicItems: EMPTY_SET,
  loading: false,
};

export function useViewerEquipment(): ViewerEquipmentSets {
  const { viewerCharacterIds } = useCampaignMembers();

  const [equipMap, setEquipMap] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (viewerCharacterIds.length === 0) {
      setEquipMap([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(
      viewerCharacterIds.map(id =>
        apiFetch<CharacterEquipmentResponse>(`/api/characters/${id}`)
          .then(d => d.character.equipment ?? {})
          .catch(() => ({} as Equipment)),
      ),
    ).then(results => {
      if (!cancelled) setEquipMap(results);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [viewerCharacterIds]);

  return useMemo(() => {
    if (equipMap.length === 0 && !loading) return EMPTY;

    const weapons = new Set<string>();
    const armor = new Set<string>();
    const gear = new Set<string>();
    const magicItems = new Set<string>();

    for (const eq of equipMap) {
      for (const id of eq.weapons ?? []) weapons.add(id);
      for (const id of eq.armor ?? []) armor.add(id);
      for (const id of eq.gear ?? []) gear.add(id);
      for (const id of eq.magicItems ?? []) magicItems.add(id);
    }

    return { weapons, armor, gear, magicItems, loading };
  }, [equipMap, loading]);
}
