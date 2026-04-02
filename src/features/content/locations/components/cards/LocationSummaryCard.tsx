import { HorizontalCompactCard } from '@/ui/patterns'
import { CardBadge } from '@/ui/primitives'

export interface LocationSummaryCardProps {
  /** Location detail route when `footerActionLabel` is set. */
  link?: string
  name: string
  /** Shown in the description line before `parentName` (e.g. scale id or label). */
  scale?: string
  imageUrl?: string
  /** Whether this is a user-created location */
  isCustom?: boolean
  /** Parent location name, if nested — combined with `scale` for the description line. */
  parentName?: string
  /**
   * When set (non-empty), renders the footer link to `link` with this label.
   * Omit to hide the footer action (default).
   */
  footerActionLabel?: string
}

function buildDescription(scale?: string, parentName?: string): string | undefined {
  const s = scale?.trim()
  const p = parentName?.trim()
  if (s && p) return `${s} · ${p}`
  if (s) return s
  if (p) return p
  return undefined
}

const LocationSummaryCard = ({
  link,
  name,
  scale,
  imageUrl,
  isCustom,
  parentName,
  footerActionLabel,
}: LocationSummaryCardProps) => {
  const description = buildDescription(scale, parentName)
  const showFooter = Boolean(link && footerActionLabel?.trim())

  return (
    <HorizontalCompactCard
      image={imageUrl}
      headline={name}
      description={description}
      titleBadges={isCustom ? <CardBadge type="tag" value="Custom" /> : undefined}
      footerActionTo={showFooter ? link : undefined}
      footerActionLabel={showFooter ? footerActionLabel?.trim() : undefined}
      footerActionOpenInNewTab={false}
    />
  )
}

export default LocationSummaryCard
