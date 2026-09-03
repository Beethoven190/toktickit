import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("GET /api/requesters", () => {
  it("returns 200 and lists only active development requesters", async () => {
    const res = await request(app).get("/api/requesters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);

    const names = res.body.map((r: { name: string }) => r.name);
    expect(names).toContain("Supanut Watthanasimakorn");
    expect(names).toContain("David Ice");
    expect(names).toContain("Nitithorn Katkaew");
    expect(names).toContain("Nara Kosiyaporn");

    // BR-04: Inactive requesters must NEVER appear in the active selection list
    expect(names).not.toContain("Metier Leviathan");
  });
});
