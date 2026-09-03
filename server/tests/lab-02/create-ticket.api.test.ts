import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Ticket Creation & Related Systems API", () => {
  it("GET /api/systems returns 200 with seeded systems", async () => {
    const res = await request(app).get("/api/systems");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(6);

    const names = res.body.map((s: { name: string }) => s.name);
    expect(names).toContain("Corporate Laptop");
    expect(names).toContain("Email");
    expect(names).toContain("Campus Wi-Fi");
  });

  it("POST /api/tickets creates a ticket with valid inputs (AC-01, BR-01, BR-02)", async () => {
    const requestersRes = await request(app).get("/api/requesters");
    const categoriesRes = await request(app).get("/api/categories");
    const systemsRes = await request(app).get("/api/systems");

    const validPayload = {
      requesterId: requestersRes.body[0].id,
      categoryId: categoriesRes.body[0].id,
      relatedSystemId: systemsRes.body[0].id,
      summary: "Cannot connect to campus VPN from home",
      description: "Getting connection timeout error 691 when attempting to establish a VPN session.",
      requestedPriority: "HIGH",
    };

    const res = await request(app).post("/api/tickets").send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("ticketNumber");

    // BR-01: Official Ticket Number format TKT-YYYY-XXXXXX
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);

    // BR-02: Starts with Current Status NEW
    expect(res.body.currentStatus).toBe("NEW");
    expect(res.body.requestedPriority).toBe("HIGH");
    expect(res.body.summary).toBe(validPayload.summary);
    expect(res.body.category.name).toBe(categoriesRes.body[0].name);
    expect(res.body.relatedSystem.name).toBe(systemsRes.body[0].name);
  });

  it("POST /api/tickets rejects summary shorter than 5 characters (BR-06)", async () => {
    const payload = {
      requesterId: 1,
      categoryId: 1,
      relatedSystemId: 1,
      summary: "Bad", // only 3 chars
      description: "This is a valid long description for testing validation.",
    };

    const res = await request(app).post("/api/tickets").send(payload);
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("summary");
  });

  it("POST /api/tickets rejects description shorter than 10 characters (BR-07)", async () => {
    const payload = {
      requesterId: 1,
      categoryId: 1,
      relatedSystemId: 1,
      summary: "Valid ticket summary",
      description: "Short", // only 5 chars
    };

    const res = await request(app).post("/api/tickets").send(payload);
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("description");
  });
});
