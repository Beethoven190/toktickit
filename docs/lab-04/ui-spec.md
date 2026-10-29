# Lab 4 UI Specification: Zen Green Design System & Component Guidelines

## 1. Design Tokens & Zen Green Palette

The application strictly adheres to the established Zen Green visual language across all new dashboards, tables, and modal dialogs.

| Token Name | Hex / CSS Class | Application & Usage |
| :--- | :--- | :--- |
| **Primary Green** | `#006B3C` (`bg-primary-green`) | App navigation header, primary CTA buttons (`+ Create Ticket`, `+ Add Action Taken`, `Save Action`), active tab indicator. |
| **Secondary Green** | `#0B7A46` (`hover:bg-secondary-green`) | Hover states on primary buttons, interactive link accents, focus rings. |
| **Pale Green** | `#EAF6EF` (`bg-pale-green`) | Active row highlights, selected KPI metric cards, success notification callouts. |
| **Page Background** | `#F5F7F6` (`bg-slate-50`) | Application body canvas, quiet near-white neutral background. |
| **Card Surface** | `#FFFFFF` (`bg-white`) | Dashboard cards, quick action boxes, ticket tables, modal dialog surfaces. |
| **Card Border** | `#E2E8F0` (`border-slate-200`) | Subtle hairline borders framing cards, tables, and form controls. |
| **Primary Text** | `#1E293B` (`text-slate-800`) | High-contrast body typography, titles, headings, and metric counters. |
| **Muted Text** | `#64748B` (`text-slate-500`) | Subtitles, timestamps, breadcrumbs, and delta indicators (`+2 from yesterday`). |
| **Warning Amber** | `#D97706` / `#FEF3C7` | `Follow-Up Required` alert badges, `WAITING FOR REQUESTER` status pills. |
| **Info Blue** | `#2563EB` / `#DBEAFE` | `IN PROGRESS` status pills, informational tooltips. |
| **Teal Success** | `#0D9488` / `#CCFBF1` | `RESOLVED` status badges, successful save notifications. |

---

## 2. Status & Metric Badge Conventions

### A. Ticket Status Badges
- **NEW:** `bg-emerald-50 text-emerald-700 border border-emerald-200`
- **OPEN:** `bg-blue-50 text-blue-700 border border-blue-200`
- **IN PROGRESS:** `bg-emerald-100 text-emerald-800 border border-emerald-300`
- **WAITING FOR REQUESTER:** `bg-amber-100 text-amber-800 border border-amber-300`
- **RESOLVED:** `bg-teal-100 text-teal-800 border border-teal-300`
- **CLOSED:** `bg-slate-100 text-slate-700 border border-slate-300`
- **CANCELLED:** `bg-rose-100 text-rose-800 border border-rose-200`
- **REOPENED:** `bg-purple-100 text-purple-800 border border-purple-200`

### B. Actions Taken Indicators
- **Follow-up Needed:** `bg-amber-100 text-amber-800 border border-amber-300 font-semibold px-2 py-0.5 rounded-full text-xs`
- **Completed (No Follow-up):** `bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-xs`
- **Performed By Badge:** `bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium text-xs`

---

## 3. Screen Specifications

### 3.1 IT Staff Dashboard (Teacher Mockup 8.1 / Image 1)

#### 1. Header Banner & Welcome Section
- **Greeting:** `Welcome back, [Staff Name]!` (font-bold text-2xl text-slate-800).
- **Sub-caption:** `Here's what's happening with your queue today.` (text-slate-500 text-sm).
- **Refresh Action:** Top right `[↻ Refresh]` button (Zen Green outline, re-fetches authoritative metrics with spinning icon indicator).

#### 2. KPI Metrics Grid (5 Cards)
- Arranged horizontally on Desktop (`grid grid-cols-5 gap-4`):
  1. **New:** Count (e.g. `14`), delta indicator `+2 from yesterday` (emerald-600), clickable drill-down to `/staff/queue?status=NEW`.
  2. **Open:** Count (e.g. `23`), delta indicator `+5 from yesterday` (emerald-600), drill-down to `/staff/queue?status=OPEN`.
  3. **In Progress:** Count (e.g. `18`), delta indicator `-1 from yesterday` (slate-500), drill-down to `/staff/queue?status=IN_PROGRESS`.
  4. **Waiting for Requester:** Count (e.g. `7`), delta indicator `0 from yesterday` (slate-400), drill-down to `/staff/queue?status=WAITING_FOR_REQUESTER`.
  5. **My Assigned:** Count (e.g. `16`), delta indicator `+3 from yesterday` (emerald-600), drill-down to `/staff/queue?owner=me`.
- **Card Styling:** White card, border `border-slate-200`, rounded-xl, p-4, shadow-sm, hover:border-emerald-600 hover:shadow transition.

#### 3. Operational Content Section (2 Columns)
- **Left Column (70% width): "My Recent Tickets"**
  - Header: `My Recent Tickets` with right-aligned link `[View all]` navigating to Staff Queue.
  - Table / List: Displays recent tickets assigned to or handled by current staff member:
    - Columns: Ticket Number (linked), Summary, Category, Priority Badge, Status Pill, Updated Timestamp.
    - Empty state: Clean slate box `No recent tickets to display. Your queue is clear!`
- **Right Column (30% width): "Quick Actions" Card**
  - Header: `Quick Actions` (font-semibold text-slate-800).
  - Vertical list of Zen Green action buttons:
    - `[+ Create Ticket]` (opens Create Ticket form)
    - `[🔍 Search Tickets]` (focuses search input on Staff Queue)
    - `[📋 My Queue]` (navigates directly to full Staff Queue)

