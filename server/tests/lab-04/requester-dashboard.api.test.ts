import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 4 Issue 5: Requester Dashboard API (API-DASH-03, AC-05, FR-13, FR-14, BR-12, BR-13)", () => {
  const staffEmail = "john.s@toktickit.local";
  const adminEmail = "admin@toktickit.local";
  const password = "Password123!";

  let reqToken: string;
  let reqUserId: number;
  let staffToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const prisma = getPrisma();
    const defaultPasswordHash = await bcrypt.hash(password, 10);

    // 1. Create dedicated isolated requester user
    const isolatedReqEmail = `req.dash.${Date.now()}-${Math.floor(Math.random() * 1000)}@toktickit.local`;
    const reqUser = await prisma.user.create({
      data: {
        name: "Clara Dashboard Requester",
        email: isolatedReqEmail,
        passwordHash: defaultPasswordHash,
        role: "REQUESTER",
        mustChangePassword: false,
        isActive: true,
      },
    });
    reqUserId = reqUser.id;

    // 2. Fetch category and system
    const cat = await prisma.category.findFirstOrThrow();
    const sys = await prisma.relatedSystem.findFirstOrThrow();

    // 3. Create exactly:
    // - 2 OPEN tickets
    // - 1 IN_PROGRESS ticket
    // - 1 RESOLVED ticket
    // - 1 CLOSED ticket
    await Promise.all([
      prisma.ticket.create({
        data: {
          ticketNumber: `TKT-REQ-O1-${Date.now()}`,
          requesterId: reqUserId,
          categoryId: cat.id,
          relatedSystemId: sys.id,
          summary: "Isolated Open Ticket 1",
          description: "Isolated description",
          requestedPriority: "MEDIUM",
          currentStatus: "OPEN",
        },
      }),
      prisma.ticket.create({
        data: {
          ticketNumber: `TKT-REQ-O2-${Date.now()}`,
          requesterId: reqUserId,
          categoryId: cat.id,
          relatedSystemId: sys.id,
          summary: "Isolated Open Ticket 2",
          description: "Isolated description",
          requestedPriority: "LOW",
          currentStatus: "OPEN",
        },
      }),
      prisma.ticket.create({
        data: {
          ticketNumber: `TKT-REQ-IP-${Date.now()}`,
          requesterId: reqUserId,
          categoryId: cat.id,
          relatedSystemId: sys.id,
          summary: "Isolated In Progress Ticket",
          description: "Isolated description",
          requestedPriority: "HIGH",
          currentStatus: "IN_PROGRESS",
        },
      }),
      prisma.ticket.create({
        data: {
          ticketNumber: `TKT-REQ-RES-${Date.now()}`,
          requesterId: reqUserId,
          categoryId: cat.id,
          relatedSystemId: sys.id,
          summary: "Isolated Resolved Ticket",
          description: "Isolated description",
          requestedPriority: "HIGH",
          currentStatus: "RESOLVED",
          resolutionSummary: "Resolved as expected.",
        },
      }),
      prisma.ticket.create({
        data: {
          ticketNumber: `TKT-REQ-CLS-${Date.now()}`,
          requesterId: reqUserId,
          categoryId: cat.id,
          relatedSystemId: sys.id,
          summary: "Isolated Closed Ticket",
          description: "Isolated description",
          requestedPriority: "LOW",
          currentStatus: "CLOSED",
          resolutionSummary: "Closed ticket properly.",
        },
      }),
    ]);

    // 4. Authenticate users
    const [rLogin, staffLogin, admLogin] = await Promise.all([
      request(app).post("/api/auth/login").send({ email: isolatedReqEmail, password }),
      request(app).post("/api/auth/login").send({ email: staffEmail, password }),
      request(app).post("/api/auth/login").send({ email: adminEmail, password }),
    ]);

    reqToken = rLogin.body.token;
    staffToken = staffLogin.body.token;
    adminToken = admLogin.body.token;
  });

  it("API-DASH-03: Requester retrieves /api/dashboards/requester with 4 KPI counts strictly isolated to their own tickets (AC-05, BR-13)", async () => {
    const res = await request(app)
      .get("/api/dashboards/requester")
      .set("Authorization", `Bearer ${reqToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("user");
    expect(res.body).toHaveProperty("recentTickets");

    // Verify user identity
    expect(res.body.user.id).toBe(reqUserId);
    expect(res.body.user.role).toBe("REQUESTER");

    // Verify metrics shape and isolated counts (strictly 2 Open, 1 In Progress, 1 Resolved, 1 Closed)
    const { metrics } = res.body;
    expect(metrics.myOpen.count).toBe(2);
    expect(metrics.myOpen.label).toBe("My Open Tickets");

    expect(metrics.inProgress.count).toBe(1);
    expect(metrics.inProgress.label).toBe("In Progress");

    expect(metrics.resolved.count).toBe(1);
    expect(metrics.resolved.label).toBe("Resolved");

    expect(metrics.closed.count).toBe(1);
    expect(metrics.closed.label).toBe("Closed");

    // Verify recent tickets are only for this requester
    const recentTickets = res.body.recentTickets;
    expect(Array.isArray(recentTickets)).toBe(true);
    expect(recentTickets.length).toBe(5);

    const prisma = getPrisma();
    for (const t of recentTickets) {
      const dbTicket = await prisma.ticket.findUnique({ where: { id: t.id } });
      expect(dbTicket?.requesterId).toBe(reqUserId);
    }
  });

  it("Non-admin Staff member is rejected from accessing /api/dashboards/requester (HTTP 403 Forbidden)", async () => {
    const res = await request(app)
      .get("/api/dashboards/requester")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("Administrator can access /api/dashboards/requester with HTTP 200", async () => {
    const res = await request(app)
      .get("/api/dashboards/requester")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
  });

  it("Unauthenticated request is rejected with HTTP 401 Unauthorized", async () => {
    const res = await request(app).get("/api/dashboards/requester");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
