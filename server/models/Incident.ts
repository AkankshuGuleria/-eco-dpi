import mongoose, { Document, Schema } from "mongoose";

export type Status = "Active" | "In progress" | "Resolved";

export interface IIncident extends Document {
  incidentId: string;
  category: string;
  sector: string;
  lat: number;
  lng: number;
  reports: number;
  priority: number;
  status: Status;
  updated: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IIncident>(
  {
    incidentId: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    sector: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    reports: { type: Number, default: 1 },
    priority: { type: Number, min: 1, max: 5, default: 1 },
    status: {
      type: String,
      enum: ["Active", "In progress", "Resolved"],
      default: "Active",
    },
    updated: { type: String, default: "just now" },
  },
  { timestamps: true }
);

export default mongoose.model<IIncident>("Incident", IncidentSchema);
