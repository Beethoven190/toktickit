import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 Issue 6: Administrator User Management API (AC-15..AC-19, BR-13, BR-14, BR-15)", () => {
  const adminEmail = "admin@toktickit.local";
  const staffEmail = "john.s@toktickit.local";
  const requesterEmail = "supanut.w@toktickit.local";
  const password = "Password123!";

  let adminToken: string;
  let staffToken: string;
  let requesterToken: string;
  let adminUserId: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const defaultPasswordHash = await bcrypt.hash(password, 10);

    // Ensure users exist
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash: defaultPasswordHash,
        mustChangePassword: false,
        isActive: true,
        role: "ADMIN",
      },
      create: {
        name: "System Administrator",
        email: adminEmail,
        passwordHash: defaultPasswordHash,
        mustChangePassword: false,
        isActive: true,
        role: "ADMIN",
      },
    });

    // Login Admin
    const adminRes = await request(app)
      .post("/api/auth/login")
      .send({ email: adminEmail, password });
    adminToken = adminRes.body.token;
    adminUserId = adminRes.body.user.id;

    // Login Staff
    const staffRes = await request(app)
      .post("/api/auth/login")
      .send({ email: staffEmail, password });
    staffToken = staffRes.body.token;

    // Login Requester
    const reqRes = await request(app)
      .post("/api/auth/login")
      .send({ email: requesterEmail, password });
    requesterToken = reqRes.body.token;
  });

  describe("RBAC & Authorization Guards (AC-15, BR-16)", () => {
    it("returns 401 Unauthorized if no token is provided", async () => {
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 403 Forbidden when accessed by a Requester (AC-15)", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${requesterToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 403 Forbidden when accessed by IT Staff (AC-15)", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("allows access to Administrator with 200 OK", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("GET /api/admin/users - User Listing & Filtering (AC-15)", () => {
    it("returns user list omitting password hashes", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      for (const user of res.body) {
        expect(user).not.toHaveProperty("passwordHash");
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("role");
        expect(user).toHaveProperty("isActive");
      }
    });

    it("filters users by role (STAFF)", async () => {
      const res = await request(app)
        .get("/api/admin/users?role=STAFF")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      for (const user of res.body) {
        expect(user.role).toBe("STAFF");
      }
    });

    it("filters users by keyword search (name or email)", async () => {
      const res = await request(app)
        .get("/api/admin/users?search=Supanut")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body.some((u: any) => u.email === requesterEmail)).toBe(true);
    });

    it("supports pagination when paginate=true or page is requested", async () => {
      const res = await request(app)
        .get("/api/admin/users?paginate=true&page=1&limit=3")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(3);
      expect(res.body.data.length).toBeLessThanOrEqual(3);
    });
  });

  describe("POST /api/admin/users - User Creation (AC-16)", () => {
    const newStaffEmail = `test.staff.${Date.now()}@toktickit.local`;

    it("creates a new user with initial credentials and mustChangePassword = true (AC-16)", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Test Engineer",
          email: newStaffEmail,
          role: "STAFF",
          isActive: true,
          initialPassword: "NewUserPass123!",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Test Engineer");
      expect(res.body.email).toBe(newStaffEmail);
      expect(res.body.role).toBe("STAFF");
      expect(res.body.isActive).toBe(true);
      expect(res.body.mustChangePassword).toBe(true);
      expect(res.body).not.toHaveProperty("passwordHash");
    });

    it("returns 409 Conflict when creating with duplicate email (AC-16)", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Duplicate User",
          email: newStaffEmail,
          role: "REQUESTER",
          isActive: true,
          initialPassword: "NewUserPass123!",
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("EMAIL_EXISTS");
    });

    it("returns 400 Bad Request when password fails complexity rules", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Weak Password User",
          email: `weak.${Date.now()}@toktickit.local`,
          role: "REQUESTER",
          isActive: true,
          initialPassword: "weak",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_PASSWORD");
    });
  });

  describe("PATCH /api/admin/users/:id - Safety Guards & Updates (AC-17, AC-18, BR-13, BR-14, BR-15)", () => {
    it("AC-17 (BR-13): rejects self-deactivation by admin with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("SELF_DEACTIVATION_PREVENTED");
    });

    it("AC-17 (BR-13): rejects self-demotion by admin with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "STAFF" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("SELF_DEMOTION_PREVENTED");
    });

    it("AC-18 (BR-14): rejects deactivating or demoting the last active Administrator with 400 Bad Request", async () => {
      const prisma = getPrisma();
      // Ensure only 1 active admin exists for this test
      const allAdmins = await prisma.user.findMany({
        where: { role: "ADMIN", isActive: true },
      });

      // If there's more than 1 admin, deactivate others for this invariant check
      for (const adm of allAdmins) {
        if (adm.id !== adminUserId) {
          await prisma.user.update({
            where: { id: adm.id },
            data: { isActive: false },
          });
        }
      }

      // Try deactivating the sole admin
      const res = await request(app)
        .patch(`/api/admin/users/${adminUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(["SELF_DEACTIVATION_PREVENTED", "LAST_ACTIVE_ADMINISTRATOR"]).toContain(
        res.body.error.code
      );
    });

    it("BR-15: rejects deactivating or demoting a user who owns active tickets", async () => {
      const prisma = getPrisma();
      // Find or create a staff user who owns an active ticket
      const staffUser = await prisma.user.findFirst({
        where: { role: "STAFF", isActive: true },
      });
      expect(staffUser).toBeDefined();

      const requester = await prisma.user.findFirst({ where: { role: "REQUESTER" } });
      const cat = await prisma.category.findFirst();
      const sys = await prisma.relatedSystem.findFirst();

      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TIK-SAFETY-${Date.now()}`,
          requesterId: requester!.id,
          ownerId: staffUser!.id,
          categoryId: cat!.id,
          relatedSystemId: sys!.id,
          summary: "Ticket for safety invariant check",
          description: "Cannot deactivate owner while ticket is open",
          currentStatus: "IN_PROGRESS",
        },
      });

      // Attempt to deactivate staff user
      const deactivateRes = await request(app)
        .patch(`/api/admin/users/${staffUser!.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(deactivateRes.status).toBe(400);
      expect(deactivateRes.body.error.code).toBe("USER_OWNS_ACTIVE_TICKETS");

      // Attempt to demote staff user to REQUESTER
      const demoteRes = await request(app)
        .patch(`/api/admin/users/${staffUser!.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "REQUESTER" });

      expect(demoteRes.status).toBe(400);
      expect(demoteRes.body.error.code).toBe("USER_OWNS_ACTIVE_TICKETS");

      // Clean up test ticket
      await prisma.ticket.delete({ where: { id: ticket.id } });
    });

    it("successfully updates name and role for a safe user", async () => {
      const prisma = getPrisma();
      // Create temporary user without tickets
      const tempEmail = `safe.update.${Date.now()}@toktickit.local`;
      const tempUser = await prisma.user.create({
        data: {
          name: "Original Name",
          email: tempEmail,
          passwordHash: await bcrypt.hash("Password123!", 10),
          role: "REQUESTER",
          isActive: true,
        },
      });

      const res = await request(app)
        .patch(`/api/admin/users/${tempUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Updated Name",
          role: "STAFF",
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Name");
      expect(res.body.role).toBe("STAFF");

      // Clean up
      await prisma.user.delete({ where: { id: tempUser.id } });
    });
  });

  describe("POST /api/admin/users/:id/reset-password (AC-19)", () => {
    it("successfully resets user password and forces mustChangePassword = true (AC-19)", async () => {
      const prisma = getPrisma();
      const tempEmail = `reset.pwd.${Date.now()}@toktickit.local`;
      const tempUser = await prisma.user.create({
        data: {
          name: "Reset Target",
          email: tempEmail,
          passwordHash: await bcrypt.hash("OldPassword123!", 10),
          role: "STAFF",
          isActive: true,
          mustChangePassword: false,
        },
      });

      const res = await request(app)
        .post(`/api/admin/users/${tempUser.id}/reset-password`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ initialPassword: "ResetPass123!#" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Password reset successfully");
      expect(res.body.user.mustChangePassword).toBe(true);

      // Verify in database
      const refreshed = await prisma.user.findUnique({ where: { id: tempUser.id } });
      expect(refreshed?.mustChangePassword).toBe(true);

      // Clean up
      await prisma.user.delete({ where: { id: tempUser.id } });
    });

    it("rejects weak initial reset password with 400 Bad Request", async () => {
      const res = await request(app)
        .post(`/api/admin/users/${adminUserId}/reset-password`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ initialPassword: "weak" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_PASSWORD");
    });
  });
});
