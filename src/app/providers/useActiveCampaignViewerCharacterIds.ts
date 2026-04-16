import { useActiveCampaign } from './ActiveCampaignProvider'

const EMPTY_VIEWER_CHARACTER_IDS: string[] = []

export function useActiveCampaignViewerCharacterIds(): string[] {
  const { campaign } = useActiveCampaign()
  return campaign?.members?.viewerCharacterIds ?? EMPTY_VIEWER_CHARACTER_IDS
}
