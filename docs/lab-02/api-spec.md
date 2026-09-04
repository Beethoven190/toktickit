# Lab 2 REST API Specification

This document defines the REST API contract for the TokTickIT Requester MVP (Lab 2).

---

## 1. Reference Endpoints

### 1.1 `GET /api/requesters`
Returns all active Development Requesters for the simulated login selector.
- **Query Params:** None
- **Response `200 OK`:**
```json
[
  { "id": 1, "name": "Jennifer Anderson", "email": "jennifer.a@toktickit.local" },
  { "id": 2, "name": "David Lee", "email": "david.l@toktickit.local" },
  { "id": 3, "name": "Sarah Johnson", "email": "sarah.j@toktickit.local" },
  { "id": 4, "name": "Michael Brown", "email": "michael.b@toktickit.local" }
]
```
*(Note: Inactive requesters with `isActive = false` are strictly omitted)*

### 1.2 `GET /api/categories`
Returns the 4 supported ticket categories.
- **Response `200 OK`:**
```json
[
  { "id": 1, "name": "Account and Access" },
  { "id": 2, "name": "Hardware" },
  { "id": 3, "name": "Software" },
  { "id": 4, "name": "Network" }
]
```

### 1.3 `GET /api/systems`
Returns supported related systems.
- **Response `200 OK`:**
```json
[
  { "id": 1, "name": "Corporate Laptop" },
  { "id": 2, "name": "Email" },
  { "id": 3, "name": "Campus Wi-Fi" },
  { "id": 4, "name": "VPN" },
  { "id": 5, "name": "LEB2 App" },
  { "id": 6, "name": "Printer" }
]
```

---

## 2. Ticket Endpoints

### 2.1 `POST /api/tickets`
Creates a new support ticket.
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "requesterId": 1,
  "categoryId": 2,
  "relatedSystemId": 1,
  "summary": "Laptop battery drains too quickly",
  "description": "My laptop battery drains in less than 45 minutes since the latest OS update.",
  "requestedPriority": "MEDIUM"
}
```
- **Validation Rules:**
  - `requesterId`: Required, integer, must match an active `RequesterUser`.
  - `categoryId`: Required, integer, must match an existing `Category`.
  - `relatedSystemId`: Required, integer, must match an existing `RelatedSystem`.
  - `summary`: Required string, 5–150 characters after trimming.
  - `description`: Required string, 10–2000 characters after trimming.
  - `requestedPriority`: Enum: `"LOW"`, `"MEDIUM"`, `"HIGH"`. Defaults to `"MEDIUM"`.
- **Response `201 Created`:**
```json
{
  "id": 1,
  "ticketNumber": "TKT-2026-000001",
  "requesterId": 1,
  "categoryId": 2,
  "relatedSystemId": 1,
  "summary": "Laptop battery drains too quickly",
  "description": "My laptop battery drains in less than 45 minutes since the latest OS update.",
  "requestedPriority": "MEDIUM",
  "currentStatus": "NEW",
  "createdAt": "2026-09-03T10:00:00.000Z",
  "updatedAt": "2026-09-03T10:00:00.000Z"
}
```
- **Error Responses:**
  - `400 Bad Request`: Validation failure (e.g. summary too short).
  - `500 Internal Server Error`: Unexpected database error.

---

### 2.2 `GET /api/tickets`
Retrieves a paginated list of tickets owned strictly by the requesting user.
- **Query Parameters:**
  - `requesterId` (required): Integer.
  - `search` (optional): Filter by summary or ticket number.
  - `categoryId` (optional): Filter by category.
  - `priority` (optional): Filter by priority (`LOW`, `MEDIUM`, `HIGH`).
  - `status` (optional): Filter by status (`NEW`, `OPEN`, `RESOLVED`, etc.).
  - `page` (optional, default: 1): Page number.
  - `limit` (optional, default: 10): Items per page.
  - `sort` (optional, default: `"createdAt"`): Sort field.
  - `order` (optional, default: `"desc"`): Sort order (`"asc"` or `"desc"`).
- **Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1,
      "ticketNumber": "TKT-2026-000001",
      "summary": "Laptop battery drains too quickly",
      "category": { "id": 2, "name": "Hardware" },
      "relatedSystem": { "id": 1, "name": "Corporate Laptop" },
      "requestedPriority": "MEDIUM",
      "currentStatus": "NEW",
      "createdAt": "2026-09-03T10:00:00.000Z",
      "updatedAt": "2026-09-03T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 2.3 `GET /api/tickets/:id`
Retrieves full details of a specific ticket with ownership verification.
- **Headers / Query:** `requesterId` (required to verify ownership).
- **Response `200 OK`:**
```json
{
  "id": 1,
  "ticketNumber": "TKT-2026-000001",
  "requester": { "id": 1, "name": "Jennifer Anderson" },
  "category": { "id": 2, "name": "Hardware" },
  "relatedSystem": { "id": 1, "name": "Corporate Laptop" },
  "summary": "Laptop battery drains too quickly",
  "description": "My laptop battery drains in less than 45 minutes since the latest OS update.",
  "requestedPriority": "MEDIUM",
  "currentStatus": "NEW",
  "createdAt": "2026-09-03T10:00:00.000Z",
  "updatedAt": "2026-09-03T10:00:00.000Z",
  "attachments": [
    {
      "id": 1,
      "originalName": "battery_report.pdf",
      "size": 245120,
      "mimeType": "application/pdf",
      "isRemoved": false,
      "removalReason": null,
      "createdAt": "2026-09-03T10:00:00.000Z"
    }
  ]
}
```
- **Error Responses:**
  - `403 Forbidden`: Ticket belongs to a different Requester.
  - `404 Not Found`: Ticket does not exist.

---

## 3. Attachment Endpoints

### 3.1 `POST /api/tickets/:id/attachments`
Uploads a new attachment for an owned ticket.
- **Content-Type:** `multipart/form-data`
- **Fields:** `file` (binary), `requesterId` (integer).
- **Constraints:**
  - Allowed types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
  - Max size: `5MB` (5,242,880 bytes).
  - Max active attachments per ticket: `5`.
- **Response `201 Created`:**
```json
{
  "id": 2,
  "ticketId": 1,
  "originalName": "screenshot.png",
  "size": 184500,
  "mimeType": "image/png",
  "isRemoved": false,
  "createdAt": "2026-09-03T10:05:00.000Z"
}
```

### 3.2 `GET /api/tickets/:id/attachments/:attachmentId/file`
Downloads or streams the active attachment file.
- **Headers / Query:** `requesterId` (required to verify ownership).
- **Response `200 OK`:** Binary file stream with matching `Content-Type` and `Content-Disposition`.
- **Error Responses:**
  - `403 Forbidden`: Ticket belongs to a different Requester.
  - `404 Not Found` or `410 Gone`: Attachment does not exist or has been soft-removed (`isRemoved = true`).

### 3.3 `DELETE /api/tickets/:id/attachments/:attachmentId`
Soft-removes an attachment while retaining its metadata and reason.
- **Request Body:**
```json
{
  "requesterId": 1,
  "removalReason": "Uploaded duplicate file by mistake"
}
```
- **Validation Rules:** `removalReason` is required, string, minimum 5 characters.
- **Response `200 OK`:**
```json
{
  "id": 1,
  "isRemoved": true,
  "removalReason": "Uploaded duplicate file by mistake",
  "removedAt": "2026-09-03T10:10:00.000Z"
}
```
