import mongoose, { Schema } from 'mongoose';

const campaignContentPatchSchema = new Schema(
  {
    campaignId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    patches: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

export const CampaignContentPatch = mongoose.model(
  'CampaignContentPatch',
  campaignContentPatchSchema,
);
