# Lab 3 UI Specification: Zen Green Design System & Component Guidelines

## 1. Design Tokens & Zen Green Palette

The application strictly enforces the Zen Green visual language established in Lab 2 and extended for Lab 3's multi-role interfaces.

| Token Name | Hex Value | Usage |
| :--- | :--- | :--- |
| **Primary Green** | `#006B3C` (or `#005A36`) | App header, primary buttons (`Sign In`, `Save User`, `Submit Ticket`), active navigation tabs. |
| **Secondary Green** | `#0B7A46` (or `#008751`) | Hover states on primary buttons, link accents, focus outlines. |
| **Pale Green** | `#EAF6EF` | Selected rows, password requirement checklist container, success message callouts. |
| **Page Background** | `#F5F7F6` (or `slate-50`) | Application body background, quiet near-white contrast. |
| **Surface / Cards** | `#FFFFFF` | Form cards, queue tables, modal panels with subtle border (`slate-200`) and soft shadows. |
| **Primary Text** | `#1E293B` | Dark charcoal-green typography for comfortable readability. |
| **Subtle Text** | `#64748B` | Secondary descriptions, timestamps, breadcrumb links. |
| **Error / Danger** | `#DC2626` | Validation error messages, login failure alerts, deactivation buttons. |
| **Warning / Amber** | `#D97706` | Inactive status badges, pending state badges. |

---

## 2. Badge & Label Conventions

### A. Role Badges
- **Administrator:** `bg-purple-100 text-purple-800 border-purple-200`
- **IT Staff:** `bg-emerald-100 text-emerald-800 border-emerald-200`
- **Requester:** `bg-blue-100 text-blue-800 border-blue-200`

### B. Ticket Status Badges
- **NEW:** `bg-emerald-50 text-emerald-700 border-emerald-200`
- **OPEN:** `bg-blue-50 text-blue-700 border-blue-200`
- **IN PROGRESS:** `bg-emerald-100 text-emerald-800 border-emerald-300`
- **WAITING FOR REQUESTER / PENDING:** `bg-amber-100 text-amber-800 border-amber-300`
- **RESOLVED:** `bg-teal-100 text-teal-800 border-teal-300`
- **CLOSED:** `bg-slate-200 text-slate-700 border-slate-300`
- **CANCELLED:** `bg-rose-100 text-rose-800 border-rose-200`

### C. Priority Badges (Requested Priority & IT Priority)
- **LOW:** `bg-slate-100 text-slate-700 border-slate-200`
- **MEDIUM:** `bg-amber-100 text-amber-800 border-amber-200`
- **HIGH:** `bg-rose-100 text-rose-800 border-rose-200`

---

## 3. Screen Specifications (Matching Provided Teacher Mockups)

### Screen 1: Login & Mandatory Password Change (Image 1)

#### 1.1 Sign in Screen (Top)
- **Container:** Centered card, max-width `440px`, background white with subtle shadow and border.
- **Brand Identity:** Green top banner with TokTickIT clock icon and title.
- **Header:** `Sign in to your account` (h3, font-bold).
- **Email Field:** Label `Email address`, input type `email`, placeholder `janderson@toktickit.com`.
- **Password Field:** Label `Password`, input type `password` with toggleable eye icon (`👁️`).
- **Validation Error Box:** Displayed when credentials fail:
  - Background: Pale red (`#FEF2F2`), border red (`#FCA5A5`), icon `(!)`, text `Invalid email or password. Please try again.`
- **Submit Button:** `Sign In` (width: 100%, background `#006B3C`, hover `#0B7A46`, text white, rounded-lg).
- **Footer Link:** `Forgot your password?` (centered, text-muted small).

#### 1.2 Change Your Password Screen (Bottom)
- **Container:** Centered card or modal overlay.
- **Header:** `Change Your Password` with subtitle `You must change your password to continue.`
- **Fields:**
  - `Current (temporary) password` with eye toggle.
  - `New password` with eye toggle.
  - `Confirm new password` with eye toggle.
- **Rules Checklist Card:** Background `#EAF6EF`, border `#A7F3D0`, padding `12px`:
  - `Password must:`
  - `✓ Be at least 8 characters`
  - `✓ Include upper and lower case letters`
  - `✓ Include a number and a special character`
- **Action Button:** `Continue` (primary green button, disabled until rules are satisfied).

---

### Screen 2: IT Staff Ticket Queue ("My Queue") (Image 2)

#### 2.1 Navigation Bar
- **Logo:** `⏱️ TokTickIT` on left.
- **Role Tabs:**
  - `📄 My Queue` (Active green tab with white text and underline/pill highlight).
  - `➕ Create Ticket` (Secondary tab).
- **Right Profile Menu:**
  - `👤 Profile ˅` dropdown with active user's name, role pill, and `Logout` action.

