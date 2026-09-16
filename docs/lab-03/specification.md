# Lab 3 Sprint Engineering Specification: TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens

## 1. Sprint Goal
Evolve the TokTickIT platform from the temporary Development Requester selector (Lab 2) into an authenticated, multi-role system supporting **Requester**, **IT Staff**, and **Administrator**. Deliver secure email/password authentication with bcrypt hashing, mandatory first-login password change for initial credentials, server-enforced role-based authorization, operational IT Staff Ticket Queue with search/filtering/sorting/pagination, IT Staff Ticket Detail with ownership assignment, IT Priority management, status transitions, threaded Public Comments, role-restricted Internal Notes, and a minimalist Administrator User Management screen, all while preserving 100% regression continuity for existing Lab 2 Requester features under the Zen Green design language.

---

## 2. Stakeholder Request Interpretation
The stakeholder requires a production-grade multi-user ticketing environment. The temporary requester selector must be replaced with real user authentication. Requesters must continue creating and managing their tickets using their authenticated credentials. IT Staff need a dedicated Ticket Queue ("My Queue") to prioritize and claim work, modify IT Priority, progress ticket statuses through valid operational states, communicate with Requesters via Public Comments, and record confidential Internal Notes. Administrators require a minimalist User Management screen to view, create, edit user profiles, assign single roles, toggle active/inactive status, and issue/reset initial passwords with mandatory change on next login. Crucially, every endpoint must be strictly authorized by role and ownership on the server side—hiding UI controls is not security.

---

## 3. Scope

