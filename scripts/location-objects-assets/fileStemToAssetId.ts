/** `door-single-wood` → `door_single_wood` */
export function fileStemToAssetId(stem: string): string {
  return stem.replaceAll('-', '_');
}