#### 2.2 Queue Table & Controls
- **Search Bar:** Full-width or inline `🔍 Search by ticket number or summary...` with `Filters` button.
- **Subtitle:** `Showing 1 to 10 of 87 tickets` (small muted font).
- **Table Structure:**
  - `Ticket No. ⇅` — e.g. `TKT-2025-001234` (font-mono, font-bold, emerald-900).
  - `Created Date ⇅` — e.g. `May 12, 09:14 AM`.
  - `Summary` — Truncated single-line summary with tooltip.
  - `Category ⇅` — e.g. `Hardware`, `Network`, `Software`.
  - `Req. Priority` — Badge: `Low`, `Medium`, `High`.
  - `IT Priority` — Badge: `Low`, `Medium`, `High`.
  - `Status ⇅` — Badge: `In Progress`, `Open`, `Pending`, `Resolved`, `Closed`.
  - `Owner ⇅` — Staff member's name or `Unassigned`.
- **Pagination:** Numeric pagination controls `< Previous  1  2  3  4  5  ...  9  Next >`.
- **Row Interaction:** Clicking any row navigates directly to the IT Staff Ticket Detail.

---

### Screen 3: IT Staff Ticket Detail (Image 3)

#### 3.1 Header & Breadcrumbs
- **Breadcrumbs:** `My Queue > Ticket Detail` (clickable navigation back to queue).
- **Top Right Button:** `← Back to Queue` (outline green button).

#### 3.2 Main Ticket Card Fields
- **Grid Layout:** 3-column top row, 2-column middle rows.
- **Field Groupings:**
  - Row 1: `Ticket No.` (read-only) | `Category` (select/read-only) | `Related System` (read-only).
  - Row 2: `Requester` (read-only) | `Requested Priority` (badge) | `Current Status` (interactive dropdown).
  - Row 3: `Ticket Owner` (dropdown of active IT Staff + Unassigned) | `IT Priority` (dropdown).
  - Row 4: `Summary` (read-only input).
  - Row 5: `Detailed Description` (read-only multiline textarea).
  - Row 6: `Resolution Summary` (input with placeholder `Add resolution summary (visible to requester)...`).

#### 3.3 Collaboration & Attachment Tabs
- **Tab Header:**
  - `💬 Public Comments (N)` (Green active tab indicator).
  - `📝 Internal Notes (N)` (Amber/private indicator; forbidden for Requesters).
  - `📎 Attachments (N)` (List of active & soft-removed attachments from Lab 2).
  - `🛠️ Service Actions (N)` (Disabled/read-only placeholder).
- **Public Comments Thread:**
  - Add comment box: `Add Public Comment` input + `✈️ Post Comment` button.
  - Message cards: Circular initials avatar (e.g. `JA`, `MB`), Author name, Role badge (`Requester`, `IT Support`), Timestamp, Comment text.

---

### Screen 4: Administrator User Management (Image 4)

#### 4.1 Two-Column / Drawer Split View
- **Left Panel (User List - 60% Width on Desktop):**
  - Header: `Users` (h3) + `➕ Create User` (primary green button).
  - Search: `🔍 Search users...` + `Filters` button.
  - Table: `Name ⇅`, `Role ⇅` (`IT Staff`, `Requester`, `Administrator`), `Status ⇅` (`Active` green, `Inactive` red).
  - Pagination: `< Prev  1  2  3  ...  6  Next >`.
  - Row click opens that user's edit view in the right panel.
- **Right Panel (User Drawer - 40% Width on Desktop):**
  - Header: `Create New User` or `Edit User` with close icon (`✕`).
  - Fields:
    - `Full Name *` (text input).
    - `Email Address *` (email input).
    - `Role *` (dropdown: `IT Staff`, `Requester`, `Administrator`).
    - `Active` toggle switch (green toggle `Yes` / `No`).
    - `Initial Password` card: Checkbox `☑ User will set password on first login` / input for setting new initial password.
  - Action Buttons:
    - `Save User` (primary green button).
    - `Deactivate User` (red outline button; hidden on self or last admin).
    - `Cancel` (neutral link button).

---

## 4. Responsive Viewport Specifications

| Viewport | Target Width | Expected Behavior |
| :--- | :--- | :--- |
| **Desktop** | `>= 992px` | Multi-column layouts; full data tables with sort arrows; two-panel view on User Management; horizontal tab navigation. |
| **Tablet** | `768px - 991px` | 2-column form grids; horizontally scrollable tables; stacked drawer on User Management. |
| **Mobile** | `< 768px` | Single-column stacked fields; ticket card format or mobile-optimized tables; hamburger navigation; touch-friendly 44px button targets. |

---

## 5. Visual Inspection Checklist (Part 9 Evidence)
- [ ] Primary Green `#006B3C` applied to app header, primary buttons, and active tabs.
- [ ] No clipping or text overflow on badge pills and ticket numbers.
- [ ] Eye icon on password fields toggles masking cleanly.
- [ ] Status dropdown on Ticket Detail restricts options to valid state transitions.
- [ ] Public Comments and Internal Notes tabs clearly visually distinguished (Internal Notes marked confidential).
- [ ] Admin panel prevents deactivation button from rendering on the currently logged-in user.
- [ ] Keyboard focus outlines visible across all interactive form elements.
