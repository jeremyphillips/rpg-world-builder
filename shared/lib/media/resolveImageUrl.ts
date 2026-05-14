/**
 * Resolve a storage key (or legacy URL) to a displayable image URL — raw mapping only (no category fallback).
 * For UI that should show placeholder art when `imageKey` is empty, use `resolveContentImageUrl` instead.
 *
 * Mirrors server-side `getPublicUrl` from server/shared/services/image.service.ts.
 * When switching to a CDN, update the fallback prefix or read from
 * an env var (e.g. `import.meta.env.VITE_IMAGE_BASE_URL`).
 */
export function resolveImageUrl(key: string | null | undefined): string | undefined {
  if (!key) return undefined
  if (key.startsWith('/') || key.startsWith('http')) return key
  return `/uploads/${key}`
}
