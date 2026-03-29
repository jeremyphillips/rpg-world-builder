import mongoose, { Schema } from 'mongoose';

const gridSchema = new Schema(
  {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    cellUnit: { type: Schema.Types.Mixed, required: true },
    geometry: { type: String, enum: ['square', 'hex'] },
  },
  { _id: false },
);

const mapCellSchema = new Schema(
  {
    cellId: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    terrain: { type: String },
    label: { type: String },
  },
  { _id: false },
);

const layoutSchema = new Schema(
  {
    excludedCellIds: { type: [String], default: undefined },
  },
  { _id: false },
);

const mapCellObjectEntrySchema = new Schema(
  {
    id: { type: String, required: true },
    kind: { type: String, required: true },
    label: { type: String },
  },
  { _id: false },
);

const mapCellAuthoringEntrySchema = new Schema(
  {
    cellId: { type: String, required: true },
    linkedLocationId: { type: String },
    objects: { type: [mapCellObjectEntrySchema], default: undefined },
  },
  { _id: false },
);

const campaignLocationMapSchema = new Schema(
  {
    campaignId: { type: String, required: true, index: true },
    locationId: { type: String, required: true, index: true },
    mapId: { type: String, required: true },
    name: { type: String, required: true },
    kind: {
      type: String,
      enum: ['world-grid', 'area-grid', 'encounter-grid'],
      required: true,
    },
    grid: { type: gridSchema, required: true },
    layout: { type: layoutSchema },
    isDefault: { type: Boolean },
    cells: { type: [mapCellSchema], default: [] },
    cellEntries: { type: [mapCellAuthoringEntrySchema], default: undefined },
  },
  { timestamps: true },
);

campaignLocationMapSchema.index({ campaignId: 1, mapId: 1 }, { unique: true });
campaignLocationMapSchema.index({ campaignId: 1, locationId: 1 });

export const CampaignLocationMap = mongoose.model('CampaignLocationMap', campaignLocationMapSchema);