### Included in Lab 3
- **Real Authentication:** Email and password login, bcrypt password hashing (salt rounds: 10), stateless JWT bearer token authentication, server-side token revocation on logout.
- **Mandatory First-Login Password Change:** Accounts flagged with `mustChangePassword = true` are intercepted upon login and must set a valid new password meeting complexity criteria before accessing application screens.
- **Role-Based Authorization (RBAC):** Three distinct roles: `REQUESTER`, `STAFF` (IT Staff), and `ADMIN` (Administrator). Server middleware enforces role permissions on every API route.
- **Requester Continuity & Ownership:** Authenticated identity automatically establishes ticket ownership (replacing client-supplied `requesterId`). Requesters can post Public Comments and click "Problem Appears Resolved".
- **IT Staff Ticket Queue ("My Queue"):** Shared queue interface supporting search (ticket number, summary), multi-criteria filtering (category, system, priority, status, owner), column sorting arrows (`⇅`), and numeric pagination.
- **IT Staff Ticket Operations:** Ticket Detail allowing IT Staff to claim or reassign ticket ownership, update IT Priority, transition statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`), write resolution summaries, view/add Public Comments, and view/add private Internal Notes.
- **Administrator User Management:** Minimalist two-panel/drawer screen listing all users with search and role filtering, user creation with initial passwords, account editing, active/inactive toggling, initial password resets, and safety rules (preventing self-deactivation and preventing elimination of the last active administrator).
- **Zen Green UI Theme & Responsive Layouts:** Full alignment with the 4 teacher mockups across Desktop (>=992px), Tablet (768-991px), and Mobile (<768px).

### Explicitly Excluded from Lab 3
- Email delivery services (SMTP, SendGrid, email invitations, password-reset emails).
- Social login, OAuth, single sign-on (SSO), and multi-factor authentication (MFA).
- Requester self-registration (accounts are provisioned by Administrator).
- Actions Taken by IT Staff (deferred to Lab 4).
- Formal SLA calculation, automated escalation engines, and notification microservices.
- Multi-tenancy, departments, organizations, profile photos, and role history audit logs.
- Hard user deletion, bulk user operations, import/export capabilities.
- Requester editing or deletion of tickets or comments/notes.

---

## 4. Functional Requirements

### Authentication & Session Management
- **FR-01 (Authentication):** Users can authenticate using their registered email and password. Inactive accounts and invalid credentials must be rejected with safe error responses.
- **FR-02 (Mandatory Password Change):** Users with `mustChangePassword = true` are forced into the password change interface; all other application routes remain inaccessible until completed.
- **FR-03 (Session & Token Invalidation):** Successful authentication issues a JWT token. Logging out revokes the session on both client and server.
- **FR-04 (Current Identity):** The application retrieves current user profile and permissions via `/api/auth/me`.

### Requester Ticketing & Ownership
- **FR-05 (Authenticated Ticket Creation):** Requesters create tickets tied strictly to their authenticated account (`req.user.id`).
- **FR-06 (My Tickets Isolation):** Requesters only see and query tickets they own. Direct attempts to view other users' tickets return 404 Not Found.
- **FR-07 (Problem Appears Resolved):** Requesters can indicate that their issue appears resolved, appending a system notification to the ticket comments.

### IT Staff Queue & Operations
- **FR-08 (Shared Ticket Queue):** IT Staff can view all organization tickets in a shared queue with search, filters, sorting, and pagination.
- **FR-09 (Ticket Claim & Assignment):** IT Staff can assign ticket ownership to themselves or reassign to another active IT Staff member.
- **FR-10 (IT Priority Adjustment):** IT Staff can adjust the IT Priority independently of the Requester's initial Requested Priority.
- **FR-11 (Status Workflow Transitions):** IT Staff can transition ticket statuses according to the permitted state machine.
- **FR-12 (Resolution Documentation):** IT Staff can document a resolution summary visible to the Requester upon resolving the ticket.

### Collaboration (Comments & Notes)
- **FR-13 (Public Comments):** Requesters, IT Staff, and Administrators can view and post append-only Public Comments on tickets.
- **FR-14 (Internal Notes):** IT Staff and Administrators can view and post append-only confidential Internal Notes. Requesters are strictly forbidden (403 Forbidden).

### Administrator User Management
- **FR-15 (User Listing & Search):** Administrators can view all user accounts, search by name/email, and filter by role.
- **FR-16 (User Creation):** Administrators can create new accounts with name, email, one role, active status, and an initial password.
- **FR-17 (User Editing):** Administrators can edit name, email, role, and active status of existing accounts.
- **FR-18 (Password Reset):** Administrators can issue a new initial password for any user, automatically setting `mustChangePassword = true`.
- **FR-19 (Administrator Safety Guards):** Administrators cannot deactivate their own account, and the system cannot deactivate the last remaining active Administrator.

---

## 5. Business Rules (BR)

| BR ID | Rule Statement |
| :--- | :--- |
| **BR-01** | Only active user accounts (`isActive = true`) with valid matching credentials can authenticate. |
| **BR-02** | Any user flagged with `mustChangePassword = true` cannot access normal application screens until a valid new password is saved. |
| **BR-03** | Authenticated session identity (`req.user.id`), not client-supplied query parameters or headers (e.g. `X-Development-Requester-Id`), strictly determines ticket ownership. |
| **BR-04** | Password Complexity Rule: New passwords must be at least 8 characters long, contain uppercase and lowercase letters, a number, and a special character. |
| **BR-05** | Public Comments are visible to the ticket's Requester, IT Staff, and Administrator. Internal Notes are strictly confidential and visible only to IT Staff and Administrator. |
| **BR-06** | Comments and Internal Notes are append-only. Editing, updating, or deleting existing entries is forbidden. Content must be between 1 and 2000 characters after trimming. |
| **BR-07** | Requesters can indicate that a problem "Appears Resolved", but only IT Staff or Administrator can formally set ticket status to `RESOLVED` or `CLOSED`. |
| **BR-08** | Initial Ticket Creation sets `currentStatus = NEW`. `IT Priority` defaults to the Requester's `Requested Priority`. `ownerId` initializes to `null` (Unassigned). |
| **BR-09** | Valid Ticket Status Transitions: <br>• `NEW` ➔ `OPEN`, `CANCELLED`<br>• `OPEN` ➔ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`<br>• `IN_PROGRESS` ➔ `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`<br>• `WAITING_FOR_REQUESTER` ➔ `IN_PROGRESS`, `RESOLVED`<br>• `RESOLVED` ➔ `CLOSED`, `REOPENED`<br>• `CLOSED` ➔ `REOPENED` |
| **BR-10** | Setting ticket status to `RESOLVED` or `CLOSED` requires a non-empty `resolutionSummary` (minimum 5 characters). |
| **BR-11** | Ticket ownership may only be assigned to an active user with the role `STAFF` or `ADMIN`. |
| **BR-12** | User email addresses must be unique across the system (case-insensitive). |
| **BR-13** | An Administrator cannot deactivate their own currently logged-in account (`self-deactivation prevention`). |
| **BR-14** | An Administrator cannot deactivate or change the role of the last remaining active Administrator in the system (`last-admin prevention`). |
| **BR-15** | Setting a new initial password for a user automatically sets `mustChangePassword = true`. |
| **BR-16** | Unauthenticated requests to protected endpoints return `401 Unauthorized`. Authenticated requests exceeding role permissions return `403 Forbidden`. |
| **BR-17** | Attempting to access a non-existent ticket or a ticket owned by another Requester returns `404 Not Found` to prevent resource enumeration. |
| **BR-18** | Existing Lab 2 Attachment constraints remain in effect: Allowed types JPG, PNG, WEBP, PDF; Max 5 MB per file; Max 5 active attachments per ticket; Soft-removal requires reason (>= 3 chars); Removed files cannot be downloaded. |

