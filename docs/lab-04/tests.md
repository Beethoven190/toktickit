# Lab 4 Test-Driven Development & Acceptance Traceability Matrix

## 1. Quality Assurance Strategy & Test Layers

Sprint 4 maintains our rigorous multi-tiered test automation pyramid across 4 layers:
1. **Backend Integration & API Tests (`server/tests/lab-04/`):** Supertest + Vitest testing Prisma schema, REST endpoints, RBAC middleware, state transitions, concurrency guards, and SQL aggregation queries for dashboards.
2. **Frontend Component & Hook Tests (`client/tests/lab-04/`):** React Testing Library + Vitest verifying modal behavior, dynamic form validation (conditional follow-up notes), read-only states, KPI rendering, and event handlers.
3. **End-to-End Multi-Role Workflow Tests (`e2e/lab-04/`):** Playwright automated scenarios exercising full user journeys (IT Staff logging work, resolving tickets, Requesters viewing dashboards and actions).
4. **Full Regression Test Suite:** Continuous verification of all 160 baseline tests from Labs 1, 2, and 3 to ensure zero regression.

---

## 2. Requirements & Acceptance Criteria Traceability Matrix

| Test ID | Layer | AC Mapped | Description / Scenario | Expected Outcome | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **API-ACT-01** | API | **AC-01** | Create Action Taken with valid fields as IT Staff | Record created with `performedById = req.user.id`, HTTP 201 | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-ACT-02** | API | **AC-02** | Create Action Taken with `followUpRequired=true` but empty `followUpNote` | HTTP 400 with validation error message | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-ACT-03** | API | **AC-03** | Requester attempts to `POST` or `PATCH` Action Taken | HTTP 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-ACT-04** | API | **AC-03** | Requester retrieves Actions Taken on owned ticket | HTTP 200 with list of recorded actions | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-ACT-05** | API | **AC-01** | IT Staff updates existing Action Taken (`PATCH`) | HTTP 200 with updated fields | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-DASH-01**| API | **AC-04** | Staff retrieves `/api/dashboards/staff` | HTTP 200 with 5 KPI counts matching DB queries | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **API-DASH-02**| API | **AC-04** | Requester attempts to access `/api/dashboards/staff` | HTTP 403 Forbidden | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **API-DASH-03**| API | **AC-05** | Requester retrieves `/api/dashboards/requester` | HTTP 200 with counts isolated to user's tickets | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **API-FLOW-01**| API | **AC-06** | Transition ticket to `RESOLVED` without `resolutionSummary` | HTTP 400 Bad Request requiring summary | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-FLOW-02**| API | **AC-06** | Transition ticket to `RESOLVED` with summary >= 5 chars | HTTP 200 with status updated to `RESOLVED` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-FLOW-03**| API | **AC-07** | Attempt illegal status transition (e.g. `RESOLVED` ➔ `NEW`) | HTTP 400 Bad Request with illegal transition error | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **API-FLOW-04**| API | **AC-08** | Stale status update with outdated `expectedUpdatedAt` | HTTP 409 Conflict | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **UI-ACT-01**  | UI  | **AC-01** | Render Actions Taken list on Ticket Detail | Shows date, description, result, performer badge | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-ACT-02**  | UI  | **AC-02** | Toggle `Follow-up Required` on Create Action Modal | Dynamically shows required `Follow-up Note` input | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-ACT-03**  | UI  | **AC-03** | Requester views Ticket Detail Actions Taken section | Read-only mode: Add/Edit buttons hidden | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-DASH-01** | UI  | **AC-04** | Staff Dashboard renders 5 KPI cards with deltas | Cards display correct counts, deltas, and labels | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **UI-DASH-02** | UI  | **AC-09** | Click `My Assigned` card on Staff Dashboard | Triggers navigation to queue filtered by `owner=me` | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **UI-DASH-03** | UI  | **AC-05** | Requester Dashboard renders 4 KPI cards and recents | Cards display correct counts and view-all links | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| **E2E-FLOW-01**| E2E | **AC-01** | Complete Staff Work Flow (Claim, Add Action, Resolve) | End-to-end multi-step flow completes in browser | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| **E2E-DASH-01**| E2E | **AC-04** | Staff Dashboard Drill-down to Queue | Metric click filters queue accurately in browser | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **REG-ALL-01** | Reg | **AC-11** | Full regression suite across Labs 1, 2, and 3 | All 160 baseline automated tests pass 100% | Full Test Runner (`server` + `client`) | **Passing (160/160)** |

---

## 3. Test Execution Commands

### 3.1 Backend Test Execution (`server/`)
```bash
cd server
npm test
```

### 3.2 Frontend Test Execution (`client/`)
```bash
cd client
npm test
```

### 3.3 End-to-End Playwright Execution (`e2e/`)
```bash
npx playwright test e2e/lab-04/
```
