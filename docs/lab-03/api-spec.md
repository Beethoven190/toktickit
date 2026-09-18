# Lab 3 REST API Specification: TokTickIT Security, Workflows, and Administration

## 1. Global API Standards & Conventions

- **Base URL:** `/api`
- **Content-Type:** `application/json` (except multipart file upload for attachments)
- **Authentication Header:** `Authorization: Bearer <JWT_TOKEN>`
- **Security Standard:** Every protected route verifies identity via middleware. Client-supplied IDs (e.g. `requesterId` in body or query) are overridden by `req.user.id`.
- **Standard Error Response Shape:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | INTERNAL_ERROR",
    "message": "Human-readable explanation of error.",
    "fields": {
      "fieldName": "Field-specific validation error message."
    }
  }
}
```

---

## 2. Authentication & Session Endpoints

### 2.1 POST `/api/auth/login`
- **Purpose:** Authenticate user credentials and establish session.
- **Request Body:**
```json
{
  "email": "janderson@toktickit.com",
  "password": "Password123!"
}
```
- **Responses:**
  - `200 OK`:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "janderson@toktickit.com",
      "role": "REQUESTER",
      "mustChangePassword": false,
      "isActive": true
    }
  }
  ```
  - `401 Unauthorized`: Invalid password, unknown email, or inactive account (`code: INVALID_CREDENTIALS`).

### 2.2 POST `/api/auth/logout`
- **Purpose:** Invalidate session token on server and client.
- **Headers:** `Authorization: Bearer <token>`
- **Responses:**
  - `200 OK`: `{"message": "Logged out successfully."}`

### 2.3 GET `/api/auth/me`
- **Purpose:** Retrieve current authenticated user profile.
- **Headers:** `Authorization: Bearer <token>`
- **Responses:**
  - `200 OK`: `{"user": { "id": 1, "name": "...", "email": "...", "role": "...", "mustChangePassword": false, "isActive": true }}`
  - `401 Unauthorized`: Missing or revoked token.

### 2.4 POST `/api/auth/change-password`
- **Purpose:** Enforce first-login password change or manual password update.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewSecurePassword456!"
}
```
- **Validation:** Minimum 8 characters, upper, lower, number, special character.
- **Responses:**
  - `200 OK`: `{"message": "Password changed successfully.", "mustChangePassword": false}`
  - `400 Bad Request`: Complexity rules not met or incorrect current password.

---

## 3. Requester Ticketing Endpoints (Regression Continuity)

### 3.1 POST `/api/tickets`
- **Purpose:** Create ticket for the authenticated user.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "categoryId": 1,
  "relatedSystemId": 1,
  "summary": "Laptop battery drains quickly",
  "requestedPriority": "MEDIUM",
  "description": "Battery discharges within 30 minutes after update."
}
```
- **Responses:**
  - `201 Created`: Returns created ticket with generated `ticketNumber` (`TKT-YYYY-XXXXXX`) and `currentStatus: "NEW"`.

### 3.2 GET `/api/tickets`
- **Purpose:** List tickets owned by authenticated Requester with search, filter, sort, and pagination.
- **Query Parameters:** `search`, `categoryId`, `relatedSystemId`, `priority`, `status`, `sort`, `page`, `pageSize`.
- **Responses:**
  - `200 OK`: `{"tickets": [...], "pagination": { "page": 1, "pageSize": 10, "total": 5, "totalPages": 1 }}`

### 3.3 GET `/api/tickets/:id`
- **Purpose:** Retrieve single ticket owned by current user.
- **Responses:**
  - `200 OK`: Ticket object with attachments and public comments.
  - `404 Not Found`: Ticket does not exist or is owned by another Requester.

---

## 4. IT Staff Queue & Operational Endpoints

### 4.1 GET `/api/staff/queue`
- **Purpose:** Retrieve shared ticket queue for IT Staff and Administrators.
- **Headers:** `Authorization: Bearer <token>` (Role: `STAFF` or `ADMIN`)
- **Query Parameters:**
  - `search`: Match ticket number or summary.
  - `categoryId`: Filter by category.
  - `relatedSystemId`: Filter by system.
  - `requestedPriority`, `itPriority`: Filter by priority.
  - `status`: Filter by ticket status.
  - `ownerId`: Filter by assigned staff (`"unassigned"` or specific user ID).
  - `sort`: Sort field and order (e.g. `createdAt_desc`, `ticketNumber_asc`).
  - `page`, `pageSize`: Numeric pagination.
- **Responses:**
  - `200 OK`: Returns tickets array with requester details, owner details, and pagination metadata.
  - `403 Forbidden`: Called by Requester.

### 4.2 GET `/api/staff/tickets/:id`
- **Purpose:** Retrieve ticket detail with owner, public comments, internal notes, and attachments.
- **Headers:** `Authorization: Bearer <token>` (Role: `STAFF` or `ADMIN`)
- **Responses:**
  - `200 OK`: Full ticket details.
  - `403 Forbidden`: Called by Requester.
  - `404 Not Found`: Ticket not found.