---

## 6. Role × Resource Authorization Matrix

| Endpoint / Capability | Requester | IT Staff | Administrator |
| :--- | :---: | :---: | :---: |
| `POST /api/auth/login`, `POST /api/auth/logout` | ✅ | ✅ | ✅ |
| `GET /api/auth/me`, `POST /api/auth/change-password` | ✅ | ✅ | ✅ |
| `POST /api/tickets` (Create Ticket) | ✅ | ✅ | ✅ |
| `GET /api/tickets` (My Tickets) | ✅ (Own tickets only) | ✅ (Own tickets only) | ✅ (Own tickets only) |
| `GET /api/tickets/:id` (Requester Detail) | ✅ (Own tickets only) | ✅ | ✅ |
| `GET /api/staff/queue` (Shared Ticket Queue) | ❌ 403 Forbidden | ✅ | ✅ |
| `GET /api/staff/tickets/:id` (Staff Detail) | ❌ 403 Forbidden | ✅ | ✅ |
| `PATCH /api/staff/tickets/:id/claim` | ❌ 403 Forbidden | ✅ | ✅ |
| `PATCH /api/staff/tickets/:id/assign` | ❌ 403 Forbidden | ✅ | ✅ |
| `PATCH /api/staff/tickets/:id/priority` | ❌ 403 Forbidden | ✅ | ✅ |
| `PATCH /api/staff/tickets/:id/status` | ❌ 403 Forbidden | ✅ | ✅ |
| `GET /api/tickets/:id/comments` (Public Comments) | ✅ (Own tickets) | ✅ | ✅ |
| `POST /api/tickets/:id/comments` (Add Public Comment) | ✅ (Own tickets) | ✅ | ✅ |
| `GET /api/tickets/:id/notes` (Internal Notes) | ❌ 403 Forbidden | ✅ | ✅ |
| `POST /api/tickets/:id/notes` (Add Internal Note) | ❌ 403 Forbidden | ✅ | ✅ |
| `GET /api/admin/users` (User Management List) | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ |
| `POST /api/admin/users` (Create User) | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ |
| `PATCH /api/admin/users/:id` (Update User) | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ |
| `POST /api/admin/users/:id/reset-password` | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ |

---

## 7. Data Changes & Database Evolution

### Evolving from Lab 2 to Lab 3 (Prisma Schema)
1. **Model `RequesterUser` ➔ Model `User`:**
   - Add enum `Role { REQUESTER, STAFF, ADMIN }`.
   - Fields: `id`, `name`, `email` (unique), `passwordHash`, `role` (default: `REQUESTER`), `mustChangePassword` (default: `false`), `isActive` (default: `true`), `createdAt`, `updatedAt`.
