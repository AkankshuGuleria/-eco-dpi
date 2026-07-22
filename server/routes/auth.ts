import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import OtpSession from "../models/OtpSession.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const DEFAULT_JWT_SECRET = "eco-dpi-super-secret-jwt-key-2026";

function isDev() {
  return process.env.NODE_ENV !== "production";
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === DEFAULT_JWT_SECRET || secret.length < 32) {
    if (!isDev()) throw new Error("JWT_SECRET must be set to a strong value in production");
    return DEFAULT_JWT_SECRET;
  }
  return secret;
}

function getAdminEmail() {
  return (process.env.ADMIN_EMAIL || "").toLowerCase();
}

// ── Twilio (optional) — only active when credentials are in .env ───────────────
async function createTwilioClient() {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const phone = process.env.TWILIO_PHONE;
  if (
    !sid   || sid   === "your_twilio_account_sid_here"   ||
    !token || token === "your_twilio_auth_token_here"     ||
    !phone || phone === "+1234567890"
  ) return null;

  try {
    const twilioModule = await import("twilio");
    const twilioFn = (twilioModule as any).default || twilioModule;
    return twilioFn(sid, token);
  } catch {
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function generateToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "7d" });
}

function determineRole(email?: string, identity?: string): "admin" | "citizen" {
  const target = (email || identity || "").toLowerCase();
  const adminEmail = getAdminEmail();
  return adminEmail && target === adminEmail ? "admin" : "citizen";
}

/** Normalise phone: strip spaces/dashes, ensure leading + */
function normalisePhone(raw: string): string {
  let p = raw.replace(/[\s\-().]/g, "");
  if (!p.startsWith("+")) p = "+91" + p.replace(/^0/, ""); // default India (+91)
  return p;
}

