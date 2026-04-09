/**
 * Re-exports raster URL helpers. Actual URL registration:
 * - Browser: {@link ./locationPlacedObjectRasterAssets.vite} (imported from `main.tsx`)
 * - Node: {@link ./locationPlacedObjectRasterAssets.node} (imported from `server/index.ts`)
 */
export {
  getPlacedObjectMapImageUrlForAssetId,
  getPlacedObjectPreviewUrlForAssetId,
  PLACEHOLDER_NO_ART_ASSET_ID,
  registerPlacedObjectRasterSourceFileToUrl,
} from './locationPlacedObjectRasterAssets.core';
