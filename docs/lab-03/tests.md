# Lab 3 Test Engineering Specification & Traceability Matrix

## 1. Test Strategy & Engineering Overview

The Sprint 3 test architecture ensures complete validation across all layers of the full-stack system:
1. **Backend API Test Suites (`server/tests/lab-03/`):** Supertest integration tests verifying authentication, session token revocation, strict ownership protection, the entire Role × Endpoint authorization matrix, ticket status workflows, and administrator safety rules.
2. **Frontend Component UI Tests (`client/src/tests/lab-03/`):** React Testing Library assertions verifying form inputs, error boxes, password complexity checklists, badge rendering, role-restricted tabs, and interactive modal/drawer operations.
3. **Regression Safety Suites (`server/tests/lab-01/`, `server/tests/lab-02/`, `client/tests/lab-01/`, `client/tests/lab-02/`):** Ensuring that existing Lab 1 health checks, categories, related systems, ticket creation, ownership isolation, and attachment soft-removal continue to pass 100%.
4. **End-to-End Test Specifications (`e2e/lab-03/`):** Playwright E2E flows validating real user journeys (login, first-time password change, staff ticket handling, and administrator account management).

---

## 2. Acceptance Criteria (AC) to Test Traceability Matrix

| AC ID | Requirement Description | Test Type | Automated Test Target File | Expected Result |
| :--- | :--- | :---: | :--- | :--- |
| **AC-01** | Valid user login | API | `server/tests/lab-03/auth.api.test.ts` | 200 OK, JWT token returned, user profile & role matched. |
| **AC-02** | Invalid password / inactive account | API | `server/tests/lab-03/auth.api.test.ts` | 401 Unauthorized with `INVALID_CREDENTIALS`. |
| **AC-03** | Mandatory first-login password change | API & UI | `server/tests/lab-03/auth.api.test.ts`<br>`client/src/tests/lab-03/ChangePassword.test.tsx` | User must update password before accessing other endpoints; complexity enforced. |
| **AC-04** | Server-side logout token invalidation | API | `server/tests/lab-03/auth.api.test.ts` | Token revoked; calling protected routes afterwards returns 401 Unauthorized. |
| **AC-05** | Requester ownership & no client override | API | `server/tests/lab-03/authorization.api.test.ts` | Querying with another `requesterId` returns only the authenticated user's tickets. |
| **AC-06** | Cross-requester ticket access blocked | API | `server/tests/lab-03/authorization.api.test.ts` | Attempting to view another requester's ticket returns 404 Not Found. |
| **AC-07** | Staff Ticket Queue query & filters | API & UI | `server/tests/lab-03/staff-queue.api.test.ts`<br>`client/src/tests/lab-03/StaffTicketQueue.test.tsx` | 200 OK with paginated list, filters by category, priority, status, and owner. |
| **AC-08** | Requester blocked from Queue & Staff APIs | API | `server/tests/lab-03/authorization.api.test.ts` | 403 Forbidden with `code: FORBIDDEN`. |
| **AC-09** | Claim / Assign ticket ownership | API & UI | `server/tests/lab-03/staff-ticket-detail.api.test.ts`<br>`client/src/tests/lab-03/StaffTicketDetail.test.tsx` | Updates `ownerId`; status advances to `OPEN` if previously `NEW`. |
| **AC-10** | IT Priority adjustment | API | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Updates `itPriority` independently of `requestedPriority`. |
| **AC-11** | Permitted status transition workflow | API | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Permitted transitions succeed; illegal transitions return 400 Bad Request. |
| **AC-12** | Resolution Summary required for Resolved/Closed | API | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Missing or blank resolution summary returns 400 Bad Request. |
| **AC-13** | Public Comments accessible to Requester & Staff | API | `server/tests/lab-03/comments-notes.api.test.ts` | Comments displayed in chronological order; valid post appends entry. |
| **AC-14** | Internal Notes strictly confidential | API | `server/tests/lab-03/comments-notes.api.test.ts` | Requester GET/POST returns 403 Forbidden without leaking metadata. |
| **AC-15** | Admin User listing, search & role filter | API & UI | `server/tests/lab-03/users-admin.api.test.ts`<br>`client/src/tests/lab-03/UserManagement.test.tsx` | Returns user list; non-admin call returns 403 Forbidden. |
| **AC-16** | Admin User creation with initial password | API & UI | `server/tests/lab-03/users-admin.api.test.ts`<br>`client/src/tests/lab-03/UserManagement.test.tsx` | Creates user; duplicate email returns 409 Conflict. |
| **AC-17** | Admin Safety Guard: Prevent self-deactivation | API | `server/tests/lab-03/users-admin.api.test.ts` | Admin deactivating self returns 400 Bad Request. |
| **AC-18** | Admin Safety Guard: Prevent removing last admin | API | `server/tests/lab-03/users-admin.api.test.ts` | Deactivating or demoting the only active admin returns 400 Bad Request. |
| **AC-19** | Reset initial password flags change requirement | API | `server/tests/lab-03/users-admin.api.test.ts` | `mustChangePassword` is set to true on the target user. |
| **AC-20** | Full Regression Suite Continuity | Regression | `server/tests/lab-01/*`, `server/tests/lab-02/*`<br>`client/tests/lab-01/*`, `client/tests/lab-02/*` | 100% passing tests without skipped or broken assertions. |

---

## 3. Test File Architecture

```text
server/tests/lab-03/
├── auth.api.test.ts               # AC-01, AC-02, AC-03, AC-04
├── authorization.api.test.ts      # AC-05, AC-06, AC-08, Complete Role Matrix
├── staff-queue.api.test.ts        # AC-07
├── staff-ticket-detail.api.test.ts # AC-09, AC-10, AC-11, AC-12
├── comments-notes.api.test.ts     # AC-13, AC-14
└── users-admin.api.test.ts        # AC-15, AC-16, AC-17, AC-18, AC-19

client/src/tests/lab-03/
├── Login.test.tsx                 # UI form rendering, invalid error box, submit state
├── ChangePassword.test.tsx        # Complexity checklist, matching password rule
├── StaffTicketQueue.test.tsx      # Table render, search, sorting, pagination, badges
├── StaffTicketDetail.test.tsx     # Field groups, claim button, tabs, comments vs notes
└── UserManagement.test.tsx        # User list, filter, drawer create/edit, self-deactivation guard

e2e/lab-03/
├── authentication.spec.ts         # End-to-end login, logout, password change flow
├── staff-ticket-flow.spec.ts      # Staff claiming, commenting, resolving ticket
└── user-administration.spec.ts    # Admin creating, editing, and resetting users
```

---

## 4. Test Execution & Reporting Commands

```bash
# Run server test suites
cd server
npm test -- --run

# Run client test suites
cd ../client
npm test -- --run

# Run full project test verification
npm run test:all
```
