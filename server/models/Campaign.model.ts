import mongoose, { Schema } from 'mongoose'

const campaignSchema = new Schema(
  {
    identity: {
      name: String,
      description: String,
      setting: String,
      edition: String,
      imageKey: String
    },

    configuration: {
      allowLegacyEditionNpcs: { type: Boolean, default: false },
      rules: { type: Schema.Types.Mixed, default: {} }
    },

    membership: {
      ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
    },

    participation: {
      characters: [
        {
          characterId: { type: Schema.Types.ObjectId, ref: 'Character' },
          status: { type: String, enum: ['active', 'inactive', 'deceased'], default: 'active' },
          joinedAt: Date
        }
      ]
    }
  },
  { timestamps: true }
)

export const Campaign = mongoose.model('Campaign', campaignSchema)
