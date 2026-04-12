import { buildRegistry } from '@/features/utils'
import { ABILITIES } from './abilities'
import type { AbilityId, AbilityKey, AbilityRef } from './abilities.types';

export const abilityRegistry = buildRegistry(ABILITIES);

export const abilityIdToKey = (id: AbilityRef): AbilityKey =>
  (id in abilityRegistry.byId ? abilityRegistry.byId[id as AbilityId].key : id) as AbilityKey;

export const abilityIdToName = (id: AbilityRef) =>
  id in abilityRegistry.byId
    ? abilityRegistry.byId[id as AbilityId].name
    : abilityRegistry.byKey[id as AbilityKey].name;

/** Returns uppercase abbreviation (e.g. STR, DEX) for list/compact displays. */
export const abilityIdToAbbrev = (id: AbilityRef): string => {
  const abilityId =
    id in abilityRegistry.byId
      ? abilityRegistry.byId[id as AbilityId].id
      : abilityRegistry.byKey[id as AbilityKey].id;
  return abilityId.toUpperCase();
};

export const abilityKeyToId = (key: AbilityKey) =>
  abilityRegistry.byKey[key].id;
