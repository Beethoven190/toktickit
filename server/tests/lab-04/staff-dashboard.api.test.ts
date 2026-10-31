import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 4 Issue 5: IT Staff Dashboard API (API-DASH-01, API-DASH-02, AC-04, FR-11, FR-12, BR-12, BR-14, BR-15)", () => {
  const adminEmail = "admin@toktickit.local";
  const requesterEmail = "supanut.w@toktickit.local";
  const password = "Password123!";

  let staffToken: string;
  let staffUserId: number;
  let adminToken: string;
  let requesterToken: string;

  beforeAll(async () => {
    const prisma = getPrisma();
    const defaultPasswordHash = await bcrypt.hash(password, 10);

    // 1. Create dedicated isolated staff user to avoid concurrent mutation race conditions
    const isolatedStaffEmail = `staff.dash.${Date.now()}-${Math.floor(Math.random() * 1000)}@toktickit.local`;
    const staffUser = await prisma.user.create({
      data: {
        name: "Alex Dashboard Staff",
        email: isolatedStaffEmail,
        passwordHash: defaultPasswordHash,
        role: "STAFF",
        mustChangePassword: false,
        isActive: true,
      },
    });
    staffUserId = staffUser.id;

    // 2. Fetch category and system
    const cat = await prisma.category.findFirstOrThrow();
    const sys = await prisma.relatedSystem.findFirstOrThrow();
    const sampleReq = await prisma.user.findFirstOrThrow({ where: { role: "REQUESTER" } });

    // 3. Assign 3 tickets to this staff user:
    // - Ticket 1: OPEN (active assigned)
    // - Ticket 2: IN_PROGRESS (active assigned)
    // - Ticket 3: RESOLVED (resolved - NOT counted in active myAssigned per BR-14)
    await Promise.all([
      prisma.ticket.create({
        data: {
          ticketNumber: `TKT-STF-D1-${Date.now()}`,
          requesterId: sampleReq.id,
          categoryId: cat.id,
          relatedSystemId: sys.id,
          summary: "Staff Dashboard Active Ticket 1",
          description: "Active ticket for staff dashboard testing.",
          requestedPriority: "MEDIUM",
          itPriority: "HIGH",
          currentStatus: "OPEN",
          ownerId: staffUserId,
        },
      }),
      prisma.ticket.create({
        data: {
          ticketNumber: `TKT-STF-D2-${Date.now()}`,
          requesterId: sampleReq.id,
          categoryId: cat.id,
          relatedSystemId: sys.id,
          summary: "Staff Dashboard Active Ticket 2",
          description: "Active ticket for staff dashboard testing.",
          requestedPriority: "HIGH",
          itPriority: "HIGH",
          currentStatus: "IN_PROGRESS",
          ownerId: staffUserId,
        },
      }),
      prisma.ticket.create({
        data: {
          ticketNumber: `TKT-STF-D3-${Date.now()}`,
          requesterId: sampleReq.id,
          categoryId: cat.id,
          relatedSystemId: sys.id,
          summary: "Staff Dashboard Inactive Ticket 3",
          description: "Resolved ticket - must not count in active myAssigned.",
          requestedPriority: "LOW",
          itPriority: "LOW",
          currentStatus: "RESOLVED",
          resolutionSummary: "Resolved prior to test.",
          ownerId: staffUserId,
        },
      }),
    ]);

    // 4. Authenticate users
    const [staffLogin, adminLogin, reqLogin] = await Promise.all([
      request(app).post("/api/auth/login").send({ email: isolatedStaffEmail, password }),
      request(app).post("/api/auth/login").send({ email: adminEmail, password }),
      request(app).post("/api/auth/login").send({ email: requesterEmail, password }),
    ]);

    staffToken = staffLogin.body.token;
    adminToken = adminLogin.body.token;
    requesterToken = reqLogin.body.token;
  });

  it("API-DASH-01: IT Staff retrieves /api/dashboards/staff with 5 KPI metrics matching DB counts (AC-04)", async () => {
    const res = await request(app)
      .get("/api/dashboards/staff")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("user");
    expect(res.body).toHaveProperty("recentTickets");

    // Verify user object
    expect(res.body.user.id).toBe(staffUserId);
    expect(res.body.user.role).toBe("STAFF");

    // Verify 5 KPI counts structure
    const { metrics } = res.body;
    expect(typeof metrics.new.count).toBe("number");
    expect(metrics.new.count).toBeGreaterThanOrEqual(0);

    expect(typeof metrics.open.count).toBe("number");
    expect(metrics.open.count).toBeGreaterThanOrEqual(1); // At least our OPEN ticket

    expect(typeof metrics.inProgress.count).toBe("number");
    expect(metrics.inProgress.count).toBeGreaterThanOrEqual(1); // At least our IN_PROGRESS ticket

    expect(typeof metrics.waitingForRequester.count).toBe("number");
    expect(metrics.waitingForRequester.count).toBeGreaterThanOrEqual(0);

    // Exactly 2 active assigned tickets (OPEN and IN_PROGRESS; RESOLVED is excluded per BR-14)
    expect(metrics.myAssigned.count).toBe(2);

    // Verify deltas have proper format (BR-15)
    expect(metrics.new.delta).toMatch(/[+-]?\d+ from yesterday/);
    expect(metrics.open.delta).toMatch(/[+-]?\d+ from yesterday/);
    expect(metrics.inProgress.delta).toMatch(/[+-]?\d+ from yesterday/);
    expect(metrics.waitingForRequester.delta).toMatch(/[+-]?\d+ from yesterday/);
    expect(metrics.myAssigned.delta).toMatch(/[+-]?\d+ from yesterday/);

    // Verify recent tickets is an array with valid ticket shape
    expect(Array.isArray(res.body.recentTickets)).toBe(true);
    expect(res.body.recentTickets.length).toBeGreaterThan(0);
    const first = res.body.recentTickets[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("ticketNumber");
    expect(first).toHaveProperty("summary");
    expect(first).toHaveProperty("category");
    expect(first).toHaveProperty("status");
    expect(first).toHaveProperty("itPriority");
    expect(first).toHaveProperty("ownerName");
    expect(first).toHaveProperty("updatedAt");
  });

  it("API-DASH-02: Requester is strictly forbidden from accessing /api/dashboards/staff (HTTP 403)", async () => {
    const res = await request(app)
      .get("/api/dashboards/staff")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("Administrator can access /api/dashboards/staff with HTTP 200", async () => {
    const res = await request(app)
      .get("/api/dashboards/staff")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("ADMIN");
    expect(res.body).toHaveProperty("metrics");
  });

  it("Unauthenticated request is rejected with HTTP 401 Unauthorized", async () => {
    const res = await request(app).get("/api/dashboards/staff");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
