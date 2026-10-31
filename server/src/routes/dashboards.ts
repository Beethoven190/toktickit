import express, { Request, Response } from "express";
import { authenticate, requireRole, requirePasswordChangeCompleted } from "../middleware/auth.js";
import { getPrisma } from "../prisma.js";

export const dashboardRouter = express.Router();

dashboardRouter.use(authenticate);
dashboardRouter.use(requirePasswordChangeCompleted);

// ---------------------------------------------------------------------------
// 3.1 GET /api/dashboards/staff (Screen 8.1, FR-11, FR-12, BR-12, BR-14, BR-15, AC-04)
// ---------------------------------------------------------------------------
dashboardRouter.get("/staff", requireRole("STAFF", "ADMIN"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      newCount,
      openCount,
      inProgressCount,
      waitingCount,
      myAssignedCount,
      newYesterday,
      openYesterday,
      inProgressYesterday,
      waitingYesterday,
      myAssignedYesterday,
    ] = await Promise.all([
      prisma.ticket.count({ where: { currentStatus: "NEW" } }),
      prisma.ticket.count({ where: { currentStatus: "OPEN" } }),
      prisma.ticket.count({ where: { currentStatus: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { currentStatus: "WAITING_FOR_REQUESTER" } }),
      prisma.ticket.count({
        where: {
          ownerId: userId,
          currentStatus: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] },
        },
      }),
      // Day-over-day delta comparisons (BR-15)
      prisma.ticket.count({ where: { currentStatus: "NEW", createdAt: { gte: yesterday } } }),
      prisma.ticket.count({ where: { currentStatus: "OPEN", createdAt: { gte: yesterday } } }),
      prisma.ticket.count({ where: { currentStatus: "IN_PROGRESS", createdAt: { gte: yesterday } } }),
      prisma.ticket.count({ where: { currentStatus: "WAITING_FOR_REQUESTER", createdAt: { gte: yesterday } } }),
      prisma.ticket.count({
        where: {
          ownerId: userId,
          currentStatus: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] },
          createdAt: { gte: yesterday },
        },
      }),
    ]);

    const formatDelta = (count: number) => {
      if (count > 0) return `+${count} from yesterday`;
      if (count < 0) return `${count} from yesterday`;
      return "0 from yesterday";
    };

    // Recent tickets: Top 5 most recently updated
    const recentTickets = await prisma.ticket.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        category: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    const formattedRecent = recentTickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      category: t.category?.name || "General",
      status: t.currentStatus,
      itPriority: t.itPriority || t.requestedPriority,
      ownerName: t.owner?.name || "Unassigned",
      updatedAt: t.updatedAt.toISOString(),
    }));

    return res.status(200).json({
      user: {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role,
      },
      metrics: {
        new: {
          count: newCount,
          delta: formatDelta(newYesterday),
        },
        open: {
          count: openCount,
          delta: formatDelta(openYesterday),
        },
        inProgress: {
          count: inProgressCount,
          delta: formatDelta(inProgressYesterday),
        },
        waitingForRequester: {
          count: waitingCount,
          delta: formatDelta(waitingYesterday),
        },
        myAssigned: {
          count: myAssignedCount,
          delta: formatDelta(myAssignedYesterday),
        },
      },
      recentTickets: formattedRecent,
    });
  } catch (err) {
    console.error("Failed to fetch staff dashboard:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch staff dashboard metrics",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// 3.2 GET /api/dashboards/requester (Screen 8.2, FR-13, FR-14, BR-12, BR-13, AC-05)
// ---------------------------------------------------------------------------
dashboardRouter.get("/requester", requireRole("REQUESTER", "ADMIN"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;

    // Authoritative counts strictly scoped to requester's tickets (BR-13, AC-05)
    const [myOpenCount, inProgressCount, resolvedCount, closedCount] = await Promise.all([
      prisma.ticket.count({ where: { requesterId: userId, currentStatus: "OPEN" } }),
      prisma.ticket.count({ where: { requesterId: userId, currentStatus: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { requesterId: userId, currentStatus: "RESOLVED" } }),
      prisma.ticket.count({ where: { requesterId: userId, currentStatus: "CLOSED" } }),
    ]);

    // Recent tickets for requester
    const recentTickets = await prisma.ticket.findMany({
      where: { requesterId: userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    const formattedRecent = recentTickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      category: t.category?.name || "General",
      status: t.currentStatus,
      requestedPriority: t.requestedPriority,
      updatedAt: t.updatedAt.toISOString(),
    }));

    return res.status(200).json({
      user: {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role,
      },
      metrics: {
        myOpen: {
          count: myOpenCount,
          label: "My Open Tickets",
        },
        inProgress: {
          count: inProgressCount,
          label: "In Progress",
        },
        resolved: {
          count: resolvedCount,
          label: "Resolved",
        },
        closed: {
          count: closedCount,
          label: "Closed",
        },
      },
      recentTickets: formattedRecent,
    });
  } catch (err) {
    console.error("Failed to fetch requester dashboard:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch requester dashboard metrics",
      },
    });
  }
});