### 4.3 PATCH `/api/staff/tickets/:id/claim`
- **Purpose:** Current IT Staff member claims ticket ownership.
- **Headers:** `Authorization: Bearer <token>` (Role: `STAFF` or `ADMIN`)
- **Responses:**
  - `200 OK`: Updates `ownerId` to current user. If status was `NEW`, transitions to `OPEN`.

### 4.4 PATCH `/api/staff/tickets/:id/assign`
- **Purpose:** Assign or reassign ticket to an active IT Staff user.
- **Request Body:** `{"ownerId": 2}` (or `null` to unassign)
- **Responses:**
  - `200 OK`: Updates `ownerId`.
  - `400 Bad Request`: Target user is not active or not an IT Staff member.

### 4.5 PATCH `/api/staff/tickets/:id/priority`
- **Purpose:** Adjust IT Priority.
- **Request Body:** `{"itPriority": "HIGH"}`
- **Responses:**
  - `200 OK`: Updates `itPriority`.

### 4.6 PATCH `/api/staff/tickets/:id/status`
- **Purpose:** Progress ticket through valid status transition matrix.
- **Request Body:**
```json
{
  "status": "RESOLVED",
  "resolutionSummary": "Replaced battery module with new OEM battery unit."
}
```
- **Responses:**
  - `200 OK`: Updates status and resolution summary.
  - `400 Bad Request`: Invalid transition from current state or missing required resolution summary.

---

## 5. Collaboration Endpoints (Comments & Internal Notes)

### 5.1 GET `/api/tickets/:id/comments`
- **Purpose:** Retrieve Public Comments thread.
- **Access:** Requester (owned ticket), IT Staff, Administrator.
- **Responses:**
  - `200 OK`: Array of comments with author name, role, timestamp.

### 5.2 POST `/api/tickets/:id/comments`
- **Purpose:** Append new Public Comment.
- **Access:** Requester (owned ticket), IT Staff, Administrator.
- **Request Body:** `{"content": "I noticed the issue happens only on Wi-Fi."}`
- **Responses:**
  - `201 Created`: Appended comment object.
  - `400 Bad Request`: Empty or whitespace-only content.

### 5.3 GET `/api/tickets/:id/notes`
- **Purpose:** Retrieve confidential Internal Notes.
- **Access:** IT Staff, Administrator ONLY.
- **Responses:**
  - `200 OK`: Array of internal notes with author and timestamp.
  - `403 Forbidden`: Attempted by Requester (no note metadata leaked).

### 5.4 POST `/api/tickets/:id/notes`
- **Purpose:** Append confidential Internal Note.
- **Access:** IT Staff, Administrator ONLY.
- **Request Body:** `{"content": "Internal check: Device warranty expires next month."}`
- **Responses:**
  - `201 Created`: Appended internal note.
  - `403 Forbidden`: Attempted by Requester.

---

## 6. Administrator User Management Endpoints

### 6.1 GET `/api/admin/users`
- **Purpose:** List users with search and role filter.
- **Access:** Administrator ONLY.
- **Query Parameters:** `search` (name or email), `role` (`REQUESTER`, `STAFF`, `ADMIN`).
- **Responses:**
  - `200 OK`: Array of users (excluding password hashes).
  - `403 Forbidden`: Non-admin access.

### 6.2 POST `/api/admin/users`
- **Purpose:** Create new user account with initial credentials.
- **Access:** Administrator ONLY.
- **Request Body:**
```json
{
  "name": "Alex Thompson",
  "email": "alex.thompson@toktickit.com",
  "role": "STAFF",
  "isActive": true,
  "initialPassword": "Password123!"
}
```
- **Responses:**
  - `201 Created`: Created user with `mustChangePassword = true`.
  - `409 Conflict`: Email address already registered.

### 6.3 PATCH `/api/admin/users/:id`
- **Purpose:** Update user details, role, or active status.
- **Access:** Administrator ONLY.
- **Request Body:**
```json
{
  "name": "Alex Thompson",
  "email": "alex.thompson@toktickit.com",
  "role": "STAFF",
  "isActive": false
}
```
- **Safety Guards Enforced:**
  - Cannot deactivate own account (`BR-13`).
  - Cannot deactivate or demote last active Administrator (`BR-14`).
- **Responses:**
  - `200 OK`: Updated user profile.
  - `400 Bad Request`: Safety guard violation.

### 6.4 POST `/api/admin/users/:id/reset-password`
- **Purpose:** Set new initial password for user.
- **Access:** Administrator ONLY.
- **Request Body:** `{"initialPassword": "TempPassword123!"}`
- **Responses:**
  - `200 OK`: Password updated, `mustChangePassword` set to `true`.
