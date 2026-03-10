import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { env } from '../../../shared/config/env'

const db = () => mongoose.connection.useDb(env.DB_NAME)
const usersCollection = () => db().collection('users')

export async function getAllUsersWithCounts() {
  const users = await usersCollection()
    .find({}, { projection: { passwordHash: 0 } })
    .toArray()

  // Gather campaign and character counts for each user
  const campaignsCol = db().collection('campaigns')
  const charactersCol = db().collection('characters')

  const enriched = await Promise.all(
    users.map(async (u) => {
      const uid = u._id
      const [campaignCount, characterCount] = await Promise.all([
        campaignsCol.countDocuments({
          $or: [{ adminId: uid }, { 'members.userId': uid }],
        }),
        charactersCol.countDocuments({ userId: uid }),
      ])
      return {
        ...u,
        campaignCount,
        characterCount,
      }
    })
  )

  return enriched
}

export async function getAllUsers() {
  return usersCollection()
    .find({}, { projection: { passwordHash: 0 } })
    .toArray()
}

export async function getUserById(id: string) {
  return usersCollection().findOne(
    { _id: new mongoose.Types.ObjectId(id) },
    { projection: { passwordHash: 0 } },
  )
}

export async function updateUserRole(id: string, role: 'superadmin' | 'admin' | 'user') {
  const result = await usersCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: { role, updatedAt: new Date() } },
    { returnDocument: 'after', projection: { passwordHash: 0 } },
  )
  return result
}

export async function createUser(data: {
  username: string
  email: string
  password: string
  role: 'superadmin' | 'admin' | 'user'
}) {
  const passwordHash = await bcrypt.hash(data.password, 10)
  const now = new Date()

  const result = await usersCollection().insertOne({
    username: data.username,
    email: data.email,
    passwordHash,
    role: data.role,
    active: true,
    createdAt: now,
    updatedAt: now,
  })

  return usersCollection().findOne(
    { _id: result.insertedId },
    { projection: { passwordHash: 0 } },
  )
}
