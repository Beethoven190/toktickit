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

---

## 3. PRs Reviewed & Merged by @Beethoven190 (As Reviewer)

*Peer repository reviews for Lab 3 will be recorded here as peer PRs are submitted.*

| Author | Repository | PR # | Issue Reviewed | Review Decision | Merged By |
| :--- | :--- | :--- | :--- | :--- | :--- |
| *TBD* | *TBD* | - | - | - | - |

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
