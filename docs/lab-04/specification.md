# Lab 4 Sprint Engineering Specification: TokTickIT Actions Taken, Dashboards, and Final Regression

## 1. Sprint Goal
Complete the end-to-end TokTickIT service-desk system by implementing the parent-child **Actions Taken** work-tracking subsystem under Tickets, establishing the final **8-state Ticket lifecycle state machine** with resolution gating and concurrency protection, delivering role-tailored **operational dashboards** for IT Staff and Requesters, and executing comprehensive regression hardening to guarantee seamless performance, accessibility, and visual consistency across all modules built in Labs 1 through 3 under the Zen Green design system.

---

## 2. Stakeholder Request Interpretation
The TokTickIT service desk now reliably manages user authentication, ticket queuing, ownership assignment, priority adjustment, comments, and internal notes. However, IT Staff still lack a structured mechanism to plan, record, and audit granular work activities carried out on each ticket. 

To address this, we introduce **Actions Taken**:
1. Each ticket can hold zero, one, or multiple Action Taken records.
2. Even when a ticket is assigned to a primary Ticket Owner, different IT Staff members can perform individual actions and record their contributions independently (`BR-02`).
3. Each Action Taken entry must capture:
   - Action Date/Time (`actionDateTime`)
   - Action Description (`description`)
   - Result (`result`)
   - Performed by (auto-populated with authenticated IT Staff member's name and ID)
   - Follow-Up Required? (`followUpRequired` boolean)
   - Follow-up Note (`followUpNote`, strictly mandatory if `followUpRequired` is true)
   - Attachment Notes (`attachmentNotes`, specifying file references or diagnostic images to look for)
4. Requester indication that a problem "Appears Resolved" remains strictly **advisory** (`BR-08`); IT Staff or Admin must review the documented work and formally transition the ticket status to `RESOLVED` or `CLOSED` with a mandatory resolution summary.
5. Role-appropriate Dashboards provide at-a-glance operational health:
   - **IT Staff Dashboard (Screen 8.1):** Operational KPI cards (`New`, `Open`, `In Progress`, `Waiting for Requester`, `My Assigned`), recent tickets list, quick action shortcuts, day-over-day trend deltas, and manual refresh.
   - **Requester Dashboard (Screen 8.2):** Requester KPI cards (`My Open Tickets`, `In Progress`, `Resolved`, `Closed`), recent tickets with status pills, and quick creation/queue shortcuts.
6. The entire application must undergo final regression verification across Desktop, Tablet, and Mobile views under the Zen Green design language.

---

## 3. Scope

### Included in Lab 4
- **Parent-Child Actions Taken Subsystem:**
  - Database model `ActionTaken` linked 1-to-many from `Ticket`.
  - Full CRUD/management API for IT Staff and Administrator (`/api/staff/tickets/:id/actions`).
  - Requester read-only view of Actions Taken (`/api/tickets/:id/actions`).
  - Validation rules: mandatory follow-up note when follow-up is checked, automatic attribution of `performedById`, timestamp validation.
- **Ticket Lifecycle & Resolution Gating:**
  - Strict enforcement of the 8 status states: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`.
  - Transition matrix enforced at API middleware level.
  - Server-side resolution gate: `RESOLVED` and `CLOSED` require a non-empty `resolutionSummary` (>= 5 characters).
  - Concurrency/stale-update protection: version counter or `updatedAt` checking to prevent accidental overwrite of concurrent status updates.
  - Advisory problem resolution: Requester's "Problem Appears Resolved" flag logged without altering ticket state directly.
- **Role-Appropriate Dashboards:**
  - **IT Staff Dashboard:** Metrics calculated by authoritative backend SQL queries (New, Open, In Progress, Waiting for Requester, My Assigned tickets), day-over-day delta comparisons, recent tickets list with status pills, quick action navigation, and refresh control.
  - **Requester Dashboard:** Authoritative backend SQL queries scoped strictly to authenticated user's tickets (My Open, In Progress, Resolved, Closed), recent tickets list, and quick actions.
  - Drill-down navigation: Clicking cards navigates to filtered IT Queue or My Tickets view with corresponding filter query params applied.
- **Final Regression Hardening & Polish:**
  - 100% preservation of all Lab 1, 2, and 3 features (Auth, Password Quarantine, Requester My Tickets, Ticket Creation, File Attachments, IT Staff Queue, Assign/Claim/Priority, Public Comments, Internal Notes, Admin User Management).
  - Responsive layouts tested and verified across Desktop (1280px), Tablet (820px), and Mobile (375px).
  - Zen Green design token consistency, zero horizontal overflow, visible focus indicators, accessible contrast.

### Explicitly Excluded from Lab 4
- Automated SLA breach timers and escalation countdown engines.
- External notification channels (SMTP email, SMS, push notifications, LINE Webhooks).
- Inventory consumption, spare-parts billing, time-sheet payroll tracking, or labor-cost calculations.
- Multi-tier managerial approval workflows and electronic cryptographic signatures.
- Business intelligence report builders, export warehouses, or chart export engines.
- Multi-tenant partitioning.

---

## 4. Functional Requirements (FR)

### Actions Taken Subsystem
- **FR-01 (Create Action Taken):** IT Staff and Administrators can add an Action Taken record to any active ticket. The backend automatically populates `performedById` with the authenticated user's ID.
- **FR-02 (Action Fields Validation):** The system captures Action Date/Time, Description, Result, Follow-Up Required toggle, Follow-up Note, and Attachment Notes. If Follow-Up Required is checked, Follow-up Note is strictly mandatory.
- **FR-03 (Edit Action Taken):** IT Staff and Administrators can update existing Action Taken entries on accessible tickets.
- **FR-04 (Requester Visibility):** Requesters can view all Actions Taken entries recorded on tickets they own, but are strictly forbidden from creating, updating, or deleting actions (read-only enforcement).
- **FR-05 (Staff Independent Attribution):** An Action Taken entry can be created by any active IT Staff member or Admin, regardless of whether they are the primary Ticket Owner (`BR-02`).

### Ticket Lifecycle & Workflow
- **FR-06 (8-State Lifecycle):** The system supports exactly 8 lifecycle states (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`).
- **FR-07 (State Transition Gate):** Transitions must conform to the defined transition matrix. Invalid transitions return `400 Bad Request`.
- **FR-08 (Mandatory Resolution Summary):** Setting status to `RESOLVED` or `CLOSED` requires a meaningful `resolutionSummary` (>= 5 characters).
- **FR-09 (Advisory Problem Resolution):** When a Requester indicates "Problem Appears Resolved", the system records an advisory event without mutating the formal status to `RESOLVED`.
- **FR-10 (Optimistic Concurrency Protection):** Concurrent or stale status updates are detected via versioning/`updatedAt` comparison, preventing silent overwrites with `409 Conflict`.

