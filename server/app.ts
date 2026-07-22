import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import incidentRoutes from "./routes/incidents.js";
import announcementRoutes from "./routes/announcements.js";
import authRoutes from "./routes/auth.js";
import { connectDatabase, seedDatabaseOnce } from "./database.js";

dotenv.config();

const app = express();

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:4173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), payment=()");
  next();
});

app.use(express.json({ limit: "100kb" }));

const authHits = new Map<string, { count: number; resetAt: number }>();
app.use("/api/auth", (req, res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const current = authHits.get(key);
  const windowMs = 15 * 60 * 1000;
  const max = 60;

  if (!current || current.resetAt <= now) {
    authHits.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  current.count += 1;
  if (current.count > max) {
    return res.status(429).json({ error: "Too many authentication attempts. Please try again later." });
  }

  next();
});

app.use("/api", async (_req, res, next) => {
  try {
    await connectDatabase();
    await seedDatabaseOnce();
    next();
  } catch (err) {
    console.error("[server] Database unavailable:", err);
    res.status(500).json({ error: "Database unavailable" });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.use("/api/incidents", incidentRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/auth", authRoutes);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
