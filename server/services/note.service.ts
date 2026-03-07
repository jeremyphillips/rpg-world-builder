import mongoose from 'mongoose'
import { env } from '../shared/config/env'

const notesCollection = () => mongoose.connection.useDb(env.DB_NAME).collection('notes')

export async function getNotesByCampaign(campaignId: string) {
  return notesCollection()
    .find({ campaignId: new mongoose.Types.ObjectId(campaignId) })
    .sort({ createdAt: -1 })
    .toArray()
}

export async function getNoteById(noteId: string) {
  return notesCollection().findOne({ _id: new mongoose.Types.ObjectId(noteId) })
}

export async function createNote(campaignId: string, createdBy: string, data: { title?: string; body?: string }) {
  const now = new Date()
  const result = await notesCollection().insertOne({
    campaignId: new mongoose.Types.ObjectId(campaignId),
    createdBy: new mongoose.Types.ObjectId(createdBy),
    title: data.title ?? '',
    body: data.body ?? '',
    createdAt: now,
    updatedAt: now,
  })

  return notesCollection().findOne({ _id: result.insertedId })
}

export async function updateNote(noteId: string, data: { title?: string; body?: string }) {
  return notesCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(noteId) },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: 'after' },
  )
}

export async function deleteNote(noteId: string) {
  return notesCollection().deleteOne({ _id: new mongoose.Types.ObjectId(noteId) })
}
