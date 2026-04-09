/**
 * Validates `location-objects.manifest.json` against `variantToAssetId.json`.
 * Fails the process on missing asset ids or invalid map/preview roles.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const OBJECTS_DIR = path.join(REPO_ROOT, 'assets/system/locations/objects');
const MANIFEST = path.join(OBJECTS_DIR, 'location-objects.manifest.json');
const VARIANT_MAP = path.join(OBJECTS_DIR, 'variantToAssetId.json');

type RasterSlice = {
  intrinsicSize: { width: number; height: number };
  trim: { x: number; y: number; width: number; height: number };
};

type ManifestAssetV1 = {
  sourceFile: string;
  contentSha256: string;
  map: RasterSlice | null;
  preview: RasterSlice | null;
};

type ManifestV1 = {
  schemaVersion: number;
  strategy: string;
  assets: Record<string, ManifestAssetV1>;
};

type VariantMap = {
  families: Record<string, Record<string, string | null>>;
  unregisteredAssetIds?: string[];
};

function assertEdgeAssetRoles(assetId: string, asset: ManifestAssetV1): string[] {
  const errs: string[] = [];
  if (asset.map !== null) {
    errs.push(`${assetId}: edge (door/window) assets must have map: null`);
  }
  if (asset.preview === null) {
    errs.push(`${assetId}: preview slice is required`);
  }
  return errs;
}

function assertCellAssetRoles(assetId: string, asset: ManifestAssetV1): string[] {
  const errs: string[] = [];
  if (asset.map === null) {
    errs.push(`${assetId}: cell assets must have map slice`);
  }
  if (asset.preview === null) {
    errs.push(`${assetId}: cell assets must have preview slice`);
  }
  return errs;
}

async function main(): Promise<void> {
  const rawManifest = await fs.readFile(MANIFEST, 'utf8');
  const rawMap = await fs.readFile(VARIANT_MAP, 'utf8');
  const manifest = JSON.parse(rawManifest) as ManifestV1;
  const variantMap = JSON.parse(rawMap) as VariantMap;

  if (manifest.schemaVersion !== 1) {
    throw new Error(`Unsupported manifest schemaVersion: ${manifest.schemaVersion}`);
  }
  if (manifest.strategy !== 'single-manifest-option-a') {
    throw new Error(`Unexpected manifest strategy: ${manifest.strategy}`);
  }

  const errors: string[] = [];

  for (const [familyId, variants] of Object.entries(variantMap.families)) {
    for (const [variantId, assetId] of Object.entries(variants)) {
      if (assetId === null) continue;
      const asset = manifest.assets[assetId];
      if (!asset) {
        errors.push(`Missing manifest asset for ${familyId}.${variantId} → "${assetId}"`);
        continue;
      }
      const isEdge = familyId === 'door' || familyId === 'window';
      if (isEdge) {
        errors.push(...assertEdgeAssetRoles(assetId, asset));
      } else {
        errors.push(...assertCellAssetRoles(assetId, asset));
      }
    }
  }

  for (const id of variantMap.unregisteredAssetIds ?? []) {
    if (!manifest.assets[id]) {
      errors.push(`unregisteredAssetIds lists "${id}" but it is missing from manifest.assets`);
    }
  }

  if (errors.length > 0) {
    console.error('location-objects manifest validation failed:\n');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(
    `OK: manifest + variant map (${Object.keys(manifest.assets).length} assets, ${Object.keys(variantMap.families).length} families).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
