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

const campaignRaceSchema = new Schema(
  {
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    raceId: {
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
  },
  { timestamps: true },
);

campaignRaceSchema.index({ campaignId: 1, raceId: 1 }, { unique: true });

export const CampaignRace = mongoose.model('CampaignRace', campaignRaceSchema);
