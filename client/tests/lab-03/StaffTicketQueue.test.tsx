import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffTicketQueue from "../../src/components/StaffTicketQueue.js";
import * as api from "../../src/api.js";

const mockTickets: api.StaffQueueTicket[] = [
  {
    id: 1,
    ticketNumber: "TKT-2026-000001",
    requesterId: 10,
    categoryId: 1,
    relatedSystemId: 1,
    summary: "Laptop keyboard keys sticking (Spacebar and Enter)",
    description: "Keys unresponsive intermittently.",
    requestedPriority: "MEDIUM",
    itPriority: "HIGH",
    currentStatus: "IN_PROGRESS",
    ownerId: 20,
    createdAt: "2026-09-03T10:00:00.000Z",
    updatedAt: "2026-09-03T10:00:00.000Z",
    category: { id: 1, name: "Hardware" },
    relatedSystem: { id: 1, name: "Corporate Laptop" },
    requester: { id: 10, name: "Jennifer Anderson", email: "jennifer@toktickit.local" },
    owner: { id: 20, name: "John Staff", email: "john.s@toktickit.local" },
  },
  {
    id: 2,
    ticketNumber: "TKT-2026-000002",
    requesterId: 11,
    categoryId: 2,
    relatedSystemId: 2,
    summary: "Cannot authenticate with Campus Wi-Fi",
    description: "Wi-Fi connection drops in Building 3.",
    requestedPriority: "LOW",
    itPriority: "LOW",
    currentStatus: "NEW",
    ownerId: null,
    createdAt: "2026-09-03T11:00:00.000Z",
    updatedAt: "2026-09-03T11:00:00.000Z",
    category: { id: 2, name: "Network" },
    relatedSystem: { id: 2, name: "Campus Wi-Fi" },
    requester: { id: 11, name: "David Ice", email: "david.i@toktickit.local" },
    owner: null,
  },
];

const mockCategories: api.Category[] = [
  { id: 1, name: "Hardware" },
  { id: 2, name: "Network" },
];

describe("Lab 3 StaffTicketQueue Component (AC-07, Teacher Mockup 2)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getCategories").mockResolvedValue(mockCategories);
  });

  it("renders queue header, KPI summary counts, and ticket rows with badges (AC-07)", async () => {
    vi.spyOn(api, "getStaffQueue").mockResolvedValueOnce({
      data: mockTickets,
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      summaryCounts: {
        all: 2,
        unassigned: 1,
        myTickets: 1,
        inProgress: 1,
      },
    });

    render(<StaffTicketQueue onSelectTicket={() => {}} />);

    // Header & Subtitle
    expect(await screen.findByRole("heading", { name: /IT Staff Ticket Queue/i })).toBeInTheDocument();
    expect(screen.getByText(/Showing 1 to 2 of 2 tickets/i)).toBeInTheDocument();

    // KPI Filters
    expect(screen.getByRole("button", { name: /^All 2/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Unassigned 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Assigned to Me 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^In Progress 1/i })).toBeInTheDocument();

    // Table row content
    expect(screen.getAllByText("TKT-2026-000001")[0]).toBeInTheDocument();
    expect(screen.getAllByText("TKT-2026-000002")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Laptop keyboard keys sticking/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText("Hardware")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Network")[0]).toBeInTheDocument();

    // Badges & Owners
    expect(screen.getAllByText("John")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Unassigned")[0]).toBeInTheDocument();
  });

  it("filters queue when clicking KPI pills (e.g. Unassigned)", async () => {
    const user = userEvent.setup();
    const getQueueSpy = vi.spyOn(api, "getStaffQueue").mockResolvedValue({
      data: [mockTickets[1]],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      summaryCounts: { all: 2, unassigned: 1, myTickets: 1, inProgress: 1 },
    });

    render(<StaffTicketQueue onSelectTicket={() => {}} />);

    // Wait for initial load
    await screen.findByTestId("ticket-row-2");

    // Click Unassigned KPI filter
    const unassignedBtn = screen.getByRole("button", { name: /^Unassigned 1/i });
    await user.click(unassignedBtn);

    await waitFor(() => {
      expect(getQueueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          quickFilter: "unassigned",
          ownerId: "unassigned",
        })
      );
    });
  });

  it("triggers search filter when typing into search input", async () => {
    const user = userEvent.setup();
    const getQueueSpy = vi.spyOn(api, "getStaffQueue").mockResolvedValue({
      data: [mockTickets[0]],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      summaryCounts: { all: 2, unassigned: 1, myTickets: 1, inProgress: 1 },
    });

    render(<StaffTicketQueue onSelectTicket={() => {}} />);

    const searchInput = await screen.findByTestId("queue-search-input");
    await user.type(searchInput, "keyboard");

    await waitFor(() => {
      expect(getQueueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "keyboard",
        })
      );
    });
  });

  it("toggles sorting when clicking sortable column headers", async () => {
    const user = userEvent.setup();
    const getQueueSpy = vi.spyOn(api, "getStaffQueue").mockResolvedValue({
      data: mockTickets,
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
      summaryCounts: { all: 2, unassigned: 1, myTickets: 1, inProgress: 1 },
    });

    render(<StaffTicketQueue onSelectTicket={() => {}} />);
    await screen.findByTestId("ticket-row-1");

    // Click Ticket No. header
    const ticketNoHeader = screen.getByText(/Ticket No\./i);
    await user.click(ticketNoHeader);

    await waitFor(() => {
      expect(getQueueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: "ticketNumber",
        })
      );
    });
  });

  it("calls onSelectTicket when a ticket row is clicked", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    vi.spyOn(api, "getStaffQueue").mockResolvedValueOnce({
      data: mockTickets,
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
      summaryCounts: { all: 2, unassigned: 1, myTickets: 1, inProgress: 1 },
    });

    render(<StaffTicketQueue onSelectTicket={handleSelect} />);

    const row = await screen.findByTestId("ticket-row-1");
    await user.click(row);

    expect(handleSelect).toHaveBeenCalledWith(mockTickets[0]);
  });

  it("renders empty state when no tickets match criteria", async () => {
    vi.spyOn(api, "getStaffQueue").mockResolvedValueOnce({
      data: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
      summaryCounts: { all: 0, unassigned: 0, myTickets: 0, inProgress: 0 },
    });

    render(<StaffTicketQueue onSelectTicket={() => {}} />);

    expect(await screen.findByText(/No tickets found/i)).toBeInTheDocument();
    expect(screen.getByText(/There are no tickets matching your active filter criteria/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clear Filters/i })).toBeInTheDocument();
  });

  it("renders pagination controls and handles page clicks when multiple pages exist", async () => {
    const user = userEvent.setup();
    const getQueueSpy = vi.spyOn(api, "getStaffQueue").mockResolvedValue({
      data: mockTickets,
      pagination: { total: 25, page: 1, limit: 10, totalPages: 3 },
      summaryCounts: { all: 25, unassigned: 10, myTickets: 5, inProgress: 8 },
    });

    render(<StaffTicketQueue onSelectTicket={() => {}} />);

    expect(await screen.findByText(/Page 1 of 3 \(25 total tickets\)/i)).toBeInTheDocument();

    const page2Button = screen.getByRole("button", { name: "2" });
    await user.click(page2Button);

    await waitFor(() => {
      expect(getQueueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });
});
