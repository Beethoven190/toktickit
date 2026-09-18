import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getPrisma } from "../prisma.js";
import { authenticate, requireRole, requirePasswordChangeCompleted } from "../middleware/auth.js";

export const adminRouter = express.Router();

// Enforce authentication, password change check, and ADMIN role across all /api/admin routes
adminRouter.use(authenticate);
adminRouter.use(requirePasswordChangeCompleted);
adminRouter.use(requireRole("ADMIN"));

/**
 * Validates password complexity:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 * - At least 1 special character
 */
export function validatePasswordComplexity(password: string): boolean {
  if (!password || typeof password !== "string") return false;
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
}

// ---------------------------------------------------------------------------
// GET /api/admin/users — List users with search, role, status filters, pagination
// ---------------------------------------------------------------------------
adminRouter.get("/users", async (req: Request, res: Response) => {
  try {
    const {
      search,
      role,
      isActive,
      sort = "id",
      order = "asc",
      page,
      limit,
      pageSize,
      paginate,
    } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // 1. Keyword search (name or email)
    if (search && String(search).trim() !== "") {
      const term = String(search).trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
    }

    // 2. Role filter
    if (role && ["REQUESTER", "STAFF", "ADMIN"].includes(String(role).toUpperCase())) {
      where.role = String(role).toUpperCase();
    }

    // 3. Active status filter
    if (isActive !== undefined && isActive !== "") {
      const activeStr = String(isActive).toLowerCase();
      if (activeStr === "true") {
        where.isActive = true;
      } else if (activeStr === "false") {
        where.isActive = false;
      }
    }

    // 4. Sorting
    const sortOrder: "asc" | "desc" = String(order).toLowerCase() === "desc" ? "desc" : "asc";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { id: sortOrder };
    const sortField = String(sort).toLowerCase();
    switch (sortField) {
      case "name":
        orderBy = { name: sortOrder };
        break;
      case "email":
        orderBy = { email: sortOrder };
        break;
      case "role":
        orderBy = { role: sortOrder };
        break;
      case "status":
      case "isactive":
        orderBy = { isActive: sortOrder };
        break;
      case "createdat":
        orderBy = { createdAt: sortOrder };
        break;
      case "updatedat":
        orderBy = { updatedAt: sortOrder };
        break;
      default:
        orderBy = { id: sortOrder };
    }

    const prisma = getPrisma();
    const selectFields = {
      id: true,
      name: true,
      email: true,
      role: true,
      mustChangePassword: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    };

    const shouldPaginate = paginate === "true" || page !== undefined;
    const total = await prisma.user.count({ where });

    if (shouldPaginate) {
      const pageNum = Math.max(1, parseInt(String(page || 1), 10) || 1);
      const limitParam = pageSize || limit || 10;
      const limitNum = Math.max(1, Math.min(100, parseInt(String(limitParam), 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      const users = await prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        select: selectFields,
      });

      const totalPages = Math.ceil(total / limitNum) || 1;

      res.setHeader("X-Total-Count", String(total));
      return res.status(200).json({
        data: users,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
        },
      });
    }

    // Default: return user array (AC-15, api-spec 6.1)
    const users = await prisma.user.findMany({
      where,
      orderBy,
      select: selectFields,
    });

    res.setHeader("X-Total-Count", String(total));
    return res.status(200).json(users);
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to retrieve user accounts",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/users/:id — Retrieve single user details
// ---------------------------------------------------------------------------
adminRouter.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "User ID must be an integer" },
      });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "User not found" },
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Failed to fetch user by id:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch user" },
    });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/users — Create new user account with initial credentials (AC-16)
