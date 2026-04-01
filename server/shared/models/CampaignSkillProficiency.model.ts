import mongoose, { Schema } from 'mongoose';
import { ABILITY_IDS } from '@/features/mechanics/domain/character';

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

const campaignSkillProficiencySchema = new Schema(
  {
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    skillProficiencyId: {
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
    ability: {
      type: String,
      required: true,
      enum: ABILITY_IDS,
    },
    suggestedClasses: {
      type: [String],
      default: [],
    },
    examples: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    accessPolicy: {
      type: accessPolicySchema,
      default: () => ({ scope: 'public', allowCharacterIds: [] }),
    },
  },
  { timestamps: true },
);

campaignSkillProficiencySchema.index(
  { campaignId: 1, skillProficiencyId: 1 },
  { unique: true },
);

export const CampaignSkillProficiency = mongoose.model(
  'CampaignSkillProficiency',
  campaignSkillProficiencySchema,
);
