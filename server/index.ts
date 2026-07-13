import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import incidentRoutes from "./routes/incidents";
import authRoutes from "./routes/auth";
import { seedDatabase } from "./seed";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eco-dpi";

app.use(cors({ origin: "*" }));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.use("/api/incidents", incidentRoutes);
app.use("/api/auth", authRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[mongo] Connected to ${MONGO_URI}`);
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`[server] Eco-DPI API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("[server] Failed to start:", err);
    process.exit(1);
  }
}

start();
