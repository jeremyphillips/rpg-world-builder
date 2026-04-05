/**
 * System location catalog — code-defined defaults per ruleset (may be empty).
 * Campaign-owned locations are merged at runtime by locationRepo.
 */
import type { Location, LocationBaseFields } from '@/features/content/locations/domain/model/location';
import type { SystemRulesetId } from '../../../types/ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from '../../../ids/systemIds';

function toSystemLocation(systemId: SystemRulesetId, raw: LocationBaseFields): Location {
  return {
    ...raw,
    source: 'system',
    systemId,
    imageKey: raw.imageKey ?? null,
    patched: false,
  };
}

const LOCATIONS_RAW: readonly LocationBaseFields[] = [];

const SYSTEM_LOCATIONS_SRD: readonly Location[] = LOCATIONS_RAW.map((raw) =>
  toSystemLocation(DEFAULT_SYSTEM_RULESET_ID, raw),
);

export const SYSTEM_LOCATIONS_BY_SYSTEM_ID: Record<SystemRulesetId, readonly Location[]> = {
  [DEFAULT_SYSTEM_RULESET_ID]: SYSTEM_LOCATIONS_SRD,
};

export function getSystemLocations(systemId: SystemRulesetId): readonly Location[] {
  return SYSTEM_LOCATIONS_BY_SYSTEM_ID[systemId] ?? [];
}

export function getSystemLocation(systemId: SystemRulesetId, locationId: string): Location | undefined {
  return getSystemLocations(systemId).find((entry) => entry.id === locationId);
}

export const locationIdToName = (systemId: SystemRulesetId, id: string): string =>
  getSystemLocation(systemId, id)?.name ?? id;
