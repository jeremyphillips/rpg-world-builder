/**
 * One-time migration: restructure flat campaign documents into
 * the new nested shape (identity, configuration, membership, participation)
 * and remove the old flat fields.
 *
 * Safe to run multiple times — only touches documents that still have old flat fields.
 *
 * Usage:
 *   npx tsx scripts/migrateCampaignStructure.ts
 */
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME ?? 'dnd'

const OLD_FIELDS = ['name', 'description', 'setting', 'edition', 'party', 'adminId', 'members']

async function migrate() {
  await mongoose.connect(MONGO_URI)
  const db = mongoose.connection.useDb(DB_NAME)
  const campaigns = db.collection('campaigns')

  // Phase 1 — Backfill nested structure on docs that lack it
  const needsNested = campaigns.find({ identity: { $exists: false } })
  let backfilled = 0

  for await (const doc of needsNested) {
    await campaigns.updateOne(
      { _id: doc._id },
      {
        $set: {
          identity: {
            name: doc.name,
            description: doc.description ?? '',
            setting: doc.setting,
            edition: doc.edition
          },
          configuration: {
            rules: {}
          },
          membership: {
            ownerId: doc.adminId,
            members: doc.members ?? []
          },
          participation: {
            characters: ((doc.party as any[]) ?? []).map((id: any) => ({
              characterId: id,
              status: 'active',
              joinedAt: doc.createdAt ?? new Date()
            }))
          }
        }
      }
    )
    backfilled++
  }

  console.log(`Phase 1: ${backfilled} campaign(s) backfilled with nested structure.`)

  // Phase 2 — Remove old flat fields from all documents
  const $unset: Record<string, ''> = {}
  for (const field of OLD_FIELDS) $unset[field] = ''

  const removeResult = await campaigns.updateMany(
    { $or: OLD_FIELDS.map((f) => ({ [f]: { $exists: true } })) },
    { $unset }
  )

  console.log(`Phase 2: ${removeResult.modifiedCount} campaign(s) had old flat fields removed.`)
  console.log('Migration complete.')

  await mongoose.disconnect()
  process.exit(0)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
