import express, { Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { authenticate, requireRole, requirePasswordChangeCompleted } from "../middleware/auth.js";

export const staffRouter = express.Router();

// Enforce authentication, password change check, and role (STAFF or ADMIN)
staffRouter.use(authenticate);
staffRouter.use(requirePasswordChangeCompleted);
staffRouter.use(requireRole("STAFF", "ADMIN"));

// ---------------------------------------------------------------------------
// GET /api/staff/queue — IT Staff Ticket Queue with search, filter, sort, pagination
// ---------------------------------------------------------------------------
staffRouter.get("/queue", async (req: Request, res: Response) => {
  try {
    const {
      search,
      categoryId,
      relatedSystemId,
      priority,
      requestedPriority,
      itPriority,
      status,
      ownerId,
      quickFilter,
      sort = "createdAt",
      order = "desc",
      page = "1",
      limit = "10",
      pageSize,
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitParam = pageSize || limit;
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limitParam), 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // 1. Quick KPI Filter presets
    if (quickFilter === "unassigned") {
      where.ownerId = null;
    } else if (quickFilter === "my") {
      where.ownerId = req.user!.id;
    } else if (quickFilter === "in-progress") {
      where.currentStatus = "IN_PROGRESS";
    } else if (quickFilter === "resolved") {
      where.currentStatus = "RESOLVED";
    }

    // 2. Owner filter (overrides quickFilter if explicitly set)
    if (ownerId !== undefined && ownerId !== "") {
      if (ownerId === "unassigned" || ownerId === "null") {
        where.ownerId = null;
      } else if (ownerId === "me") {
        where.ownerId = req.user!.id;
      } else if (!isNaN(Number(ownerId))) {
        where.ownerId = Number(ownerId);
      }
    }

    // 3. Category filter
    if (categoryId && !isNaN(Number(categoryId))) {
      where.categoryId = Number(categoryId);
    }

    // 4. Related system filter
    if (relatedSystemId && !isNaN(Number(relatedSystemId))) {
      where.relatedSystemId = Number(relatedSystemId);
    }

    // 5. Status filter (supports single or comma-separated list)
    if (status && typeof status === "string" && status.trim()) {
      const statuses = status
        .split(",")
        .map((s) => s.trim().toUpperCase())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter(Boolean) as any[];
      if (statuses.length === 1) {
        where.currentStatus = statuses[0];
      } else if (statuses.length > 1) {
        where.currentStatus = { in: statuses };
      }
    }

    // 6. Priority filter
    if (itPriority && ["LOW", "MEDIUM", "HIGH"].includes(String(itPriority).toUpperCase())) {
      where.itPriority = String(itPriority).toUpperCase();
    }
    if (requestedPriority && ["LOW", "MEDIUM", "HIGH"].includes(String(requestedPriority).toUpperCase())) {
      where.requestedPriority = String(requestedPriority).toUpperCase();
    }
    if (
      priority &&
      !itPriority &&
      !requestedPriority &&
      ["LOW", "MEDIUM", "HIGH"].includes(String(priority).toUpperCase())
    ) {
      const prio = String(priority).toUpperCase();
      where.OR = [
        { itPriority: prio },
        { requestedPriority: prio },
      ];
    }

    // 7. Search keyword across ticketNumber, summary, description, and requester name/email
    if (search && typeof search === "string" && search.trim() !== "") {
      const term = search.trim();
      const searchConditions = [
        { ticketNumber: { contains: term, mode: "insensitive" } },
        { summary: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { requester: { name: { contains: term, mode: "insensitive" } } },
        { requester: { email: { contains: term, mode: "insensitive" } } },
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    // 8. Sorting
    const sortOrder: "asc" | "desc" = String(order).toLowerCase() === "asc" ? "asc" : "desc";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { createdAt: sortOrder };

    const sortKey = String(sort).toLowerCase();
    switch (sortKey) {
      case "ticketnumber":
        orderBy = { ticketNumber: sortOrder };
        break;
      case "createdat":
        orderBy = { createdAt: sortOrder };
        break;
      case "updatedat":
        orderBy = { updatedAt: sortOrder };
        break;
      case "summary":
        orderBy = { summary: sortOrder };
        break;
      case "category":
        orderBy = { category: { name: sortOrder } };
        break;
      case "system":
      case "relatedsystem":
        orderBy = { relatedSystem: { name: sortOrder } };
        break;
      case "requestedpriority":
        orderBy = { requestedPriority: sortOrder };
        break;
      case "itpriority":
        orderBy = { itPriority: sortOrder };
        break;
      case "status":
      case "currentstatus":
        orderBy = { currentStatus: sortOrder };
        break;
      case "owner":
        orderBy = { owner: { name: sortOrder } };
        break;
      default:
        orderBy = { createdAt: sortOrder };
    }

    const prisma = getPrisma();

    // 9. Execute queries in parallel
    const [total, tickets, allCount, unassignedCount, myCount, inProgressCount] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.ticket.count(),
      prisma.ticket.count({ where: { ownerId: null } }),
      prisma.ticket.count({ where: { ownerId: req.user!.id } }),
      prisma.ticket.count({ where: { currentStatus: "IN_PROGRESS" } }),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      data: tickets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
      summaryCounts: {
        all: allCount,
        unassigned: unassignedCount,
        myTickets: myCount,
        inProgress: inProgressCount,
      },
    });
  } catch (err) {
    console.error("Failed to fetch staff ticket queue:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch staff ticket queue",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/staff/tickets/:id — Retrieve single ticket details for staff operations
// ---------------------------------------------------------------------------
staffRouter.get("/tickets/:id", async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Ticket ID must be a valid integer",
        },
      });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        relatedSystem: true,
        requester: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
        attachments: {
          orderBy: { createdAt: "asc" },
        },
        publicComments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
        },
        internalNotes: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found",
        },
      });
    }

    return res.status(200).json(ticket);
  } catch (err) {
    console.error("Failed to fetch staff ticket detail:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch ticket detail",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/staff/assignees — Retrieve active IT Staff and Admin members
// ---------------------------------------------------------------------------
staffRouter.get("/assignees", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const staffMembers = await prisma.user.findMany({
      where: {
        role: { in: ["STAFF", "ADMIN"] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    return res.status(200).json(staffMembers);
  } catch (err) {
    console.error("Failed to fetch staff assignees:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch staff assignees",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/staff/tickets/:id/claim — Claim ticket ownership
// ---------------------------------------------------------------------------
staffRouter.patch("/tickets/:id/claim", async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Ticket ID must be a valid integer",
        },
      });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found",
        },
      });
    }

    // Auto-advance status to OPEN if previously NEW (BR-09, AC-09)
    const newStatus = ticket.currentStatus === "NEW" ? "OPEN" : ticket.currentStatus;

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ownerId: req.user!.id,
        currentStatus: newStatus,
      },
      include: {
        category: true,
        relatedSystem: true,
        requester: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
        attachments: { orderBy: { createdAt: "asc" } },
        publicComments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
        internalNotes: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error("Failed to claim ticket:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to claim ticket",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/staff/tickets/:id/assign — Assign/reassign ticket to an active staff
// ---------------------------------------------------------------------------
staffRouter.patch("/tickets/:id/assign", async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Ticket ID must be a valid integer",
        },
      });
    }

    const { ownerId } = req.body;
    const prisma = getPrisma();

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found",
        },
      });
    }

    // Unassign ticket
    if (ownerId === null || ownerId === undefined || ownerId === "") {
      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: { ownerId: null },
        include: {
          category: true,
          relatedSystem: true,
          requester: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } },
          attachments: { orderBy: { createdAt: "asc" } },
          publicComments: {
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, name: true, role: true } } },
          },
          internalNotes: {
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, name: true, role: true } } },
          },
        },
      });
      return res.status(200).json(updated);
    }

    const targetOwnerId = Number(ownerId);
    if (isNaN(targetOwnerId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Owner ID must be a valid integer or null",
        },
      });
    }

    // Verify target user is active and has role STAFF or ADMIN (BR-11, AC-09)
    const targetUser = await prisma.user.findUnique({
      where: { id: targetOwnerId },
    });

    if (!targetUser || !targetUser.isActive || !["STAFF", "ADMIN"].includes(targetUser.role)) {
      return res.status(400).json({
        error: {
          code: "TARGET_USER_NOT_STAFF",
          message: "Ticket owner must be an active IT Staff or Administrator account",
        },
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { ownerId: targetOwnerId },
      include: {
        category: true,
        relatedSystem: true,
        requester: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
        attachments: { orderBy: { createdAt: "asc" } },
        publicComments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
        internalNotes: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error("Failed to assign ticket:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to assign ticket",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/staff/tickets/:id/priority — Adjust IT Priority
// ---------------------------------------------------------------------------
staffRouter.patch("/tickets/:id/priority", async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Ticket ID must be a valid integer",
        },
      });
    }

    const { itPriority } = req.body;
    if (!itPriority || !["LOW", "MEDIUM", "HIGH"].includes(String(itPriority).toUpperCase())) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "IT Priority must be one of LOW, MEDIUM, HIGH",
        },
      });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found",
        },
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { itPriority: String(itPriority).toUpperCase() as any },
      include: {
        category: true,
        relatedSystem: true,
        requester: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
        attachments: { orderBy: { createdAt: "asc" } },
        publicComments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
        internalNotes: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error("Failed to update IT priority:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update IT priority",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// Permitted Status Transition Matrix (BR-09)
// ---------------------------------------------------------------------------
const PERMITTED_STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ["OPEN", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CLOSED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  CANCELLED: [],
};

// ---------------------------------------------------------------------------
// PATCH /api/staff/tickets/:id/status — Progress ticket status per state machine
// ---------------------------------------------------------------------------
staffRouter.patch("/tickets/:id/status", async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Ticket ID must be a valid integer",
        },
      });
    }

    const { status, resolutionSummary } = req.body;
    if (!status || typeof status !== "string") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Target status is required",
        },
      });
    }

    const targetStatus = status.trim().toUpperCase();
    const validStatuses = [
      "NEW",
      "OPEN",
      "IN_PROGRESS",
      "WAITING_FOR_REQUESTER",
      "RESOLVED",
      "CLOSED",
      "REOPENED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(targetStatus)) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATUS",
          message: `Status must be one of: ${validStatuses.join(", ")}`,
        },
      });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found",
        },
      });
    }

    // Check transition validity
    const allowed = PERMITTED_STATUS_TRANSITIONS[ticket.currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATUS_TRANSITION",
          message: `Cannot transition status from ${ticket.currentStatus} to ${targetStatus}`,
        },
      });
    }

    // Check resolution summary requirement for RESOLVED or CLOSED (BR-10, AC-12)
    const isResolutionRequired = targetStatus === "RESOLVED" || targetStatus === "CLOSED";
    const resolvedText =
      typeof resolutionSummary === "string" ? resolutionSummary.trim() : ticket.resolutionSummary?.trim() || "";

    if (isResolutionRequired && resolvedText.length < 5) {
      return res.status(400).json({
        error: {
          code: "RESOLUTION_SUMMARY_REQUIRED",
          message: "A resolution summary of at least 5 characters is required when resolving or closing a ticket",
        },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      currentStatus: targetStatus,
    };

    if (typeof resolutionSummary === "string") {
      updateData.resolutionSummary = resolutionSummary.trim();
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        category: true,
        relatedSystem: true,
        requester: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
        attachments: { orderBy: { createdAt: "asc" } },
        publicComments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
        internalNotes: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error("Failed to update ticket status:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update ticket status",
      },
    });
  }
});

