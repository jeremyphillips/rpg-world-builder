import { CampaignLocationTransition } from '../../../../shared/models/CampaignLocationTransition.model';

export async function countTransitionsReferencingMap(campaignId: string, mapId: string): Promise<number> {
  return CampaignLocationTransition.countDocuments({
    campaignId,
    $or: [{ fromMapId: mapId }, { toMapId: mapId }],
  });
}

export async function countTransitionsReferencingLocation(campaignId: string, locationId: string): Promise<number> {
  return CampaignLocationTransition.countDocuments({ campaignId, toLocationId: locationId });
}
