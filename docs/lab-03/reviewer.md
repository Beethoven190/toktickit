# Peer Review Record — Lab 3: TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens

**Course:** CPE 334 Software Engineering Laboratory  
**Project:** TokTickIT IT Service Desk (Sprint 3: Authentication, IT Staff Workflow, and Administration)  
**Repository Author:** Supanut Watthanasimakorn ([@Beethoven190](https://github.com/Beethoven190))  
**Primary Reviewer & Collaborator:** Nitithorn Ketkaew ([@SANOP19](https://github.com/SANOP19))  
**Cross-Review Collaborators:** [@Sxr1n](https://github.com/Sxr1n), [@FramePongrit](https://github.com/FramePongrit)  

---

## 1. Peer Review Process & Rules Adherence

Throughout the Lab 3 sprint, our team strictly enforces the engineering workflow guidelines:
1. **Rule 1 — Reviewer Clicks Merge:** The PR author **never** merges their own Pull Request. The assigned reviewer thoroughly reviews the changes, writes a structured review evaluation, and clicks the green **`Merge pull request`** button.
2. **Rule 2 — Reply to Comments:** If any review feedback or questions are posted, the author replies and clarifies before resolution.
3. **Rule 3 — Link PR to Issue:** Every Pull Request is explicitly linked to its corresponding GitHub Issue using the `Development` panel on GitHub.
4. **Rule 4 — Kanban Flow:** Every issue transitions through the 6 Kanban stages: `Backlog` → `Specified` → `Started` → `PR Review` → `Fixing` (if needed) → `Done`.
5. **Rule 5 — Branching Strategy:** All feature branches (`feature/lab3-X-...`) merge into `lab3-staging`. The final release is merged from `lab3-staging` into `main`.

---

## 2. PRs Created by @Beethoven190 (Reviewed & Merged by @SANOP19)

| Issue # | Branch Name | PR # | PR Link | Reviewer | Decision | Merged By | Merge Commit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Issue 1** | `feature/lab3-1-spec-contract` | #23 | [PR #23](https://github.com/Beethoven190/toktickit/pull/23) | @SANOP19 | **Approved** | @SANOP19 | `54cd8ff` |
| **Issue 2** | `feature/lab3-2-auth-foundation` | #25 | [PR #25](https://github.com/Beethoven190/toktickit/pull/25) | @SANOP19 | **Approved** | @SANOP19 | `a4c5f7d` |
| **Issue 3** | `feature/lab3-3-staff-queue` | #27 | [PR #27](https://github.com/Beethoven190/toktickit/pull/27) | @SANOP19 | **Approved** | @SANOP19 | `8d79c2a` |
| **Issue 4** | `feature/lab3-4-staff-operations` | #29 | [PR #29](https://github.com/Beethoven190/toktickit/pull/29) | @SANOP19 | **Approved** | @SANOP19 | `bd05a74` |
| **Issue 5** | `feature/lab3-5-comments-notes` | TBD | Pending PR | @SANOP19 | In Progress | @SANOP19 | TBD |

### Detailed Evaluation of Author PRs:

#### PR #23 (Issue 1: Engineering Contract Documentation)
- **PR URL:** [https://github.com/Beethoven190/toktickit/pull/23](https://github.com/Beethoven190/toktickit/pull/23)
- **Author Summary:** Defined the Sprint 3 engineering contracts across `specification.md` (FR-01..FR-19, BR-01..BR-18, Role x Resource Authorization Matrix, DoD), `ui-spec.md` (Zen Green design tokens `#006B3C`, screen layouts for Login, Mandatory Password Change, IT Staff Queue, Ticket Detail with Notes/Comments, Admin User Management), `api-spec.md` (REST contracts for Auth, Staff Queue, Staff Detail, Comments/Notes, Admin Users), and `tests.md` (AC-01..AC-20 traceability matrix).
- **Reviewer Evaluation (@SANOP19):**
  > "Outstanding work establishing the foundational Sprint 3 engineering contracts across all 4 required markdown documents (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) prior to feature implementation, strictly fulfilling the **Spec-Driven Development (Spec DD)** requirement.
  > 
  > * **Clear Role Segregation:** Accurately defines boundaries between **Requester**, **IT Staff**, and **Administrator**, ensuring server-side authorization enforcement rather than relying on frontend visibility.
  > * **API & Security Standards:** The REST API specification in `api-spec.md` is well-structured with uniform error schemas (`code`, `message`, `fields`), JWT Bearer token authentication, and clear role guards (especially isolating confidential Internal Notes from Requesters).
  > * **Zen Green Design Continuity:** `ui-spec.md` preserves the Lab 2 design tokens (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`) and details responsive layouts (Desktop, Tablet, Mobile) for all new screens.
  > * **Traceability Foundation:** `tests.md` sets up a solid full-stack test strategy covering Supertest API integration, React Testing Library UI assertions, and Playwright E2E flows.
  > 
  > #### Minor Recommendations for Implementation Phase
  > * **Ticket Status Coverage:** Ensure the implementation covers all 8 required ticket statuses (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`) during status transition handlers.
  > * **Seed Credentials:** Ensure the seed data includes at least one user account with `mustChangePassword: true` to easily verify the first-login password change flow.
  > 
  > **Summary:** The specification is complete, unambiguous, and ready to guide implementation."
- **Author Response (@Beethoven190):** "Thanks @SANOP19"
- **Outcome:** Approved and merged into `lab3-staging` by @SANOP19 (commit `54cd8ff`).

#### PR #25 (Issue 2: Authentication Foundation, User Migration & Password Change)
- **PR URL:** [https://github.com/Beethoven190/toktickit/pull/25](https://github.com/Beethoven190/toktickit/pull/25)
- **Author Summary:** Implemented database evolution from `RequesterUser` to unified `User` model with `Role` enum (`REQUESTER`, `STAFF`, `ADMIN`), added `Ticket.ownerId`, `itPriority`, and models `PublicComment`, `InternalNote`. Delivered JWT auth middleware, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/change-password` with complexity validation, server-side ownership enforcement overriding client `requesterId` (BR-03, AC-03), Zen Green `LoginForm`, `ChangePasswordModal` with live checklist, and 58 passing tests.
- **Reviewer Evaluation (@SANOP19):**
  > "Summary & Highlights:
  > - **Database & Migration:** Clean evolution from `RequesterUser` to unified `User` model with `Role` enum, preserving existing relationships and adding support for Lab 3 ticket workflow (`ownerId`, `itPriority`, `PublicComment`, `InternalNote`).
  > - **Security & RBAC:** Robust JWT authentication and bcrypt hashing. Inactive accounts are properly rejected (BR-01), token revocation on logout works seamlessly, and first-login password quarantine strictly enforces mandatory change before system entry (BR-02, AC-02).
  > - **Server-Side Ownership Enforcement:** Verified that forged `requesterId` values in both `POST /api/tickets` body and `GET /api/tickets` query params are strictly overridden by the authenticated token identity (BR-03, AC-03).
  > - **Frontend UX & Zen Green Design:** Beautiful `LoginForm` with demo account quick-fill and busy states. The `ChangePasswordModal` live complexity checklist provides great user feedback while adhering to Zen Green design tokens.
  > - **Test Coverage:** Comprehensive test suites across backend and frontend (58/58 tests passing). All Acceptance Criteria (AC-01 to AC-03) and Business Rules are well-verified.
  > 
  > APPROVE @Beethoven190"
- **Author Response (@Beethoven190):** Acknowledged and verified.
- **Outcome:** Approved and merged into `lab3-staging` by @SANOP19 (commit `a4c5f7d`).

#### PR #27 (Issue 3: IT Staff Ticket Queue & RBAC)
- **PR URL:** [https://github.com/Beethoven190/toktickit/pull/27](https://github.com/Beethoven190/toktickit/pull/27)
- **Author Summary:** Implemented IT Staff Ticket Queue (`GET /api/staff/queue` & `GET /api/staff/tickets/:id`) with multi-criteria search, category/system/priority/status/owner filters, sorting arrows, numeric pagination, and quick KPI metrics pills. Delivered `StaffTicketQueue.tsx` aligning strictly with Teacher Mockup 2, supporting responsive desktop table and mobile card views, Zen Green badges, and 100% test continuity (85 passing tests: 55 server + 30 client).
- **Reviewer Evaluation (@SANOP19):**
  > "Summary & Highlights:
  > - **API & RBAC Enforcement:** `GET /api/staff/queue` and `GET /api/staff/tickets/:id` strictly enforce authentication and role guards (`STAFF` or `ADMIN`). Unauthorized requesters are safely blocked with 403 Forbidden.
  > - **Queue Capabilities:** Multi-criteria filtering, search by ticket number or summary, dynamic column sorting, and numeric pagination work accurately. Summary counts provide real-time KPI metrics.
  > - **Frontend Polish:** `StaffTicketQueue.tsx` matches Teacher Mockup 2 beautifully with Zen Green tokens, dual responsive views (desktop table + mobile card), and clear empty states.
  > - **Test Coverage:** 20 new backend tests and 7 frontend tests, preserving 100% pass rate with zero regression.
  > 
  > APPROVE @Beethoven190"
- **Author Response (@Beethoven190):** Thank you @SANOP19 for the review and merge!
- **Outcome:** Approved and merged into `lab3-staging` by @SANOP19 (commit `8d79c2a`).

#### PR #29 (Issue 4: IT Staff Ticket Operations & Status Transitions)
- **PR URL:** [https://github.com/Beethoven190/toktickit/pull/29](https://github.com/Beethoven190/toktickit/pull/29)
- **Author Summary:** Implemented IT Staff ticket operations on individual tickets (`PATCH /api/staff/tickets/:id/claim`, `/assign`, `/priority`, `/status`) and `GET /api/staff/assignees`. Enforced state transition matrix, auto-advancing `NEW` to `OPEN` on claim, active staff validation on assign, independent IT priority adjustments, and mandatory resolution summary (>= 5 chars) on `RESOLVED`/`CLOSED`. Delivered Teacher Mockup 3 UI (`StaffTicketDetail.tsx`) and passed 116/116 tests.
- **Reviewer Evaluation (@SANOP19):**
  > "Summary & Highlights:
  > - **Staff Operations API:** Verified `PATCH /api/staff/tickets/:id/claim` auto-advances `NEW` to `OPEN` (BR-09, AC-09). Assign validates active staff/admin and supports unassigning. IT priority updates independently of requester priority (AC-10).
  > - **Status State Machine & Resolution Rule:** Permitted status transitions strictly enforced per BR-09, rejecting illegal transitions with 400 Bad Request. Mandatory resolution summary (>= 5 chars) enforced for `RESOLVED` and `CLOSED` (BR-10, AC-12).
  > - **Frontend Polish (Teacher Mockup 3):** `StaffTicketDetail.tsx` delivers clean breadcrumbs, read-only field groups, interactive claim/assign/priority controls, and tab navigation.
  > - **Test Coverage & Regression Safety:** 23 new backend integration tests and 8 frontend unit tests, maintaining 100% test pass rate across all 116 tests.
  > 
  > APPROVE @Beethoven190"
- **Author Response (@Beethoven190):** Thank you @SANOP19 for reviewing and merging!
- **Outcome:** Approved and merged into `lab3-staging` by @SANOP19 (commit `bd05a74`).

---

## 3. PRs Reviewed & Merged by @Beethoven190 (As Reviewer)

As part of peer collaboration, @Beethoven190 performs code reviews and executes merges for peer repositories:

| Author | Repository | PR # | Issue Reviewed | Review Decision | Merged By | Merge Commit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **@SANOP19** | SANOP19/toktickit | [PR #22](https://github.com/SANOP19/toktickit/pull/22) | Issue 1: Sprint 3 Engineering Contract Documentation | **Approved** | @Beethoven190 | `7bfa69b` |
| **@SANOP19** | SANOP19/toktickit | [PR #25](https://github.com/SANOP19/toktickit/pull/25) | Issue 2: Authentication Foundation & User Migration | **Approved** | @Beethoven190 | Merged |
| **@SANOP19** | SANOP19/toktickit | [PR #27](https://github.com/SANOP19/toktickit/pull/27) | Issue 3: Requester Continuation & Public Comments | **Approved** | @Beethoven190 | Merged |
| **@pimchayasupr-hash** | pimchayasupr-hash/toktickit | [PR #36](https://github.com/pimchayasupr-hash/toktickit/pull/36) | Lab 3 Full Stack Implementation & Integration | **Reviewed** | Collaborative | In progress |

---

## 4. Quality Checklist & Verification Summary

| Check Item | Requirement | Status |
| :--- | :--- | :--- |
| **Branch Target** | All PRs targeted `lab3-staging` before final release | **PASS** |
| **Merge Authority** | Reviewer clicked merge on pull requests | **PASS** |
| **Issue Traceability** | All PRs linked to GitHub Issues via Development panel | **PASS** |
| **Kanban Movement** | Cards follow `Backlog` → `Specified` → `Started` → `PR Review` → `Done` | **PASS** |
| **Test Automation** | 100% of automated tests pass before merge approval | **PASS** |
| **Design Tokens** | UI complies with Zen Green Theme (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`) | **PASS** |
