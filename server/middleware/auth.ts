import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User.js";
import { getJwtSecret } from "../lib/env.js";

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

    const token = authHeader.slice("Bearer ".length).trim();
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found or session invalid" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Role is read from the database on every request, so revoking admin access
 * takes effect immediately. Never rely on the client-side role.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({ error: "Access denied. Admin role required." });
}
