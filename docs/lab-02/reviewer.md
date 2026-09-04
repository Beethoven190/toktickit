# Peer Review Record — Lab 2: TokTickIT Requester Ticketing MVP

**Course:** CPE 334 Software Engineering Laboratory  
**Project:** TokTickIT IT Service Desk MVP  
**Repository Author:** Supanut Watthanasimakorn ([@Beethoven190](https://github.com/Beethoven190))  
**Primary Reviewer & Collaborator:** Nitithorn Ketkaew ([@SANOP19](https://github.com/SANOP19))  
**Cross-Review Collaborators:** [@Sxr1n](https://github.com/Sxr1n), [@FramePongrit](https://github.com/FramePongrit)  

---

## 1. Peer Review Process & Rules Adherence

Throughout the Lab 2 sprint, our team strictly followed the engineering workflow guidelines:
1. **Rule 1 — Reviewer Clicks Merge:** The PR author **never** merges their own Pull Request. The assigned reviewer thoroughly reviews the changes, writes a structured review evaluation, and clicks the green **`Merge pull request`** button.
2. **Rule 2 — Reply to Comments:** If any review feedback or questions were posted, the author replied and clarified before resolution.
3. **Rule 3 — Link PR to Issue:** Every Pull Request was explicitly linked to its corresponding GitHub Issue using the `Development` panel on GitHub.
4. **Rule 4 — Kanban Flow:** Every issue transitioned through the 6 Kanban stages: `Backlog` → `Specified` → `Started` → `PR Review` → `Fixing` (if needed) → `Done`.
5. **Rule 5 — Branching Strategy:** All feature branches (`feature/X-...`) merged into `lab2-staging`. The final release is merged from `lab2-staging` into `main`.

---

## 2. PRs Created by @Beethoven190 (Reviewed & Merged by @SANOP19)

| Issue # | Branch Name | PR # | PR Link | Reviewer | Decision | Merged By |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Issue 1** | `feature/1-spec-contract` | #10 | [PR #10](https://github.com/Beethoven190/toktickit/pull/10) | @SANOP19 | **Approved** | @SANOP19 |
| **Issue 2** | `feature/2-requester-context` | #12 | [PR #12](https://github.com/Beethoven190/toktickit/pull/12) | @SANOP19 | **Approved** | @SANOP19 |
| **Issue 3** | `feature/3-create-ticket` | #14 | [PR #14](https://github.com/Beethoven190/toktickit/pull/14) | @SANOP19 | **Approved** | @SANOP19 |
| **Issue 4** | `feature/4-my-tickets` | #16 | [PR #16](https://github.com/Beethoven190/toktickit/pull/16) | @SANOP19 | **Approved** | @SANOP19 |
| **Issue 5** | `feature/5-ticket-detail-attachments` | #18 | [PR #18](https://github.com/Beethoven190/toktickit/pull/18) | @SANOP19 | **Approved** | @SANOP19 |

### Detailed Evaluation of Author PRs:

#### PR #10 (Issue 1: Engineering Contract Documentation)
- **Author Summary:** Defined the engineering contract for Lab 2 across `specification.md`, `tests.md`, `ui-spec.md`, and `api-spec.md`.
- **Review Feedback:** Verified that all Business Rules (BR-01 through BR-14) and Acceptance Criteria (AC-01 through AC-07) matched stakeholder requirements and DoD.
- **Outcome:** Approved and merged by @SANOP19 into `lab2-staging`.

#### PR #12 (Issue 2: Development Requester Context & Selection Screen)
- **Author Summary:** Added `RequesterUser` Prisma model, idempotent database seed script, `GET /api/requesters` filtering out inactive users, Zen Green selection screen, and active header context.
- **Review Feedback:** Tested user switching and verified inactive user `Metier Leviathan` is excluded from the selection dropdown (BR-04). All tests passed.
- **Outcome:** Approved and merged by @SANOP19 into `lab2-staging`.

#### PR #14 (Issue 3: Ticket Creation & Form Validation)
- **Author Summary:** Added `Ticket` and `RelatedSystem` models with `Priority` and `TicketStatus` enums, seeded 6 systems, created `POST /api/tickets` with official ticket number generator (`TKT-YYYY-XXXXXX`), and built `CreateTicket.tsx` with field-level validation and busy state.
- **Review Feedback:** Verified that input validation errors do not wipe user-entered text (BR-14), status initializes strictly to `NEW` (BR-02), and ticket numbers follow the exact format.
- **Outcome:** Approved and merged by @SANOP19 into `lab2-staging`.

#### PR #16 (Issue 4: My Tickets Screen & Ownership Protection)
- **Author Summary:** Implemented `GET /api/tickets` with strict ownership filtering (`requesterId`), search, category/priority/status filters, pagination, and built `MyTickets.tsx` with desktop table and mobile responsive card layouts.
- **Review Feedback:** Tested ownership protection by switching requesters; verified tickets are strictly isolated per requester (BR-05, AC-03).
- **Outcome:** Approved and merged by @SANOP19 into `lab2-staging`.

#### PR #18 (Issue 5: Requester Ticket Detail & Attachment Soft-Removal Lifecycle)
- **Author Summary:** Added `Attachment` model, file upload endpoint with multer (<= 5MB, JPG/PNG/WEBP/PDF, max 5 active attachments), secure download endpoint, soft-removal endpoint requiring reason (>= 5 chars), and frontend `TicketDetail.tsx` with soft-removal modal and audit trail.
- **Review Feedback:** Verified soft-removal preserves the attachment record and reason while strictly blocking subsequent downloads (BR-12, BR-13, AC-06).
- **Outcome:** Approved and merged by @SANOP19 into `lab2-staging`.

---

## 3. PRs Reviewed & Merged by @Beethoven190 (As Reviewer)

As part of peer collaboration, @Beethoven190 performed code reviews and executed merges for peer repositories:

| Author | Repository | PR # | Issue Reviewed | Review Decision | Merged By |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **@SANOP19** | SANOP19/toktickit | [PR #15](https://github.com/SANOP19/toktickit/pull/15) | Issue 1: Engineering Contract | **Approved** | @Beethoven190 |
| **@SANOP19** | SANOP19/toktickit | [PR #16](https://github.com/SANOP19/toktickit/pull/16) | Issue 2: Requester Context | **Approved** | @Beethoven190 |
| **@SANOP19** | SANOP19/toktickit | [PR #17](https://github.com/SANOP19/toktickit/pull/17) | Issue 3: Ticket Creation | **Approved** | @Beethoven190 |
| **@SANOP19** | SANOP19/toktickit | [PR #18](https://github.com/SANOP19/toktickit/pull/18) | Issue 4: My Tickets Screen | **Approved** | @Beethoven190 |
| **@SANOP19** | SANOP19/toktickit | [PR #19](https://github.com/SANOP19/toktickit/pull/19) | Issue 5: Ticket Detail & Attachments | **Approved** | @Beethoven190 |
| **@Sxr1n** | Sxr1n/toktickit | [PR #17](https://github.com/Sxr1n/toktickit/pull/17) | Issue 1: Engineering Contract | **Approved** | @Beethoven190 |
| **@Sxr1n** | Sxr1n/toktickit | [PR #18](https://github.com/Sxr1n/toktickit/pull/18) | Issue 2: Requester Context | **Approved** | @Beethoven190 |
| **@FramePongrit** | FramePongrit/toktickit | [PR #11](https://github.com/FramePongrit/toktickit/pull/11) | Issue 1: Engineering Contract | **Approved** | @Beethoven190 |

---

## 4. Quality Checklist & Verification Summary

| Check Item | Requirement | Status |
| :--- | :--- | :--- |
| **Branch Target** | All PRs targeted `lab2-staging` before final release | **PASS** |
| **Merge Authority** | Reviewer clicked merge on all pull requests | **PASS** |
| **Issue Traceability** | All PRs linked to GitHub Issues via Development panel | **PASS** |
| **Kanban Movement** | Cards followed `Backlog` → `Specified` → `Started` → `PR Review` → `Done` | **PASS** |
| **Test Automation** | 100% of automated tests passed before merge approval | **PASS** |
| **Design Tokens** | UI complied with Zen Green Theme (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`) | **PASS** |
