# Lab 4 REST API Specification: Actions Taken, Dashboards, and Ticket Lifecycle

## 1. Global API Standards & Conventions

- **Base URL:** `/api`
- **Content-Type:** `application/json`
- **Authentication:** `Authorization: Bearer <JWT_TOKEN>`
- **Security Guard:** Server middleware overrides client-supplied actor identifiers with `req.user.id`.
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

## 2. Actions Taken Endpoints

### 2.1 POST `/api/staff/tickets/:ticketId/actions`
- **Purpose:** Record a new Action Taken line item under a ticket.
- **Roles Permitted:** `STAFF`, `ADMIN`
- **Request Parameters:**
  - `ticketId` (int, required): Target ticket ID.
- **Request Body:**
```json
{
  "actionDateTime": "2026-10-29T10:30:00Z",
  "description": "Replaced faulty RAM module in slot 2 and ran memtest diagnostics.",
  "result": "Passed 3 cycles of memtest without memory errors.",
  "followUpRequired": true,
  "followUpNote": "Monitor system stability during user's morning shift.",
  "attachmentNotes": "See diagnostic_log.txt and ram_barcode.jpg in attachments."
}
```
- **Validation Rules:**
  - `actionDateTime`: ISO 8601 string, defaults to current time if omitted.
  - `description`: String, 10–2,000 characters (required).
  - `result`: String, 3–2,000 characters (required).
  - `followUpRequired`: Boolean, default `false`.
  - `followUpNote`: String, required if `followUpRequired = true` (min 3 chars).
  - `attachmentNotes`: String, optional (max 1,000 chars).
- **Responses:**
  - `201 Created`:
  ```json
  {
    "action": {
      "id": 14,
      "ticketId": 102,
      "actionDateTime": "2026-10-29T10:30:00.000Z",
      "description": "Replaced faulty RAM module in slot 2 and ran memtest diagnostics.",
      "result": "Passed 3 cycles of memtest without memory errors.",
      "performedById": 2,
      "performedBy": {
        "id": 2,
        "name": "Alex Tech",
        "email": "atech@toktickit.com",
        "role": "STAFF"
      },
      "followUpRequired": true,
      "followUpNote": "Monitor system stability during user's morning shift.",
      "attachmentNotes": "See diagnostic_log.txt and ram_barcode.jpg in attachments.",
      "createdAt": "2026-10-29T10:32:15.000Z",
      "updatedAt": "2026-10-29T10:32:15.000Z"
    }
  }
  ```
  - `400 Bad Request`: Validation failure (e.g. missing `followUpNote` when `followUpRequired` is true).
  - `403 Forbidden`: Authenticated user is `REQUESTER`.
  - `404 Not Found`: Ticket does not exist.
  - `409 Conflict`: Ticket is in terminal status `CLOSED` or `CANCELLED`.

### 2.2 GET `/api/staff/tickets/:ticketId/actions`
- **Purpose:** Retrieve all Actions Taken records for a specific ticket (Staff view).
- **Roles Permitted:** `STAFF`, `ADMIN`
- **Responses:**
  - `200 OK`:
  ```json
  {
    "actions": [
      {
        "id": 14,
        "ticketId": 102,
        "actionDateTime": "2026-10-29T10:30:00.000Z",
        "description": "Replaced faulty RAM module...",
        "result": "Passed 3 cycles...",
        "performedById": 2,
        "performedBy": {
          "id": 2,
          "name": "Alex Tech",
          "email": "atech@toktickit.com"
        },
        "followUpRequired": true,
        "followUpNote": "Monitor system...",
        "attachmentNotes": "See diagnostic_log.txt",
        "createdAt": "2026-10-29T10:32:15.000Z"
      }
    ],
    "total": 1
  }
  ```

### 2.3 PATCH `/api/staff/tickets/:ticketId/actions/:actionId`
- **Purpose:** Modify an existing Action Taken record.
- **Roles Permitted:** `STAFF`, `ADMIN`
- **Request Body:** Partial update fields (`description`, `result`, `followUpRequired`, `followUpNote`, `attachmentNotes`, `actionDateTime`).
- **Responses:**
  - `200 OK`: Updated action object.
  - `400 Bad Request`: Validation failure.
  - `403 Forbidden`: Requester role.
  - `404 Not Found`: Action Taken or Ticket not found.

### 2.4 GET `/api/tickets/:ticketId/actions`
- **Purpose:** Retrieve Actions Taken records for a ticket owned by the authenticated Requester.
- **Roles Permitted:** `REQUESTER` (Must own ticket), `STAFF`, `ADMIN`
- **Responses:**
  - `200 OK`: Actions list.
  - `403 Forbidden`: Requester does not own the requested ticket.
  - `404 Not Found`: Ticket not found.

