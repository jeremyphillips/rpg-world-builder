/**
 * One-way Mongo migration: semantic proficiency modes (no proficiencyLevel).
 *
 * Characters: proficiencies.skills — objects or legacy string[] → Record<string, 'proficient'|'expertise'>
 * Campaign monsters: data.mechanics.proficiencies groups; data.mechanics.savingThrows → proficiencies.saves
 *
 * Standard groups: legacy proficiencyLevel 2 coerced to 'proficient' with reporting.
 * STRICT_INVALID_LEGACY_EXPERTISE=1: abort (exit 1) if any coercion would occur.
 *
 * Usage:
 *   npx tsx scripts/migrateAuthoredProficiencyModes.ts
 *   DRY_RUN=1 npx tsx scripts/migrateAuthoredProficiencyModes.ts
 */
import mongoose from 'mongoose'
import dotenv from 'dotenv'

import {
  migrateCharacterSkillsRecord,
  migrateProficienciesObject,
  migrateProficiencyGroupRecord,
  type LegacyProficiencyMigrationReport,
} from '../shared/domain/proficiency/legacyProficiencyMigration'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME ?? 'dnd'
const DRY_RUN = process.env.DRY_RUN === '1'
const STRICT = process.env.STRICT_INVALID_LEGACY_EXPERTISE === '1'

async function migrate() {
  await mongoose.connect(MONGO_URI)
  const db = mongoose.connection.useDb(DB_NAME)
  const characters = db.collection('characters')
  const campaignMonsters = db.collection('campaignmonsters')

  const report: LegacyProficiencyMigrationReport = { invalidLegacyExpertiseInStandardGroup: [] }
  let charsScanned = 0
  let charsUpdated = 0
  let monstersScanned = 0
  let monstersUpdated = 0

  const charUpdates: { _id: unknown; proficiencies: Record<string, unknown> }[] = []
  const monsterUpdates: { _id: unknown; data: Record<string, unknown> }[] = []

  for await (const doc of characters.find({})) {
    charsScanned++
    const prof = doc.proficiencies as Record<string, unknown> | undefined
    if (!prof) continue
    const nextProf = { ...prof }
    const pathPrefix = `characters.${doc._id}.proficiencies`
    const skills = migrateCharacterSkillsRecord(prof.skills, pathPrefix, report)
    if (skills !== undefined) nextProf.skills = skills as Record<string, unknown>
    if (JSON.stringify(prof) !== JSON.stringify(nextProf)) {
      charsUpdated++
      charUpdates.push({ _id: doc._id, proficiencies: nextProf })
    }
  }

  for await (const doc of campaignMonsters.find({})) {
    monstersScanned++
    const data = (doc.data as Record<string, unknown>) ?? {}
    const mechanicsSource = data.mechanics
    if (
      mechanicsSource === undefined ||
      mechanicsSource === null ||
      typeof mechanicsSource !== 'object' ||
      Array.isArray(mechanicsSource)
    ) {
      continue
    }

    const mechanics = { ...(mechanicsSource as Record<string, unknown>) }
    let changed = false
    const mPath = `campaignmonsters.${doc._id}.data.mechanics`

    if (mechanics.savingThrows && typeof mechanics.savingThrows === 'object') {
      const saves = migrateProficiencyGroupRecord(
        'saves',
        mechanics.savingThrows as Record<string, unknown>,
        `${mPath}.savingThrows`,
        report,
      )
      const prof = (mechanics.proficiencies as Record<string, unknown> | undefined) ?? {}
      mechanics.proficiencies = { ...prof, saves }
      delete mechanics.savingThrows
      changed = true
    }

    if (mechanics.proficiencies) {
      const migrated = migrateProficienciesObject(mechanics.proficiencies, `${mPath}.proficiencies`, report)
      if (migrated && JSON.stringify(mechanics.proficiencies) !== JSON.stringify(migrated)) {
        mechanics.proficiencies = migrated
        changed = true
      }
    }

    if (changed) {
      monstersUpdated++
      monsterUpdates.push({ _id: doc._id, data: { ...data, mechanics } })
    }
  }

  if (STRICT && report.invalidLegacyExpertiseInStandardGroup.length > 0) {
    console.error(
      'STRICT_INVALID_LEGACY_EXPERTISE: migration would coerce invalid standard-group expertise:',
      report.invalidLegacyExpertiseInStandardGroup,
    )
    await mongoose.disconnect()
    process.exit(1)
  }

  if (!DRY_RUN) {
    for (const u of charUpdates) {
      await characters.updateOne({ _id: u._id }, { $set: { proficiencies: u.proficiencies } })
    }
    for (const u of monsterUpdates) {
      await campaignMonsters.updateOne({ _id: u._id }, { $set: { data: u.data } })
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        charsScanned,
        charsUpdated,
        monstersScanned,
        monstersUpdated,
        invalidLegacyExpertiseInStandardGroup: report.invalidLegacyExpertiseInStandardGroup,
      },
      null,
      2,
    ),
  )

  await mongoose.disconnect()
  process.exit(0)
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
