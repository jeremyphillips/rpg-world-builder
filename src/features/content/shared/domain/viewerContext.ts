import type { CampaignViewer } from '@/shared/types/campaign.types';
import type { ViewerContext } from '@/shared/domain/capabilities';

export type ContentViewerContext = ViewerContext;

export function toContentViewerContext(
  viewer: CampaignViewer | undefined,
  characterIds: string[],
): ContentViewerContext | undefined {
  if (!viewer) return undefined;
  return {
    campaignRole: viewer.campaignRole,
    isOwner: viewer.isOwner,
    isPlatformAdmin: viewer.isPlatformAdmin,
    characterIds,
  };
}
