import mongoose, { Schema } from 'mongoose';

const traversalSchema = new Schema(
  {
    bidirectional: { type: Boolean },
    locked: { type: Boolean },
    dc: { type: Number },
    keyItemId: { type: String },
  },
  { _id: false },
);

const campaignLocationTransitionSchema = new Schema(
  {
    campaignId: { type: String, required: true, index: true },
    transitionId: { type: String, required: true },
    fromMapId: { type: String, required: true, index: true },
    fromCellId: { type: String, required: true },
    toLocationId: { type: String, required: true },
    toMapId: { type: String },
    toTargetCellId: { type: String },
    toSpawnCellId: { type: String },
    kind: {
      type: String,
      enum: ['enter', 'exit', 'door', 'stairs', 'portal', 'zoom'],
      required: true,
    },
    label: { type: String },
    traversal: { type: traversalSchema },
  },
  { timestamps: true },
);

campaignLocationTransitionSchema.index({ campaignId: 1, transitionId: 1 }, { unique: true });
campaignLocationTransitionSchema.index({ campaignId: 1, fromMapId: 1 });

export const CampaignLocationTransition = mongoose.model(
  'CampaignLocationTransition',
  campaignLocationTransitionSchema,
);
