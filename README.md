# TokTickIT — IT Service Desk

TokTickIT is an IT service desk web application developed as part of **CPE 334: Introduction to Software Engineering in the Age of AI Agents** (Lab 1: Full-Stack Hello World Starter). 

The goal of this vertical slice is to integrate and verify all layers of the modern full-stack web architecture:
**React UI → Express REST API → Prisma ORM → PostgreSQL Database**

---

## 🛠 Tech Stack

| Area | Technology Stack |
|---|---|
| **Frontend** | React (v18), TypeScript, Vite, Bootstrap 5 |
| **Backend** | Node.js, Express, TypeScript, tsx |
| **Database & ORM** | PostgreSQL, Prisma ORM |
| **Testing** | Vitest, Supertest, React Testing Library |
| **Workflow** | Git Flow, GitHub Issues & Projects, Kanban |

---

## 📁 Repository Structure

```text
toktickit/
├── client/                 # Frontend application
│   ├── src/                # UI components, React hooks, API client
│   ├── tests/              # Frontend unit and component tests (Vitest)
│   │   └── lab-01/
│   ├── .env.example        # Frontend environment template
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Backend REST API
│   ├── prisma/             # Prisma schema and seed scripts
│   ├── src/                # Express application, routes, controllers
│   ├── tests/              # Backend integration tests (Supertest + Vitest)
│   │   └── lab-01/
│   ├── .env.example        # Backend environment template
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── docs/                   # Course documentation and review records
│   └── lab-01/
│       ├── ai_use.md       # AI agent usage log and reflections
│       ├── reviewer.md     # Peer review records
│       └── tests.md        # Test matrix and verification evidence
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.x or later)
- **npm** (v9.x or later)
- **PostgreSQL** database server running locally (default port: `5432`)

---

### 2. Backend Setup (`server/`)

1. Open your terminal and change directory into `server/`:
   ```bash
   cd server
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Verify `DATABASE_URL` in `.env` matches your local PostgreSQL credentials:
     ```env
     DATABASE_URL="postgresql://toktickit:toktickit@localhost:5432/toktickit?schema=public"
     PORT=3000
     ```

4. Database Migrations & Seeding (for subsequent issues):
   - Run Prisma migrations:
     ```bash
     npm run prisma:migrate
     ```
   - Seed initial category data:
     ```bash
     npm run prisma:seed
     ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The Express REST API will listen on `http://localhost:3000`.*

---

### 3. Frontend Setup (`client/`)

1. In a separate terminal, change directory into `client/`:
   ```bash
   cd client
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Default backend endpoint:
     ```env
     VITE_API_URL="http://localhost:3000"
     ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The React client will be available at `http://localhost:5173`.*

---

## 🧪 Automated Testing

### Backend Integration Tests (Supertest + Vitest)
In `server/`:
```bash
npm run test
```

### Frontend Unit & Component Tests (Vitest)
In `client/`:
```bash
npm run test
```

---

## 📡 REST API Specifications

| Method | Endpoint | Description | Expected Response |
|---|---|---|---|
| `GET` | `/api/health` | Health check endpoint | `200 OK` `{ "status": "ok", "service": "TokTickIT API" }` |
| `GET` | `/api/categories` | Retrieve request categories list | `200 OK` `[{ "id": 1, "name": "Account and Access" }, ...]` |

---

## 🌿 Git Flow & Branch Strategy

- **`main`**: Production-ready release branch.
- **`lab1-staging`**: Integration branch for Lab 1.
- **`feature/<issue-number>-<feature-name>`**: Individual feature branches created from `lab1-staging` and merged via peer-reviewed Pull Requests.
