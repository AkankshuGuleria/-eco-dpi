import { Router, Request, Response } from "express";
import Incident from "../models/Incident";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

// Haversine distance in km
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/incidents — list all (unprotected so anyone can see the map / public stats)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

// GET /api/incidents/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const incident = await Incident.findOne({ incidentId: req.params.id });
    if (!incident) return res.status(404).json({ error: "Not found" });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch incident" });
  }
});

// POST /api/incidents — create or increment duplicate (protected: requires logged in user)
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { category, lat, lng, sector } = req.body;

    if (!category || lat == null || lng == null) {
      return res.status(400).json({ error: "category, lat, lng are required" });
    }

    const now = new Date().toISOString();

    // Find nearby duplicate (same category within 120m)
    const all = await Incident.find({ category, status: { $ne: "Resolved" } });
    const duplicate = all.find(
      (inc) => distanceKm(lat, lng, inc.lat, inc.lng) <= 0.12
    );

    if (duplicate) {
      duplicate.reports += 1;
      duplicate.priority = Math.min(5, duplicate.priority + 1);
      duplicate.status = "Active";
      duplicate.updated = now;
      await duplicate.save();
      return res.json({ merged: true, incident: duplicate });
    }

    // Safe ID: use max existing numeric suffix + 1 to avoid collision after deletes
    const all2 = await Incident.find({}, { incidentId: 1 });
    const maxNum = all2.reduce((max, inc) => {
      const n = parseInt(inc.incidentId.replace("INC-", ""), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 1029);

    const newIncident = await Incident.create({
      incidentId: `INC-${maxNum + 1}`,
      category,
      sector: sector || "Near you",
      lat,
      lng,
      reports: 1,
      priority: 1,
      status: "Active",
      updated: now,
    });

    res.status(201).json({ merged: false, incident: newIncident });
  } catch (err) {
    res.status(500).json({ error: "Failed to create incident" });
  }
});

// PATCH /api/incidents/:id/resolve (protected: requires admin user)
router.patch("/:id/resolve", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const incident = await Incident.findOneAndUpdate(
      { incidentId: req.params.id },
      { status: "Resolved", updated: new Date().toISOString() },
      { new: true }
    );
    if (!incident) return res.status(404).json({ error: "Not found" });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve incident" });
  }
});

// PATCH /api/incidents/:id/status (protected: requires admin user)
router.patch("/:id/status", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!["Active", "In progress", "Resolved"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const incident = await Incident.findOneAndUpdate(
      { incidentId: req.params.id },
      { status, updated: new Date().toISOString() },
      { new: true }
    );
    if (!incident) return res.status(404).json({ error: "Not found" });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

// PATCH /api/incidents/:id/priority (protected: requires admin user)
router.patch("/:id/priority", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const priority = Number(req.body.priority);
    if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
      return res.status(400).json({ error: "priority must be an integer 1–5" });
    }
    const incident = await Incident.findOneAndUpdate(
      { incidentId: req.params.id },
      { priority, updated: new Date().toISOString() },
      { new: true }
    );
    if (!incident) return res.status(404).json({ error: "Not found" });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: "Failed to update priority" });
  }
});

// DELETE /api/incidents/:id (protected: requires admin user)
router.delete("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const incident = await Incident.findOneAndDelete({ incidentId: req.params.id });
    if (!incident) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete incident" });
  }
});

export default router;
