import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

const DEFAULT_JWT_SECRET = "eco-dpi-super-secret-jwt-key-2026";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === DEFAULT_JWT_SECRET || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set to a strong value in production");
    }
    return DEFAULT_JWT_SECRET;
  }
  return secret;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser | undefined;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No authentication token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found or session invalid" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  const userIdentity = req.user.email || req.user.identity || "";

  if (adminEmail && userIdentity.toLowerCase() === adminEmail) {
    next();
  } else {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }
}
