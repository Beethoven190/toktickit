import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Ticket Detail API", () => {
  let requester1Id: number;
  let requester2Id: number;
  let ticket1Id: number;

  beforeAll(async () => {
    const reqRes = await request(app).get("/api/requesters");
    requester1Id = reqRes.body[0].id;
    requester2Id = reqRes.body[1].id;

    const catRes = await request(app).get("/api/categories");
    const sysRes = await request(app).get("/api/systems");

    const tRes = await request(app).post("/api/tickets").send({
      requesterId: requester1Id,
      categoryId: catRes.body[0].id,
      relatedSystemId: sysRes.body[0].id,
      summary: "Ticket for Detail Test",
      description: "Testing ticket detail retrieval and access boundaries.",
      requestedPriority: "MEDIUM",
    });

    ticket1Id = tRes.body.id;
  });

  it("returns 200 with ticket details when accessed by owner (FR-09)", async () => {
    const res = await request(app).get(`/api/tickets/${ticket1Id}?requesterId=${requester1Id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ticket1Id);
    expect(res.body.summary).toBe("Ticket for Detail Test");
    expect(res.body).toHaveProperty("attachments");
  });

  it("returns 403 Forbidden when accessed by a different requester (BR-05, AC-04)", async () => {
    const res = await request(app).get(`/api/tickets/${ticket1Id}?requesterId=${requester2Id}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Forbidden");
  });

  it("returns 404 for non-existent ticket", async () => {
    const res = await request(app).get(`/api/tickets/999999?requesterId=${requester1Id}`);
    expect(res.status).toBe(404);
  });
});