### Role-Appropriate Dashboards
- **FR-11 (IT Staff Dashboard Metrics):** IT Staff and Admins receive calculated KPI cards: `New`, `Open`, `In Progress`, `Waiting for Requester`, and `My Assigned`.
- **FR-12 (IT Staff Dashboard Recent Tickets & Actions):** IT Staff dashboard displays recent tickets with quick links and provides Quick Action buttons (`Create Ticket`, `Search Tickets`, `My Queue`).
- **FR-13 (Requester Dashboard Metrics):** Requesters receive KPI cards strictly scoped to their tickets: `My Open Tickets`, `In Progress`, `Resolved`, and `Closed`.
- **FR-14 (Requester Dashboard Quick Actions):** Requester dashboard provides shortcuts (`Create Ticket`, `View My Tickets`) and recent tickets list.
- **FR-15 (Metric Drill-Down):** Clicking any dashboard KPI card navigates directly to the relevant queue with pre-applied status/ownership filters.

### Regression & Hardening
- **FR-16 (Full Regression Continuity):** All existing APIs and UI flows from Labs 1–3 remain functional without degradation.

---

## 5. Business Rules (BR)

| BR ID | Business Rule Statement |
| :--- | :--- |
| **BR-01** | **Parent-Child Integrity:** Every Action Taken belongs to exactly one Ticket (`ticketId`). Orphan actions are strictly forbidden. |
| **BR-02** | **Distributed Teamwork:** The Ticket Owner coordinates the Ticket as a whole, but an Action Taken may be performed and logged by any active IT Staff member or Administrator. |
| **BR-03** | **Automatic Attribution:** `performedById` is automatically populated from the authenticated JWT session identity. Client-supplied actor IDs are ignored. |
| **BR-04** | **Conditional Follow-up Requirement:** When `followUpRequired = true`, `followUpNote` must be provided (non-empty string, min 3 characters). When `followUpRequired = false`, `followUpNote` is optional or null. |
| **BR-05** | **Field Length Limits:** `description` (10–2,000 chars), `result` (3–2,000 chars), `followUpNote` (max 1,000 chars), `attachmentNotes` (max 1,000 chars). |
| **BR-06** | **Role RBAC on Actions Taken:** `STAFF` and `ADMIN` can create and edit Actions Taken. `REQUESTER` has read-only access to actions on owned tickets and receives `403 Forbidden` on write attempts. |
| **BR-07** | **Terminal Ticket Guard:** Actions Taken cannot be added or modified on tickets in `CLOSED` or `CANCELLED` status unless the ticket is first `REOPENED`. |
| **BR-08** | **Advisory Resolution Gate:** Requester's "Problem Appears Resolved" trigger is purely advisory. Only `STAFF` or `ADMIN` can formally advance status to `RESOLVED` or `CLOSED`. |
| **BR-09** | **Resolution Summary Enforcement:** Advancing a ticket to `RESOLVED` or `CLOSED` strictly requires `resolutionSummary` with at least 5 characters. |
| **BR-10** | **Permitted Transition Matrix:**<br>• `NEW` ➔ `OPEN`, `CANCELLED`<br>• `OPEN` ➔ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`<br>• `IN_PROGRESS` ➔ `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`<br>• `WAITING_FOR_REQUESTER` ➔ `IN_PROGRESS`, `RESOLVED`, `CANCELLED`<br>• `RESOLVED` ➔ `CLOSED`, `REOPENED`<br>• `REOPENED` ➔ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`<br>• `CLOSED` ➔ `REOPENED`<br>• `CANCELLED` ➔ *(Terminal)* |
| **BR-11** | **Concurrency Protection:** Updating ticket status must provide the client's current `updatedAt` or version. If the server record was modified since client read, return `409 Conflict`. |
| **BR-12** | **Authoritative Dashboard Calculation:** All dashboard metrics must be computed server-side via authoritative SQL queries. Frontend calculation of whole collections is prohibited. |
| **BR-13** | **Requester Metric Isolation:** Requester dashboard queries must filter strictly by `requesterId = req.user.id`. No cross-requester data leakage. |
| **BR-14** | **Staff Queue Metric Scoping:**<br>• `New`: `status = 'NEW'`<br>• `Open`: `status = 'OPEN'`<br>• `In Progress`: `status = 'IN_PROGRESS'`<br>• `Waiting for Requester`: `status = 'WAITING_FOR_REQUESTER'`<br>• `My Assigned`: `ownerId = req.user.id` and status not in (`RESOLVED`, `CLOSED`, `CANCELLED`). |
| **BR-15** | **Delta Comparison Rules:** Dashboard deltas (e.g. `+2 from yesterday`, `-1 from yesterday`) compare current count to count as of 24 hours prior or beginning of current day. |
| **BR-16** | **Zero/Empty State Grace:** Dashboards and Actions Taken lists must render informative empty state banners when no records exist (`0 tickets`, `No actions recorded yet`). |