---

### 3.2 Requester Dashboard (Teacher Mockup 8.2 / Image 2)

#### 1. Header Banner & Welcome Section
- **Greeting:** `Welcome, [Requester Name]!` (font-bold text-2xl text-slate-800).
- **Sub-caption:** `Here's the latest on your requests.` (text-slate-500 text-sm).

#### 2. KPI Metrics Grid (4 Cards)
- Arranged horizontally on Desktop (`grid grid-cols-4 gap-4`):
  1. **My Open Tickets:** Count (e.g. `3`), link `View all` navigating to `/my-tickets?status=OPEN`.
  2. **In Progress:** Count (e.g. `2`), link `View all` navigating to `/my-tickets?status=IN_PROGRESS`.
  3. **Resolved:** Count (e.g. `5`), link `View all` navigating to `/my-tickets?status=RESOLVED`.
  4. **Closed:** Count (e.g. `12`), link `View all` navigating to `/my-tickets?status=CLOSED`.

#### 3. Operational Content Section (2 Columns)
- **Left Column (70% width): "My Recent Tickets"**
  - Header: `My Recent Tickets` with right-aligned `[View all]` link navigating to My Tickets.
  - Displays up to 5 recently updated tickets owned by user with ticket number, summary, category, status badge, and relative date (`2 hours ago`).
- **Right Column (30% width): "Quick Actions" Card**
  - `[+ Create Ticket]` (Primary Zen Green button)
  - `[📋 View My Tickets]` (Secondary outline button)

---

### 3.3 Actions Taken on Ticket Detail (Screen 8.3)

#### 1. Actions Taken Area
- Positioned below ticket description and above comments/notes tabs on `StaffTicketDetail.tsx`.
- Header bar: `Actions Taken ([Count])` with right-aligned `[+ Add Action Taken]` button (Staff/Admin only).
- Table Columns:
  1. **Date/Time:** Formatted local datetime (e.g. `Oct 29, 2026 10:30 AM`).
  2. **Description:** Clear summary of activity performed.
  3. **Result:** Diagnostic outcome or work verification.
  4. **Performed By:** Auto-generated staff name badge.
  5. **Follow-Up:** Badge indicating `None` or `Required` (with hover tooltip or expandable note).
  6. **Attachment Notes:** Filename hints or reference images.
  7. **Actions:** `Edit` button (Staff/Admin).
- **Requester View:** Same table format, but `+ Add Action Taken` and `Edit` action controls are completely hidden; view is purely read-only (`FR-04`).

#### 2. Create / Edit Action Taken Modal Dialog
- Modal header: `Record Action Taken` or `Edit Action Taken`.
- Inputs:
  - **Action Date/Time:** Datetime picker, defaulting to current time.
  - **Action Description:** Textarea, min 10 chars, placeholder `Describe specific diagnostics, repairs, or procedures performed...`
  - **Result:** Textarea, min 3 chars, placeholder `Record observable outcome, test results, or current equipment state...`
  - **Performed by:** Read-only input pill showing current authenticated user name & role.
  - **Follow-Up Required:** Checkbox / Toggle switch.
  - **Follow-up Note:** Conditional textarea, visible and strictly required with red asterisk `*` when toggle is checked.
  - **Attachment Notes:** Textarea, optional, placeholder `Note any relevant diagnostic logs or attached image filenames...`
- Footer buttons: `Cancel` (slate outline) and `Save Action` (Zen Green `#006B3C`).

---

## 4. Responsive Breakpoint Layout Rules

| Screen Size | Breakpoint | Dashboard Layout | Actions Taken Table | Navigation Bar |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop** | `>= 992px` | 5-col (Staff) / 4-col (Requester) KPI grid. Side-by-side Recent Tickets (70%) and Quick Actions (30%). | Full multi-column table with column sorting and spacious cell padding. | Single-line horizontal navbar with role badges and profile dropdown. |
| **Tablet** | `768px – 991px` | 3-col + 2-col wrap for Staff KPIs; 2x2 grid for Requester KPIs. Stacked Recent Tickets above Quick Actions. | Table layout with compact font (`0.82rem`), auto word-break, no horizontal clipping. | Two-tier wrapped navbar with scrollable tab container. |
| **Mobile** | `< 768px` (`375px`) | 1-col or 2-col card stack. Vertical stack for Recent Tickets and Quick Actions. | Responsive card cards or scroll-contained table with sticky headers. Zero window overflow. | Stacked brand bar and horizontally scrollable nav tabs with hidden scrollbar. |

---

## 5. Accessibility Checklist (WCAG 2.1 AA Compliance)

- [ ] **Contrast Ratio:** Text on Zen Green buttons `#006B3C` exceeds `4.5:1` contrast ratio.
- [ ] **Non-Color Status Cues:** All badges combine colored pills with clear text labels (e.g. `Follow-Up Required` text, not just an amber dot).
- [ ] **Keyboard Navigation:** All interactive elements (`[+ Add Action Taken]`, KPI cards, `[↻ Refresh]`) are accessible via `Tab` and triggerable via `Enter`/`Space`.
- [ ] **Accessible Dialogs:** Modals implement focus traps, `aria-labelledby`, and `Escape` key dismissal.
- [ ] **Visible Focus:** Focus rings (`ring-2 ring-emerald-600 ring-offset-2`) are distinctly visible on all inputs and buttons.
