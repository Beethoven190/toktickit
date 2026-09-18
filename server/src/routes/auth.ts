import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getPrisma } from "../prisma.js";
import {
  authenticate,
  signToken,
  revokedTokens,
  AuthUser,
} from "../middleware/auth.js";

export const authRouter = Router();

// ---------------------------------------------------------------------------
// POST /api/auth/login (AC-01, BR-01)
// ---------------------------------------------------------------------------
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const errors: Record<string, string> = {};

    if (!email || typeof email !== "string" || !email.trim()) {
      errors.email = "Email is required";
    }

    if (!password || typeof password !== "string") {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          fields: errors,
        },
      });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: {
          code: "ACCOUNT_INACTIVE",
          message: "Account is inactive. Please contact an administrator.",
        },
      });
    }

    const safeUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      isActive: user.isActive,
    };

    const token = signToken(safeUser);

    return res.status(200).json({
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred during login.",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout (Revoke token)
// ---------------------------------------------------------------------------
authRouter.post("/logout", authenticate, (req: Request, res: Response) => {
  if (req.token) {
    revokedTokens.add(req.token);
  }
  return res.status(200).json({
    message: "Logged out successfully.",
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me (Current user session)
// ---------------------------------------------------------------------------
authRouter.get("/me", authenticate, (req: Request, res: Response) => {
  return res.status(200).json({
    user: req.user,
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/change-password (AC-02, BR-02, BR-06)
// ---------------------------------------------------------------------------
authRouter.post("/change-password", authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const errors: Record<string, string> = {};

    if (!currentPassword || typeof currentPassword !== "string") {
      errors.currentPassword = "Current password is required";
    }

    if (!newPassword || typeof newPassword !== "string") {
      errors.newPassword = "New password is required";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          fields: errors,
        },
      });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "User not found.",
        },
      });
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Incorrect current password.",
          fields: {
            currentPassword: "The current password you provided is incorrect.",
          },
        },
      });
    }

    // Password Complexity Rules (BR-06):
    // Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
    const minLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!minLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Password does not meet complexity requirements.",
          fields: {
            newPassword:
              "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.",
          },
        },
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "New password must be different from current password.",
          fields: {
            newPassword: "New password cannot be the same as your current password.",
          },
        },
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
      },
    });

    return res.status(200).json({
      message: "Password changed successfully.",
      mustChangePassword: false,
      user: updated,
    });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while changing password.",
      },
    });
  }
});
