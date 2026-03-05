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

const campaignClassSchema = new Schema(
  {
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    classId: {
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
    accessPolicy: {
      type: accessPolicySchema,
      default: () => ({ scope: 'public', allowCharacterIds: [] }),
    },
    data: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

campaignClassSchema.index({ campaignId: 1, classId: 1 }, { unique: true });

export const CampaignClass = mongoose.model(
  'CampaignClass',
  campaignClassSchema,
);
