# TokTickIT — IT Service Desk

TokTickIT is an IT service desk web application developed as part of **CPE 334: Introduction to Software Engineering in the Age of AI Agents**.

**Lab 4 Increment: Actions Taken, Dashboards, and Final Regression** completes the core service desk workflow:
- **Actions Taken:** Parent-child work logging under tickets by IT Staff and Administrators (action date/time, description, result, performer auto-attribution, conditional follow-up note, attachment notes).
- **Ticket Lifecycle & Resolution Gate:** Strict 8-state transition matrix, server-side resolution gate requiring `resolutionSummary >= 5` characters for `RESOLVED` and `CLOSED`, and optimistic concurrency conflict detection (`expectedUpdatedAt` / HTTP 409).
- **Role-Appropriate Dashboards:** Real-time authoritative SQL aggregation for IT Staff (`/api/dashboards/staff`) and isolated Requester dashboards (`/api/dashboards/requester`) with day-over-day deltas and seamless queue drill-down navigation.
- **Full Regression Hardening:** 100% preservation of all prior sprint features (authentication, password change quarantine, comments, notes, admin user management) across the unified **Zen Green** design language (`#006B3C`).

---

## 🛠 Tech Stack

| Area | Technology Stack |
|---|---|
| **Frontend** | React (v18), TypeScript, Vite, Bootstrap 5 (Zen Green Theme) |
| **Backend** | Node.js, Express, TypeScript, tsx, JWT, bcryptjs |
| **Database & ORM** | PostgreSQL, Prisma ORM |
| **Testing** | Vitest (API & Component), Supertest, React Testing Library, Playwright (E2E) |
| **Workflow** | Spec DD, Test DD, Trunk-Based Staging Flow, Linked GitHub Issues & Kanban |

---

## 📁 Repository Structure

```text
toktickit/
├── client/                     # Frontend application (React + Vite + TS)
│   ├── src/
│   │   ├── api.ts              # API client methods with JWT Bearer auth
│   │   ├── App.tsx             # Main shell & multi-role tab navigation
│   │   ├── context/            # AuthContext (JWT session management)
│   │   └── components/         # StaffDashboard, RequesterDashboard, ActionsTakenSection,
│   │                           # StaffTicketQueue, StaffTicketDetail, UserManagement, MyTickets
│   └── tests/                  # Frontend component test suites (Vitest + RTL)
│       ├── lab-01/
│       ├── lab-02/
│       ├── lab-03/
│       └── lab-04/             # ActionsTaken, TicketWorkflow, StaffDashboard, RequesterDashboard
├── server/                     # Backend application (Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma       # Unified User, Ticket, ActionTaken, Attachment, Comment, Note
│   │   ├── migrations/         # Prisma schema migrations
│   │   └── seed.ts             # Seeded accounts and tickets covering 0, 1, multi actions
│   ├── src/
│   │   ├── middleware/         # auth.middleware.ts, rbac.middleware.ts
│   │   └── routes/             # actions-taken, dashboards, staff-queue, staff-tickets, auth
│   └── tests/                  # Backend API & integration test suites (Supertest + Vitest)
│       ├── lab-01/
│       ├── lab-02/
│       ├── lab-03/
│       └── lab-04/             # actions-taken, ticket-workflow, staff-dash, requester-dash
├── docs/                       # Course engineering contracts & documentation
│   ├── lab-03/                 # Sprint 3 specifications and reports
│   └── lab-04/                 # Sprint 4 specifications and reports
│       ├── specification.md    # FR-01..12, BR-01..16, 8-state lifecycle, DoD
│       ├── api-spec.md         # REST API schema and endpoint contracts
│       ├── ui-spec.md          # Zen Green tokens & responsive layouts (Screens 8.1..8.3)
│       ├── tests.md            # Traceability matrix (AC-01..11) & test results
│       ├── reviewer.md         # Peer review logs & merge authority records
│       └── ai-use.md           # Prompt history and critical reflections
├── e2e/                        # Playwright multi-role End-to-End test suites
│   ├── lab-03/
│   └── lab-04/
│       ├── actions-taken-flow.spec.ts
│       ├── ticket-resolution.spec.ts
│       └── dashboards.spec.ts
├── artifacts/                  # Submission screenshots and evidence
├── .gitignore                  # Git ignore rules (includes Playwright artifacts)
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v20.x or later)
- **npm** (v9.x or later)
- **PostgreSQL** database server running locally (default port: `5432`)

---

### 2. Backend Setup (`server/`)

1. Open your terminal and navigate to `server/`:
   ```bash
   cd server
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Verify `DATABASE_URL` matches your local PostgreSQL credentials:
     ```env
     DATABASE_URL="postgresql://toktickit:toktickit@localhost:5432/toktickit?schema=public"
     PORT=3000
     JWT_SECRET="toktickit_jwt_super_secret_lab3"
     ```

3. Run Prisma migrations and seed database:
   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

4. Start backend server:
   ```bash
   npm run dev
   ```
   *Express REST API will listen on `http://localhost:3000`.*

---

### 3. Frontend Setup (`client/`)

1. In a separate terminal, navigate to `client/`:
   ```bash
   cd client
   npm install
   ```

2. Start frontend dev server:
   ```bash
   npm run dev
   ```
   *The React client will be available at `http://localhost:5173`.*

---

## 🧪 Automated Testing

### 1. Backend Integration Tests (`server/`)
```bash
cd server
npm test
```
*Result: 150 passed across 16 test files (100% pass rate).*

### 2. Frontend Component Tests (`client/`)
```bash
cd client
npm test
```
*Result: 75 passed across 15 test files (100% pass rate).*

### 3. Combined Unit & Integration Regression Suite
- **Total Tests Passing:** **225 / 225 (100% pass rate, 0 regressions)**

### 4. Playwright End-to-End Testing (`e2e/`)
```bash
npx playwright test e2e/lab-04/
```

---

## 🔐 Role-Based Access Control (RBAC) Summary

| Role | Key Permissions |
|---|---|
| **Requester** | Create tickets; view personal dashboard (`/api/dashboards/requester`); view Actions Taken on owned tickets (read-only); append Public Comments; indicate Problem Appears Resolved. Forbidden from IT Queue, Internal Notes, Admin APIs, and Staff Dashboard. |
| **IT Staff** | View shared IT Ticket Queue and Staff Dashboard (`/api/dashboards/staff`); claim/assign tickets; adjust IT Priority; progress ticket status (enforcing Resolution Gate); record/edit Actions Taken; record confidential Internal Notes; append Public Comments. |
| **Administrator** | Full IT Staff capabilities + user account management (`/api/admin/users`); create users; edit roles/active status; reset initial passwords; protected by self-deactivation and last-admin safety guards. |

---

## 🌿 Git Flow & Branching Strategy

- **`main`**: Production release branch.
- **`lab4-staging`**: Staging integration branch for Lab 4.
- **`feature/lab4-X-...`**: Feature branches branched from `lab4-staging` and merged via peer-reviewed Pull Requests (Rule 1: Reviewer clicks merge).
