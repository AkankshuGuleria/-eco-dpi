import mongoose, { Document, Schema } from "mongoose";

export interface IOtpSession extends Document {
  phone: string;
  otp: string;
  expiresAt: Date;
}

const OtpSessionSchema = new Schema<IOtpSession>({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

// Auto-delete document after expiration time
OtpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IOtpSession>("OtpSession", OtpSessionSchema);
