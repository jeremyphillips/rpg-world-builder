import { describe, expect, it } from 'vitest';
import { createPatchDriver } from './patchDriver';

describe('createPatchDriver', () => {
  it('replaces spell components wholesale so toggling flags off can remove base keys', () => {
    const base = {
      components: { verbal: true, somatic: true },
    } as Record<string, unknown>;
    const driver = createPatchDriver({
      base,
      initialPatch: {},
    });
    driver.setValue('components', { somatic: true });
    expect(driver.getResolved().components).toEqual({ somatic: true });
  });

  it('preserves empty components in patch so all flags can be cleared vs base', () => {
    const base = {
      components: { verbal: true },
    } as Record<string, unknown>;
    const driver = createPatchDriver({
      base,
      initialPatch: {},
    });
    driver.setValue('components', {});
    expect(driver.getPatch().components).toEqual({});
    expect(driver.getResolved().components).toEqual({});
  });
});
