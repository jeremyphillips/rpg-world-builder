/**
 * Campaign-owned equipment controller.
 *
 * Parametric handlers for all 4 equipment types. Each route-registering
 * call passes the equipmentType and response key so a single set of
 * handler factories serves weapons, armor, gear, and magic items.
 */
import type { Request, Response } from 'express';
import * as service from '../services/campaignEquipment.service';
import type { EquipmentType } from '../services/campaignEquipment.service';
import { canViewContent } from '../../shared/domain/capabilities';

type HandlerConfig = {
  equipmentType: EquipmentType;
  /** Key used in the JSON response, e.g. 'weapon', 'armor' */
  responseKey: string;
  /** Plural key used in list responses, e.g. 'weapons', 'armors' */
  responsePluralKey: string;
  /** URL param name for the item id, e.g. 'weaponId', 'armorId' */
  paramKey: string;
};

export function makeEquipmentHandlers(config: HandlerConfig) {
  const { equipmentType, responseKey, responsePluralKey, paramKey } = config;

  return {
    async list(req: Request, res: Response) {
      const { id: campaignId } = req.params;
      const all = await service.listByCampaign(campaignId, equipmentType);

      const ctx = req.viewerContext!;
      const filtered = all.filter(item => canViewContent(ctx, item.accessPolicy));

      res.json({ [responsePluralKey]: filtered });
    },

    async get(req: Request, res: Response) {
      const { id: campaignId } = req.params;
      const itemId = req.params[paramKey];
      const item = await service.getById(campaignId, equipmentType, itemId);
      if (!item) {
        res.status(404).json({ error: `${responseKey} not found` });
        return;
      }

      if (!canViewContent(req.viewerContext!, item.accessPolicy)) {
        res.status(404).json({ error: `${responseKey} not found` });
        return;
      }

      res.json({ [responseKey]: item });
    },

    async create(req: Request, res: Response) {
      const { id: campaignId } = req.params;
      const result = await service.create(campaignId, equipmentType, req.body);
      if ('errors' in result) {
        res.status(400).json({ errors: result.errors });
        return;
      }
      res.status(201).json({ [responseKey]: result.item });
    },

    async update(req: Request, res: Response) {
      const { id: campaignId } = req.params;
      const itemId = req.params[paramKey];
      const result = await service.update(campaignId, equipmentType, itemId, req.body);
      if (!result) {
        res.status(404).json({ error: `${responseKey} not found` });
        return;
      }
      if ('errors' in result) {
        res.status(400).json({ errors: result.errors });
        return;
      }
      res.json({ [responseKey]: result.item });
    },

    async remove(req: Request, res: Response) {
      const { id: campaignId } = req.params;
      const itemId = req.params[paramKey];
      const deleted = await service.remove(campaignId, equipmentType, itemId);
      if (!deleted) {
        res.status(404).json({ error: `${responseKey} not found` });
        return;
      }
      res.json({ ok: true });
    },
  };
}

export const weaponHandlers = makeEquipmentHandlers({
  equipmentType: 'weapon',
  responseKey: 'weapon',
  responsePluralKey: 'weapons',
  paramKey: 'weaponId',
});

export const armorHandlers = makeEquipmentHandlers({
  equipmentType: 'armor',
  responseKey: 'armor',
  responsePluralKey: 'armors',
  paramKey: 'armorId',
});

export const gearHandlers = makeEquipmentHandlers({
  equipmentType: 'gear',
  responseKey: 'gear',
  responsePluralKey: 'gears',
  paramKey: 'gearId',
});

export const magicItemHandlers = makeEquipmentHandlers({
  equipmentType: 'magicItem',
  responseKey: 'magicItem',
  responsePluralKey: 'magicItems',
  paramKey: 'magicItemId',
});
