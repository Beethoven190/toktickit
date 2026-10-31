import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffDashboard from "../../src/components/StaffDashboard.js";
import * as api from "../../src/api.js";

const mockStaffDashboardData: api.StaffDashboardData = {
  user: {
    id: 2,
    name: "Alex Rivera",
    role: "STAFF",
  },
  metrics: {
    new: { count: 14, delta: "+2 from yesterday" },
    open: { count: 23, delta: "+5 from yesterday" },
    inProgress: { count: 18, delta: "-1 from yesterday" },
    waitingForRequester: { count: 7, delta: "0 from yesterday" },
    myAssigned: { count: 16, delta: "+3 from yesterday" },
  },
  recentTickets: [
    {
      id: 101,
      ticketNumber: "TKT-2026-000101",
      summary: "Laptop battery drains quickly after sleep mode",
      category: "Hardware and Equipment",
      status: "OPEN",
      itPriority: "HIGH",
      ownerName: "Alex Rivera",
      updatedAt: "2026-10-31T09:15:00.000Z",
    },
    {
      id: 98,
      ticketNumber: "TKT-2026-000098",
      summary: "Printer keeps showing offline on 3rd floor",
      category: "Hardware and Equipment",
      status: "IN_PROGRESS",
      itPriority: "MEDIUM",
      ownerName: "Sarah Chen",
      updatedAt: "2026-10-31T08:45:00.000Z",
    },
  ],
};

