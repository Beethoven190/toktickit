import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 Issue 5: Collaboration API — Comments, Notes & Resolve Indication (AC-13, AC-14, BR-05..BR-07)", () => {
  const staffEmail = "john.s@toktickit.local";
  const requester1Email = "supanut.w@toktickit.local";
  const requester2Email = "requester2.collab@toktickit.local";
  const password = "Password123!";

  let staffToken: string;
  let staffUserId: number;
  let requester1Token: string;
  let requester1UserId: number;
  let requester2Token: string;
  let requester2UserId: number;

  let ticket1Id: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const defaultPasswordHash = await bcrypt.hash(password, 10);

    // 1. Ensure requester 2 exists for cross-user permission checks
    const req2 = await prisma.user.upsert({
      where: { email: requester2Email },
      update: {
        passwordHash: defaultPasswordHash,
        isActive: true,
        role: "REQUESTER",
      },
      create: {
        name: "Second Requester",
        email: requester2Email,
        passwordHash: defaultPasswordHash,
        isActive: true,
        role: "REQUESTER",
      },
    });
    requester2UserId = req2.id;

    // 2. Log in Staff
    const staffRes = await request(app)
      .post("/api/auth/login")
      .send({ email: staffEmail, password });
    staffToken = staffRes.body.token;
    staffUserId = staffRes.body.user.id;

    // 3. Log in Requester 1
    const req1Res = await request(app)
      .post("/api/auth/login")
      .send({ email: requester1Email, password });
    requester1Token = req1Res.body.token;
    requester1UserId = req1Res.body.user.id;

    // 4. Log in Requester 2
    const req2Res = await request(app)
      .post("/api/auth/login")
      .send({ email: requester2Email, password });
    requester2Token = req2Res.body.token;

    // 5. Ensure category and system exist
    const category = await prisma.category.findFirstOrThrow();
    const system = await prisma.relatedSystem.findFirstOrThrow();

    // 6. Create test ticket owned by Requester 1
    const t1 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-COLLAB-${Date.now()}`,
        summary: "Collaboration and Notes Test Ticket",
        description: "Testing public comments and internal notes workflow",
        categoryId: category.id,
        relatedSystemId: system.id,
        requesterId: requester1UserId,
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        currentStatus: "OPEN",
        problemResolvedReq: false,
      },
    });
    ticket1Id = t1.id;
  });

  // -------------------------------------------------------------------------
  // 1. Public Comments (AC-13, BR-05, BR-06)
  // -------------------------------------------------------------------------
  describe("Public Comments API (GET & POST /api/tickets/:id/comments)", () => {
    it("rejects empty or whitespace-only comments with 400 Bad Request (BR-06)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/comments`)
        .set("Authorization", `Bearer ${requester1Token}`)
        .send({ content: "   " });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects comments exceeding 2,000 characters with 400 Bad Request (BR-06)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/comments`)
        .set("Authorization", `Bearer ${requester1Token}`)
        .send({ content: "A".repeat(2001) });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("prevents non-owner Requester from commenting on another's ticket (BR-05)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/comments`)
        .set("Authorization", `Bearer ${requester2Token}`)
        .send({ content: "Attempting unauthorized comment" });

      expect(res.status).toBe(403);
    });

    it("allows ticket owner Requester to post a public comment (AC-13)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/comments`)
        .set("Authorization", `Bearer ${requester1Token}`)
        .send({ content: "Requester says: I replaced the cable, issue remains." });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.content).toBe("Requester says: I replaced the cable, issue remains.");
      expect(res.body.author.id).toBe(requester1UserId);
      expect(res.body.author.role).toBe("REQUESTER");
    });

    it("allows IT Staff to post a public comment on any ticket (AC-13)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/comments`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ content: "IT Staff response: We are dispatching a new adapter." });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe("IT Staff response: We are dispatching a new adapter.");
      expect(res.body.author.id).toBe(staffUserId);
      expect(res.body.author.role).toBe("STAFF");
    });

    it("retrieves public comments in chronological order (AC-13)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticket1Id}/comments`)
        .set("Authorization", `Bearer ${requester1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body[0].content).toContain("Requester says");
      expect(res.body[1].content).toContain("IT Staff response");
    });

    it("prevents non-owner Requester from viewing comments on another's ticket (BR-05)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticket1Id}/comments`)
        .set("Authorization", `Bearer ${requester2Token}`);

      expect(res.status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Confidential Internal Notes (AC-14, BR-05, BR-06)
  // -------------------------------------------------------------------------
  describe("Confidential Internal Notes API (GET & POST /api/tickets/:id/notes)", () => {
    it("rejects Requester attempt to view internal notes with 403 Forbidden (AC-14, BR-05)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticket1Id}/notes`)
        .set("Authorization", `Bearer ${requester1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("rejects Requester attempt to post internal notes with 403 Forbidden (AC-14, BR-05)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/notes`)
        .set("Authorization", `Bearer ${requester1Token}`)
        .send({ content: "Requester trying to post note" });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("allows IT Staff to post confidential internal note (AC-14)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/notes`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ content: "Internal Note: User device warranty expires next month." });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe("Internal Note: User device warranty expires next month.");
      expect(res.body.author.id).toBe(staffUserId);
      expect(res.body.author.role).toBe("STAFF");
    });

    it("allows IT Staff to view internal notes in chronological order (AC-14)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticket1Id}/notes`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].content).toContain("Internal Note: User device warranty");
    });
  });

  // -------------------------------------------------------------------------
  // 3. Problem Appears Resolved Indication (FR-07, BR-07)
  // -------------------------------------------------------------------------
  describe("Problem Appears Resolved Indication (POST /api/tickets/:id/resolve-indication)", () => {
    it("rejects non-owner Requester attempting to signal resolution with 403 Forbidden", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/resolve-indication`)
        .set("Authorization", `Bearer ${requester2Token}`)
        .send({ isResolved: true });

      expect(res.status).toBe(403);
    });

    it("allows ticket owner to signal problem appears resolved while preserving ticket status (FR-07, BR-07)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/resolve-indication`)
        .set("Authorization", `Bearer ${requester1Token}`)
        .send({ isResolved: true });

      expect(res.status).toBe(200);
      expect(res.body.problemResolvedReq).toBe(true);
      expect(res.body.currentStatus).toBe("OPEN"); // Status NOT changed to RESOLVED (BR-07)
    });

    it("allows ticket owner to toggle resolution signal back to false (undo)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticket1Id}/resolve-indication`)
        .set("Authorization", `Bearer ${requester1Token}`)
        .send({ isResolved: false });

      expect(res.status).toBe(200);
      expect(res.body.problemResolvedReq).toBe(false);
    });
  });
});
