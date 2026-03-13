/**
 * One-time migration: convert character proficiencies.skills from string[]
 * to Record<string, ProficiencyAdjustment> shape.
 *
 * Safe to run multiple times — only touches documents where proficiencies.skills
 * is still an array.
 *
 * Usage:
 *   npx tsx scripts/migrateSkillProficiencies.ts
 *   DRY_RUN=1 npx tsx scripts/migrateSkillProficiencies.ts  # log changes without writing
 */
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME ?? 'dnd'
const DRY_RUN = process.env.DRY_RUN === '1'

function isLegacySkills(value: unknown): value is string[] {
  return Array.isArray(value)
}

function toSkillProficienciesRecord(ids: string[]): Record<string, ProficiencyAdjustment> {
  return Object.fromEntries(ids.map((id) => [id, { proficiencyLevel: 1 }]))
}

async function migrate() {
  await mongoose.connect(MONGO_URI)
  const db = mongoose.connection.useDb(DB_NAME)
  const characters = db.collection('characters')

  // Find documents where proficiencies.skills is an array
  const legacyCursor = characters.find({
    'proficiencies.skills': { $type: 'array' },
  })

  let migrated = 0

  for await (const doc of legacyCursor) {
    const skills = doc.proficiencies?.skills
    if (!isLegacySkills(skills)) continue

    const newSkills = toSkillProficienciesRecord(skills)

    if (DRY_RUN) {
      console.log(
        `[DRY RUN] Would migrate ${doc._id}: ${skills.length} skill(s) -> record shape`,
      )
      migrated++
      continue
    }

    await characters.updateOne(
      { _id: doc._id },
      { $set: { 'proficiencies.skills': newSkills } },
    )
    migrated++
  }

  if (DRY_RUN && migrated > 0) {
    console.log(`[DRY RUN] Would migrate ${migrated} character(s). Run without DRY_RUN=1 to apply.`)
  } else if (migrated > 0) {
    console.log(`Migrated ${migrated} character(s) to new skill proficiency shape.`)
  } else {
    console.log('No characters with legacy proficiencies.skills array found.')
  }

  await mongoose.disconnect()
  process.exit(0)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
