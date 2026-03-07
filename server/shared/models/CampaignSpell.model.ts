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

const campaignSpellSchema = new Schema(
  {
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    spellId: {
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
    school: {
      type: String,
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
    classes: {
      type: [String],
      default: [],
    },
    ritual: {
      type: Boolean,
      default: false,
    },
    concentration: {
      type: Boolean,
      default: false,
    },
    effects: {
      type: Schema.Types.Mixed,
      default: [],
    },
    accessPolicy: {
      type: accessPolicySchema,
      default: () => ({ scope: 'public', allowCharacterIds: [] }),
    },
  },
  { timestamps: true },
);

campaignSpellSchema.index(
  { campaignId: 1, spellId: 1 },
  { unique: true },
);

export const CampaignSpell = mongoose.model(
  'CampaignSpell',
  campaignSpellSchema,
);
