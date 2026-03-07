import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, sparse: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'user'], default: 'user' },
  active: { type: Boolean, default: true },
  firstName: { type: String },
  lastName: { type: String },
  avatarKey: { type: String },
  bio: { type: String },
  website: { type: String },
  notificationPreferences: {
    sessionScheduled: { type: Boolean, default: true },
    inviteReceived: { type: Boolean, default: true },
    mentionedInChat: { type: Boolean, default: true },
  },
}, { timestamps: true })

export const User = mongoose.model('User', UserSchema)
