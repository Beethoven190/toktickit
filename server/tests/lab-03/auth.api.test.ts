import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 3 Auth API & User Foundation (AC-01, AC-02, AC-03, BR-01, BR-02, BR-03, BR-06)", () => {
  const validEmail = "supanut.w@toktickit.local";
  const validPassword = "Password123!";
  const inactiveEmail = "metier.l@toktickit.local";
  const mustChangeEmail = "newbie.requester@toktickit.local";

  let authToken: string;

  describe("POST /api/auth/login", () => {
    it("returns 200 and JWT token with safe user profile for valid credentials (AC-01, BR-01)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: validEmail, password: validPassword });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(typeof res.body.token).toBe("string");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe(validEmail);
      expect(res.body.user.role).toBe("REQUESTER");
      expect(res.body.user.isActive).toBe(true);
      expect(res.body.user).not.toHaveProperty("passwordHash");

      authToken = res.body.token;
    });

    it("rejects login for inactive user account with 401 (BR-01)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: inactiveEmail, password: validPassword });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it("rejects login for incorrect password with 401 (BR-01)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: validEmail, password: "WrongPassword999!" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it("rejects login for non-existent email with 401 (BR-01)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nonexistent@toktickit.local", password: validPassword });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it("rejects login missing email or password with 400 validation error", async () => {
      const res = await request(app).post("/api/auth/login").send({});

      expect(res.status).toBe(400);
      expect(res.body.error.fields).toHaveProperty("email");
      expect(res.body.error.fields).toHaveProperty("password");
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 200 with authenticated user profile when Bearer token is provided", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(validEmail);
      expect(res.body.user.name).toBe("Supanut Watthanasimakorn");
    });

    it("returns 401 Unauthorized when authorization header is missing", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns 401 Unauthorized when invalid token is provided", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid.token.value");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("revokes token on logout so subsequent requests fail with 401", async () => {
      // Login to get a disposable token
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "david.i@toktickit.local", password: validPassword });
      const tokenToRevoke = loginRes.body.token;

      // Verify token works
      const beforeLogout = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${tokenToRevoke}`);
      expect(beforeLogout.status).toBe(200);

      // Logout
      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${tokenToRevoke}`);
      expect(logoutRes.status).toBe(200);

      // Verify token is now rejected
      const afterLogout = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${tokenToRevoke}`);
      expect(afterLogout.status).toBe(401);
    });
  });

  describe("POST /api/auth/change-password (AC-02, BR-02, BR-06)", () => {
    let newbieToken: string;

    beforeAll(async () => {
      const { getPrisma } = await import("../../src/prisma.js");
      const bcrypt = (await import("bcryptjs")).default;
      const prisma = getPrisma();
      const hash = await bcrypt.hash(validPassword, 10);
      await prisma.user.update({
        where: { email: mustChangeEmail },
        data: {
          passwordHash: hash,
          mustChangePassword: true,
        },
      });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: mustChangeEmail, password: validPassword });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.mustChangePassword).toBe(true);
      newbieToken = loginRes.body.token;
    });

    it("rejects password that does not meet complexity requirements (BR-06)", async () => {
      // Missing uppercase, special character, too short
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${newbieToken}`)
        .send({
          currentPassword: validPassword,
          newPassword: "short",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.fields).toHaveProperty("newPassword");
    });

    it("rejects change password when current password is wrong", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${newbieToken}`)
        .send({
          currentPassword: "IncorrectCurrentPassword!",
          newPassword: "BrandNewSecurePassword123!",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.fields).toHaveProperty("currentPassword");
    });

    it("rejects when new password is identical to current password", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${newbieToken}`)
        .send({
          currentPassword: validPassword,
          newPassword: validPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.fields).toHaveProperty("newPassword");
    });

    it("successfully changes password and clears mustChangePassword flag (AC-02, BR-02)", async () => {
      const newPassword = "BrandNewSecurePassword123!";
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${newbieToken}`)
        .send({
          currentPassword: validPassword,
          newPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.mustChangePassword).toBe(false);
      expect(res.body.user.mustChangePassword).toBe(false);

      // Verify that user can now log in with the new password
      const reLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: mustChangeEmail, password: newPassword });
      expect(reLogin.status).toBe(200);
      expect(reLogin.body.user.mustChangePassword).toBe(false);
    });
  });

  describe("Ownership Protection with Authenticated Identity (AC-03, BR-03)", () => {
    it("ignores forged requesterId in POST /api/tickets and sets owner to authenticated user", async () => {
      const catsRes = await request(app).get("/api/categories");
      const sysRes = await request(app).get("/api/systems");

      // Supanut (id=1 or authenticated) passes a forged requesterId=999
      const res = await request(app)
        .post("/api/tickets")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          requesterId: 999, // Forged!
          categoryId: catsRes.body[0].id,
          relatedSystemId: sysRes.body[0].id,
          summary: "Auth Overrides Forged Requester Ticket",
          description: "Testing that server enforces authenticated user identity over body requesterId.",
          requestedPriority: "LOW",
        });

      expect(res.status).toBe(201);
      // The created ticket's requesterId MUST match the authenticated user's ID, NOT 999
      expect(res.body.requesterId).not.toBe(999);
      expect(res.body.requester.email).toBe(validEmail);
    });

    it("ignores forged requesterId in GET /api/tickets query param and filters by authenticated user", async () => {
      // Supanut requests tickets with ?requesterId=2 (David Ice)
      const res = await request(app)
        .get("/api/tickets?requesterId=2")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      // All returned tickets must belong to Supanut (validEmail), never David Ice
      for (const ticket of res.body.data) {
        expect(ticket.requester.email).toBe(validEmail);
      }
    });
  });
});
