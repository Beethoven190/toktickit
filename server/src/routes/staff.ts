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
