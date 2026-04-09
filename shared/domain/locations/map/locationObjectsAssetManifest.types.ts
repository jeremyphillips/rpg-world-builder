/**
 * Phase 1 generated manifest for system placed-object raster assets.
 * @see assets/system/locations/objects/README.md
 */
export type LocationObjectsTrimRectV1 = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LocationObjectsRasterSliceV1 = {
  intrinsicSize: { width: number; height: number };
  trim: LocationObjectsTrimRectV1;
};

export type LocationObjectsManifestAssetV1 = {
  sourceFile: string;
  contentSha256: string;
  /** Null for edge (door/window) assets: map uses vector geometry in Phase 2+. */
  map: LocationObjectsRasterSliceV1 | null;
  /** Toolbar preview; always set when the asset exists. */
  preview: LocationObjectsRasterSliceV1 | null;
};

export type LocationObjectsManifestV1 = {
  schemaVersion: 1;
  strategy: 'single-manifest-option-a';
  /** SHA-256 over sorted `filename:contentSha256` pairs for all inputs. */
  inputFingerprint: string;
  objectsDir: string;
  assets: Record<string, LocationObjectsManifestAssetV1>;
};

/** Author mapping: registry family → variant id → asset id or null (no art yet). */
export type VariantToAssetIdFileV1 = {
  families: Record<string, Record<string, string | null>>;
  /** Manifest ids present for future registry rows (e.g. extra table art). */
  unregisteredAssetIds?: string[];
};
