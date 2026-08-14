# Lab 1 — Peer Review Record

**Author:** Supanut Watthanasimakorn — GitHub: @Beethoven190  
**Peer reviewer:** Nititorn Ketkaew — GitHub: @SANOP19  

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| #1 | feature/1-project-foundation | Approved |
| #2 | feature/2-health-check | Approved |
| #7 | feature/3-category-seed | Approved |
| #8 | feature/4-category-list | Approved |

**Reviewer comment I received (PR #1):**
> Project Structure: Client (React + Vite + Bootstrap) and Server (Express + Prisma + TypeScript) are well-structured and aligned with the requirements.  
> Dependencies & Config: Vitest and Supertest testing frameworks, .gitignore, and .env.example are properly configured.  
> Documentation: Initial README setup instructions are clear.

**How I responded:**
> Thanks @SANOP19 I will merge that immediately.

**Reviewer comment I received (PR #2):**
> Summary:  
> - API Endpoint: `GET /api/health` returns HTTP 200 OK with `{ status: "ok", service: "TokTickIT API" }` as specified.  
> - Integration Test: Supertest integration test in `health.test.ts` passes.  
> - Frontend: Handled loading, Online, and Offline states properly with error messages.

**How I responded:**
> Thanks for the review! Merging this into `lab1-staging`.

**Reviewer comment I received (PR #7):**
> Summary:  
> - Prisma Schema: `Category` model defined with `id`, unique `name`, and `createdAt`.  
> - Migration: Successfully generated and applied PostgreSQL migration.  
> - Seeding: `server/prisma/seed.ts` upserts the 4 default categories safely and idempotently without duplicate records.  
> - Security: No sensitive credentials committed.

**How I responded:**
> Thanks for the review! Merging this into `lab1-staging`.

**Reviewer comment I received (PR #8):**
> Summary:  
> - Backend Endpoint: `GET /api/categories` retrieves categories in predictable ID order from PostgreSQL using Prisma.  
> - Integration Test: Supertest test in `categories.test.ts` passes asserting all 4 seeded categories.  
> - Frontend Integration: `checkSystem()` calls both health and categories endpoints, rendering dynamic categories in React UI.  
> - Frontend Tests: Vitest tests in `App.test.tsx` pass covering all UI states.

**How I responded:**
> Thanks for the review! Merging this into `lab1-staging`.

---

## Pull Requests I reviewed for my partner

### Issue 1: Project Foundation
**PR Link:** https://github.com/SANOP19/toktickit/pull/1  
**My comment:**
> Everything is set up properly for Issue 1:  
> - Correct branch structure targeting `lab1-staging` (from `feature/1-project-foundation`).  
> - Full project scaffold present across `client/`, `server/`, and `docs/`.  
> - `.gitignore` and `.env.example` are properly configured without any leaked secrets or `node_modules`.  
> - Starter configurations and test suites for Vitest/Supertest are ready for Issue 2.  
> Approved!

**Partner's response:**
> Merged pull request

### Issue 2: API Health Check
**PR Link:** https://github.com/SANOP19/toktickit/pull/6  
**My comment:**
> LGTM! All acceptance criteria for Issue 2 (Implement the API health check) have been satisfied:  
> - Backend: Endpoint `GET /api/health` returns HTTP 200 OK with `{ status: "ok", service: "TokTickIT API" }`.  
> - Backend Test: Supertest test in `health.test.ts` passes.  
> - Frontend: `checkSystem()` properly connects to `/api/health` and handles UI states (Online / Offline error message).  
> - Git Flow: Target branch correctly set to `lab1-staging`.  
> Approved!

**Partner's response:**
> Merged pull request

### Issue 3: Create and seed IT request categories
**PR Link:** https://github.com/SANOP19/toktickit/pull/7  
**My comment:**
> LGTM! All acceptance criteria for Issue 3 (Create and seed IT request categories) have been satisfied:  
> - Prisma Schema: `Category` model is properly defined with `id`, unique `name`, and `createdAt`.  
> - Database Migration: Migration files set up the `Category` table in PostgreSQL.  
> - Seeding Script: `server/prisma/seed.ts` safely upserts the 4 required categories (`Account and Access`, `Hardware`, `Software`, `Network`) without creating duplicates on repeated runs.  
> - Security: No database credentials or `.env` files committed.  
> - Git Flow: Target branch correctly set to `lab1-staging`.  
> Approved!

**Partner's response:**
> Merged pull request

### Issue 4: Display the IT request category list
**PR Link:** https://github.com/SANOP19/toktickit/pull/8  
**My comment:**
> LGTM! All acceptance criteria for Issue 4 (Display the IT request category list) have been satisfied:  
> - Backend: `GET /api/categories` properly retrieves categories from PostgreSQL via Prisma in predictable `id` order.  
> - Backend Test: Supertest test in `categories.test.ts` asserts HTTP 200 and the 4 seeded categories.  
> - Frontend: `checkSystem()` fetches both health and categories, dynamically rendering real categories on React UI.  
> - Frontend Test: Vitest component tests in `App.test.tsx` verify the category list rendering and UI states.  
> - Git Flow: Target branch correctly set to `lab1-staging`.  
> Approved!

**Partner's response:**
> Merged pull request
