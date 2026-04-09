/**
 * Manifest + URL map for placed-object PNGs. Populated by {@link registerPlacedObjectRasterSourceFileToUrl}
 * from {@link ./locationPlacedObjectRasterAssets.vite} (Vite `import.meta.glob`) or
 * {@link ./locationPlacedObjectRasterAssets.node} (Node `file:` URLs). Safe to import from Node/tsx and the client.
 * @see assets/system/locations/objects/README.md
 */
import type { LocationObjectsManifestV1 } from '@/shared/domain/locations/map/locationObjectsAssetManifest.types';

import manifestJson from '../../../../../../../assets/system/locations/objects/location-objects.manifest.json';

const manifest = manifestJson as LocationObjectsManifestV1;

let sourceFileToUrl: Map<string, string> | undefined;

/** Called by Vite and Node side-effect modules so {@link getPlacedObjectPreviewUrlForAssetId} resolves URLs. */
export function registerPlacedObjectRasterSourceFileToUrl(map: Map<string, string>): void {
  sourceFileToUrl = map;
}

function getSourceFileToUrl(): Map<string, string> {
  return sourceFileToUrl ?? new Map();
}

export const PLACEHOLDER_NO_ART_ASSET_ID = 'placeholder_no_art' as const;

function pngUrlForSourceFile(sourceFile: string): string | undefined {
  return getSourceFileToUrl().get(sourceFile);
}

/** Preview / tray: always returns a URL (falls back to placeholder asset). */
export function getPlacedObjectPreviewUrlForAssetId(assetId: string): string {
  const entry = manifest.assets[assetId];
  const id = entry ? assetId : PLACEHOLDER_NO_ART_ASSET_ID;
  const resolved = manifest.assets[id];
  if (!resolved?.preview) {
    const ph = manifest.assets[PLACEHOLDER_NO_ART_ASSET_ID];
    return pngUrlForSourceFile(ph!.sourceFile) ?? '';
  }
  return pngUrlForSourceFile(resolved.sourceFile) ?? pngUrlForSourceFile(manifest.assets[PLACEHOLDER_NO_ART_ASSET_ID]!.sourceFile) ?? '';
}

/** In-map cell raster: null when manifest has no map slice (edge preview-only assets) or asset missing. */
export function getPlacedObjectMapImageUrlForAssetId(assetId: string): string | null {
  const entry = manifest.assets[assetId];
  if (!entry?.map) return null;
  return pngUrlForSourceFile(entry.sourceFile) ?? null;
}
