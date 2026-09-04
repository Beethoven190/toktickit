import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Attachment Lifecycle API (Upload, Download, Soft-Removal)", () => {
  let requester1Id: number;
  let ticket1Id: number;
  let attachmentId: number;

  beforeAll(async () => {
    const reqRes = await request(app).get("/api/requesters");
    requester1Id = reqRes.body[0].id;

    const catRes = await request(app).get("/api/categories");
    const sysRes = await request(app).get("/api/systems");

    const tRes = await request(app).post("/api/tickets").send({
      requesterId: requester1Id,
      categoryId: catRes.body[0].id,
      relatedSystemId: sysRes.body[0].id,
      summary: "Ticket for Attachment Lifecycle Tests",
      description: "Testing uploading and soft-removing attachments on a ticket.",
      requestedPriority: "LOW",
    });

    ticket1Id = tRes.body.id;
  });

  it("uploads a valid PNG attachment successfully (BR-09, AC-05)", async () => {
    const fakePngBuffer = Buffer.from("89504E470D0A1A0A0000000D49484452", "hex");

    const res = await request(app)
      .post(`/api/tickets/${ticket1Id}/attachments`)
      .field("requesterId", requester1Id)
      .attach("file", fakePngBuffer, "screenshot.png");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.originalName).toBe("screenshot.png");
    expect(res.body.isRemoved).toBe(false);

    attachmentId = res.body.id;
  });

  it("rejects an unsupported attachment file type (BR-09)", async () => {
    const badBuffer = Buffer.from("MZ90000300000004", "hex");

    const res = await request(app)
      .post(`/api/tickets/${ticket1Id}/attachments`)
      .field("requesterId", requester1Id)
      .attach("file", badBuffer, "virus.exe");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Unsupported file type");
  });

  it("downloads active attachment successfully (FR-11)", async () => {
    const res = await request(app).get(
      `/api/tickets/${ticket1Id}/attachments/${attachmentId}/file?requesterId=${requester1Id}`
    );

    expect(res.status).toBe(200);
    expect(res.header["content-disposition"]).toContain("screenshot.png");
  });

  it("soft-removes attachment with reason (BR-12, BR-13, AC-06)", async () => {
    const res = await request(app)
      .delete(`/api/tickets/${ticket1Id}/attachments/${attachmentId}`)
      .send({
        requesterId: requester1Id,
        removalReason: "Uploaded wrong screenshot by mistake",
      });

    expect(res.status).toBe(200);
    expect(res.body.isRemoved).toBe(true);
    expect(res.body.removalReason).toBe("Uploaded wrong screenshot by mistake");
    expect(res.body.removedAt).not.toBeNull();
  });

  it("blocks downloading soft-removed attachment (BR-12, AC-06)", async () => {
    const res = await request(app).get(
      `/api/tickets/${ticket1Id}/attachments/${attachmentId}/file?requesterId=${requester1Id}`
    );

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("removed");
  });
});
