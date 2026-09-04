import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("My Tickets API (Ownership Protection & Search/Filters)", () => {
  let requester1Id: number;
  let requester2Id: number;
  let categoryId: number;
  let systemId: number;

  beforeAll(async () => {
    const requestersRes = await request(app).get("/api/requesters");
    requester1Id = requestersRes.body[0].id;
    requester2Id = requestersRes.body[1].id;

    const categoriesRes = await request(app).get("/api/categories");
    categoryId = categoriesRes.body[0].id;

    const systemsRes = await request(app).get("/api/systems");
    systemId = systemsRes.body[0].id;

    // Create a ticket for Requester 1
    await request(app).post("/api/tickets").send({
      requesterId: requester1Id,
      categoryId,
      relatedSystemId: systemId,
      summary: "Requester 1 First Support Ticket",
      description: "Detailed description for requester 1 first test ticket.",
      requestedPriority: "HIGH",
    });

    // Create a ticket for Requester 2
    await request(app).post("/api/tickets").send({
      requesterId: requester2Id,
      categoryId,
      relatedSystemId: systemId,
      summary: "Requester 2 Confidential Issue",
      description: "Detailed description for requester 2 confidential ticket.",
      requestedPriority: "LOW",
    });
  });

  it("fails with 400 if requesterId is missing", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("requesterId is required");
  });

  it("enforces Ownership Protection: Requester 1 sees only Requester 1's tickets (BR-05, AC-03)", async () => {
    const res = await request(app).get(`/api/tickets?requesterId=${requester1Id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");

    // All returned tickets must strictly belong to requester1Id
    for (const ticket of res.body.data) {
      expect(ticket.requesterId).toBe(requester1Id);
      expect(ticket.summary).not.toContain("Requester 2 Confidential Issue");
    }
  });

  it("supports searching by summary keyword (FR-07, AC-07)", async () => {
    const res = await request(app).get(
      `/api/tickets?requesterId=${requester1Id}&search=First`
    );
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].summary).toContain("First");
  });

  it("supports filtering by priority", async () => {
    const res = await request(app).get(
      `/api/tickets?requesterId=${requester1Id}&priority=HIGH`
    );
    expect(res.status).toBe(200);
    for (const ticket of res.body.data) {
      expect(ticket.requestedPriority).toBe("HIGH");
    }
  });

  it("returns pagination metadata", async () => {
    const res = await request(app).get(
      `/api/tickets?requesterId=${requester1Id}&page=1&limit=5`
    );
    expect(res.status).toBe(200);
    expect(res.body.pagination).toHaveProperty("total");
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(5);
    expect(res.body.pagination).toHaveProperty("totalPages");
  });
});