---

## 3. Dashboard Endpoints

### 3.1 GET `/api/dashboards/staff`
- **Purpose:** Provide operational metrics, day-over-day trends, and recent ticket activity for IT Staff and Admins.
- **Roles Permitted:** `STAFF`, `ADMIN`
- **Responses:**
  - `200 OK`:
  ```json
  {
    "user": {
      "id": 2,
      "name": "Michael",
      "role": "STAFF"
    },
    "metrics": {
      "new": {
        "count": 14,
        "delta": "+2 from yesterday"
      },
      "open": {
        "count": 23,
        "delta": "+5 from yesterday"
      },
      "inProgress": {
        "count": 18,
        "delta": "-1 from yesterday"
      },
      "waitingForRequester": {
        "count": 7,
        "delta": "0 from yesterday"
      },
      "myAssigned": {
        "count": 16,
        "delta": "+3 from yesterday"
      }
    },
    "recentTickets": [
      {
        "id": 101,
        "ticketNumber": "TKT-2025-001234",
        "summary": "Laptop battery drains quickly after sleep mode",
        "category": "Hardware and Equipment",
        "status": "OPEN",
        "itPriority": "HIGH",
        "ownerName": "Michael",
        "updatedAt": "2026-10-29T09:15:00Z"
      },
      {
        "id": 98,
        "ticketNumber": "TKT-2025-001230",
        "summary": "Printer keeps showing offline on 3rd floor",
        "category": "Hardware and Equipment",
        "status": "IN_PROGRESS",
        "itPriority": "MEDIUM",
        "ownerName": "Alex Tech",
        "updatedAt": "2026-10-29T08:45:00Z"
      }
    ]
  }
  ```
  - `403 Forbidden`: Requester accounts.

### 3.2 GET `/api/dashboards/requester`
- **Purpose:** Provide personal ticket metrics and recent activity for the authenticated Requester.
- **Roles Permitted:** `REQUESTER`, `ADMIN`
- **Responses:**
  - `200 OK`:
  ```json
  {
    "user": {
      "id": 1,
      "name": "Jennifer",
      "role": "REQUESTER"
    },
    "metrics": {
      "myOpen": {
        "count": 3,
        "label": "My Open Tickets"
      },
      "inProgress": {
        "count": 2,
        "label": "In Progress"
      },
      "resolved": {
        "count": 5,
        "label": "Resolved"
      },
      "closed": {
        "count": 12,
        "label": "Closed"
      }
    },
    "recentTickets": [
      {
        "id": 101,
        "ticketNumber": "TKT-2025-001234",
        "summary": "Laptop battery drains quickly after sleep mode",
        "category": "Hardware and Equipment",
        "status": "OPEN",
        "requestedPriority": "HIGH",
        "updatedAt": "2026-10-29T09:15:00Z"
      },
      {
        "id": 89,
        "ticketNumber": "TKT-2025-001222",
        "summary": "Request software access for Figma Enterprise",
        "category": "Software and Applications",
        "status": "RESOLVED",
        "requestedPriority": "MEDIUM",
        "updatedAt": "2026-10-28T16:20:00Z"
      }
    ]
  }
  ```

---

## 4. Ticket Lifecycle & Concurrency Endpoints

### 4.1 PATCH `/api/staff/tickets/:id/status`
- **Purpose:** Transition ticket status with resolution gating and optimistic concurrency check.
- **Roles Permitted:** `STAFF`, `ADMIN`
- **Request Body:**
```json
{
  "status": "RESOLVED",
  "resolutionSummary": "Replaced RAM module and verified stability with user.",
  "expectedUpdatedAt": "2026-10-29T09:15:00.000Z"
}
```
- **Validation & Business Logic:**
  - Checks state machine transition matrix (`BR-10`).
  - If target status is `RESOLVED` or `CLOSED`, `resolutionSummary` is strictly required (min 5 characters).
  - If `expectedUpdatedAt` does not match database `updatedAt`, aborts update and returns `409 Conflict`.
- **Responses:**
  - `200 OK`: Updated ticket object with refreshed status and timestamp.
  - `400 Bad Request`: Illegal status transition or missing resolution summary.
  - `409 Conflict`: Stale update detected (`code: STALE_UPDATE_CONFLICT`).

### 4.2 POST `/api/tickets/:id/resolve-advisory`
- **Purpose:** Record Requester's advisory indication that the problem appears resolved.
- **Roles Permitted:** `REQUESTER` (Must own ticket)
- **Responses:**
  - `200 OK`:
  ```json
  {
    "message": "Advisory resolution recorded. IT Staff will review and formally close the ticket.",
    "ticketId": 101,
    "advisoryStatus": "APPEARS_RESOLVED"
  }
  ```
