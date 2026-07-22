import mongoose, { Document, Schema } from "mongoose";

export interface IOtpSession extends Document {
  phone: string;       // primary key — user's phone number
  otp: string;
  expiresAt: Date;
}

const OtpSessionSchema = new Schema<IOtpSession>({
  phone: { type: String, required: true, trim: true },
  otp:   { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

// Auto-delete expired documents from MongoDB
OtpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IOtpSession>("OtpSession", OtpSessionSchema);
