import mongoose, { Document, Schema } from "mongoose";

export type Role = "citizen" | "admin";

export interface IUser extends Document {
  name?: string;
  identity?: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  googleId?: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, trim: true, maxlength: 60 },
    identity: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String },
    googleId: { type: String },
    role: { type: String, enum: ["citizen", "admin"], default: "citizen" },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });

export default mongoose.model<IUser>("User", UserSchema);
