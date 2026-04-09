/**
 * Phase 1: Generate `location-objects.manifest.json` (Option A) from PNGs in
 * assets/system/locations/objects. Run via `npm run build:location-objects-manifest`.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { trimTransparentRgba } from '../../shared/domain/locations/map/locationObjectsAssetManifest.trim.ts';
import { fileStemToAssetId } from './fileStemToAssetId.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const OBJECTS_DIR = path.join(REPO_ROOT, 'assets/system/locations/objects');
const OUT_FILE = path.join(OBJECTS_DIR, 'location-objects.manifest.json');

type RasterSlice = {
  intrinsicSize: { width: number; height: number };
  trim: { x: number; y: number; width: number; height: number };
};

type ManifestAssetV1 = {
  sourceFile: string;
  contentSha256: string;
  /** Same slice used for map + preview when both roles exist. */
  map: RasterSlice | null;
  preview: RasterSlice | null;
};

function isEdgeRasterAssetId(assetId: string): boolean {
  return assetId.startsWith('door_') || assetId.startsWith('window_');
}

function decodePngSync(buf: Buffer): PNG {
  return PNG.sync.read(buf);
}

function sliceFromPng(png: PNG): RasterSlice {
  const trim = trimTransparentRgba(png.data, png.width, png.height);
  return {
    intrinsicSize: { width: png.width, height: png.height },
    trim,
  };
}

async function main(): Promise<void> {
  const entries = await fs.readdir(OBJECTS_DIR, { withFileTypes: true });
  const pngFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith('.png'))
    .map((e) => e.name)
    .sort();

  const assets: Record<string, ManifestAssetV1> = {};

  for (const name of pngFiles) {
    const stem = path.basename(name, '.png');
    const assetId = fileStemToAssetId(stem);
    const fullPath = path.join(OBJECTS_DIR, name);
    const raw = await fs.readFile(fullPath);
    const sha256 = createHash('sha256').update(raw).digest('hex');
    const png = decodePngSync(raw);
    const slice = sliceFromPng(png);

    const edge = isEdgeRasterAssetId(assetId);
    const entry: ManifestAssetV1 = {
      sourceFile: name,
      contentSha256: sha256,
      map: edge ? null : { ...slice },
      preview: { ...slice },
    };
    assets[assetId] = entry;
  }

  const inputFingerprint = createHash('sha256')
    .update(
      pngFiles
        .map((name) => {
          const assetId = fileStemToAssetId(path.basename(name, '.png'));
          return `${name}:${assets[assetId]!.contentSha256}`;
        })
        .sort()
        .join('|'),
    )
    .digest('hex');

  const manifest = {
    schemaVersion: 1 as const,
    strategy: 'single-manifest-option-a' as const,
    /** Deterministic fingerprint of all input PNG bytes (stable across machines until art changes). */
    inputFingerprint,
    objectsDir: 'assets/system/locations/objects',
    assets,
  };

  await fs.writeFile(OUT_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${OUT_FILE} (${Object.keys(assets).length} assets).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
