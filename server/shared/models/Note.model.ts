import mongoose, { Schema } from 'mongoose'

const noteSchema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  title:      { type: String, default: '' },
  body:       { type: String, default: '' },
  createdBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

export const Note = mongoose.model('Note', noteSchema)
