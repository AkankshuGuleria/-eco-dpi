import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import OtpSession from "../models/OtpSession";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "eco-dpi-super-secret-jwt-key-2026";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "akankshuguleria2000@gmail.com";

// Helper to generate JWT token
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

// Check admin role helper based on email or identity
function determineRole(email?: string, identity?: string): "admin" | "citizen" {
  const target = (email || identity || "").toLowerCase();
  return target === ADMIN_EMAIL.toLowerCase() ? "admin" : "citizen";
}

// POST /api/auth/register - email + password registration
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const role = determineRole(email);

    const user = await User.create({
      email: email.toLowerCase(),
      identity: email.toLowerCase(),
      passwordHash,
      role,
    });

    const token = generateToken(user._id as string);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login/password - email + password login
router.post("/login/password", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Double check/upgrade admin role on login
    const currentRole = determineRole(user.email);
    if (user.role !== currentRole) {
      user.role = currentRole;
      await user.save();
    }

    const token = generateToken(user._id as string);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/otp/send - Generate and send OTP to phone
router.post("/otp/send", async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Upsert OTP session
    await OtpSession.findOneAndUpdate(
      { phone },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Development OTP log
    console.log(`\n======================================================`);
    console.log(`[SMS OTP SIMULATION] Sending to ${phone}: OTP is: ${otp}`);
    console.log(`======================================================\n`);

    res.json({ message: "OTP sent successfully (Simulated)" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// POST /api/auth/otp/verify - Verify OTP and login/register user
router.post("/otp/verify", async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone and OTP are required" });
    }

    const session = await OtpSession.findOne({ phone });
    if (!session || session.otp !== otp || session.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Clear the OTP session
    await OtpSession.deleteOne({ _id: session._id });

    // Login/Register the user
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({
        phone,
        identity: phone,
        role: "citizen", // phone user is citizen by default
      });
    }

    const token = generateToken(user._id as string);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// POST /api/auth/google/direct - Direct Google Login
router.post("/google/direct", async (req: Request, res: Response) => {
  try {
    const { email, googleId, name } = req.body;
    if (!email || !googleId) {
      return res.status(400).json({ error: "Email and Google ID are required" });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });
    const targetRole = determineRole(email);

    if (user) {
      // Update googleId and role if necessary
      let modified = false;
      if (!user.googleId) { user.googleId = googleId; modified = true; }
      if (user.role !== targetRole) { user.role = targetRole; modified = true; }
      if (modified) await user.save();
    } else {
      user = await User.create({
        email: email.toLowerCase(),
        identity: email.toLowerCase(),
        googleId,
        role: targetRole,
      });
    }

    const token = generateToken(user._id as string);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Google sign-in failed" });
  }
});

// GET /api/auth/me - Get current user profile
router.get("/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
