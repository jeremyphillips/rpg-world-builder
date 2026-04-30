/**
 * Patch-driver smoke test for the monster traits structured group.
 *
 * Verifies that {@link createNamedDescriptionGroup}'s `patchBinding` round-trips
 * the loaded base array through `parse` (tag with stable ids), then `serialize`
 * (merge form rows back into source rows preserving extras and re-attach ids
 * for the next render's parse cycle). The patch state retains `__rowId`s so
 * successive edits keep finding the same source rows; the persist boundary
 * (`useSystemPatchActions`) strips them via `stripRowIdsDeep`.
 */
import { describe, expect, it } from 'vitest';

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { getSystemMonster } from '@/features/mechanics/domain/rulesets/system/monsters';
import { createPatchDriver } from '@/features/content/shared/editor/patchDriver';
import { stripRowIdsDeep } from '@/features/content/shared/forms/assembly/mergePreserveExtras';
import type { MonsterTrait } from '@/features/content/monsters/domain/types/monster-traits.types';

import { tagMonsterForEditing } from './monsterForm.mappers';
import { monsterTraitsGroup } from '../registry/monsterForm.registry';

function getAbolethBase(): Record<string, unknown> {
  const aboleth = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'aboleth');
  if (!aboleth) throw new Error('aboleth fixture missing');
  return tagMonsterForEditing(aboleth) as unknown as Record<string, unknown>;
}

describe('monster traits patch driver — preserve extras + minimal delta', () => {
  it('round-trips an unedited form back to data-equivalent base traits (after stripping ids)', () => {
    const base = getAbolethBase();
    const driver = createPatchDriver({ base, initialPatch: {} });

    const domainVal = driver.getValue(monsterTraitsGroup.patchBinding!.domainPath);
    const formRows = monsterTraitsGroup.patchBinding!.parse(domainVal);
    expect(Array.isArray(formRows)).toBe(true);

    const serialized = monsterTraitsGroup.patchBinding!.serialize(formRows, domainVal);
    const baseTraits = (base.mechanics as { traits: Array<MonsterTrait & { __rowId?: string }> })
      .traits;
    const baseTraitsWithoutIds = stripRowIdsDeep(baseTraits);
    const serializedWithoutIds = stripRowIdsDeep(serialized);
    expect(serializedWithoutIds).toEqual(baseTraitsWithoutIds);
  });

  it('editing one trait\'s description preserves every other row\'s extras byte-for-byte', () => {
    const base = getAbolethBase();
    const driver = createPatchDriver({ base, initialPatch: {} });

    const domainVal = driver.getValue(monsterTraitsGroup.patchBinding!.domainPath);
    const formRows = monsterTraitsGroup.patchBinding!.parse(domainVal) as Array<{
      __rowId: string;
      name: string;
      description: string;
    }>;

    const mucusIndex = formRows.findIndex((r) => r.name === 'Mucus Cloud');
    expect(mucusIndex).toBeGreaterThanOrEqual(0);
    const editedFormRows = formRows.map((r, i) =>
      i === mucusIndex ? { ...r, description: 'EDITED via patch' } : r,
    );

    const serialized = monsterTraitsGroup.patchBinding!.serialize(
      editedFormRows,
      domainVal,
    ) as MonsterTrait[];

    const baseTraits = (base.mechanics as { traits: Array<MonsterTrait & { __rowId?: string }> })
      .traits;
    expect(serialized).toHaveLength(baseTraits.length);

    /**
     * The patch state intentionally retains `__rowId` to keep render-cycle
     * identity stable — strip it for the byte-for-byte comparison against the
     * (also tagged) base.
     */
    const serializedClean = stripRowIdsDeep(serialized) as MonsterTrait[];
    const baseClean = stripRowIdsDeep(baseTraits) as MonsterTrait[];
    for (let i = 0; i < baseClean.length; i++) {
      const src = baseClean[i];
      const out = serializedClean[i];
      if (i === mucusIndex) {
        expect(out.name).toBe(src.name);
        expect(out.description).toBe('EDITED via patch');
        expect(out.resolution).toEqual(src.resolution);
      } else {
        expect(out).toEqual(src);
      }
    }

    driver.setValue(monsterTraitsGroup.patchBinding!.domainPath, serialized);
    const persistedAfterStrip = stripRowIdsDeep(driver.getPatch()) as {
      mechanics?: { traits?: MonsterTrait[] };
    };
    expect(persistedAfterStrip.mechanics?.traits).toBeDefined();
    expect(persistedAfterStrip.mechanics?.traits).toHaveLength(baseTraits.length);
    expect(persistedAfterStrip.mechanics?.traits?.[mucusIndex].description).toBe(
      'EDITED via patch',
    );
    for (const row of persistedAfterStrip.mechanics?.traits ?? []) {
      expect(row).not.toHaveProperty('__rowId');
    }
  });

  it('survives a render-cycle round-trip (parse → serialize → setValue → parse) without losing extras', () => {
    const base = getAbolethBase();
    const driver = createPatchDriver({ base, initialPatch: {} });

    const initialDomainVal = driver.getValue(monsterTraitsGroup.patchBinding!.domainPath);
    const firstParse = monsterTraitsGroup.patchBinding!.parse(initialDomainVal) as Array<{
      __rowId: string;
      name: string;
      description: string;
    }>;
    const editedOnce = firstParse.map((r, i) =>
      i === 0 ? { ...r, description: 'first edit' } : r,
    );
    const firstSerialize = monsterTraitsGroup.patchBinding!.serialize(
      editedOnce,
      initialDomainVal,
    );
    driver.setValue(monsterTraitsGroup.patchBinding!.domainPath, firstSerialize);

    const secondDomainVal = driver.getValue(monsterTraitsGroup.patchBinding!.domainPath);
    const secondParse = monsterTraitsGroup.patchBinding!.parse(secondDomainVal) as Array<{
      __rowId: string;
      name: string;
      description: string;
    }>;
    const editedTwice = secondParse.map((r, i) =>
      i === 1 ? { ...r, description: 'second edit' } : r,
    );
    const secondSerialize = monsterTraitsGroup.patchBinding!.serialize(
      editedTwice,
      secondDomainVal,
    ) as MonsterTrait[];

    expect(secondSerialize[0].description).toBe('first edit');
    expect(secondSerialize[1].description).toBe('second edit');

    const baseTraits = (base.mechanics as { traits: Array<MonsterTrait & { __rowId?: string }> })
      .traits;
    expect(secondSerialize[0].name).toBe(baseTraits[0].name);
    expect(secondSerialize[1].name).toBe(baseTraits[1].name);
    expect(secondSerialize[1].resolution).toEqual(baseTraits[1].resolution);
  });
});
