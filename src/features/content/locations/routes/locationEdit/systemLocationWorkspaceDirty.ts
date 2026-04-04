/**
 * Combined dirty flag for **system** location edit (`source === 'system'`), where persistence uses
 * the JSON patch driver instead of the campaign workspace snapshot.
 *
 * @see `docs/reference/location-workspace.md` (section *Dirty state — system location patch*).
 */
export function isSystemLocationWorkspaceDirty(
  isPatchDriverDirty: boolean,
  isGridDraftDirty: boolean,
): boolean {
  return isPatchDriverDirty || isGridDraftDirty;
}
