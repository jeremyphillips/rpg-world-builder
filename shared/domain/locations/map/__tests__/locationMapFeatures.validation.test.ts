// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  validateEdgeEntriesStructure,
  validatePathEntriesStructure,
} from '../locationMapFeatures.validation';

describe('validatePathEntriesStructure — hex geometry', () => {
  const width = 6;
  const height = 6;

  it('accepts hex-adjacent consecutive cells in cellIds', () => {
    const errors = validatePathEntriesStructure(
      [{ id: '1', kind: 'road', cellIds: ['0,0', '1,0'] }],
      width, height, 'hex',
    );
    const adjErrors = errors.filter((e) => e.code === 'INVALID');
    expect(adjErrors).toHaveLength(0);
  });

  it('accepts hex chain with south step', () => {
    const errors = validatePathEntriesStructure(
      [{ id: '1', kind: 'road', cellIds: ['0,0', '0,1'] }],
      width, height, 'hex',
    );
    expect(errors.filter((e) => e.code === 'INVALID')).toHaveLength(0);
  });

  it('rejects non-adjacent consecutive cells on hex', () => {
    const errors = validatePathEntriesStructure(
      [{ id: '1', kind: 'road', cellIds: ['0,0', '3,3'] }],
      width, height, 'hex',
    );
    expect(errors.some((e) => e.message.includes('adjacent'))).toBe(true);
  });

  it('square geometry still works via default', () => {
    const errors = validatePathEntriesStructure(
      [{ id: '1', kind: 'road', cellIds: ['0,0', '1,0'] }],
      width, height,
    );
    expect(errors.filter((e) => e.code === 'INVALID')).toHaveLength(0);
  });

  it('square geometry rejects diagonal in cellIds', () => {
    const errors = validatePathEntriesStructure(
      [{ id: '1', kind: 'road', cellIds: ['0,0', '1,1'] }],
      width, height, 'square',
    );
    expect(errors.some((e) => e.message.includes('adjacent'))).toBe(true);
  });
});

describe('validateEdgeEntriesStructure', () => {
  const w = 4;
  const h = 4;

  it('rejects duplicate edgeId', () => {
    const errors = validateEdgeEntriesStructure(
      [
        { edgeId: 'between:0,0|1,0', kind: 'wall' },
        { edgeId: 'between:0,0|1,0', kind: 'door' },
      ],
      w,
      h,
    );
    expect(errors.some((e) => e.code === 'DUPLICATE')).toBe(true);
  });

  it('accepts perimeter edge on outer boundary', () => {
    const errors = validateEdgeEntriesStructure(
      [{ edgeId: 'perimeter:0,0|N', kind: 'wall' }],
      w,
      h,
    );
    expect(errors).toHaveLength(0);
  });

  it('rejects perimeter edge on interior side (neighbor exists)', () => {
    const errors = validateEdgeEntriesStructure(
      [{ edgeId: 'perimeter:0,0|E', kind: 'wall' }],
      w,
      h,
    );
    expect(errors.some((e) => e.message.includes('outer map boundary'))).toBe(true);
  });
});
