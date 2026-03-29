import { Router } from 'express';
import { requireCampaignOwner } from '../../../../shared/middleware/requireCampaignRole';
import { asyncHandler } from '../../../../shared/middleware/asyncHandler';
import {
  listLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  listLocationMaps,
  createLocationMap,
  updateLocationMap,
  deleteLocationMap,
  listMapTransitions,
  createMapTransition,
  updateMapTransition,
  deleteMapTransition,
} from '../controllers/locations.controller';

const locationsRouter = Router({ mergeParams: true });

locationsRouter.get('/', asyncHandler(listLocations));
locationsRouter.post('/', requireCampaignOwner(), asyncHandler(createLocation));
locationsRouter.get('/:locationId', asyncHandler(getLocation));
locationsRouter.patch('/:locationId', requireCampaignOwner(), asyncHandler(updateLocation));
locationsRouter.delete('/:locationId', requireCampaignOwner(), asyncHandler(deleteLocation));

locationsRouter.get('/:locationId/maps', asyncHandler(listLocationMaps));
locationsRouter.post('/:locationId/maps', requireCampaignOwner(), asyncHandler(createLocationMap));
locationsRouter.patch('/:locationId/maps/:mapId', requireCampaignOwner(), asyncHandler(updateLocationMap));
locationsRouter.delete('/:locationId/maps/:mapId', requireCampaignOwner(), asyncHandler(deleteLocationMap));

const locationMapTransitionsRouter = Router({ mergeParams: true });
locationMapTransitionsRouter.get('/transitions', asyncHandler(listMapTransitions));
locationMapTransitionsRouter.post('/transitions', requireCampaignOwner(), asyncHandler(createMapTransition));
locationMapTransitionsRouter.patch('/transitions/:transitionId', requireCampaignOwner(), asyncHandler(updateMapTransition));
locationMapTransitionsRouter.delete('/transitions/:transitionId', requireCampaignOwner(), asyncHandler(deleteMapTransition));

export default locationsRouter;
export { locationMapTransitionsRouter };
