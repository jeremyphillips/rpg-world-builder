/**
 * Migrates legacy `buildingProfile` on campaign locations to `buildingMeta` + `buildingStructure`,
 * then unsets `buildingProfile`.
 *
 * Usage:
 *   npx tsx scripts/migrateLocationBuildingProfile.ts --dry-run
 *   npx tsx scripts/migrateLocationBuildingProfile.ts --apply
 *
 * Requires MONGO_URI and DB_NAME (see .env). Back up the database before --apply.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { normalizeBuildingFieldsFromPersistedDoc } from '../shared/domain/locations/building/locationBuilding.normalize';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME ?? 'dnd';

const COLLECTION = 'campaignlocations';
const MAP_COLLECTION = 'campaignlocationmaps';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const apply = args.has('--apply');

if (!dryRun && !apply) {
  console.error('Specify --dry-run or --apply');
  process.exit(1);
}

if (dryRun && apply) {
  console.error('Use only one of --dry-run or --apply');
  process.exit(1);
}

type LocationDoc = {
  _id: unknown;
  campaignId?: string;
  locationId?: string;
  scale?: string;
  name?: string;
  buildingMeta?: unknown;
  buildingStructure?: unknown;
  buildingProfile?: unknown;
};

type PlacementRow = {
  campaignId: string;
  mapId: string;
  hostLocationId: string;
  cellId: string;
};

async function reportDuplicateBuildingLinks(db: mongoose.mongo.Db): Promise<void> {
  const maps = db.collection(MAP_COLLECTION);
  const locs = db.collection(COLLECTION);

  const occurrences = new Map<string, PlacementRow[]>();

  const cursor = maps.find({ cellEntries: { $exists: true, $ne: [] } });
  for await (const m of cursor) {
    const campaignId = String(m.campaignId ?? '');
    const mapId = String(m.mapId ?? '');
    const hostLocationId = String(m.locationId ?? '');
    const entries = (m.cellEntries as { cellId?: string; linkedLocationId?: string }[]) ?? [];
    for (const row of entries) {
      const lid = row.linkedLocationId?.trim();
      const cellId = row.cellId?.trim();
      if (!lid || !cellId) continue;
      const list = occurrences.get(lid) ?? [];
      list.push({ campaignId, mapId, hostLocationId, cellId });
      occurrences.set(lid, list);
    }
  }

  const duplicates: { linkedLocationId: string; rows: PlacementRow[] }[] = [];
  for (const [linkedLocationId, rows] of occurrences) {
    if (rows.length <= 1) continue;
    const loc = (await locs.findOne({
      campaignId: rows[0].campaignId,
      locationId: linkedLocationId,
    })) as { scale?: string; name?: string } | null;
    if (loc?.scale !== 'building') continue;
    duplicates.push({ linkedLocationId, rows });
  }

  if (duplicates.length === 0) {
    console.log('\n[links] No duplicate city/site map links to the same building id found.');
    return;
  }

  console.log(`\n[links] WARNING: ${duplicates.length} building(s) linked from more than one map cell:`);
  for (const d of duplicates) {
    const loc = (await locs.findOne({
      campaignId: d.rows[0].campaignId,
      locationId: d.linkedLocationId,
    })) as { name?: string } | null;
    console.log(
      `  building ${d.linkedLocationId} (${loc?.name ?? '?'}) — ${d.rows.length} placements (manual cleanup recommended)`,
    );
    for (const r of d.rows) {
      console.log(`    campaignId=${r.campaignId} mapId=${r.mapId} hostLocation=${r.hostLocationId} cellId=${r.cellId}`);
    }
  }
}

async function migrate(): Promise<void> {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.useDb(DB_NAME);
  const coll = db.collection(COLLECTION);

  const filter = {
    scale: 'building',
    buildingProfile: { $exists: true, $ne: null },
  };

  const total = await coll.countDocuments(filter);
  console.log(
    `${dryRun ? '[dry-run]' : '[apply]'} Found ${total} building location document(s) with legacy buildingProfile.`,
  );

  await reportDuplicateBuildingLinks(db);

  if (dryRun) {
    const sample = await coll.find(filter).limit(5).toArray();
    for (const doc of sample) {
      const d = doc as LocationDoc;
      const n = normalizeBuildingFieldsFromPersistedDoc({
        buildingMeta: d.buildingMeta,
        buildingStructure: d.buildingStructure,
        buildingProfile: d.buildingProfile,
      });
      console.log(
        `  sample ${d.campaignId}/${d.locationId}: meta keys=${n.buildingMeta ? Object.keys(n.buildingMeta).length : 0} structure=${n.buildingStructure ? JSON.stringify(n.buildingStructure).slice(0, 80) : '—'}`,
      );
    }
    await mongoose.disconnect();
    process.exit(0);
  }

  let modified = 0;
  const cursor = coll.find(filter);
  for await (const raw of cursor) {
    const doc = raw as LocationDoc;
    const n = normalizeBuildingFieldsFromPersistedDoc({
      buildingMeta: doc.buildingMeta,
      buildingStructure: doc.buildingStructure,
      buildingProfile: doc.buildingProfile,
    });

    const $set: Record<string, unknown> = {};
    if (n.buildingMeta && Object.keys(n.buildingMeta).length > 0) {
      $set.buildingMeta = n.buildingMeta;
    }
    if (n.buildingStructure && Object.keys(n.buildingStructure).length > 0) {
      $set.buildingStructure = n.buildingStructure;
    }

    const update: Record<string, unknown> = { $unset: { buildingProfile: '' } };
    if (Object.keys($set).length > 0) update.$set = $set;

    const res = await coll.updateOne({ _id: doc._id }, update);
    if (res.modifiedCount > 0) modified += 1;
  }

  const remaining = await coll.countDocuments({
    scale: 'building',
    buildingProfile: { $exists: true, $ne: null },
  });
  console.log(`Updated ${modified} document(s). Remaining with buildingProfile: ${remaining}`);
  await mongoose.disconnect();
  process.exit(remaining > 0 ? 2 : 0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
