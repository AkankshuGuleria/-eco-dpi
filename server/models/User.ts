import mongoose, { Document, Schema } from "mongoose";

export type Role = "citizen" | "admin";

export interface IUser extends Document {
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
    identity: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String },
    googleId: { type: String },
    role: { type: String, enum: ["citizen", "admin"], default: "citizen" },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
