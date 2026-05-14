import { getImageFallbackUrl, type ImageContentType } from './imageFallbacks'
import { resolveImageUrl } from './resolveImageUrl'

/**
 * Resolve a content row’s `imageKey` to a display URL, using the correct static fallback when empty.
 * Prefer this for list/detail UI; use {@link resolveImageUrl} only for raw key → URL without category fallback.
 */
export function resolveContentImageUrl(
  contentType: ImageContentType,
  imageKey: string | null | undefined,
): string {
  return resolveImageUrl(imageKey) ?? getImageFallbackUrl(contentType)
}
