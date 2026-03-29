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

const connectionSchema = new Schema(
  {
    toId: { type: String, required: true },
    kind: {
      type: String,
      enum: ['road', 'river', 'door', 'stairs', 'hall', 'secret', 'portal'],
      required: true,
    },
    bidirectional: { type: Boolean },
    locked: { type: Boolean },
    dc: { type: Number },
    keyItemId: { type: String },
  },
  { _id: false },
);

const labelSchema = new Schema(
  {
    short: { type: String },
    number: { type: String },
  },
  { _id: false },
);

const campaignLocationSchema = new Schema(
  {
    campaignId: { type: String, required: true, index: true },
    locationId: { type: String, required: true },
    name: { type: String, required: true },
    scale: { type: String, required: true },
    category: { type: String },
    description: { type: String },
    imageKey: { type: String },
    accessPolicy: {
      type: accessPolicySchema,
      default: () => ({ scope: 'public', allowCharacterIds: [] }),
    },
    parentId: { type: String },
    ancestorIds: { type: [String], default: [] },
    sortOrder: { type: Number },
    label: { type: labelSchema },
    aliases: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    connections: { type: [connectionSchema], default: [] },
  },
  { timestamps: true },
);

campaignLocationSchema.index({ campaignId: 1, locationId: 1 }, { unique: true });
campaignLocationSchema.index({ campaignId: 1, parentId: 1 });

export const CampaignLocation = mongoose.model('CampaignLocation', campaignLocationSchema);
