# Lab 2 Test Plan and Results

## 1. Test Strategy
Our testing strategy follows Test-Driven Development (TDD) across multiple testing layers:
1. **Unit & API Integration Tests (Supertest + Vitest):** Verifies backend endpoints, validation rules, database constraints, ownership isolation, and error status codes.
2. **UI Component Tests (Vitest + React Testing Library):** Verifies form inputs, error messages, user feedback, loading states, modal dialogs, and responsive behaviors.
3. **End-to-End & Cross-User Scenarios:** Verifies that Requester switching properly protects ticket data privacy between users.

---

## 2. Planned Tests Table

| Test ID | Type | Req / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|:---:|
| API-REQ-01 | API | FR-01, BR-04 | Retrieve active requesters | 200 OK; lists only active requesters (excludes inactive) | `server/tests/lab-02/requesters.api.test.ts` | Pass |
| API-TKT-01 | API | FR-04, AC-01 | Create ticket with valid data | 201 Created; returns `TKT-YYYY-XXXXXX` and status `NEW` | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-TKT-02 | API | BR-06, BR-07 | Create ticket with invalid summary/description | 400 Bad Request; field-level error messages returned | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-LIST-01 | API | FR-06, AC-03 | Retrieve owned tickets list | 200 OK; returns only tickets belonging to requester | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-LIST-02 | API | FR-07, AC-07 | Search tickets by summary or ticket number | 200 OK; returns filtered results | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-OWN-01 | API | BR-05, AC-04 | Requester B accesses Requester A's ticket detail | 403 Forbidden / 404 Not Found; access denied | `server/tests/lab-02/ticket-detail.api.test.ts` | Pass |
| API-ATT-01 | API | BR-09, AC-05 | Upload invalid file type or file > 5 MB | 400 Bad Request; file rejected | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| API-ATT-02 | API | BR-12, AC-06 | Soft-remove attachment with reason | 200 OK; metadata retained, download returns 404 | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| UI-REQ-01 | UI | FR-01, AC-02 | Requester selection and context switching | Selected user shown in header; persists across screens | `client/tests/lab-02/RequesterSelector.test.tsx` | Pass |
| UI-TKT-01 | UI | FR-04, BR-14 | Validation errors displayed next to invalid fields | Input error messages appear without clearing form | `client/tests/lab-02/CreateTicket.test.tsx` | Pass |
| UI-LIST-01 | UI | FR-06, FR-08 | My Tickets table rendering and pagination | Lists tickets with badges, search input, and page buttons | `client/tests/lab-02/MyTickets.test.tsx` | Pass |
| UI-DET-01 | UI | FR-09, FR-12 | Ticket detail display & soft-remove modal | Read-only details shown; soft-removal prompt works | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | Pass |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Covered By Tests | Verification Method |
|---|---|---|
| **AC-01** (Ticket Creation & Unique Number) | `API-TKT-01`, `UI-TKT-01` | Automated Supertest & React Testing Library |
| **AC-02** (Development Requester Context) | `API-REQ-01`, `UI-REQ-01` | Dropdown renders active users, sets context |
| **AC-03** (My Tickets Ownership Isolation) | `API-LIST-01`, `UI-LIST-01` | Validates queries filtered by `requesterId` |
| **AC-04** (Cross-Requester Protection) | `API-OWN-01` | Negative test asserting 403/404 on cross access |
| **AC-05** (Attachment Validation Limits) | `API-ATT-01` | File size and mime-type assertions |
| **AC-06** (Attachment Soft-Removal) | `API-ATT-02`, `UI-DET-01` | Checks `isRemoved` flag & blocked download |
| **AC-07** (Search & Filter Execution) | `API-LIST-02`, `UI-LIST-01` | Query parameter and UI filtering assertions |

---

## 4. Responsive and Visual Checklist
- [x] **Desktop (>= 992px):** Centered layout with max width (1140px), full table with all ticket columns, multi-column form.
- [x] **Tablet (768px - 991px):** Two-column form layout, horizontally scrollable table with touch scroll.
- [x] **Mobile (< 768px):** Single-column stacked form, card-based layout for My Tickets, touch-friendly buttons.
- [x] **Color Tokens:** Zen Green palette strictly applied (`#006B3C` primary, `#0B7A46` secondary, `#EAF6EF` pale green, `#F5F7F6` background).
- [x] **Typography & Contrast:** Dark charcoal text on light backgrounds meeting WCAG AA contrast standards.

---

## 5. Test Commands
```bash
# Run server integration tests
cd server && npm run test

# Run client component tests
cd client && npm run test
```

---

## 6. Final Results
- Backend integration tests: **Passed (100%)**
- Frontend component tests: **Passed (100%)**

---

## 7. Known Limitations or Deferred Tests
- E2E Playwright tests simulating full browser sessions are planned for final end-of-sprint verification.
- Real password authentication testing is deferred to Lab 3 as specified in project scope.
