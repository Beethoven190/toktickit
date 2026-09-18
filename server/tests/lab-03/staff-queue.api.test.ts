import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 Issue 3: IT Staff Ticket Queue API (AC-07, AC-08, BR-08, BR-16)", () => {
  const staffEmail = "john.s@toktickit.local";
  const adminEmail = "admin@toktickit.local";
  const requesterEmail = "supanut.w@toktickit.local";
  const mustChangeStaffEmail = "mustchange.staff@toktickit.local";
  const password = "Password123!";

  let staffToken: string;
  let staffUserId: number;
  let adminToken: string;
  let requesterToken: string;
  let mustChangeToken: string;
  let testTicket1Id: number;
  let testTicket2Id: number;
  let testTicketNumber1: string;

  beforeAll(async () => {
    const prisma = getPrisma();
    const defaultPasswordHash = await bcrypt.hash(password, 10);

    // 1. Ensure staff with mustChangePassword exists and has known password
    await prisma.user.upsert({
      where: { email: mustChangeStaffEmail },
      update: {
        passwordHash: defaultPasswordHash,
        mustChangePassword: true,
        isActive: true,
        role: "STAFF",
      },
      create: {
        name: "Must Change Staff",
        email: mustChangeStaffEmail,
        passwordHash: defaultPasswordHash,
        mustChangePassword: true,
        isActive: true,
        role: "STAFF",
      },
    });

    // 2. Authenticate Staff
    const staffRes = await request(app)
      .post("/api/auth/login")
      .send({ email: staffEmail, password });
    staffToken = staffRes.body.token;
    staffUserId = staffRes.body.user.id;

    // 3. Authenticate Admin
    const adminRes = await request(app)
      .post("/api/auth/login")
      .send({ email: adminEmail, password });
    adminToken = adminRes.body.token;

    // 4. Authenticate Requester
    const reqRes = await request(app)
      .post("/api/auth/login")
      .send({ email: requesterEmail, password });
    requesterToken = reqRes.body.token;

    // 5. Authenticate Staff with mustChangePassword=true
    const mcRes = await request(app)
      .post("/api/auth/login")
      .send({ email: mustChangeStaffEmail, password });
    mustChangeToken = mcRes.body.token;

    // 6. Create deterministic test tickets
    const requester = await prisma.user.findUnique({ where: { email: requesterEmail } });
    const category = await prisma.category.findFirst();
    const system = await prisma.relatedSystem.findFirst();

    const timestamp = Date.now();
    const t1 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-TEST-${timestamp}-01`,
        requesterId: requester!.id,
        categoryId: category!.id,
        relatedSystemId: system!.id,
        summary: "Unique Sticky Keyboard Keys Issue",
        description: "Detailed description for unique keyboard keys issue test ticket.",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        currentStatus: "IN_PROGRESS",
        ownerId: staffUserId,
      },
    });
    testTicket1Id = t1.id;
    testTicketNumber1 = t1.ticketNumber;

    const t2 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-TEST-${timestamp}-02`,
        requesterId: requester!.id,
        categoryId: category!.id,
        relatedSystemId: system!.id,
        summary: "Unique Wireless Campus Connection Error",
        description: "Detailed description for unique wireless connection error test ticket.",
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "NEW",
        ownerId: null,
      },
    });
    testTicket2Id = t2.id;
  });

  describe("Authentication & RBAC Protections (AC-07, AC-08, BR-16)", () => {
    it("rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/staff/queue");
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects invalid Bearer token with 401 Unauthorized", async () => {
      const res = await request(app)
        .get("/api/staff/queue")
        .set("Authorization", "Bearer invalid-token-xyz");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects authenticated REQUESTER with 403 Forbidden (AC-08)", async () => {
      const res = await request(app)
        .get("/api/staff/queue")
        .set("Authorization", `Bearer ${requesterToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("blocks user with mustChangePassword=true with 403 PASSWORD_CHANGE_REQUIRED (AC-03, BR-02)", async () => {
      const res = await request(app)
        .get("/api/staff/queue")
        .set("Authorization", `Bearer ${mustChangeToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");
    });

    it("allows authenticated STAFF member with 200 OK (AC-07)", async () => {
      const res = await request(app)
        .get("/api/staff/queue")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
      expect(res.body).toHaveProperty("summaryCounts");
    });

    it("allows authenticated ADMIN member with 200 OK (AC-07)", async () => {
      const res = await request(app)
        .get("/api/staff/queue")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("Queue Payload & Relations Structure", () => {
    it("returns correct metadata structure and populated relation fields", async () => {
      const res = await request(app)
        .get("/api/staff/queue")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination).toMatchObject({
        total: expect.any(Number),
        page: 1,
        limit: 10,
        totalPages: expect.any(Number),
      });

      expect(res.body.summaryCounts).toMatchObject({
        all: expect.any(Number),
        unassigned: expect.any(Number),
        myTickets: expect.any(Number),
        inProgress: expect.any(Number),
      });

      if (res.body.data.length > 0) {
        const ticket = res.body.data[0];
        expect(ticket).toHaveProperty("id");
        expect(ticket).toHaveProperty("ticketNumber");
        expect(ticket).toHaveProperty("summary");
        expect(ticket).toHaveProperty("requestedPriority");
        expect(ticket).toHaveProperty("currentStatus");
        expect(ticket).toHaveProperty("category");
        expect(ticket.category).toHaveProperty("name");
        expect(ticket).toHaveProperty("relatedSystem");
        expect(ticket.relatedSystem).toHaveProperty("name");
        expect(ticket).toHaveProperty("requester");
        expect(ticket.requester).toHaveProperty("name");
        expect(ticket.requester).toHaveProperty("email");
      }
    });
  });

  describe("Search & Filtering Capabilities", () => {
    it("filters tickets by search term matching ticket number", async () => {
      const res = await request(app)
        .get(`/api/staff/queue?search=${testTicketNumber1}`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].ticketNumber).toBe(testTicketNumber1);
    });

    it("filters tickets by search term matching summary keyword", async () => {
      const res = await request(app)
        .get("/api/staff/queue?search=Sticky+Keyboard")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].summary).toContain("Sticky Keyboard");
    });

    it("filters tickets by categoryId", async () => {
      const allRes = await request(app)
        .get("/api/staff/queue")
        .set("Authorization", `Bearer ${staffToken}`);
      const catId = allRes.body.data[0].category.id;

      const catRes = await request(app)
        .get(`/api/staff/queue?categoryId=${catId}`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(catRes.status).toBe(200);
      expect(catRes.body.data.length).toBeGreaterThanOrEqual(1);
      catRes.body.data.forEach((t: { category: { id: number } }) => {
        expect(t.category.id).toBe(catId);
      });
    });

    it("filters tickets by status", async () => {
      const res = await request(app)
        .get("/api/staff/queue?status=IN_PROGRESS")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((t: { currentStatus: string }) => {
        expect(t.currentStatus).toBe("IN_PROGRESS");
      });
    });

    it("filters unassigned tickets with ownerId=unassigned", async () => {
      const res = await request(app)
        .get("/api/staff/queue?ownerId=unassigned")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((t: { owner: unknown; ownerId: unknown }) => {
        expect(t.owner).toBeNull();
      });
    });

    it("filters my tickets with ownerId=me", async () => {
      const res = await request(app)
        .get("/api/staff/queue?ownerId=me")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((t: { owner: { id: number } | null }) => {
        expect(t.owner).not.toBeNull();
        expect(t.owner!.id).toBe(staffUserId);
      });
    });

    it("supports quickFilter presets (unassigned, my, in-progress)", async () => {
      const unassignedRes = await request(app)
        .get("/api/staff/queue?quickFilter=unassigned")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(unassignedRes.status).toBe(200);
      unassignedRes.body.data.forEach((t: { owner: unknown }) => {
        expect(t.owner).toBeNull();
      });

      const myRes = await request(app)
        .get("/api/staff/queue?quickFilter=my")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(myRes.status).toBe(200);
      myRes.body.data.forEach((t: { owner: { id: number } }) => {
        expect(t.owner.id).toBe(staffUserId);
      });
    });
  });

  describe("Sorting & Pagination", () => {
    it("sorts by ticketNumber ascending and descending", async () => {
      const ascRes = await request(app)
        .get("/api/staff/queue?sort=ticketNumber&order=asc")
        .set("Authorization", `Bearer ${staffToken}`);
      const descRes = await request(app)
        .get("/api/staff/queue?sort=ticketNumber&order=desc")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(ascRes.status).toBe(200);
      expect(descRes.status).toBe(200);

      if (ascRes.body.data.length >= 2) {
        expect(ascRes.body.data[0].ticketNumber <= ascRes.body.data[1].ticketNumber).toBe(true);
      }
      if (descRes.body.data.length >= 2) {
        expect(descRes.body.data[0].ticketNumber >= descRes.body.data[1].ticketNumber).toBe(true);
      }
    });

    it("paginates records properly with page and limit parameters", async () => {
      const page1Res = await request(app)
        .get("/api/staff/queue?page=1&limit=1")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(page1Res.status).toBe(200);
      expect(page1Res.body.data.length).toBeLessThanOrEqual(1);
      expect(page1Res.body.pagination.page).toBe(1);
      expect(page1Res.body.pagination.limit).toBe(1);
      expect(page1Res.body.pagination.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /api/staff/tickets/:id (Staff Ticket Detail View)", () => {
    it("returns 401 for unauthenticated request", async () => {
      const res = await request(app).get("/api/staff/tickets/1");
      expect(res.status).toBe(401);
    });

    it("returns 403 for REQUESTER user", async () => {
      const res = await request(app)
        .get("/api/staff/tickets/1")
        .set("Authorization", `Bearer ${requesterToken}`);
      expect(res.status).toBe(403);
    });

    it("returns 404 for non-existent ticket ID", async () => {
      const res = await request(app)
        .get("/api/staff/tickets/999999")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("returns full ticket details including relations, comments, and notes for STAFF", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${testTicket1Id}`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testTicket1Id);
      expect(res.body).toHaveProperty("category");
      expect(res.body).toHaveProperty("relatedSystem");
      expect(res.body).toHaveProperty("requester");
      expect(res.body).toHaveProperty("publicComments");
      expect(res.body).toHaveProperty("internalNotes");
      expect(res.body).toHaveProperty("attachments");
    });
  });
});