---

## 6. Role & Resource Authorization Matrix

| Resource / Action | Requester | IT Staff | Administrator |
| :--- | :---: | :---: | :---: |
| View Requester Dashboard (`GET /api/dashboards/requester`) | **Allowed (Owned)** | 403 Forbidden | Allowed |
| View Staff Dashboard (`GET /api/dashboards/staff`) | 403 Forbidden | **Allowed** | **Allowed** |
| List Actions Taken (`GET /api/staff/tickets/:id/actions`) | 403 Forbidden | **Allowed** | **Allowed** |
| List Actions Taken on Owned Ticket (`GET /api/tickets/:id/actions`) | **Allowed (Owned)** | **Allowed** | **Allowed** |
| Create Action Taken (`POST /api/staff/tickets/:id/actions`) | 403 Forbidden | **Allowed** | **Allowed** |
| Edit Action Taken (`PATCH /api/staff/tickets/:id/actions/:actionId`) | 403 Forbidden | **Allowed** | **Allowed** |
| Transition Ticket Status | 403 Forbidden | **Allowed** | **Allowed** |
| Provide Resolution Summary on Resolve | 403 Forbidden | **Allowed** | **Allowed** |
| Advisory "Problem Appears Resolved" | **Allowed (Owned)** | N/A | Allowed |
| Full Labs 1–3 Regression Endpoints | Maintained | Maintained | Maintained |

