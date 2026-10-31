import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 4 Issue 4: Ticket Lifecycle, Resolution Gate & Concurrency Guards (AC-06, AC-07, AC-08, BR-08..BR-11)", () => {
  const staffEmail = "john.s@toktickit.local";
  const adminEmail = "admin@toktickit.local";
  const requesterEmail = "supanut.w@toktickit.local";
  const otherRequesterEmail = "david.i@toktickit.local";
  const password = "Password123!";

  let staffToken: string;
  let adminToken: string;
  let requesterToken: string;
  let otherRequesterToken: string;
  let requesterUserId: number;

  let categoryId: number;
  let relatedSystemId: number;

  beforeAll(async () => {
    const prisma = getPrisma();

    // 1. Authenticate users
    const [staffRes, adminRes, reqRes, otherReqRes] = await Promise.all([
      request(app).post("/api/auth/login").send({ email: staffEmail, password }),
      request(app).post("/api/auth/login").send({ email: adminEmail, password }),
      request(app).post("/api/auth/login").send({ email: requesterEmail, password }),
      request(app).post("/api/auth/login").send({ email: otherRequesterEmail, password }),
    ]);

    staffToken = staffRes.body.token;
    adminToken = adminRes.body.token;
    requesterToken = reqRes.body.token;
    requesterUserId = reqRes.body.user.id;
    otherRequesterToken = otherReqRes.body.token;

    // 2. Fetch category and related system
    const cat = await prisma.category.findFirstOrThrow();
    const sys = await prisma.relatedSystem.findFirstOrThrow();
    categoryId = cat.id;
    relatedSystemId = sys.id;
  });

  // Helper to create a ticket in a specific initial status
  async function createTestTicket(initialStatus: string = "NEW") {
    const prisma = getPrisma();
    return prisma.ticket.create({
      data: {
        ticketNumber: `TKT-FLOW-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        requesterId: requesterUserId,
        categoryId,
        relatedSystemId,
        summary: `Lifecycle Test Ticket [${initialStatus}]`,
        description: "Testing state machine transitions and resolution gate enforcement.",
        requestedPriority: "MEDIUM",
        itPriority: "HIGH",
        currentStatus: initialStatus as any,
      },
    });
  }

  // -------------------------------------------------------------------------
  // 1. Resolution Gate Enforcement (AC-06, BR-09, API-FLOW-01, API-FLOW-02)
  // -------------------------------------------------------------------------
  describe("Resolution Gate Enforcement (BR-09, AC-06)", () => {
    it("API-FLOW-01: rejects transition to RESOLVED without resolutionSummary", async () => {
      const ticket = await createTestTicket("OPEN");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("RESOLUTION_SUMMARY_REQUIRED");
      expect(res.body.error.message).toMatch(/at least 5 characters/i);
    });

    it("API-FLOW-01: rejects transition to RESOLVED with resolutionSummary shorter than 5 chars", async () => {
      const ticket = await createTestTicket("OPEN");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "RESOLVED", resolutionSummary: "Fix" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("RESOLUTION_SUMMARY_REQUIRED");
    });

    it("API-FLOW-02: succeeds transitioning to RESOLVED with valid resolutionSummary (>= 5 chars)", async () => {
      const ticket = await createTestTicket("OPEN");
      const summary = "Replaced degraded network transceiver on rack switch 4B.";

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "RESOLVED", resolutionSummary: summary });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("RESOLVED");
      expect(res.body.resolutionSummary).toBe(summary);
    });

    it("rejects transition to CLOSED if resolutionSummary is missing and not previously recorded", async () => {
      const ticket = await createTestTicket("RESOLVED");
      // clear any summary on this test ticket
      const prisma = getPrisma();
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { resolutionSummary: null },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "CLOSED" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("RESOLUTION_SUMMARY_REQUIRED");
    });
  });

  // -------------------------------------------------------------------------
  // 2. 8-State Permitted Transition Matrix (AC-07, BR-10, API-FLOW-03)
  // -------------------------------------------------------------------------
  describe("Permitted Transition Matrix & Illegal Transitions (BR-10, AC-07)", () => {
    it("API-FLOW-03: rejects illegal status transition from RESOLVED to NEW", async () => {
      const ticket = await createTestTicket("RESOLVED");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "NEW" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
      expect(res.body.error.message).toContain("Cannot transition status from RESOLVED to NEW");
    });

    it("API-FLOW-03: rejects illegal status transition from NEW to RESOLVED", async () => {
      const ticket = await createTestTicket("NEW");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "RESOLVED", resolutionSummary: "Premature resolution" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("API-FLOW-03: rejects any transition attempt from CANCELLED (Terminal state)", async () => {
      const ticket = await createTestTicket("CANCELLED");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "OPEN" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
      expect(res.body.error.message).toContain("Cannot transition status from CANCELLED to OPEN");
    });

    it("executes the full legitimate lifecycle: NEW -> OPEN -> IN_PROGRESS -> WAITING_FOR_REQUESTER -> RESOLVED -> CLOSED -> REOPENED -> CANCELLED", async () => {
      const ticket = await createTestTicket("NEW");

      // 1. NEW -> OPEN
      const r1 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "OPEN" });
      expect(r1.status).toBe(200);
      expect(r1.body.currentStatus).toBe("OPEN");

      // 2. OPEN -> IN_PROGRESS
      const r2 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "IN_PROGRESS" });
      expect(r2.status).toBe(200);
      expect(r2.body.currentStatus).toBe("IN_PROGRESS");

      // 3. IN_PROGRESS -> WAITING_FOR_REQUESTER
      const r3 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "WAITING_FOR_REQUESTER" });
      expect(r3.status).toBe(200);
      expect(r3.body.currentStatus).toBe("WAITING_FOR_REQUESTER");

      // 4. WAITING_FOR_REQUESTER -> RESOLVED (with resolutionSummary)
      const r4 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "RESOLVED", resolutionSummary: "User confirmed network restore." });
      expect(r4.status).toBe(200);
      expect(r4.body.currentStatus).toBe("RESOLVED");

      // 5. RESOLVED -> CLOSED
      const r5 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "CLOSED" });
      expect(r5.status).toBe(200);
      expect(r5.body.currentStatus).toBe("CLOSED");

      // 6. CLOSED -> REOPENED
      const r6 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "REOPENED" });
      expect(r6.status).toBe(200);
      expect(r6.body.currentStatus).toBe("REOPENED");

      // 7. REOPENED -> CANCELLED
      const r7 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "CANCELLED" });
      expect(r7.status).toBe(200);
      expect(r7.body.currentStatus).toBe("CANCELLED");
    });
  });

  // -------------------------------------------------------------------------
  // 3. Optimistic Concurrency Protection (AC-08, BR-11, API-FLOW-04)
  // -------------------------------------------------------------------------
  describe("Optimistic Concurrency Protection (BR-11, AC-08)", () => {
    it("API-FLOW-04: rejects stale update with HTTP 409 Conflict when expectedUpdatedAt does not match", async () => {
      const ticket = await createTestTicket("OPEN");
      const staleTimestamp = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          status: "IN_PROGRESS",
          expectedUpdatedAt: staleTimestamp,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("STALE_UPDATE_CONFLICT");
      expect(res.body.error.message).toMatch(/modified by another user/i);
    });

    it("succeeds when expectedUpdatedAt matches current ticket.updatedAt", async () => {
      const ticket = await createTestTicket("OPEN");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          status: "IN_PROGRESS",
          expectedUpdatedAt: ticket.updatedAt.toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("IN_PROGRESS");
    });
  });

  // -------------------------------------------------------------------------
  // 4. Advisory Problem Resolution for Requesters (FR-09, BR-08)
  // -------------------------------------------------------------------------
  describe("Advisory Resolution for Requesters (FR-09, BR-08)", () => {
    it("records advisory resolution without mutating ticket.currentStatus", async () => {
      const ticket = await createTestTicket("OPEN");

      const res = await request(app)
        .post(`/api/tickets/${ticket.id}/resolve-advisory`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.advisoryStatus).toBe("APPEARS_RESOLVED");
      expect(res.body.message).toMatch(/Advisory resolution recorded/i);

      // Verify database record has problemResolvedReq = true and currentStatus remains OPEN
      const prisma = getPrisma();
      const updatedTicket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
      expect(updatedTicket.problemResolvedReq).toBe(true);
      expect(updatedTicket.currentStatus).toBe("OPEN"); // MUST NOT MUTATE TO RESOLVED
    });

    it("rejects advisory resolution attempt by non-owner requester with 403 Forbidden", async () => {
      const ticket = await createTestTicket("OPEN");

      const res = await request(app)
        .post(`/api/tickets/${ticket.id}/resolve-advisory`)
        .set("Authorization", `Bearer ${otherRequesterToken}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  // -------------------------------------------------------------------------
  // 5. Role-Based Access Control on Ticket Status Transitions (BR-06)
  // -------------------------------------------------------------------------
  describe("RBAC on Status Transitions", () => {
    it("strictly blocks Requesters from updating ticket status (403 Forbidden)", async () => {
      const ticket = await createTestTicket("OPEN");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ status: "RESOLVED", resolutionSummary: "Requester unauthorized attempt" });

      expect(res.status).toBe(403);
    });

    it("allows Administrators to transition ticket status", async () => {
      const ticket = await createTestTicket("OPEN");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "RESOLVED", resolutionSummary: "Resolved by System Administrator" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("RESOLVED");
    });
  });
});

