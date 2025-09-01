import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "user" | "admin";
  };
}

export function generateToken(user: { id: string; email: string; role: "user" | "admin" }): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { id: string; email: string; role: "user" | "admin" } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: "user" | "admin" };
  } catch {
    return null;
  }
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }

  const user = await storage.getUser(decoded.id);
  if (!user || !user.isActive) {
    return res.status(403).json({ message: "User not found or inactive" });
  }

  req.user = decoded;
  next();
}

export async function authenticateAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  await authenticateToken(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
}
