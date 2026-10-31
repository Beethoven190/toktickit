# AI Usage Log & Reflection — Lab 4: TokTickIT

**Course:** CPE 334 Software Engineering Laboratory  
**Sprint:** Lab 4 — TokTickIT Actions Taken, Dashboards, and Final Regression  
**Author:** Supanut Watthanasimakorn ([@Beethoven190](https://github.com/Beethoven190))  
**Primary AI Assistant:** Antigravity IDE (Advanced Agentic Coding / Gemini 2.5) & GitHub Copilot  

---

## 1. Overview of AI Tools Utilized

Throughout Sprint 4, AI assistance was systematically integrated across the complete Spec-Driven Development (Spec DD) and Test-Driven Development (Test DD) lifecycles:
- **Antigravity IDE (Agentic Assistant):** Used for codebase analysis, drafting engineering contracts (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`), evolving database models (`ActionTaken`, Prisma migration `20261029150000_lab4_actions_taken`), developing Zen Green UI components (`ActionsTakenSection.tsx`, `AddActionTakenModal.tsx`, `StaffDashboard.tsx`, `RequesterDashboard.tsx`), enforcing state machines and optimistic concurrency guards, authoring automated test suites, and performing line-by-line peer reviews.
- **GitHub Copilot:** Used in-editor for autocompletion of TypeScript interfaces, Express route handlers, React form validation hooks, and CSS utility styling.

---

## 2. Key Prompts & Engineering Iterations (6–10 Prompts)

### 2.1 Issue 1: Sprint 4 Engineering Contract Documentation (Spec DD)
- **Prompt:**
  > *"Analyze Lab 4 handout and formalize the Sprint 4 engineering contracts in `docs/lab-04/`: `specification.md` (FR-01..12, BR-01..16, 8-state lifecycle matrix, DoD), `api-spec.md` (Actions Taken, Dashboards, Resolution Gate, Stale Update Conflict), `ui-spec.md` (Zen Green tokens `#006B3C`, Screens 8.1, 8.2, 8.3), and `tests.md` (AC-01..11 traceability). Ensure parent-child relationships between Ticket and Actions Taken are rigorously defined prior to implementation."*
- **Outcome & Human Intervention:**
  The AI drafted all four specification files. Human review verified that all 8 ticket statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`) and the strict transition rules were fully documented before any code was written.

### 2.2 Issue 2: Actions Taken Database Foundation, Prisma Migration & REST API
- **Prompt:**
  > *"Add ActionTaken model to Prisma schema with fields (actionDateTime, description, result, performedById, followUpRequired, followUpNote, attachmentNotes, ticketId). Create migration 20261029150000_lab4_actions_taken. Implement REST API endpoints: POST/GET/PATCH /api/staff/tickets/:ticketId/actions, GET /api/tickets/:id/actions, and block Requester write attempts with 403 Forbidden (AC-03). Seed tickets with 0, 1, and multiple actions."*
- **Outcome & Human Intervention:**
  The interactive `prisma migrate dev` command hung waiting for TTY in the automated terminal. Human intervention pivoted to `prisma migrate diff` and `prisma migrate deploy`, generating idempotent migrations and verified seed data.

### 2.3 Issue 3: Actions Taken UI on Ticket Detail (Screen 8.3)
- **Prompt:**
  > *"Build ActionsTakenSection.tsx and AddActionTakenModal.tsx conforming to Screen 8.3 and Teacher Mockup 3. Display chronological cards with performer badge, status pills, result box, conditional follow-up banner, and attachment notes. Enforce dynamic toggle for mandatory followUpNote (min 5 chars). Ensure Requester view is strictly read-only with Add/Edit buttons hidden."*
- **Outcome & Human Intervention:**
  Vitest JSDOM tests failed initially because HTML5 native form validation blocked form submission during simulated events. Human guidance added `noValidate` to the form element to allow React state validation to handle the flow deterministically.

### 2.4 Issue 4: Ticket Lifecycle, Resolution Gate & Concurrency Guards
- **Prompt:**
  > *"Enforce 8-state transition matrix strictly on PATCH /api/staff/tickets/:id/status. Enforce server-side Resolution Gate: transitioning to RESOLVED or CLOSED requires resolutionSummary >= 5 characters (BR-09, AC-06). Implement optimistic concurrency guard via expectedUpdatedAt returning HTTP 409 STALE_UPDATE_CONFLICT (BR-11, AC-08). Implement POST /api/tickets/:id/resolve-advisory for Requester without altering currentStatus."*
- **Outcome & Human Intervention:**
  Automated tests caught an invalid enum cast in `ticket-workflow.api.test.ts`. Human intervention added explicit type casting to satisfy TypeScript compiler standards, achieving 14 backend integration tests and 6 frontend component tests passing.

### 2.5 Issue 5: Role-Appropriate Dashboards (Screens 8.1 & 8.2)
- **Prompt:**
  > *"Implement /api/dashboards/staff returning authoritative SQL counts for new, open, inProgress, waitingForRequester, myAssigned (excluding terminal states), day-over-day deltas, and top 5 recent tickets. Implement /api/dashboards/requester strictly isolated to requesterId = req.user.id (AC-05). Build StaffDashboard.tsx (Screen 8.1) and RequesterDashboard.tsx (Screen 8.2) with interactive drill-down navigation (AC-09)."*
- **Outcome & Human Intervention:**
  During concurrent Vitest execution, dynamic ticket creations from parallel suites caused race conditions in global ticket counts. Human intervention updated dashboard test fixtures to create isolated test users with predetermined ticket counts, ensuring 100% deterministic assertions.

### 2.6 Issue 6: Final Hardening, Full Regression & Release Verification
- **Prompt:**
  > *"Execute full regression across all test suites (server and client). Verify 100% pass rate with zero regressions across Labs 1 to 4. Ensure production builds (tsc and vite build) compile cleanly. Build Playwright E2E test suites in e2e/lab-04/ for actions taken flow, ticket resolution, and dashboards. Finalize reviewer.md and ai-use.md."*
- **Outcome & Human Intervention:**
  All 225 automated unit/integration/component tests passed cleanly (150 server + 75 client), production builds compiled with 0 errors, and Playwright E2E suites were configured.

### 2.7 Reciprocal Peer Review Assistance
- **Prompt:**
  > *"Conduct structured peer reviews on @SANOP19 PRs (#38, #46, #47, #48, #49) and @narakosi-dev PR #67. Inspect code diffs against Lab 4 business rules (BR-01..BR-16) and acceptance criteria. Provide thorough line-by-line review comments with clear formatting and double newlines to prevent text clumping in GitHub."*
- **Outcome & Human Intervention:**
  The AI drafted detailed, highly structured English reviews. The student author verified the code, posted the reviews to GitHub, and executed the merge per Rule 1 (Reviewer Merges PR).

---

## 3. Critical Reflection on AI Effectiveness

### 3.1 Strengths & Productivity Multipliers
1. **Accelerated Spec DD:** Drafting exhaustive specification contracts across data models, REST endpoints, UI screens, and test matrices eliminated ambiguity before writing application code.
2. **State Machine & Concurrency Precision:** The AI accurately implemented the 8-state transition matrix and optimistic concurrency locks (`expectedUpdatedAt`), catching potential race conditions and unauthorized status jumps.
3. **Design System Consistency:** Preserving the Zen Green design tokens (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`) across Screens 8.1, 8.2, and 8.3 ensured a unified, professional user experience.
4. **Comprehensive Regression Protection:** Maintaining 225 automated tests guaranteed that adding new Sprint 4 capabilities caused zero regression to authentication, comments, notes, or admin user management from earlier labs.

### 3.2 Challenges & Human Engineering Interventions
1. **Interactive TTY Migration Blocker:** Automated tools cannot respond to interactive TTY prompts. Human intervention diagnosed the issue and executed `prisma migrate diff` / `prisma migrate deploy` non-interactively.
2. **Concurrent Test Race Conditions:** When testing dashboard SQL aggregates, concurrent test suites created tickets simultaneously, altering counts. Human engineering introduced isolated test fixtures to guarantee test isolation.
3. **HTML5 Form Validation in Virtual DOM:** Vitest/JSDOM does not execute browser form submission when HTML5 inputs fail native constraints. Human intervention added `noValidate` to let React state manage validation cleanly.
4. **Windows Line Ending (CRLF vs LF) Normalization:** Script replacements on Windows failed due to mismatched `\r\n` line endings. Human intervention normalized line breaks before applying regex substitutions.

---

## 4. Ethical & Academic Integrity Statement

AI tools were utilized strictly as an intelligent pair-programming assistant under the author's direct architectural and engineering supervision. All business logic, database migrations, security rules, and user interfaces were reviewed, validated, and thoroughly understood by the author. Peer reviews and merges were executed independently in strict compliance with the course collaboration guidelines.
