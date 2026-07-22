import mongoose from "mongoose";
import { seedDatabase } from "./seed.js";

let seedPromise: Promise<void> | null = null;

export async function connectDatabase() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eco-dpi";
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return mongoose.connection;
  }

  await mongoose.connect(MONGO_URI);
  console.log("[mongo] Connected");
  return mongoose.connection;
}

export async function seedDatabaseOnce() {
  if (!seedPromise) {
    seedPromise = seedDatabase();
  }

  return seedPromise;
}
