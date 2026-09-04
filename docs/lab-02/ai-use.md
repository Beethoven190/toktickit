# AI Usage Log & Reflection — Lab 2: TokTickIT

**Course:** CPE 334 Software Engineering Laboratory  
**Sprint:** Lab 2 — Requester Ticketing MVP with UI Foundation  
**Author:** Supanut Watthanasimakorn ([@Beethoven190](https://github.com/Beethoven190))  
**Primary AI Assistant:** Antigravity IDE (Advanced Agentic Coding / Gemini 2.5) & GitHub Copilot  

---

## 1. Overview of AI Tools Utilized

During the development of Lab 2, AI tools were leveraged throughout the end-to-end software engineering lifecycle, including architectural specification, database modeling, REST API design, frontend component development, automated testing, and peer review assistance:
- **Antigravity IDE (Agentic Assistant):** Used for repository analysis, planning implementation steps, drafting engineering specifications, executing shell migrations, writing Supertest and Vitest test suites, and refactoring responsive UI components.
- **GitHub Copilot:** Used in-editor for autocompletion of TypeScript interfaces, Prisma queries, and Bootstrap utility classes.

---

## 2. Detailed Prompt Log & Engineering Iterations

### 2.1 Issue 1: Engineering Contract Documentation
- **Prompt Sample:**
  > *"Analyze the Lab 2 assignment requirements (Part 1-6) and generate the 4 engineering contract documents in `docs/lab-02/`: `specification.md`, `tests.md`, `ui-spec.md`, and `api-spec.md`. Ensure all Business Rules (BR-01 to BR-14) and Acceptance Criteria (AC-01 to AC-07) are formalized in Given-When-Then format."*
- **Outcome & Iteration:**
  The AI drafted complete, detailed specifications aligned with the Zen Green Theme (`#006B3C`), ticket numbering scheme (`TKT-YYYY-XXXXXX`), and attachment soft-removal lifecycle. Human review ensured that the boundaries between included and excluded scope were strictly respected.

### 2.2 Issue 2: Development Requester Context
- **Prompt Sample:**
  > *"Create the RequesterUser model in Prisma with an isActive flag. Seed 5 requesters (4 active, 1 inactive) idempotently. Create an endpoint GET /api/requesters that strictly omits inactive users (BR-04), and build the Zen Green selector UI with context storage."*
- **Outcome & Iteration:**
  The AI generated the model and API. During testing, the author requested specific custom requester names (`Supanut Watthanasimakorn`, `David Ice`, `Nitithorn Katkaew`, `Nara Kosiyaporn`, and inactive `Metier Leviathan`), which were updated across seeds, tests, and frontend components.

### 2.3 Issue 3: Ticket Creation and Form Validation
- **Prompt Sample:**
  > *"Add Ticket and RelatedSystem models, Priority and TicketStatus enums. Seed 6 related systems safely. Create POST /api/tickets with automated ticket number generation in TKT-YYYY-XXXXXX format and NEW initial status. Implement CreateTicket.tsx with field-level error messages that do not wipe user inputs (BR-14)."*
- **Outcome & Iteration:**
  The sequence generator logic was implemented to safely increment based on the latest ticket in the current year. Supertest tests and Vitest UI tests were generated and passed with 100% success rate.

### 2.4 Issue 4: My Tickets Screen & Ownership Protection
- **Prompt Sample:**
  > *"Implement GET /api/tickets with required requesterId for strict ownership protection (BR-05). Add search by ticket number or summary, category/priority/status filters, and pagination. Create MyTickets.tsx with a desktop table and mobile card responsive layout."*
- **Outcome & Iteration:**
  The component handled both desktop and mobile viewports. In Vitest, an initial `findByText` matcher error occurred because the ticket number was rendered in both the desktop table and mobile card; this was promptly corrected by using `findAllByText`.

### 2.5 Issue 5: Requester Ticket Detail & Attachment Soft-Removal
- **Prompt Sample:**
  > *"Add the Attachment model with isRemoved, removalReason, and removedAt. Install multer and configure endpoints for file upload (<= 5MB, JPG/PNG/WEBP/PDF, max 5 active), secure download, and soft-removal requiring a reason (min 5 chars). Create TicketDetail.tsx with a soft-removal confirmation modal and an audit history list with blocked downloads."*
- **Outcome & Iteration:**
  Multer was installed and configured with disk storage. Both backend and frontend enforcement of the 5-character reason requirement and download blocking were verified with automated tests.

---

## 3. Critical Reflection on AI Effectiveness

### 3.1 Strengths & Productivity Gains
1. **Rapid Scaffolding:** Generating database schemas, SQL migrations, and REST endpoints significantly reduced boilerplate setup time.
2. **Automated Test Quality:** Generating integration tests (Supertest) and component tests (Vitest with React Testing Library) ensured regression prevention and adherence to DoD.
3. **Consistency in Design System:** Applying the Zen Green palette (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`) and field state styling consistently across all three screens.

### 3.2 Areas Requiring Human Verification & Intervention
1. **Prisma Migrations on Non-Interactive Shells:** In Windows environments, `npx prisma migrate dev` prompts interactively. Human guidance directed the process to use `prisma migrate diff` and `prisma migrate deploy` to ensure reliable execution.
2. **Testing in Responsive DOMs:** Multiple DOM nodes generated by responsive layouts (desktop table + mobile cards) required careful test query selection (`findAllByText` instead of `getByText`).
3. **Business Rule Enforcement:** Human verification ensured that edge cases—such as blocking inactive requesters from dropdowns and blocking downloads of soft-removed files—were strictly enforced at both the API and UI layers.

---

## 4. Ethical & Academic Integrity Statement

The AI was used as an agile pair programmer and software engineering accelerator. All generated code, database migrations, and architectural decisions were reviewed, understood, validated, and tested by the student author. All Git commits and peer review interactions were conducted in accordance with the course academic integrity policy.