2. **Model `Ticket` Updates:**
   - Update relation `requesterId` to reference `User.id` (`TicketRequester`).
   - Add `ownerId Int?` referencing `User.id` (`TicketOwner`).
   - Add `itPriority Priority?` (defaults to `requestedPriority` upon creation).
   - Add `resolutionSummary String?`.
   - Add `problemResolvedReq Boolean @default(false)`.
3. **New Model `PublicComment`:**
   - Fields: `id`, `ticketId` (FK), `authorId` (FK User), `content`, `createdAt`.
4. **New Model `InternalNote`:**
   - Fields: `id`, `ticketId` (FK), `authorId` (FK User), `content`, `createdAt`.
5. **Existing Models Preserved:**
   - `Category`, `RelatedSystem`, and `Attachment` remain fully compatible.

### Seed Data Requirements (Idempotent)
- At least 4 active Requesters and 1 inactive Requester (`mustChangePassword = true`).
- At least 3 active IT Staff and 1 inactive IT Staff.
- At least 1 active Administrator.
- Default seeded password: `Password123!` (hashed via bcrypt).
- Realistic seeded tickets across statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), priorities, and assignments.
- Sample Public Comments and Internal Notes on initial tickets.

---

## 8. Acceptance Criteria (AC)

- **AC-01 (Valid Login):** Given an active user with valid credentials, when POST `/api/auth/login` is called, then return status 200, an authentication token, and user identity with role.
- **AC-02 (Invalid Login):** Given incorrect password or inactive user account, when login is attempted, return status 401 with code `INVALID_CREDENTIALS`.
- **AC-03 (Mandatory Password Change):** Given a user with `mustChangePassword = true`, when attempting to view tickets or queues, access is blocked with password change required until a valid new password is saved via POST `/api/auth/change-password`.
- **AC-04 (Token Revocation on Logout):** Given an authenticated session, when POST `/api/auth/logout` is called, subsequent requests using that token receive status 401 Unauthorized.
- **AC-05 (Strict Requester Ownership):** Given an authenticated Requester, when viewing tickets or creating a ticket with another `requesterId`, the backend strictly enforces the token user's identity and returns only owned data.
- **AC-06 (Staff Queue Query):** Given an authenticated IT Staff member, when querying GET `/api/staff/queue` with keyword and filters, return all matching organization tickets with numeric pagination metadata.
- **AC-07 (Role Protection on Queue):** Given an authenticated Requester, when calling GET `/api/staff/queue`, return status 403 Forbidden.
- **AC-08 (Staff Ticket Operations):** Given an IT Staff member on Ticket Detail, they can claim ownership, reassign owner, update IT Priority, and update ticket status.
- **AC-09 (Internal Notes Protection):** Given an authenticated Requester, when requesting GET or POST `/api/tickets/:id/notes`, return status 403 Forbidden without leaking note content.
- **AC-10 (Public Comments Thread):** Given a ticket, when a Requester or IT Staff posts a public comment, it appears in chronological order with author name, role tag, and timestamp.
- **AC-11 (Admin User Management):** Given an Administrator, they can list users, create a new user with initial password, edit user details, and toggle active status.
- **AC-12 (Admin Safety Guards):** Given an Administrator, when attempting to deactivate their own account or the last remaining Administrator, return status 400 Bad Request with a clear validation error.

---

## 9. Product Definition of Done (DoD)
- [ ] All 6 planned GitHub issues implemented on dedicated feature branches.
- [ ] Prisma schema migrated to `User` model, relationships, and new models without data loss.
- [ ] Idempotent seed script populating all required users, roles, categories, systems, tickets, comments, and notes.
- [ ] 100% passing automated test suite (all Lab 1, Lab 2, and new Lab 3 server and client tests).
- [ ] Complete Role × Endpoint Authorization Matrix enforced and verified by tests.
- [ ] All 4 mockup user interfaces implemented with responsive Zen Green styling.
- [ ] Visual inspection checklist verified across Desktop, Tablet, and Mobile viewports.
- [ ] Every PR linked to its GitHub Issue, peer-reviewed, and merged into `lab3-staging` by reviewer.
- [ ] Final release merged cleanly from `lab3-staging` into `main`.
