import mongoose, { Schema } from 'mongoose';

const accessPolicySchema = new Schema(
  {
    scope: {
      type: String,
      enum: ['public', 'dm', 'restricted'],
      default: 'public',
    },
    allowCharacterIds: { type: [String], default: [] },
    allowFactionIds: { type: [String], default: [] },
  },
  { _id: false },
);

const campaignEquipmentSchema = new Schema(
  {
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    equipmentType: {
      type: String,
      required: true,
      enum: ['weapon', 'armor', 'gear', 'magicItem'],
    },
    itemId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    imageKey: {
      type: String,
      default: '',
    },
    accessPolicy: {
      type: accessPolicySchema,
      default: () => ({ scope: 'public', allowCharacterIds: [] }),
    },
    /** Type-specific fields stored as a flexible subdocument. */
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

campaignEquipmentSchema.index(
  { campaignId: 1, equipmentType: 1, itemId: 1 },
  { unique: true },
);

export const CampaignEquipment = mongoose.model(
  'CampaignEquipment',
  campaignEquipmentSchema,
);
