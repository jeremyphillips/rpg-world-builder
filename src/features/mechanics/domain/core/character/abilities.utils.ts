import { buildRegistry } from '@/features/utils'
import { ABILITIES } from './abilities'
import type { AbilityId, AbilityKey } from './abilities.types';

export const abilityRegistry = buildRegistry(ABILITIES);

export const abilityIdToKey = (id: AbilityId) =>
  abilityRegistry.byId[id].key;

export const abilityIdToName = (id: AbilityId) =>
  abilityRegistry.byId[id].name;

export const abilityKeyToId = (key: AbilityKey) =>
  abilityRegistry.byKey[key].id;