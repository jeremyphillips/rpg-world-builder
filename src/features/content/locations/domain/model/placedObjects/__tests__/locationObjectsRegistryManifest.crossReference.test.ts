// @vitest-environment node
/**
 * Phases 4–6 — registry `assetId`s that reference real art must exist in `location-objects.manifest.json`
 * with the correct map/preview roles for cell vs edge placement.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { AUTHORED_PLACED_OBJECT_DEFINITIONS } from '../locationPlacedObject.registry';
import { PLACEHOLDER_NO_ART_ASSET_ID } from '../locationPlacedObjectRasterAssets.core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..', '..', '..', '..');
const MANIFEST_PATH = path.join(REPO_ROOT, 'assets/system/locations/objects/location-objects.manifest.json');

type ManifestAsset = {
  map: unknown;
  preview: unknown;
};

type ManifestV1 = {
  schemaVersion: number;
  assets: Record<string, ManifestAsset>;
};

describe('placed-object registry ↔ location-objects.manifest.json', () => {
  const manifest: ManifestV1 = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

  it('every non-placeholder variant assetId exists with correct map/preview roles', () => {
    for (const [familyId, family] of Object.entries(AUTHORED_PLACED_OBJECT_DEFINITIONS)) {
      for (const [variantId, v] of Object.entries(family.variants)) {
        if (v.assetId === PLACEHOLDER_NO_ART_ASSET_ID) continue;
        const asset = manifest.assets[v.assetId];
        expect(asset, `${familyId}.${variantId}: missing manifest asset "${v.assetId}"`).toBeDefined();
        const isEdge = family.placementMode === 'edge';
        if (isEdge) {
          expect(asset!.map, `${familyId}.${variantId}: edge assets must have map: null`).toBeNull();
          expect(asset!.preview, `${familyId}.${variantId}: preview slice required`).toBeTruthy();
        } else {
          expect(asset!.map, `${familyId}.${variantId}: cell assets must have map slice`).toBeTruthy();
          expect(asset!.preview, `${familyId}.${variantId}: preview slice required`).toBeTruthy();
        }
      }
    }
  });
});
