import mongoose, { Schema } from 'mongoose';

const campaignRulesetPatchSchema = new Schema(
  {
    campaignId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    systemId: {
      type: String,
      required: true,
    },
    schemaVersion: {
      type: Number,
      default: 1,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    content: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    mechanics: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  { timestamps: true },
);

export const CampaignRulesetPatch = mongoose.model(
  'CampaignRulesetPatch',
  campaignRulesetPatchSchema,
);
