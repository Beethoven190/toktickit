# AI Usage Log & Reflection — Lab 3: TokTickIT

**Course:** CPE 334 Software Engineering Laboratory  
**Sprint:** Lab 3 — Users, Roles, IT Staff Ticketing, and Admin Screens  
**Author:** Supanut Watthanasimakorn ([@Beethoven190](https://github.com/Beethoven190))  
**Primary AI Assistant:** Antigravity IDE (Advanced Agentic Coding / Gemini 2.5) & GitHub Copilot  

---

## 1. Overview of AI Tools Utilized

Throughout Sprint 3, AI assistance was systematically integrated across the full Spec-Driven Development (Spec DD) and Test-Driven Development (Test DD) lifecycles:
- **Antigravity IDE (Agentic Assistant):** Used for codebase analysis, drafting engineering contracts (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`), designing database evolution (`RequesterUser` to unified `User` model with `Role` enum), generating Supertest integration tests and Vitest component test suites, developing Zen Green UI components, enforcing safety guards, and peer review assistance.
- **GitHub Copilot:** Used in-editor for autocompletion of TypeScript interfaces, Supertest route handlers, React hooks, and Bootstrap utility classes.

---

## 2. Key Prompts & Engineering Iterations (6–10 Prompts)

### 2.1 Issue 1: Engineering Contract Documentation (Spec DD)
- **Prompt:**
  > *"Analyze Lab 3 handout and formalize the Sprint 3 engineering contracts in `docs/lab-03/`: `specification.md` (FR-01..19, BR-01..18, Role x Endpoint authorization matrix, DoD), `api-spec.md`, `ui-spec.md` (Zen Green tokens, Teacher Mockups 1-4), and `tests.md` (AC-01..20 traceability). Ensure clear boundary definitions between Requester, IT Staff, and Administrator."*
- **Outcome & Human Intervention:**
  The AI produced a complete specification. Human review verified that ticket statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `PENDING`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`) and state machine transitions strictly matched the instructor requirements before any feature coding began.

### 2.2 Issue 2: Authentication Foundation, User Migration & Password Change
- **Prompt:**
  > *"Evolve Prisma schema from RequesterUser to unified User model with Role enum (REQUESTER, STAFF, ADMIN). Add JWT auth middleware with token revocation on logout. Implement POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me, and POST /api/auth/change-password with live password complexity validation and mandatory first-login quarantine (BR-02, AC-02)."*
- **Outcome & Human Intervention:**
  Database schema was migrated with `Ticket.ownerId` and `itPriority`. First-login quarantine was enforced on the server-side (`requirePasswordChangeCompleted` middleware) and frontend (`ChangePasswordModal` live checklist).

### 2.3 Issue 3: IT Staff Ticket Queue & KPI Metrics (Teacher Mockup 2)
- **Prompt:**
  > *"Implement GET /api/staff/queue with multi-criteria search, category/system/priority/status/owner filters, sorting, and pagination. Build StaffTicketQueue.tsx adhering to Teacher Mockup 2 with KPI summary pills (All, Unassigned, My Tickets, In Progress), desktop table, mobile cards, and Zen Green badges."*
- **Outcome & Human Intervention:**
  The queue query was optimized with parallel Prisma count queries for real-time KPI metrics. Responsive layout testing confirmed proper table rendering on `>= 992px` and card view on mobile `< 768px`.

### 2.4 Issue 4: IT Staff Ticket Operations & State Transitions (Teacher Mockup 3)
- **Prompt:**
  > *"Implement IT Staff ticket operations: PATCH /api/staff/tickets/:id/claim (auto-advancing NEW to OPEN), /assign, /priority, and /status. Enforce valid state transition matrix and mandatory resolution summary (>= 5 chars) on RESOLVED/CLOSED (BR-10). Build StaffTicketDetail.tsx with clean breadcrumbs and operational controls."*
- **Outcome & Human Intervention:**
  Strict transition validation was verified via 23 integration tests, rejecting illegal jumps (e.g. `NEW` directly to `CLOSED`) with HTTP 400 Bad Request.

### 2.5 Issue 5: Collaboration — Comments, Confidential Notes & Problem Resolution
- **Prompt:**
  > *"Implement Public Comments (GET/POST /api/tickets/:id/comments) accessible to Requester, Staff, and Admin (1-2000 chars, append-only). Implement Internal Notes (GET/POST /api/tickets/:id/notes) strictly confidential to Staff and Admin (403 Forbidden for Requester). Implement POST/PATCH /api/tickets/:id/resolve-indication for Requester without altering currentStatus (BR-07)."*
- **Outcome & Human Intervention:**
  Authorization guards were tested to ensure zero information leakage: requesters cannot access internal notes or know of their existence. The "Appears Resolved" indicator was integrated into `MyTickets.tsx` with a `✓ Resolved` badge.

### 2.6 Issue 6: Administrator User Management & Safety Guards (Teacher Mockup 4)
- **Prompt:**
  > *"Implement /api/admin/users endpoints restricted to ADMIN. Implement GET with search/role filter/pagination, POST with bcrypt cost 12 and mustChangePassword=true, PATCH with safety guards (BR-13 self-protection, BR-14 last admin guard, BR-15 active ticket owner protection), and POST /reset-password. Build UserManagement.tsx with split-view layout and drawer."*
- **Outcome & Human Intervention:**
  All three safety guards were enforced on both backend and frontend. The UI conditionally hides the `Deactivate User` action on the logged-in administrator and the last active administrator.

### 2.7 Automated Test Coverage & Regression Safety
- **Prompt:**
  > *"Ensure full test continuity across all suites: server/tests/lab-01, lab-02, lab-03 and client/tests/lab-01, lab-02, lab-03. Verify 100% pass rate with zero regressions and clean TypeScript/Vite builds."*
- **Outcome & Human Intervention:**
  A foreign key issue in `users-admin.api.test.ts` was caught during test execution (hardcoded `requesterId: 1`) and promptly fixed to use dynamic database lookups. Final verification achieved 160/160 passing tests.

### 2.8 Peer Review Assistance & Cross-Collaboration
- **Prompt:**
  > *"Review PR #33 on SANOP19/toktickit against Lab 3 specifications, Teacher Mockup 4, and acceptance criteria. Evaluate RBAC enforcement, safety rules, and UI responsiveness. Prepare structured peer review documentation for reviewer.md."*
- **Outcome & Human Intervention:**
  The AI performed deep diff inspections and generated structured feedback. The student author verified the review, approved the PR on GitHub, and executed the merge per Rule 1 (Reviewer Clicks Merge).

---

## 3. Critical Reflection on AI Effectiveness

### 3.1 Strengths & Productivity Multipliers
1. **Accelerated Spec DD:** Drafting complete engineering contracts and mapping every requirement to Acceptance Criteria (AC-01..20) ensured zero specification gaps prior to coding.
2. **Robust Test Generation:** Writing comprehensive Supertest and React Testing Library tests alongside code prevented regressions across earlier Lab 1 and Lab 2 features.
3. **Safety Guard Verification:** Automated tests effectively tested edge cases (e.g., self-deactivation, demoting the last admin, active ticket ownership conflicts) that are easily overlooked in manual testing.
4. **Design Language Fidelity:** The Zen Green palette (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`) was consistently applied across all screens (Login, Mandatory Password Change, Queue, Detail, User Management).

### 3.2 Challenges & Human Engineering Interventions
1. **Foreign Key Test Fixtures:** When generating database integration tests, the AI initially hardcoded relational IDs. Human intervention established dynamic record retrieval (`prisma.user.findFirst`) to ensure test idempotency across diverse environments.
2. **TypeScript Query Parameter Type Inference:** Strict TypeScript compiler checks (`tsc`) identified subtle type mismatch comparisons on Express `req.query` string/boolean values, which were resolved by explicit string normalization (`String(isActive).toLowerCase() === "true"`).
3. **Responsive DOM Querying in Tests:** With two-panel desktop and responsive card layouts, multiple elements with similar labels exist in the DOM. Human guidance introduced scoped queries using `within(container)` to ensure rock-solid test reliability.

---

## 4. Ethical & Academic Integrity Statement

AI tools were utilized strictly as intelligent pair-programming assistants under human architectural direction. All business logic, database migrations, security rules, and user interfaces were reviewed, validated, and understood by the author. Peer reviews and merges were executed independently in strict compliance with the course collaboration guidelines.
