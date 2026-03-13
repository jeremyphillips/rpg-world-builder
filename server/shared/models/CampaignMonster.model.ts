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

const campaignMonsterSchema = new Schema(
  {
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    monsterId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    accessPolicy: {
      type: accessPolicySchema,
      default: () => ({ scope: 'public', allowCharacterIds: [] }),
    },
  },
  { timestamps: true },
);

campaignMonsterSchema.index({ campaignId: 1, monsterId: 1 }, { unique: true });

export const CampaignMonster = mongoose.model('CampaignMonster', campaignMonsterSchema);