// ---------------------------------------------------------------------------
adminRouter.post("/users", async (req: Request, res: Response) => {
  try {
    const { name, email, role, isActive = true, initialPassword } = req.body;

    // 1. Validate required fields
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Full name is required" },
      });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Valid email address is required" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!role || !["REQUESTER", "STAFF", "ADMIN"].includes(role)) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Role must be REQUESTER, STAFF, or ADMIN" },
      });
    }

    // 2. Validate password complexity
    if (!initialPassword || !validatePasswordComplexity(initialPassword)) {
      return res.status(400).json({
        error: {
          code: "INVALID_PASSWORD",
          message:
            "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
        },
      });
    }

    const prisma = getPrisma();

    // 3. Unique email check
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return res.status(409).json({
        error: { code: "EMAIL_EXISTS", message: "Email address is already registered" },
      });
    }

    // 4. Hash password with bcrypt cost 12
    const passwordHash = await bcrypt.hash(initialPassword, 12);

    // 5. Create user with mustChangePassword = true
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
        isActive: isActive !== false,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json(newUser);
  } catch (error) {
    console.error("Failed to create user:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to create user account" },
    });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/users/:id — Update user profile, role, and active status (AC-17, AC-18)
// ---------------------------------------------------------------------------
adminRouter.patch("/users/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "User ID must be an integer" },
      });
    }

    const prisma = getPrisma();
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "User not found" },
      });
    }

    const { name, email, role, isActive } = req.body;

    // --- Safety Guard 1: BR-13 Self-Protection (AC-17) ---
    // Admin cannot deactivate or demote their own account
    if (req.user!.id === targetUser.id) {
      if (isActive === false) {
        return res.status(400).json({
          error: {
            code: "SELF_DEACTIVATION_PREVENTED",
            message: "Administrators cannot deactivate their own account.",
          },
        });
      }
      if (role !== undefined && role !== "ADMIN") {
        return res.status(400).json({
          error: {
            code: "SELF_DEMOTION_PREVENTED",
            message: "Administrators cannot change their own role.",
          },
        });
      }
    }

    // --- Safety Guard 2: BR-14 Last Active Administrator Protection (AC-18) ---
    // Cannot deactivate or demote the last remaining active Administrator
    if (targetUser.role === "ADMIN" && targetUser.isActive) {
      const isDeactivating = isActive === false;
      const isDemoting = role !== undefined && role !== "ADMIN";

      if (isDeactivating || isDemoting) {
        const activeAdminsCount = await prisma.user.count({
          where: { role: "ADMIN", isActive: true },
        });

        if (activeAdminsCount <= 1) {
          return res.status(400).json({
            error: {
              code: "LAST_ACTIVE_ADMINISTRATOR",
              message: "Cannot deactivate or demote the last remaining active Administrator.",
            },
          });
        }
      }
    }

    // --- Safety Guard 3: BR-15 Ticket Ownership Safety ---
    // Cannot deactivate or demote to REQUESTER if user currently owns non-final tickets
    if (isActive === false || role === "REQUESTER") {
      const activeTicketsCount = await prisma.ticket.count({
        where: {
          ownerId: targetUser.id,
          currentStatus: { notIn: ["CLOSED", "CANCELLED"] },
        },
      });

      if (activeTicketsCount > 0) {
        return res.status(400).json({
          error: {
            code: "USER_OWNS_ACTIVE_TICKETS",
            message:
              "Cannot deactivate or change role to Requester while user owns active tickets. Reassign tickets first.",
          },
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Name cannot be empty" },
        });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail.includes("@")) {
        return res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Valid email is required" },
        });
      }
      if (normalizedEmail !== targetUser.email) {
        const existing = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (existing && existing.id !== targetUser.id) {
          return res.status(409).json({
            error: { code: "EMAIL_EXISTS", message: "Email address is already in use" },
          });
        }
        updateData.email = normalizedEmail;
      }
    }

    if (role !== undefined) {
      if (!["REQUESTER", "STAFF", "ADMIN"].includes(role)) {
        return res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Role must be REQUESTER, STAFF, or ADMIN" },
        });
      }
      updateData.role = role;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to update user profile" },
    });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/users/:id/reset-password — Reset user password with mandatory change (AC-19)
// ---------------------------------------------------------------------------
adminRouter.post("/users/:id/reset-password", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "User ID must be an integer" },
      });
    }

    const prisma = getPrisma();
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "User not found" },
      });
    }

    const { initialPassword } = req.body;
    if (!initialPassword || !validatePasswordComplexity(initialPassword)) {
      return res.status(400).json({
        error: {
          code: "INVALID_PASSWORD",
          message:
            "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
        },
      });
    }

    const passwordHash = await bcrypt.hash(initialPassword, 12);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "Password reset successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Failed to reset password:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to reset initial password" },
    });
  }
});
