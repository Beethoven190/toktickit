# TokTickIT — IT Service Desk

TokTickIT is an IT service desk web application developed as part of **CPE 334: Introduction to Software Engineering in the Age of AI Agents**.

**Lab 3 Increment: Users, Roles, IT Staff Ticketing, and Admin Screens** replaces the temporary Development Requester selector with secure authentication, mandatory first-login password quarantine, server-side role-based access control (RBAC), an operational IT Staff Ticket Queue with multi-criteria filtering and sorting, IT Staff Ticket Detail with state machine transitions, bidirectional Public Comments and confidential Internal Notes, and an Administrator User Management module under the **Zen Green** design language (`#006B3C`).

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
│   │   └── components/         # LoginForm, ChangePasswordModal, StaffTicketQueue,
│   │                           # StaffTicketDetail, UserManagement, MyTickets, CreateTicket
│   └── tests/                  # Frontend component test suites (Vitest + RTL)
│       ├── lab-01/
│       ├── lab-02/
│       └── lab-03/
├── server/                     # Backend application (Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma       # Unified User, Ticket, Attachment, Comment, Note models
│   │   ├── migrations/         # Prisma database schema migrations
│   │   └── seed.ts             # Seeded accounts with bcrypt passwords
│   ├── src/
│   │   ├── middleware/         # auth.middleware.ts, rbac.middleware.ts
│   │   └── routes/             # auth, staff-queue, staff-tickets, comments-notes, admin-users
│   └── tests/                  # Backend API & integration test suites (Supertest + Vitest)
│       ├── lab-01/
│       ├── lab-02/
│       └── lab-03/
├── docs/                       # Course engineering contracts & documentation
│   └── lab-03/
│       ├── specification.md    # FR-01..19, BR-01..18, Role Matrix, DoD
│       ├── api-spec.md         # REST API schema and endpoint contracts
│       ├── ui-spec.md          # Zen Green tokens & responsive layouts
│       ├── tests.md            # Traceability matrix (AC-01..20) & test results
│       ├── reviewer.md         # Peer review logs & merge authority records
│       ├── ai-use.md           # Prompt history and critical reflections
│       └── Lab3_Final_Report.md# Complete Lab 3 report across Answers 1–9
├── e2e/                        # Playwright multi-role End-to-End test suites
│   └── lab-03/
│       ├── authentication.spec.ts
│       ├── staff-ticket-flow.spec.ts
│       └── user-administration.spec.ts
├── artifacts/                  # Submission screenshots
│   └── lab-03/
│       └── screenshots/
│           ├── authentication/
│           ├── staff-queue/
│           ├── staff-ticket-detail/
│           ├── user-management/
│           └── responsive/
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

3. Run Prisma migrations and seed users:
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
*Result: 110 passed across 12 test files (100% pass rate).*

### 2. Frontend Component Tests (`client/`)
```bash
cd client
npm test
```
*Result: 50 passed across 11 test files (100% pass rate).*

### 3. Combined Unit & Integration Suite
- **Total Tests Passing:** **160 / 160 (100% pass rate, 0 regressions)**

### 4. Playwright End-to-End Testing (`e2e/`)
```bash
npx playwright test e2e/lab-03/
```

---

## 🔐 Role-Based Access Control (RBAC) Summary

| Role | Key Permissions |
|---|---|
| **Requester** | Create tickets; view/manage owned tickets; append Public Comments; indicate Problem Appears Resolved. Forbidden from IT Queue, Internal Notes, and Admin APIs. |
| **IT Staff** | View shared IT Ticket Queue; claim/assign tickets; adjust IT Priority; progress ticket status; record confidential Internal Notes; append Public Comments. |
| **Administrator** | Manage user accounts; create users; edit roles/active status; reset initial passwords; protected by self-deactivation and last-admin safety guards. |

---

## 🌿 Git Flow & Branching Strategy

- **`main`**: Production release branch.
- **`lab3-staging`**: Staging integration branch for Lab 3.
- **`feature/lab3-X-...`**: Feature branches branched from `lab3-staging` and merged via peer-reviewed Pull Requests (Rule 1: Reviewer clicks merge).
