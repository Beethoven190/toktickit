# Lab 2 Zen Green UI Specification

## 1. Design Language & Color Tokens
The UI adopts the **Zen Green Theme**, offering a calm, professional, and accessible IT service desk aesthetic.

| Token Name | Hex Code | Purpose / Intended Use |
|---|---|---|
| **Primary Green** | `#006B3C` | App header, primary action buttons, active badges, and brand identity |
| **Secondary Green** | `#0B7A46` | Secondary accents, active tabs, focus outlines, and hover states |
| **Pale Green** | `#EAF6EF` | Selected rows, subtle section cards, success alerts, and badge backgrounds |
| **Page Background** | `#F5F7F6` | Main background color providing quiet near-white contrast |
| **Surface / Card** | `#FFFFFF` | Form surfaces, list items, and modal cards with subtle border `#E2E8E5` |
| **Text Primary** | `#1C2826` | Dark charcoal-green for body copy and headings (WCAG AAA compliant) |
| **Text Muted** | `#5A6B65` | Muted captions, help text, and timestamps |
| **Border Neutral** | `#D2DDD7` | Input field borders and divider lines |
| **Status / Error** | `#B3261E` | Validation error messages, danger buttons, and high priority badges |
| **Status / Warning**| `#B26A00` | Medium priority badges and pending status callouts |
| **Status / Info**   | `#006874` | Info notices and new ticket badges |

---

## 2. Typography & Spacing
- **Font Family:** System UI stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`)
- **Scale:**
  - `h1` (App title): `24px` (`1.5rem`), Semi-bold (600)
  - `h2` (Section header): `20px` (`1.25rem`), Semi-bold (600)
  - `h3` (Card header): `16px` (`1rem`), Semi-bold (600)
  - Body: `14px` (`0.875rem`), Regular (400), Line height `1.5`
  - Small / Caption: `12px` (`0.75rem`), Regular (400)
- **Spacing Grid:** 4px base (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`)

---

## 3. Form Controls & Field States
- **Labels:** Positioned strictly above controls with `font-weight: 500`.
- **Required Fields:** Marked with a red asterisk (`<span class="text-danger">*</span>`).
- **Input Dimensions:** Uniform height of `38px` (`padding: 6px 12px`).
- **Multiline Description:** Minimum height `120px`, vertically resizable.
- **States:**
  - *Default:* White background `#FFFFFF`, border `#D2DDD7`.
  - *Focus:* Border `#0B7A46`, glow outline `box-shadow: 0 0 0 3px rgba(11, 122, 70, 0.2)`.
  - *Invalid:* Border `#B3261E`. Validation message appears immediately below in `#B3261E` font size `12px`.
  - *Disabled / Read-only:* Background `#F0F4F2`, text `#5A6B65`, cursor `not-allowed`.

---

## 4. Button Hierarchy
1. **Primary Action:** Solid Primary Green (`background: #006B3C`, text `#FFFFFF`). Hover: `#00522E`.
2. **Secondary Action:** Outline Neutral (`background: transparent`, border `#D2DDD7`, text `#1C2826`).
3. **Destructive Action:** Danger Red (`background: #B3261E` or outline `#B3261E`). Used for soft-removing attachments.
4. **Busy State:** Displays animated loading spinner, text updates to `"Submitting..."` / `"Loading..."`, button is disabled.

---

## 5. Screen Layouts & Workflows

### 5.1 Development Requester Selection Screen
- Centered card modal with TokTickIT branding.
- Clear explanatory banner: *"Development Requester Selection — Temporary testing context for Lab 2"*.
- Dropdown showing active Requesters loaded from PostgreSQL.
- Continue button activating user context.

### 5.2 Application Shell & Navigation
- Top navigation bar in `#006B3C` with TokTickIT logo.
- Navigation links: `My Tickets`, `Create Ticket`.
- User Profile chip on top-right displaying active Requester name with a **"Change Requester"** action button.

### 5.3 Create Ticket Screen
- System-generated read-only info (Ticket Date, Requester Name).
- Form inputs: Category (select), Related System (select), Requested Priority (radio/select: Low, Medium, High).
- Summary (text input with character counter) and Description (textarea).
- Attachment dropzone supporting multi-file selection (JPG, PNG, WEBP, PDF <= 5MB, max 5 files).
- Primary Submit button and Secondary Cancel button.

### 5.4 My Tickets Screen
- Search bar (by ticket number or summary).
- Filter controls: Category, Priority, Status.
- "Clear Filters" button.
- Desktop Table View: Columns for Ticket No, Created Date, Summary, Category, Priority, Status, Last Updated.
- Mobile Card View: Stacked cards with priority and status chips.
- Empty State: Illustrated empty desk graphic with `"No tickets submitted yet. Click [Create Ticket] to get started."`
- No-Results State: `"No tickets match your search filters."` with a quick clear action.
- Accessible pagination controls.

### 5.5 Requester Ticket Detail Screen
- Header with Ticket Number and current status badge.
- Read-only details grid: Requester, Created Date, Category, Related System, Priority.
- Summary and full Description cards.
- **Attachments Section:**
  - Active Attachments: File card showing icon, name, size, upload date, **Download** button, and **Remove** button.
  - Soft-Removed Attachments: Muted card showing file name, removed timestamp, reason text, with download strictly disabled.
  - Soft-Removal Modal: Requires confirmation and reason input (min 5 chars) before proceeding.
  - Add Attachment button allowing further uploads up to the limit of 5 active files.

---

## 6. Priority & Status Badges

| Type | Value | Badge Style |
|---|---|---|
| **Priority** | High | Red badge (`bg-danger text-white`) |
| **Priority** | Medium | Amber badge (`bg-warning text-dark`) |
| **Priority** | Low | Muted green badge (`bg-light text-success border border-success`) |
| **Status** | New | Primary Green badge (`bg-success text-white`) |
| **Status** | Open / In Progress | Blue / Cyan badge |
| **Status** | Resolved / Closed | Gray / Soft Green badge |

---

## 7. Responsive Breakpoint Rules
- **Desktop (>= 992px):** Container max-width `1140px`, multi-column forms, full data table.
- **Tablet (768px - 991px):** Two-column form layout, table with horizontal scrollable wrapper.
- **Mobile (< 768px):** Single-column stacked fields, table replaced by individual card elements, full-width buttons.
