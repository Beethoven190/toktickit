import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { getPrisma } from "./prisma.js";
import { authRouter } from "./routes/auth.js";
import { staffRouter } from "./routes/staff.js";
import { optionalAuthenticate } from "./middleware/auth.js";

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
export const app = express();

app.use(cors());          // already wired: lets the Vite dev server call this API
app.use(express.json());
app.use(optionalAuthenticate); // Populates req.user if Bearer token present

// Mount Authentication & Staff Routers
app.use("/api/auth", authRouter);
app.use("/api/staff", staffRouter);

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
// Development Requesters list (active only) - evolved to User model (REQUESTER)
// ---------------------------------------------------------------------------
app.get("/api/requesters", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().user.findMany({
      where: { role: "REQUESTER", isActive: true },
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

  const tickets = await prisma.ticket.findMany({
    where: {
      ticketNumber: {
        startsWith: prefix,
      },
    },
    select: {
      ticketNumber: true,
    },
  });

  let maxSeq = 0;
  for (const t of tickets) {
    const parts = t.ticketNumber.split("-");
    if (parts.length >= 3) {
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(6, "0")}`;
}

// ---------------------------------------------------------------------------
// Create Ticket (POST /api/tickets)
// In Lab 3: If authenticated, requesterId is ALWAYS derived from req.user.id (BR-03, AC-03)
// ---------------------------------------------------------------------------
app.post("/api/tickets", async (req: Request, res: Response) => {
  try {
    const { categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;
    let { requesterId } = req.body;

    // BR-03, AC-03: The authenticated user identity, not a requesterId supplied by the client, determines ownership
    if (req.user) {
      requesterId = req.user.id;
    }

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
    const requester = await prisma.user.findUnique({ where: { id: requesterId } });
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

    let newTicket;
    let attempts = 0;
    while (attempts < 5) {
      try {
        const ticketNumber = await generateTicketNumber();
        newTicket = await prisma.ticket.create({
          data: {
            ticketNumber,
            requesterId,
            categoryId,
            relatedSystemId,
            summary: trimmedSummary,
            description: trimmedDescription,
            requestedPriority: priority,
            itPriority: priority, // Copies requested priority initially (BR-08)
            currentStatus: "NEW", // Starts with NEW (BR-08)
            ownerId: null,        // Unassigned initially (BR-08)
          },
          include: {
            category: true,
            relatedSystem: true,
            requester: {
              select: { id: true, name: true, email: true },
            },
          },
        });
        break;
      } catch (createErr: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errAny = createErr as any;
        if (errAny.code === "P2002" && errAny.meta?.target?.includes("ticketNumber") && attempts < 4) {
          attempts++;
          await new Promise((res) => setTimeout(res, 50 * attempts));
          continue;
        }
        throw createErr;
      }
    }

    res.status(201).json(newTicket);
  } catch (err) {
    console.error("Failed to create ticket:", err);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

// ---------------------------------------------------------------------------
// My Tickets list with search, filter, sort, pagination,
// and strict Ownership Protection (Rule BR-03, BR-05, AC-03)
// ---------------------------------------------------------------------------
app.get("/api/tickets", async (req: Request, res: Response) => {
  try {
    let { requesterId } = req.query;
    const {
      search,
      categoryId,
      priority,
      status,
      page = "1",
      limit = "10",
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // BR-03, AC-03: Authenticated Requester is strictly locked to own ID
    if (req.user && req.user.role === "REQUESTER") {
      requesterId = String(req.user.id);
    } else if (req.user && !requesterId) {
      requesterId = String(req.user.id);
    }

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
// Requester Ticket Detail (GET /api/tickets/:id) (BR-05, BR-17, AC-04)
// ---------------------------------------------------------------------------
app.get("/api/tickets/:id", async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    let requesterId = req.query.requesterId ? Number(req.query.requesterId) : undefined;

    if (req.user && req.user.role === "REQUESTER") {
      requesterId = req.user.id;
    }

    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    if (!req.user && requesterId === undefined) {
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
        publicComments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Role-based authorization & ownership protection:
    // If requester, can only view own ticket (BR-17: return 404/403 to prevent enumeration)
    if (req.user) {
      if (req.user.role === "REQUESTER" && ticket.requesterId !== req.user.id) {
        return res.status(404).json({ error: "Ticket not found" });
      }
    } else {
      if (ticket.requesterId !== requesterId) {
        return res.status(403).json({ error: "Forbidden: You do not have permission to view this ticket" });
      }
    }

    res.status(200).json(ticket);
  } catch (err) {
    console.error("Failed to fetch ticket detail:", err);
    res.status(500).json({ error: "Failed to fetch ticket detail" });
  }
});

// ---------------------------------------------------------------------------
// Upload Attachment (POST /api/tickets/:id/attachments)
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
    let requesterId = req.user ? req.user.id : Number(req.body.requesterId || req.query.requesterId);

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
    const isStaffOrAdmin = req.user && (req.user.role === "STAFF" || req.user.role === "ADMIN");
    if (!isStaffOrAdmin && ticket.requesterId !== requesterId) {
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
// Download Attachment (GET /api/tickets/:id/attachments/:attachmentId/file)
// ---------------------------------------------------------------------------
app.get("/api/tickets/:id/attachments/:attachmentId/file", async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const attachmentId = Number(req.params.attachmentId);
    const requesterId = req.user ? req.user.id : Number(req.query.requesterId);

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const isStaffOrAdmin = req.user && (req.user.role === "STAFF" || req.user.role === "ADMIN");
    if (!isStaffOrAdmin && ticket.requesterId !== requesterId) {
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
// Soft-Remove Attachment (DELETE /api/tickets/:id/attachments/:attachmentId)
// ---------------------------------------------------------------------------
app.delete("/api/tickets/:id/attachments/:attachmentId", async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const attachmentId = Number(req.params.attachmentId);
    const { removalReason } = req.body;
    const requesterId = req.user ? req.user.id : Number(req.body.requesterId);

    if (!removalReason || typeof removalReason !== "string" || removalReason.trim().length < 5) {
      return res.status(400).json({ error: "Removal reason is required and must be at least 5 characters" });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const isStaffOrAdmin = req.user && (req.user.role === "STAFF" || req.user.role === "ADMIN");
    if (!isStaffOrAdmin && ticket.requesterId !== requesterId) {
      return res.status(403).json({ error: "Forbidden: You do not own this ticket" });
    }

    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.ticketId !== ticketId) {
      return res.status(404).json({ error: "Attachment not found" });
    }

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

// ---------------------------------------------------------------------------
// Public Comments (GET /api/tickets/:id/comments) (FR-13, BR-05, AC-13)
// ---------------------------------------------------------------------------
app.get("/api/tickets/:id/comments", async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid ticket ID" } });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, requesterId: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
    }

    // Requester can only access comments on their own ticket (BR-05, AC-13)
    if (req.user) {
      if (req.user.role === "REQUESTER" && ticket.requesterId !== req.user.id) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Forbidden: You do not own this ticket" } });
      }
    } else {
      const requesterId = Number(req.query.requesterId);
      if (!requesterId || ticket.requesterId !== requesterId) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Forbidden: You do not own this ticket" } });
      }
    }

    const comments = await prisma.publicComment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    return res.status(200).json(comments);
  } catch (err) {
    console.error("Failed to fetch comments:", err);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch comments" } });
  }
});

// ---------------------------------------------------------------------------
// Post Public Comment (POST /api/tickets/:id/comments) (FR-13, BR-05, BR-06, AC-13)
// ---------------------------------------------------------------------------
app.post("/api/tickets/:id/comments", async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid ticket ID" } });
    }

    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0 || content.trim().length > 2000) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Comment content must be between 1 and 2,000 characters",
        },
      });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, requesterId: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
    }

    let authorId: number;
    if (req.user) {
      if (req.user.role === "REQUESTER" && ticket.requesterId !== req.user.id) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Forbidden: You do not own this ticket" } });
      }
      authorId = req.user.id;
    } else {
      const requesterId = Number(req.body.requesterId || req.query.requesterId);
      if (!requesterId || ticket.requesterId !== requesterId) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Forbidden: You do not own this ticket" } });
      }
      authorId = requesterId;
    }

    const comment = await prisma.publicComment.create({
      data: {
        ticketId,
        authorId,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    return res.status(201).json(comment);
  } catch (err) {
    console.error("Failed to post comment:", err);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to post comment" } });
  }
});

// ---------------------------------------------------------------------------
// Internal Notes (GET /api/tickets/:id/notes) (FR-14, BR-05, AC-14)
// ---------------------------------------------------------------------------
app.get("/api/tickets/:id/notes", async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid ticket ID" } });
    }

    // Strictly forbidden for Requesters (BR-05, AC-14)
    if (!req.user || req.user.role === "REQUESTER") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Forbidden: Only IT Staff and Administrators may access internal notes",
        },
      });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
    }

    const notes = await prisma.internalNote.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    return res.status(200).json(notes);
  } catch (err) {
    console.error("Failed to fetch internal notes:", err);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch internal notes" } });
  }
});

// ---------------------------------------------------------------------------
// Post Internal Note (POST /api/tickets/:id/notes) (FR-14, BR-05, BR-06, AC-14)
// ---------------------------------------------------------------------------
app.post("/api/tickets/:id/notes", async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid ticket ID" } });
    }

    // Strictly forbidden for Requesters (BR-05, AC-14)
    if (!req.user || req.user.role === "REQUESTER") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Forbidden: Only IT Staff and Administrators may create internal notes",
        },
      });
    }

    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0 || content.trim().length > 2000) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Internal note content must be between 1 and 2,000 characters",
        },
      });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
    }

    const note = await prisma.internalNote.create({
      data: {
        ticketId,
        authorId: req.user.id,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    return res.status(201).json(note);
  } catch (err) {
    console.error("Failed to post internal note:", err);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to post internal note" } });
  }
});

// ---------------------------------------------------------------------------
// Problem Appears Resolved Indication (POST / PATCH /api/tickets/:id/resolve-indication) (FR-07, BR-07)
// ---------------------------------------------------------------------------
const handleResolveIndication = async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid ticket ID" } });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        relatedSystem: true,
        requester: { select: { id: true, name: true, email: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
    }

    // Ownership verification: Requester can only toggle on their own ticket
    if (req.user) {
      if (req.user.role === "REQUESTER" && ticket.requesterId !== req.user.id) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Forbidden: You may only signal resolution on your own tickets" } });
      }
    } else {
      const requesterId = Number(req.body.requesterId || req.query.requesterId);
      if (!requesterId || ticket.requesterId !== requesterId) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Forbidden: You may only signal resolution on your own tickets" } });
      }
    }

    const isResolved = req.body.isResolved !== undefined ? Boolean(req.body.isResolved) : true;

    // BR-07: Updates problemResolvedReq flag, does NOT alter currentStatus
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        problemResolvedReq: isResolved,
      },
      include: {
        category: true,
        relatedSystem: true,
        requester: { select: { id: true, name: true, email: true } },
        attachments: { orderBy: { createdAt: "asc" } },
        publicComments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error("Failed to update resolution indication:", err);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update resolution indication" } });
  }
};

app.post("/api/tickets/:id/resolve-indication", handleResolveIndication);
app.patch("/api/tickets/:id/resolve-indication", handleResolveIndication);

export default app;

