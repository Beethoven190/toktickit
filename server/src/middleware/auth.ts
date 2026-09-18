import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getPrisma } from "../prisma.js";

export const JWT_SECRET = process.env.JWT_SECRET || "toktickit-secret-jwt-key-sprint-3-2026";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "REQUESTER" | "STAFF" | "ADMIN";
  mustChangePassword: boolean;
  isActive: boolean;
}

// In-memory revocation set for invalidated tokens (logout)
export const revokedTokens = new Set<string>();

// Extend Express Request to include user & token
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      token?: string;
    }
  }
}

export function signToken(user: { id: number; email: string; role: string; name: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authorization header",
      },
    });
  }

  const token = authHeader.substring(7).trim();
  if (revokedTokens.has(token)) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Token has been revoked",
      },
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "User account is invalid or inactive",
        },
      });
    }

    req.user = user as AuthUser;
    req.token = token;
    next();
  } catch {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      },
    });
  }
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  if (revokedTokens.has(token)) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
      },
    });

    if (user && user.isActive) {
      req.user = user as AuthUser;
      req.token = token;
    }
  } catch {
    // Ignore invalid tokens in optional mode
  }
  next();
}

export function requireRole(...roles: ("REQUESTER" | "STAFF" | "ADMIN")[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this resource",
        },
      });
    }

    next();
  };
}

// Middleware to block normal operations if password change is pending (AC-02, BR-02)
export function requirePasswordChangeCompleted(req: Request, res: Response, next: NextFunction) {
  if (req.user && req.user.mustChangePassword) {
    return res.status(403).json({
      error: {
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "You must change your initial password before accessing application features.",
      },
    });
  }
  next();
}
