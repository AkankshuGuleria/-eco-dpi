import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "eco-dpi-super-secret-jwt-key-2026";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No authentication token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

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

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const adminEmail = process.env.ADMIN_EMAIL || "akankshuguleria2000@gmail.com";
  const userIdentity = req.user.email || req.user.identity || "";

  if (userIdentity.toLowerCase() === adminEmail.toLowerCase() || req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }
}
