import { Router, Request, Response } from "express";
import Announcement from "../models/Announcement.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/announcements — public list of approved announcements (what the hero shows)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const items = await Announcement.find({ status: "approved" }).sort({ eventDate: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

// GET /api/announcements/all — admin: every announcement (pending + approved + rejected)
router.get("/all", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const items = await Announcement.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

// POST /api/announcements — admin creates an announcement (starts as pending, needs approval)
router.post("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, message, type, eventDate, eventTime, location } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: "title and message are required" });
    }
    const validType = ["event", "notice", "alert", "update"].includes(type) ? type : "notice";
    const item = await Announcement.create({
      title: String(title).trim(),
      message: String(message).trim(),
      type: validType,
      eventDate: eventDate || undefined,
      eventTime: eventTime || undefined,
      location: location ? String(location).trim() : undefined,
      createdBy: req.user?.email || undefined,
      // Auto-approve if no eventDate (simple notice); events start pending for admin approval.
      status: validType === "event" ? "pending" : "approved",
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to create announcement" });
  }
});

// PATCH /api/announcements/:id/approve — admin approves a pending announcement
router.patch("/:id/approve", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const item = await Announcement.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to approve announcement" });
  }
});

// PATCH /api/announcements/:id/reject — admin rejects a pending announcement
router.patch("/:id/reject", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const item = await Announcement.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to reject announcement" });
  }
});

// DELETE /api/announcements/:id — admin deletes an announcement
router.delete("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const item = await Announcement.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete announcement" });
  }
});

export default router;
