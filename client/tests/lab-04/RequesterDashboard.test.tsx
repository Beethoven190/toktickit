import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RequesterDashboard from "../../src/components/RequesterDashboard.js";
import * as api from "../../src/api.js";

const mockRequesterDashboardData: api.RequesterDashboardData = {
  user: {
    id: 1,
    name: "Supanut Watthanasimakorn",
    role: "REQUESTER",
  },
  metrics: {
    myOpen: { count: 3, label: "My Open Tickets" },
    inProgress: { count: 2, label: "In Progress" },
    resolved: { count: 5, label: "Resolved" },
    closed: { count: 12, label: "Closed" },
  },
  recentTickets: [
    {
      id: 201,
      ticketNumber: "TKT-2026-000201",
      summary: "Cannot access internal GitLab server",
      category: "Network and Access",
      status: "OPEN",
      requestedPriority: "HIGH",
      updatedAt: "2026-10-31T09:30:00.000Z",
    },
    {
      id: 195,
      ticketNumber: "TKT-2026-000195",
      summary: "Docker desktop license renewal request",
      category: "Software and Applications",
      status: "RESOLVED",
      requestedPriority: "MEDIUM",
      updatedAt: "2026-10-30T16:00:00.000Z",
    },
  ],
};

describe("Lab 4 Issue 5: Requester Dashboard Component (Screen 8.2, UI-DASH-03, AC-05, FR-13, FR-14)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("UI-DASH-03: renders welcome banner, 4 KPI cards and recent tickets (AC-05, FR-13)", async () => {
    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(mockRequesterDashboardData);

    render(
      <RequesterDashboard
        onNavigateToMyTickets={vi.fn()}
        onNavigateToCreate={vi.fn()}
        onSelectTicket={vi.fn()}
      />
    );

    // Welcome banner
    expect(await screen.findByText(/Welcome, Supanut!/i)).toBeInTheDocument();
    expect(screen.getByText(/Here's the latest on your requests/i)).toBeInTheDocument();

    // 4 KPI Cards
    expect(screen.getByTestId("kpi-count-my-open")).toHaveTextContent("3");
    expect(screen.getByTestId("kpi-count-in-progress")).toHaveTextContent("2");
    expect(screen.getByTestId("kpi-count-resolved")).toHaveTextContent("5");
    expect(screen.getByTestId("kpi-count-closed")).toHaveTextContent("12");

    // Recent tickets
    expect(screen.getByText("TKT-2026-000201")).toBeInTheDocument();
    expect(screen.getByText("Cannot access internal GitLab server")).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-000195")).toBeInTheDocument();
  });

  it("clicking KPI cards triggers navigation to My Tickets with corresponding status filter (FR-15)", async () => {
    const user = userEvent.setup();
    const handleNavigate = vi.fn();
    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(mockRequesterDashboardData);

    render(
      <RequesterDashboard
        onNavigateToMyTickets={handleNavigate}
        onNavigateToCreate={vi.fn()}
        onSelectTicket={vi.fn()}
      />
    );

    const openCard = await screen.findByTestId("kpi-card-my-open");
    await user.click(openCard);
    expect(handleNavigate).toHaveBeenCalledWith("OPEN");

    const inProgressCard = screen.getByTestId("kpi-card-in-progress");
    await user.click(inProgressCard);
    expect(handleNavigate).toHaveBeenCalledWith("IN_PROGRESS");

    const resolvedCard = screen.getByTestId("kpi-card-resolved");
    await user.click(resolvedCard);
    expect(handleNavigate).toHaveBeenCalledWith("RESOLVED");

    const closedCard = screen.getByTestId("kpi-card-closed");
    await user.click(closedCard);
    expect(handleNavigate).toHaveBeenCalledWith("CLOSED");
  });

  it("clicking recent ticket row calls onSelectTicket with ticket ID", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(mockRequesterDashboardData);

    render(
      <RequesterDashboard
        onNavigateToMyTickets={vi.fn()}
        onNavigateToCreate={vi.fn()}
        onSelectTicket={handleSelect}
      />
    );

    const row = await screen.findByTestId("recent-ticket-row-201");
    await user.click(row);

    expect(handleSelect).toHaveBeenCalledWith(201);
  });

  it("renders empty state guidance when zero recent tickets exist (BR-16)", async () => {
    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue({
      ...mockRequesterDashboardData,
      recentTickets: [],
    });

    render(
      <RequesterDashboard
        onNavigateToMyTickets={vi.fn()}
        onNavigateToCreate={vi.fn()}
        onSelectTicket={vi.fn()}
      />
    );

    expect(await screen.findByTestId("empty-recent-tickets")).toBeInTheDocument();
    expect(screen.getByText(/No recent requests found/i)).toBeInTheDocument();
  });

  it("triggers Quick Actions handlers (Create Ticket, View My Tickets) (FR-14)", async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn();
    const handleMyTickets = vi.fn();
    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(mockRequesterDashboardData);

    render(
      <RequesterDashboard
        onNavigateToMyTickets={handleMyTickets}
        onNavigateToCreate={handleCreate}
        onSelectTicket={vi.fn()}
      />
    );

    const createBtn = await screen.findByTestId("quick-action-create");
    await user.click(createBtn);
    expect(handleCreate).toHaveBeenCalledTimes(1);

    const myTicketsBtn = screen.getByTestId("quick-action-my-tickets");
    await user.click(myTicketsBtn);
    expect(handleMyTickets).toHaveBeenCalledTimes(1);
  });
});

