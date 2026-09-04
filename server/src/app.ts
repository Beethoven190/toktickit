import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { getPrisma } from "./prisma.js";

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
export const app = express();

app.use(cors());          // already wired: lets the Vite dev server call this API
app.use(express.json());

// ---------------------------------------------------------------------------
// Multer Storage & Validation for Attachments (BR-09, BR-10)
// ---------------------------------------------------------------------------
const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file (BR-10)
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Only JPG, PNG, WEBP, and PDF files are allowed."));
    }
  },
});

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

// ---------------------------------------------------------------------------
// Lab 2 — Issue 5: Requester Ticket Detail (GET /api/tickets/:id) (BR-05, AC-04)
// ---------------------------------------------------------------------------
app.get("/api/tickets/:id", async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const requesterId = Number(req.query.requesterId);

    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    if (isNaN(requesterId)) {
      return res.status(400).json({ error: "requesterId is required for ownership verification" });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        relatedSystem: true,
        requester: {
          select: { id: true, name: true, email: true },
        },
        attachments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Ownership protection: 403 Forbidden if not owned (BR-05, AC-04)
    if (ticket.requesterId !== requesterId) {
      return res.status(403).json({ error: "Forbidden: You do not have permission to view this ticket" });
    }

    res.status(200).json(ticket);
  } catch (err) {
    console.error("Failed to fetch ticket detail:", err);
    res.status(500).json({ error: "Failed to fetch ticket detail" });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 5: Upload Attachment (POST /api/tickets/:id/attachments)
// ---------------------------------------------------------------------------
app.post("/api/tickets/:id/attachments", (req: Request, res: Response, next) => {
  upload.single("file")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large. Maximum permitted file size is 5 MB." });
      }
      return res.status(400).json({ error: err.message });
    } else if (err instanceof Error) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const requesterId = Number(req.body.requesterId || req.query.requesterId);

    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Attachment file is required" });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check ownership
    if (ticket.requesterId !== requesterId) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: "Forbidden: You do not own this ticket" });
    }

    // Check active attachment limit (max 5 active attachments per ticket, BR-11)
    const activeCount = await prisma.attachment.count({
      where: { ticketId, isRemoved: false },
    });

    if (activeCount >= 5) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Maximum limit of 5 active attachments reached for this ticket" });
    }

    const attachment = await prisma.attachment.create({
      data: {
        ticketId,
        originalName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        isRemoved: false,
      },
    });

    res.status(201).json(attachment);
  } catch (err) {
    console.error("Failed to upload attachment:", err);
    res.status(500).json({ error: "Failed to upload attachment" });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 5: Download Attachment (GET /api/tickets/:id/attachments/:attachmentId/file)
// ---------------------------------------------------------------------------
app.get("/api/tickets/:id/attachments/:attachmentId/file", async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const attachmentId = Number(req.params.attachmentId);
    const requesterId = Number(req.query.requesterId);

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.requesterId !== requesterId) {
      return res.status(403).json({ error: "Forbidden: You do not own this ticket" });
    }

    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.ticketId !== ticketId) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    // BR-12: If soft-removed, download and preview are strictly blocked
    if (attachment.isRemoved) {
      return res.status(404).json({ error: "Attachment has been removed and is no longer accessible" });
    }

    const filePath = path.resolve(uploadDir, attachment.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on storage disk" });
    }

    res.download(filePath, attachment.originalName);
  } catch (err) {
    console.error("Failed to download attachment:", err);
    res.status(500).json({ error: "Failed to download attachment" });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 5: Soft-Remove Attachment (DELETE /api/tickets/:id/attachments/:attachmentId)
// ---------------------------------------------------------------------------
app.delete("/api/tickets/:id/attachments/:attachmentId", async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const attachmentId = Number(req.params.attachmentId);
    const { requesterId, removalReason } = req.body;

    if (!removalReason || typeof removalReason !== "string" || removalReason.trim().length < 5) {
      return res.status(400).json({ error: "Removal reason is required and must be at least 5 characters" });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.requesterId !== Number(requesterId)) {
      return res.status(403).json({ error: "Forbidden: You do not own this ticket" });
    }

    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.ticketId !== ticketId) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    // Soft-remove: update isRemoved, removalReason, removedAt (BR-12, BR-13)
    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isRemoved: true,
        removalReason: removalReason.trim(),
        removedAt: new Date(),
      },
    });

    res.status(200).json(updated);
  } catch (err) {
    console.error("Failed to soft-remove attachment:", err);
    res.status(500).json({ error: "Failed to remove attachment" });
  }
});

export default app;