---

## 7. Data Changes & Database Design Decisions

### 7.1 Prisma Schema Evolution
Evolve `server/prisma/schema.prisma` by adding the `ActionTaken` model and updating `Ticket` relations:

```prisma
model ActionTaken {
  id                Int       @id @default(autoincrement())
  ticketId          Int
  ticket            Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  actionDateTime    DateTime  @default(now())
  description       String
  result            String
  performedById     Int
  performedBy       User      @relation("ActionPerformer", fields: [performedById], references: [id])
  followUpRequired  Boolean   @default(false)
  followUpNote      String?
  attachmentNotes   String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([ticketId])
  @@index([performedById])
  @@index([actionDateTime])
}
```

### 7.2 Database Design Decisions (Justification Required by Rubric)

1. **Decision 1: Separate `performedById` relation from `Ticket.ownerId`:**
   - *Rationale:* In IT service desk environments, a senior staff member may own the ticket for accountability, while multiple junior specialists or on-duty engineers execute diagnostic tasks (e.g. hardware replacement, network cabling). Linking each `ActionTaken` to its own `performedById` reflects real-world division of labor without forcing ticket reassignment back and forth (`BR-02`).
2. **Decision 2: Direct relational Foreign Key with Composite Indexing on `[ticketId, actionDateTime]`:**
   - *Rationale:* Action Taken records are intrinsically bounded to their parent ticket. Placing an index on `ticketId` and `actionDateTime` guarantees chronological sorting (`actionDateTime ASC`) with optimal query performance while enabling clean cascading cleanup should test teardown or administrative archiving occur.
3. **Decision 3: Retaining Optimistic Concurrency via `updatedAt` / `version` on `Ticket`:**
   - *Rationale:* Multiple staff members and requesters interact with tickets simultaneously. Checking `updatedAt` on status transitions ensures that if Staff A resolves a ticket while Staff B changes its priority, Staff B is alerted with `409 Conflict` rather than silently overwriting the resolution.

### 7.3 Seed Data Requirements
- Seed must be idempotent (`upsert` or clear-and-insert).
- Must include tickets with:
  - 0 Actions Taken (demonstrating clean empty state).
  - 1 Action Taken (completed diagnostic without follow-up).
  - Multiple Actions Taken (demonstrating ongoing multi-step remediation with follow-up required).
- Seed data must populate all 8 statuses to demonstrate non-zero and zero dashboard metrics for Staff and Requester accounts.

