import mongoose, { Document, Schema } from "mongoose";

export type AnnouncementType = "event" | "notice" | "alert" | "update";
export type AnnouncementStatus = "pending" | "approved" | "rejected";

export interface IAnnouncement extends Document {
  title: string;
  message: string;
  type: AnnouncementType;
  status: AnnouncementStatus;
  eventDate?: string; // ISO date for events (e.g. blood donation camp)
  eventTime?: string; // Human-readable time, e.g. "10:00 AM – 4:00 PM"
  location?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["event", "notice", "alert", "update"],
      default: "notice",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    eventDate: { type: String },
    eventTime: { type: String },
    location: { type: String, trim: true },
    createdBy: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);
