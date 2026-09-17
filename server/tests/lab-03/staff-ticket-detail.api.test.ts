import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 Issue 4: IT Staff Ticket Operations API (AC-09, AC-10, AC-11, AC-12, BR-08..BR-11)", () => {
  const staffEmail = "john.s@toktickit.local";
  const staff2Email = "sarah.c@toktickit.local";
  const requesterEmail = "supanut.w@toktickit.local";
  const password = "Password123!";

  let staffToken: string;
  let staffUserId: number;
  let staff2Token: string;
  let staff2UserId: number;
  let requesterToken: string;
  let requesterUserId: number;
  let inactiveStaffUserId: number;

  let testTicketId: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const defaultPasswordHash = await bcrypt.hash(password, 10);

    // Ensure inactive staff user exists for validation tests
    const inactiveStaff = await prisma.user.upsert({
      where: { email: "inactive.staff@toktickit.local" },
      update: {
        passwordHash: defaultPasswordHash,
        isActive: false,
        role: "STAFF",
      },
      create: {
        name: "Inactive Staff",
        email: "inactive.staff@toktickit.local",
        passwordHash: defaultPasswordHash,
        isActive: false,
        role: "STAFF",
      },
    });
    inactiveStaffUserId = inactiveStaff.id;

    // 1. Authenticate Staff 1
    const staffRes = await request(app)
      .post("/api/auth/login")
      .send({ email: staffEmail, password });
    staffToken = staffRes.body.token;
    staffUserId = staffRes.body.user.id;

    // 2. Authenticate Staff 2
    const staff2Res = await request(app)
      .post("/api/auth/login")
      .send({ email: staff2Email, password });
    staff2Token = staff2Res.body.token;
    staff2UserId = staff2Res.body.user.id;

    // 3. Authenticate Requester
    const reqRes = await request(app)
      .post("/api/auth/login")
      .send({ email: requesterEmail, password });
    requesterToken = reqRes.body.token;
    requesterUserId = reqRes.body.user.id;

    // Ensure category and system exist
    const category = await prisma.category.findFirstOrThrow();
    const system = await prisma.relatedSystem.findFirstOrThrow();

    // Create a fresh test ticket starting in NEW status with no owner
    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-TEST-OP-${Date.now()}`,
        summary: "Test Operations Ticket",
        description: "Testing staff operations including claim, assign, priority, status",
        categoryId: category.id,
        relatedSystemId: system.id,
        requesterId: requesterUserId,
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        currentStatus: "NEW",
        ownerId: null,
      },
    });
    testTicketId = newTicket.id;
  });

  // -------------------------------------------------------------------------
  // 1. GET /api/staff/assignees
  // -------------------------------------------------------------------------
  describe("GET /api/staff/assignees", () => {
    it("returns list of active staff and admin members for IT Staff", async () => {
      const res = await request(app)
        .get("/api/staff/assignees")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Verify all returned users have role STAFF or ADMIN and no passwordHash exposed
      for (const member of res.body) {
        expect(["STAFF", "ADMIN"]).toContain(member.role);
        expect(member.passwordHash).toBeUndefined();
      }

      // Ensure inactive staff is not listed
      const foundInactive = res.body.find((u: { id: number }) => u.id === inactiveStaffUserId);
      expect(foundInactive).toBeUndefined();
    });

    it("rejects Requester with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/staff/assignees")
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  // 2. PATCH /api/staff/tickets/:id/claim (AC-09, BR-09)
  // -------------------------------------------------------------------------
  describe("PATCH /api/staff/tickets/:id/claim", () => {
    it("assigns current user as owner and auto-advances NEW status to OPEN (AC-09, BR-09)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/claim`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ownerId).toBe(staffUserId);
      expect(res.body.currentStatus).toBe("OPEN");
    });

    it("claims ownership without resetting status if status is already OPEN or IN_PROGRESS", async () => {
      // Re-claim by Staff 2
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/claim`)
        .set("Authorization", `Bearer ${staff2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.ownerId).toBe(staff2UserId);
      expect(res.body.currentStatus).toBe("OPEN"); // Still OPEN, not reverted to NEW
    });

    it("returns 404 for non-existent ticket ID", async () => {
      const res = await request(app)
        .patch("/api/staff/tickets/999999/claim")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(404);
    });

    it("rejects Requester with 403 Forbidden", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/claim`)
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  // 3. PATCH /api/staff/tickets/:id/assign (AC-09, BR-11)
  // -------------------------------------------------------------------------
  describe("PATCH /api/staff/tickets/:id/assign", () => {
    it("assigns ticket to another active staff member (BR-11)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/assign`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ ownerId: staffUserId });

      expect(res.status).toBe(200);
      expect(res.body.ownerId).toBe(staffUserId);
    });

    it("allows unassigning ticket when ownerId is null", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/assign`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ ownerId: null });

      expect(res.status).toBe(200);
      expect(res.body.ownerId).toBeNull();
    });

    it("rejects assigning to non-staff user (e.g. Requester) with 400 Bad Request (BR-11)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/assign`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ ownerId: requesterUserId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("TARGET_USER_NOT_STAFF");
    });

    it("rejects assigning to inactive staff user with 400 Bad Request (BR-11)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/assign`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ ownerId: inactiveStaffUserId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("TARGET_USER_NOT_STAFF");
    });

    it("rejects Requester with 403 Forbidden", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/assign`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ ownerId: staffUserId });

      expect(res.status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  // 4. PATCH /api/staff/tickets/:id/priority (AC-10, BR-08)
  // -------------------------------------------------------------------------
  describe("PATCH /api/staff/tickets/:id/priority", () => {
    it("updates IT priority independently of requester requested priority (AC-10)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/priority`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ itPriority: "HIGH" });

      expect(res.status).toBe(200);
      expect(res.body.itPriority).toBe("HIGH");
      expect(res.body.requestedPriority).toBe("MEDIUM"); // Untouched
    });

    it("rejects invalid priority value with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/priority`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ itPriority: "CRITICAL" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects Requester with 403 Forbidden", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/priority`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ itPriority: "LOW" });

      expect(res.status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  // 5. PATCH /api/staff/tickets/:id/status (AC-11, AC-12, BR-09, BR-10)
  // -------------------------------------------------------------------------
  describe("PATCH /api/staff/tickets/:id/status", () => {
    it("allows valid state transition: OPEN -> IN_PROGRESS", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("IN_PROGRESS");
    });

    it("allows valid state transition: IN_PROGRESS -> WAITING_FOR_REQUESTER", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "WAITING_FOR_REQUESTER" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("WAITING_FOR_REQUESTER");
    });

    it("rejects illegal status transition with 400 Bad Request (e.g. WAITING_FOR_REQUESTER -> CLOSED)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "CLOSED", resolutionSummary: "Closed ticket directly" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("rejects transition to RESOLVED without resolutionSummary (BR-10, AC-12)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("RESOLUTION_SUMMARY_REQUIRED");
    });

    it("rejects transition to RESOLVED with resolutionSummary shorter than 5 chars (BR-10, AC-12)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "RESOLVED", resolutionSummary: "Done" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("RESOLUTION_SUMMARY_REQUIRED");
    });

    it("succeeds transitioning to RESOLVED with valid resolutionSummary (>= 5 chars)", async () => {
      const summaryText = "Fixed driver issues and reconnected adapter successfully.";
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "RESOLVED", resolutionSummary: summaryText });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("RESOLVED");
      expect(res.body.resolutionSummary).toBe(summaryText);
    });

    it("allows transitioning from RESOLVED to CLOSED with resolutionSummary", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "CLOSED" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("CLOSED");
    });

    it("allows transitioning from CLOSED to REOPENED", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "REOPENED" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("REOPENED");
    });

    it("rejects Requester with 403 Forbidden", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ status: "RESOLVED", resolutionSummary: "Requester trying to resolve" });

      expect(res.status).toBe(403);
    });
  });
});