describe("Lab 4 Issue 5: IT Staff Dashboard Component (Screen 8.1, UI-DASH-01, UI-DASH-02, AC-04, AC-09, FR-11, FR-12)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("UI-DASH-01: renders welcome banner, 5 KPI cards with counts and deltas (AC-04)", async () => {
    vi.spyOn(api, "getStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    render(
      <StaffDashboard
        onNavigateToQueue={vi.fn()}
        onNavigateToCreate={vi.fn()}
        onSelectTicket={vi.fn()}
      />
    );

    // Welcome banner
    expect(await screen.findByText(/Welcome back, Alex!/i)).toBeInTheDocument();
    expect(screen.getByText(/Here's what's happening with your queue today/i)).toBeInTheDocument();

    // 5 KPI Cards counts
    expect(screen.getByTestId("kpi-count-new")).toHaveTextContent("14");
    expect(screen.getByTestId("kpi-count-open")).toHaveTextContent("23");
    expect(screen.getByTestId("kpi-count-inprogress")).toHaveTextContent("18");
    expect(screen.getByTestId("kpi-count-waiting")).toHaveTextContent("7");
    expect(screen.getByTestId("kpi-count-assigned")).toHaveTextContent("16");

    // Delta tags
    expect(screen.getByText("+2 from yesterday")).toBeInTheDocument();
    expect(screen.getByText("+5 from yesterday")).toBeInTheDocument();
    expect(screen.getByText("-1 from yesterday")).toBeInTheDocument();
    expect(screen.getByText("0 from yesterday")).toBeInTheDocument();
    expect(screen.getByText("+3 from yesterday")).toBeInTheDocument();

    // Recent tickets
    expect(screen.getByText("TKT-2026-000101")).toBeInTheDocument();
    expect(screen.getByText("Laptop battery drains quickly after sleep mode")).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-000098")).toBeInTheDocument();
  });

  it("UI-DASH-02: clicking 'My Assigned' KPI card navigates to queue filtered by owner=me (AC-09, FR-15)", async () => {
    const user = userEvent.setup();
    const handleNavigateToQueue = vi.fn();
    vi.spyOn(api, "getStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    render(
      <StaffDashboard
        onNavigateToQueue={handleNavigateToQueue}
        onNavigateToCreate={vi.fn()}
        onSelectTicket={vi.fn()}
      />
    );

    const assignedCard = await screen.findByTestId("kpi-card-assigned");
    await user.click(assignedCard);

    expect(handleNavigateToQueue).toHaveBeenCalledWith({ owner: "me" });
  });

  it("clicking status KPI cards (New, Open, In Progress, Waiting) navigates to queue with pre-applied status (FR-15)", async () => {
    const user = userEvent.setup();
    const handleNavigateToQueue = vi.fn();
    vi.spyOn(api, "getStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    render(
      <StaffDashboard
        onNavigateToQueue={handleNavigateToQueue}
        onNavigateToCreate={vi.fn()}
        onSelectTicket={vi.fn()}
      />
    );

    const newCard = await screen.findByTestId("kpi-card-new");
    await user.click(newCard);
    expect(handleNavigateToQueue).toHaveBeenCalledWith({ status: "NEW" });

    const openCard = screen.getByTestId("kpi-card-open");
    await user.click(openCard);
    expect(handleNavigateToQueue).toHaveBeenCalledWith({ status: "OPEN" });

    const inProgressCard = screen.getByTestId("kpi-card-inprogress");
    await user.click(inProgressCard);
    expect(handleNavigateToQueue).toHaveBeenCalledWith({ status: "IN_PROGRESS" });

    const waitingCard = screen.getByTestId("kpi-card-waiting");
    await user.click(waitingCard);
    expect(handleNavigateToQueue).toHaveBeenCalledWith({ status: "WAITING_FOR_REQUESTER" });
  });

  it("triggers refresh and re-fetches authoritative metrics when Refresh button is clicked (FR-11)", async () => {
    const user = userEvent.setup();
    const dashboardSpy = vi.spyOn(api, "getStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    render(
      <StaffDashboard
        onNavigateToQueue={vi.fn()}
        onNavigateToCreate={vi.fn()}
        onSelectTicket={vi.fn()}
      />
    );

    const refreshBtn = await screen.findByTestId("refresh-dashboard-btn");
    await user.click(refreshBtn);

    expect(dashboardSpy).toHaveBeenCalledTimes(2);
  });

  it("clicking recent ticket row calls onSelectTicket with ticket ID", async () => {
    const user = userEvent.setup();
    const handleSelectTicket = vi.fn();
    vi.spyOn(api, "getStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    render(
      <StaffDashboard
        onNavigateToQueue={vi.fn()}
        onNavigateToCreate={vi.fn()}
        onSelectTicket={handleSelectTicket}
      />
    );

    const row = await screen.findByTestId("recent-ticket-row-101");
    await user.click(row);

    expect(handleSelectTicket).toHaveBeenCalledWith(101);
  });

  it("renders empty state guidance when zero recent tickets exist (BR-16)", async () => {
    vi.spyOn(api, "getStaffDashboard").mockResolvedValue({
      ...mockStaffDashboardData,
      recentTickets: [],
    });

    render(
      <StaffDashboard
        onNavigateToQueue={vi.fn()}
        onNavigateToCreate={vi.fn()}
        onSelectTicket={vi.fn()}
      />
    );

    expect(await screen.findByTestId("empty-recent-tickets")).toBeInTheDocument();
    expect(screen.getByText(/Your queue is clear!/i)).toBeInTheDocument();
  });

  it("triggers Quick Actions handlers (Create Ticket, Search, Queue) (FR-12)", async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn();
    const handleQueue = vi.fn();
    vi.spyOn(api, "getStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    render(
      <StaffDashboard
        onNavigateToQueue={handleQueue}
        onNavigateToCreate={handleCreate}
        onSelectTicket={vi.fn()}
      />
    );

    const createBtn = await screen.findByTestId("quick-action-create");
    await user.click(createBtn);
    expect(handleCreate).toHaveBeenCalledTimes(1);

    const searchBtn = screen.getByTestId("quick-action-search");
    await user.click(searchBtn);
    expect(handleQueue).toHaveBeenCalledWith({ search: "" });

    const queueBtn = screen.getByTestId("quick-action-queue");
    await user.click(queueBtn);
    expect(handleQueue).toHaveBeenCalledTimes(2);
  });
});

