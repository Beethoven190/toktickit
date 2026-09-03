import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
export const app = express();

app.use(cors());          // already wired: lets the Vite dev server call this API
app.use(express.json());

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

// ---------------------------------------------------------------------------
// Categories list
// ---------------------------------------------------------------------------
app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await getPrisma().category.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
    res.status(200).json(categories);
  } catch {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 2: Development Requesters list (active only)
// ---------------------------------------------------------------------------
app.get("/api/requesters", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().requesterUser.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true, email: true },
    });
    res.status(200).json(requesters);
  } catch {
    res.status(500).json({ error: "Failed to fetch requesters" });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 3: Related Systems list
// ---------------------------------------------------------------------------
app.get("/api/systems", async (_req: Request, res: Response) => {
  try {
    const systems = await getPrisma().relatedSystem.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
    res.status(200).json(systems);
  } catch {
    res.status(500).json({ error: "Failed to fetch systems" });
  }
});

// ---------------------------------------------------------------------------
// Ticket Number Generator: Format TKT-YYYY-XXXXXX (Rule BR-01)
// ---------------------------------------------------------------------------
export async function generateTicketNumber(): Promise<string> {
  const prisma = getPrisma();
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}-`;

  const latestTicket = await prisma.ticket.findFirst({
    where: {
      ticketNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      ticketNumber: "desc",
    },
    select: {
      ticketNumber: true,
    },
  });

  let nextSeq = 1;
  if (latestTicket) {
    const parts = latestTicket.ticketNumber.split("-");
    const num = parseInt(parts[2], 10);
    if (!isNaN(num)) {
      nextSeq = num + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(6, "0")}`;
}

// ---------------------------------------------------------------------------
// Lab 2 — Issue 3: Create Ticket (POST /api/tickets)
// ---------------------------------------------------------------------------
app.post("/api/tickets", async (req: Request, res: Response) => {
  try {
    const { requesterId, categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;

    const errors: Record<string, string> = {};

    if (!requesterId || typeof requesterId !== "number") {
      errors.requesterId = "Requester ID is required and must be a number";
    }

    if (!categoryId || typeof categoryId !== "number") {
      errors.categoryId = "Category ID is required and must be a number";
    }

    if (!relatedSystemId || typeof relatedSystemId !== "number") {
      errors.relatedSystemId = "Related System ID is required and must be a number";
    }

    const trimmedSummary = typeof summary === "string" ? summary.trim() : "";
    if (!trimmedSummary || trimmedSummary.length < 5 || trimmedSummary.length > 150) {
      errors.summary = "Summary is required and must be between 5 and 150 characters";
    }

    const trimmedDescription = typeof description === "string" ? description.trim() : "";
    if (!trimmedDescription || trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
      errors.description = "Description is required and must be between 10 and 2000 characters";
    }

    let priority: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
    if (requestedPriority) {
      const upperPriority = String(requestedPriority).toUpperCase();
      if (["LOW", "MEDIUM", "HIGH"].includes(upperPriority)) {
        priority = upperPriority as "LOW" | "MEDIUM" | "HIGH";
      } else {
        errors.requestedPriority = "Requested Priority must be LOW, MEDIUM, or HIGH";
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: "Validation failed", errors });
    }

    const prisma = getPrisma();

    // Verify relations exist in database
    const requester = await prisma.requesterUser.findUnique({ where: { id: requesterId } });
    if (!requester || !requester.isActive) {
      return res.status(400).json({ error: "Invalid or inactive requester user", errors: { requesterId: "Requester not found or inactive" } });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(400).json({ error: "Invalid category", errors: { categoryId: "Category not found" } });
    }

    const system = await prisma.relatedSystem.findUnique({ where: { id: relatedSystemId } });
    if (!system) {
      return res.status(400).json({ error: "Invalid related system", errors: { relatedSystemId: "Related system not found" } });
    }

    const ticketNumber = await generateTicketNumber();

    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber,
        requesterId,
        categoryId,
        relatedSystemId,
        summary: trimmedSummary,
        description: trimmedDescription,
        requestedPriority: priority,
        currentStatus: "NEW",
      },
      include: {
        category: true,
        relatedSystem: true,
        requester: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(newTicket);
  } catch (err) {
    console.error("Failed to create ticket:", err);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 4: My Tickets list with search, filter, sort, pagination,
// and strict Ownership Protection (Rule BR-05, AC-03, AC-07)
// ---------------------------------------------------------------------------
app.get("/api/tickets", async (req: Request, res: Response) => {
  try {
    const {
      requesterId,
      search,
      categoryId,
      priority,
      status,
      page = "1",
      limit = "10",
      sort = "createdAt",
      order = "desc",
    } = req.query;

    if (!requesterId) {
      return res.status(400).json({ error: "requesterId is required for ownership protection" });
    }

    const reqId = Number(requesterId);
    if (isNaN(reqId)) {
      return res.status(400).json({ error: "requesterId must be a number" });
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause ensuring STRICT ownership protection (BR-05)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      requesterId: reqId,
    };

    if (categoryId) {
      const catId = Number(categoryId);
      if (!isNaN(catId)) {
        where.categoryId = catId;
      }
    }

    if (priority && ["LOW", "MEDIUM", "HIGH"].includes(String(priority).toUpperCase())) {
      where.requestedPriority = String(priority).toUpperCase();
    }

    if (status) {
      where.currentStatus = String(status).toUpperCase();
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const term = search.trim();
      where.OR = [
        {
          summary: {
            contains: term,
            mode: "insensitive",
          },
        },
        {
          ticketNumber: {
            contains: term,
            mode: "insensitive",
          },
        },
      ];
    }

    const allowedSortFields = ["createdAt", "ticketNumber", "requestedPriority", "currentStatus"];
    const sortField = allowedSortFields.includes(String(sort)) ? String(sort) : "createdAt";
    const sortOrder = String(order).toLowerCase() === "asc" ? "asc" : "desc";

    const prisma = getPrisma();

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy: {
          [sortField]: sortOrder,
        },
        skip,
        take: limitNum,
        include: {
          category: true,
          relatedSystem: true,
          requester: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      data: tickets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (err) {
    console.error("Failed to fetch tickets:", err);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

export default app;
