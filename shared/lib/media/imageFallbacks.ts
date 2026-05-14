/**
 * Static fallback artwork per content category (presentation only — not persisted).
 * Keys align with `resolveContentImageUrl` / campaign content list `imageContentType`.
 */
export const IMAGE_FALLBACK_URLS = {
  monster: '/assets/system/fallbacks/monster.png',
  spell: '/assets/system/fallbacks/spell.png',
  character: '/assets/system/fallbacks/character.png',
  race: '/assets/system/fallbacks/character.png',
  class: '/assets/system/fallbacks/character.png',
  skillProficiencies: '/assets/system/fallbacks/generic.png',
  location: '/assets/system/fallbacks/generic.png',
  gear: '/assets/system/fallbacks/generic.png',
  armor: '/assets/system/fallbacks/generic.png',
  weapon: '/assets/system/fallbacks/generic.png',
  equipment: '/assets/system/fallbacks/generic.png',
} as const

export type ImageContentType = keyof typeof IMAGE_FALLBACK_URLS

export function getImageFallbackUrl(type: ImageContentType): string {
  return IMAGE_FALLBACK_URLS[type]
}