---

## 8. Acceptance Criteria (AC)

| AC ID | Acceptance Criterion |
| :--- | :--- |
| **AC-01** | Given an authenticated IT Staff member and a valid ticket, when submitting an Action Taken with valid fields, then the record is saved with `performedById = req.user.id` and returned with HTTP `201 Created`. |
| **AC-02** | Given an IT Staff member submitting an Action Taken with `followUpRequired = true` and an empty `followUpNote`, then the server rejects the request with HTTP `400 Bad Request` and field error `followUpNote is required`. |
| **AC-03** | Given an authenticated Requester viewing an owned ticket, when fetching Actions Taken, then all recorded actions are visible, but any write/update request returns HTTP `403 Forbidden`. |
| **AC-04** | Given an authenticated IT Staff member, when fetching `GET /api/dashboards/staff`, then the server returns accurate counts for `New`, `Open`, `In Progress`, `Waiting for Requester`, and `My Assigned`, matching direct database counts. |
| **AC-05** | Given an authenticated Requester, when fetching `GET /api/dashboards/requester`, then the server returns counts strictly scoped to tickets where `requesterId = req.user.id`. |
| **AC-06** | Given a ticket in `OPEN` status, when transitioning to `RESOLVED` without a `resolutionSummary` (or < 5 chars), then the server rejects with HTTP `400 Bad Request` (`resolutionSummary must be at least 5 characters`). |
| **AC-07** | Given a ticket in `RESOLVED` status, when a user attempts an illegal transition to `NEW`, then the server rejects with HTTP `400 Bad Request`. |
| **AC-08** | Given a ticket updated by another user concurrently, when attempting a status change with stale `updatedAt`, then the server returns HTTP `409 Conflict`. |
| **AC-09** | Given an IT Staff member clicking the `My Assigned` metric card on the dashboard, then the application navigates to the staff queue pre-filtered by `owner = current_user`. |
| **AC-10** | Given a screen size of 1280px (Desktop), 820px (Tablet), and 375px (Mobile), then all dashboards and Actions Taken interfaces render without horizontal overflow, clipped text, or broken components. |
| **AC-11** | Given complete execution of all test suites (unit, API integration, component, and E2E), all 160+ baseline tests pass with zero regression alongside new Lab 4 suites. |

---

## 9. Definition of Done (DoD) for Sprint 4

- [ ] **Specifications Pre-Implementation:** `specification.md`, `api-spec.md`, `ui-spec.md`, and `tests.md` reviewed and merged into `lab4-staging` prior to feature implementation PRs.
- [ ] **Database Schema & Seed:** Prisma migration applied cleanly, seed data idempotent, covering 0, 1, and multiple Actions Taken across all 8 ticket statuses.
- [ ] **Actions Taken Backend:** Endpoints for create, list, and update implemented with authentication, RBAC, input validation, and automatic attribution.
- [ ] **Actions Taken Frontend:** Ticket Detail augmented with Actions Taken section, create/edit modal, follow-up indicators, attachment notes, and requester read-only mode.
- [ ] **Ticket Workflow & Gating:** Permitted 8-state transition matrix enforced server-side, mandatory resolution summary enforced, concurrency guard active.
- [ ] **Role Dashboards:** IT Staff (8.1) and Requester (8.2) dashboards implemented with authoritative metrics, deltas, recent tickets, and drill-down navigation.
- [ ] **Zen Green Design & Responsiveness:** Verified on Desktop (1280px), Tablet (820px), and Mobile (375px) without horizontal blowout or clipping.
- [ ] **Automated Testing:** 100% pass rate across backend Supertest, frontend React Testing Library, and Playwright E2E suites.
- [ ] **Peer Review Process:** All feature PRs linked to GitHub Issues, reviewed and merged by peer reviewer (@SANOP19) under Rule 1. Release PR merged from `lab4-staging` into `main`.
