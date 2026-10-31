import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 4 Issue 2: Actions Taken Backend Foundation & REST API (AC-01, AC-02, AC-03, BR-01..BR-07)", () => {
  const staff1Email = "john.s@toktickit.local";
  const staff2Email = "alex.t@toktickit.local";
  const adminEmail = "admin@toktickit.local";
  const requester1Email = "supanut.w@toktickit.local";
  const requester2Email = "david.i@toktickit.local";
  const password = "Password123!";

  let staff1Token: string;
  let staff1UserId: number;
  let staff2Token: string;
  let staff2UserId: number;
  let adminToken: string;
  let requester1Token: string;
  let requester1UserId: number;
  let requester2Token: string;
  let requester2UserId: number;

  let activeTicketId: number;
  let terminalTicketId: number;

  beforeAll(async () => {
    const prisma = getPrisma();

    // 1. Authenticate users
    const [s1Res, s2Res, admRes, r1Res, r2Res] = await Promise.all([
      request(app).post("/api/auth/login").send({ email: staff1Email, password }),
      request(app).post("/api/auth/login").send({ email: staff2Email, password }),
      request(app).post("/api/auth/login").send({ email: adminEmail, password }),
      request(app).post("/api/auth/login").send({ email: requester1Email, password }),
      request(app).post("/api/auth/login").send({ email: requester2Email, password }),
    ]);

    staff1Token = s1Res.body.token;
    staff1UserId = s1Res.body.user.id;
    staff2Token = s2Res.body.token;
    staff2UserId = s2Res.body.user.id;
    adminToken = admRes.body.token;
    requester1Token = r1Res.body.token;
    requester1UserId = r1Res.body.user.id;
    requester2Token = r2Res.body.token;
    requester2UserId = r2Res.body.user.id;

    // 2. Fetch categories and systems
    const cat = await prisma.category.findFirstOrThrow();
    const sys = await prisma.relatedSystem.findFirstOrThrow();

    // 3. Create active ticket owned by Staff 1 and requested by Requester 1
    const activeTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-TEST-ACT-${Date.now()}`,
        requesterId: requester1UserId,
        categoryId: cat.id,
        relatedSystemId: sys.id,
        summary: "Active Ticket for Actions Taken Integration Testing",
        description: "Testing parent-child Actions Taken features in Lab 4 Sprint.",
        requestedPriority: "MEDIUM",
        itPriority: "HIGH",
        currentStatus: "IN_PROGRESS",
        ownerId: staff1UserId,
      },
    });
    activeTicketId = activeTicket.id;

    // 4. Create closed (terminal) ticket
    const terminalTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-TERM-ACT-${Date.now()}`,
        requesterId: requester1UserId,
        categoryId: cat.id,
        relatedSystemId: sys.id,
        summary: "Terminal Closed Ticket for Actions Taken Guard Testing",
        description: "Testing terminal ticket modification prevention rule.",
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "CLOSED",
        ownerId: staff1UserId,
        resolutionSummary: "Already completed and verified by team.",
      },
    });
    terminalTicketId = terminalTicket.id;
  });

  describe("Authentication & RBAC Protections (BR-06, AC-01, AC-03)", () => {
    it("rejects unauthenticated request to POST /api/staff/tickets/:id/actions with 401 Unauthorized", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${activeTicketId}/actions`)
        .send({
          description: "Attempting unauthenticated action taken creation.",
          result: "Should be blocked.",
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects Requester user from POST /api/staff/tickets/:id/actions with 403 Forbidden (BR-06)", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${activeTicketId}/actions`)
        .set("Authorization", `Bearer ${requester1Token}`)
        .send({
          description: "Requester trying to record staff action taken.",
          result: "Should be forbidden.",
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("rejects Requester user from POST /api/tickets/:id/actions guard route with 403 Forbidden (BR-06)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${activeTicketId}/actions`)
        .set("Authorization", `Bearer ${requester1Token}`)
        .send({
          description: "Requester trying to post action directly.",
          result: "Should be blocked.",
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("allows IT Staff member to record Action Taken (201 Created) (AC-01)", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${activeTicketId}/actions`)
        .set("Authorization", `Bearer ${staff1Token}`)
        .send({
          description: "Performed initial memory diagnostic scan via hardware console.",
          result: "Memory modules passed initial voltage and timing checks.",
          followUpRequired: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.action).toBeDefined();
      expect(res.body.action.ticketId).toBe(activeTicketId);
      expect(res.body.action.performedById).toBe(staff1UserId);
      expect(res.body.action.performedBy.name).toBe("John Staff");
      expect(res.body.action.performedBy.role).toBe("STAFF");
      expect(res.body.action.followUpRequired).toBe(false);
      expect(res.body.action.followUpNote).toBeNull();
    });

    it("allows Administrator to record Action Taken (201 Created) (AC-01)", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${activeTicketId}/actions`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          description: "Admin audit review on network firewall rules.",
          result: "Port 443 inbound access confirmed operating under standard security profile.",
          followUpRequired: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.action.performedBy.role).toBe("ADMIN");
    });
  });

  describe("Distributed Teamwork & Automatic Attribution (BR-02, BR-03, AC-01)", () => {
    it("allows a different staff member (Staff 2) to log Action Taken on ticket owned by Staff 1 (BR-02)", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${activeTicketId}/actions`)
        .set("Authorization", `Bearer ${staff2Token}`)
        .send({
          description: "Alex Tech assisting: Replaced auxiliary power cable and ran load test.",
          result: "Power rails stabilized at 12V under 80% synthetic load.",
          followUpRequired: false,
          attachmentNotes: "power_rail_oscilloscope.png",
        });

      expect(res.status).toBe(201);
      expect(res.body.action.performedById).toBe(staff2UserId);
      expect(res.body.action.performedBy.name).toBe("Alex Tech");
      expect(res.body.action.attachmentNotes).toBe("power_rail_oscilloscope.png");
    });

    it("enforces server-side attribution ignoring client-spoofed performedById in body (BR-03)", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${activeTicketId}/actions`)
        .set("Authorization", `Bearer ${staff1Token}`)
        .send({
          performedById: 9999, // Attempted spoof
          description: "Attempted to forge performedById field in payload.",
          result: "Should be ignored; server uses authenticated token identity.",
        });

      expect(res.status).toBe(201);
      expect(res.body.action.performedById).toBe(staff1UserId); // Bound strictly to staff1
    });
  });

  describe("Conditional Follow-Up Requirement & Input Validations (BR-04, BR-05, AC-02)", () => {
    it("rejects Action Taken when followUpRequired=true but followUpNote is omitted (400 Bad Request) (BR-04, AC-02)", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${activeTicketId}/actions`)
        .set("Authorization", `Bearer ${staff1Token}`)
        .send({
          description: "Applied temporary patch to routing table.",
          result: "Temporary connectivity established.",
          followUpRequired: true,
          // followUpNote omitted
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.fields.followUpNote).toBeDefined();
    });

    it("rejects Action Taken when followUpRequired=true but followUpNote is whitespace only (400 Bad Request) (BR-04)", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${activeTicketId}/actions`)
        .set("Authorization", `Bearer ${staff1Token}`)
        .send({
          description: "Applied temporary patch to routing table.",
          result: "Temporary connectivity established.",
          followUpRequired: true,
          followUpNote: "   ",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.fields.followUpNote).toContain("at least 3 characters");
    });

    it("accepts Action Taken when followUpRequired=true and valid followUpNote is provided (201 Created) (BR-04)", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${activeTicketId}/actions`)
        .set("Authorization", `Bearer ${staff1Token}`)
        .send({
          description: "Applied hotfix patch to network driver.",
          result: "Driver functional with zero dropped packets over 5 minutes.",
          followUpRequired: true,
          followUpNote: "Verify permanent firmware update after weekly maintenance window.",
        });

      expect(res.status).toBe(201);
      expect(res.body.action.followUpRequired).toBe(true);
      expect(res.body.action.followUpNote).toBe("Verify permanent firmware update after weekly maintenance window.");
    });

    it("rejects Action Taken when description is shorter than 10 characters (BR-05)", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${activeTicketId}/actions`)
        .set("Authorization", `Bearer ${staff1Token}`)
        .send({
          description: "Too short", // < 10 chars
          result: "Valid result description here.",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.fields.description).toBeDefined();
    });

    it("rejects Action Taken when result is shorter than 3 characters (BR-05)", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${activeTicketId}/actions`)
        .set("Authorization", `Bearer ${staff1Token}`)
        .send({
          description: "Valid description for hardware inspection testing.",
          result: "OK", // < 3 chars
        });

      expect(res.status).toBe(400);
      expect(res.body.error.fields.result).toBeDefined();
    });
  });

  describe("Terminal Ticket Modification Guard (BR-07)", () => {
    it("rejects creating Action Taken on CLOSED ticket with 409 Conflict (BR-07)", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${terminalTicketId}/actions`)
        .set("Authorization", `Bearer ${staff1Token}`)
        .send({
          description: "Attempting to add action to an already closed ticket.",
          result: "Should be rejected with 409 conflict.",
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("TERMINAL_TICKET_CONFLICT");
    });
  });

  describe("Requester Read-Only Access & Data Isolation (AC-03, FR-04, BR-06)", () => {
    it("allows Requester 1 to view Actions Taken on their owned ticket via GET /api/tickets/:id/actions (AC-03)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${activeTicketId}/actions`)
        .set("Authorization", `Bearer ${requester1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.actions)).toBe(true);
      expect(res.body.actions.length).toBeGreaterThan(0);
      expect(res.body.total).toBe(res.body.actions.length);
      expect(res.body.actions[0].performedBy).toBeDefined();
    });

    it("forbids Requester 2 from viewing Actions Taken for Requester 1's ticket (403 Forbidden) (AC-03)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${activeTicketId}/actions`)
        .set("Authorization", `Bearer ${requester2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN_RESOURCE");
    });
  });

  describe("Staff Ticket Details & Update Operations (AC-01, FR-03)", () => {
    let createdActionId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${activeTicketId}/actions`)
        .set("Authorization", `Bearer ${staff1Token}`)
        .send({
          description: "Configured local proxy server settings and verified DNS routing.",
          result: "DNS query latency dropped to 4ms.",
          followUpRequired: false,
        });
      createdActionId = res.body.action.id;
    });

    it("allows IT Staff to update existing Action Taken via PATCH /api/staff/tickets/:ticketId/actions/:actionId (FR-03)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${activeTicketId}/actions/${createdActionId}`)
        .set("Authorization", `Bearer ${staff1Token}`)
        .send({
          result: "Updated: DNS query latency dropped to 2ms with dual redundancy.",
          followUpRequired: true,
          followUpNote: "Confirm cache expiration time tomorrow morning.",
        });

      expect(res.status).toBe(200);
      expect(res.body.action.result).toContain("dual redundancy");
      expect(res.body.action.followUpRequired).toBe(true);
      expect(res.body.action.followUpNote).toBe("Confirm cache expiration time tomorrow morning.");
    });

    it("includes actions array in GET /api/staff/tickets/:id ticket detail view (AC-01)", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${activeTicketId}`)
        .set("Authorization", `Bearer ${staff1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.actions)).toBe(true);
      expect(res.body.actions.length).toBeGreaterThan(0);
      expect(res.body.actions[0].performedBy).toBeDefined();
    });

    it("includes actions array in GET /api/tickets/:id requester detail view for owned ticket (AC-03)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${activeTicketId}`)
        .set("Authorization", `Bearer ${requester1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.actions)).toBe(true);
      expect(res.body.actions.length).toBeGreaterThan(0);
      expect(res.body.actions[0].performedBy).toBeDefined();
    });
  });
});
