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

/**
 * Campaign-owned spell — persisted shape matches SpellInput / SpellBase nested fields.
 * `description` may be legacy string or { full, summary }; use normalize on read.
 * Optional `ritual` / `concentration` are legacy only; new writes omit them.
 */
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
      type: Schema.Types.Mixed,
      default: () => ({ full: '', summary: '' }),
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
    /** @deprecated legacy — read only via normalize */
    ritual: {
      type: Boolean,
      required: false,
    },
    /** @deprecated legacy — read only via normalize */
    concentration: {
      type: Boolean,
      required: false,
    },
    castingTime: { type: Schema.Types.Mixed, required: true },
    range: { type: Schema.Types.Mixed, required: true },
    duration: { type: Schema.Types.Mixed, required: true },
    components: { type: Schema.Types.Mixed, required: true },
    effectGroups: {
      type: Schema.Types.Mixed,
      default: [],
    },
    scaling: { type: Schema.Types.Mixed, required: false },
    resolution: { type: Schema.Types.Mixed, required: false },
    deliveryMethod: { type: String, required: false },
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