// ── SMS dispatch: Twilio → console fallback ───────────────────────────────────
async function sendSmsOtp(
  phone: string,
  otp: string
): Promise<"sms" | "console"> {
  const client = await createTwilioClient();

  if (client) {
    await client.messages.create({
      body: `Your Eco-DPI login code is: ${otp}. Valid for 10 minutes. Do not share.`,
      from: process.env.TWILIO_PHONE,
      to: phone,
    });
    return "sms";
  }

  if (!isDev()) {
    throw new Error("Twilio SMS is not configured");
  }

  // Dev fallback — print to server console
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[SMS OTP — DEV]  Phone: ${phone}   →   OTP: ${otp}`);
  console.log(`${"=".repeat(60)}\n`);
  return "console";
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(400).json({ error: "User already exists with this email" });

    const passwordHash = await bcrypt.hash(password, 10);
    const role = determineRole(email);

    const user = await User.create({
      email: email.toLowerCase(),
      identity: email.toLowerCase(),
      passwordHash,
      role,
    });

    const token = generateToken(user._id.toString());
    res.status(201).json({ token, user });
  } catch (err) {
    console.error("[auth] register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ── POST /api/auth/login/password ─────────────────────────────────────────────
router.post("/login/password", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash)
      return res.status(400).json({ error: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match)
      return res.status(400).json({ error: "Invalid email or password" });

    const currentRole = determineRole(user.email);
    if (user.role !== currentRole) { user.role = currentRole; await user.save(); }

    const token = generateToken(user._id.toString());
    res.json({ token, user });
  } catch (err) {
    console.error("[auth] login/password error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ── POST /api/auth/otp/send ───────────────────────────────────────────────────
// Body: { phone: "+919876543210" }
// • Sends real SMS if Twilio is configured in .env
// • Falls back to console log + returns devOtp in response (dev mode only)
router.post("/otp/send", async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone || String(phone).trim() === "")
      return res.status(400).json({ error: "Phone number is required" });

    const normalised = normalisePhone(String(phone));

    // Basic sanity check — must be 10–15 digits after normalisation
    const digits = normalised.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15)
      return res.status(400).json({ error: "Please enter a valid phone number (10–15 digits)" });

    // Generate 6-digit OTP
    const otp       = crypto.randomInt(100000, 1000000).toString();
    const otpHash   = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert OTP session
    await OtpSession.findOneAndUpdate(
      { phone: normalised },
      { otp: otpHash, expiresAt },
      { upsert: true, new: true }
    );

    const delivery = await sendSmsOtp(normalised, otp);

    const payload: Record<string, unknown> = {
      message:
        delivery === "sms"
          ? `OTP sent to ${normalised} via SMS.`
          : "OTP generated (Twilio not configured). Check server console.",
      delivery,
      phone: normalised,
    };

    // Dev mode: expose OTP in response so it can be shown in the UI
    if (isDev() && delivery === "console") {
      payload.devOtp  = otp;
      payload.devNote = "DEV MODE — Twilio not configured. OTP shown in response for testing.";
    }

    res.json(payload);
  } catch (err) {
    console.error("[auth] otp/send error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ── POST /api/auth/otp/verify ─────────────────────────────────────────────────
// Body: { phone, otp }
router.post("/otp/verify", async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp)
      return res.status(400).json({ error: "Phone number and OTP are required" });

    const normalised = normalisePhone(String(phone));
    const session    = await OtpSession.findOne({ phone: normalised });

    if (!session || session.expiresAt < new Date())
      return res.status(400).json({ error: "Invalid or expired OTP" });

    const otpMatches = await bcrypt.compare(String(otp), session.otp);
    if (!otpMatches)
      return res.status(400).json({ error: "Invalid or expired OTP" });

    // Delete used session immediately
    await OtpSession.deleteOne({ _id: session._id });

    // Find or auto-create user by phone
    let user = await User.findOne({ phone: normalised });
    if (!user) {
      user = await User.create({
        phone: normalised,
        identity: normalised,
        role: "citizen", // phone users are always citizens
      });
    }

    const token = generateToken(user._id.toString());
    res.json({ token, user });
  } catch (err) {
    console.error("[auth] otp/verify error:", err);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// ── POST /api/auth/google/verify (Real Google OAuth ID Token Verification) ──
router.post("/google/verify", async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Google ID Token is required" });
    }

    // Verify token with Google's public tokeninfo endpoint
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!googleRes.ok) {
      return res.status(401).json({ error: "Invalid or expired Google token" });
    }

    const payload = await googleRes.json();
    const { sub: googleId, email, email_verified } = payload;

    if (!email || (email_verified !== "true" && email_verified !== true)) {
      return res.status(400).json({ error: "Google account email is not verified" });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });
    const targetRole = determineRole(email);

    if (user) {
      let modified = false;
      if (!user.googleId)           { user.googleId = googleId;  modified = true; }
      if (user.role !== targetRole) { user.role     = targetRole; modified = true; }
      if (modified) await user.save();
    } else {
      user = await User.create({
        email: email.toLowerCase(),
        identity: email.toLowerCase(),
        googleId,
        role: targetRole,
      });
    }

    const token = generateToken(user._id.toString());
    res.json({ token, user });
  } catch (err) {
    console.error("[auth] google/verify error:", err);
    res.status(500).json({ error: "Google token verification failed" });
  }
});

// ── POST /api/auth/google/direct (Dev fallback) ────────────────────────────────
router.post("/google/direct", async (req: Request, res: Response) => {
  try {
    if (!isDev() && process.env.ALLOW_INSECURE_GOOGLE_DIRECT !== "true") {
      return res.status(501).json({ error: "Direct Google sign-in is disabled in production" });
    }

    const { email, googleId } = req.body;
    if (!email || !googleId)
      return res.status(400).json({ error: "Email and Google ID are required" });

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });
    const targetRole = determineRole(email);

    if (user) {
      let modified = false;
      if (!user.googleId)          { user.googleId = googleId;  modified = true; }
      if (user.role !== targetRole) { user.role     = targetRole; modified = true; }
      if (modified) await user.save();
    } else {
      user = await User.create({
        email: email.toLowerCase(),
        identity: email.toLowerCase(),
        googleId,
        role: targetRole,
      });
    }

    const token = generateToken(user._id.toString());
    res.json({ token, user });
  } catch (err) {
    console.error("[auth] google/direct error:", err);
    res.status(500).json({ error: "Google sign-in failed" });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;
