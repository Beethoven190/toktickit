import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffTicketDetail } from "../../src/components/StaffTicketDetail.js";
import * as api from "../../src/api.js";

describe("Lab 4 Issue 4: Ticket Lifecycle, Resolution Gate & Concurrency Guards (AC-06, AC-07, AC-08, BR-08..BR-11)", () => {
  const initialUpdatedAt = "2026-10-29T10:00:00.000Z";

  const baseTicket: api.StaffQueueTicket = {
    id: 201,
    ticketNumber: "TKT-2026-000201",
    summary: "Switch Port flapping in Data Center B",
    description: "Port 12 is experiencing intermittent link flapping every few minutes.",
    categoryId: 2,
    category: { id: 2, name: "Network" },
    relatedSystemId: 3,
    relatedSystem: { id: 3, name: "Cisco Switch" },
    requesterId: 1,
    requester: { id: 1, name: "Supanut W.", email: "supanut.w@toktickit.local" },
    ownerId: 2,
    owner: { id: 2, name: "John Staff", email: "john.s@toktickit.local" },
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    currentStatus: "IN_PROGRESS",
    resolutionSummary: null,
    createdAt: "2026-10-29T09:00:00.000Z",
    updatedAt: initialUpdatedAt,
    attachments: [],
    publicComments: [],
    internalNotes: [],
    actions: [],
  };

  const mockAssignees: api.StaffAssignee[] = [
    { id: 2, name: "John Staff", email: "john.s@toktickit.local", role: "STAFF" },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getStaffAssignees").mockResolvedValue([...mockAssignees]);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("renders permitted transition options conforming to BR-10 (AC-07)", async () => {
    vi.spyOn(api, "getStaffTicketDetail").mockResolvedValue({
      ...baseTicket,
      currentStatus: "IN_PROGRESS",
    });

    render(<StaffTicketDetail ticketId={201} onBack={vi.fn()} />);

    // Wait for ticket to load
    expect(await screen.findByText("TKT-2026-000201")).toBeInTheDocument();

    const statusSelect = (await screen.findByTestId("status-transition-select")) as HTMLSelectElement;
    const options = Array.from(statusSelect.options).map((opt) => opt.value);

    // Current status + permitted: WAITING_FOR_REQUESTER, RESOLVED, CANCELLED
    expect(options).toContain("IN_PROGRESS");
    expect(options).toContain("WAITING_FOR_REQUESTER");
    expect(options).toContain("RESOLVED");
    expect(options).toContain("CANCELLED");
    // Illegal transitions MUST NOT be present
    expect(options).not.toContain("NEW");
    expect(options).not.toContain("CLOSED");
  });

  it("Resolution Gate: enforces >= 5 characters in resolution summary when transitioning to RESOLVED (BR-09, AC-06)", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getStaffTicketDetail").mockResolvedValue({
      ...baseTicket,
      currentStatus: "IN_PROGRESS",
    });

    const updateStatusSpy = vi.spyOn(api, "updateStaffTicketStatus");

    render(<StaffTicketDetail ticketId={201} onBack={vi.fn()} />);
    expect(await screen.findByText("TKT-2026-000201")).toBeInTheDocument();

    // Select RESOLVED
    const statusSelect = await screen.findByTestId("status-transition-select");
    await user.selectOptions(statusSelect, "RESOLVED");

    // The resolution summary input appears
    const summaryInput = await screen.findByTestId("resolution-summary-input");
    expect(summaryInput).toBeInTheDocument();

    // Try updating without entering summary
    const applyBtn = screen.getByTestId("apply-status-button");
    await user.click(applyBtn);

    // Validation error banner appears
    expect(await screen.findByText(/resolution summary of at least 5 characters is required/i)).toBeInTheDocument();
    expect(updateStatusSpy).not.toHaveBeenCalled();

    // Type short summary (< 5 chars)
    await user.type(summaryInput, "Fix");
    await user.click(applyBtn);
    expect(await screen.findByText(/resolution summary of at least 5 characters is required/i)).toBeInTheDocument();
    expect(updateStatusSpy).not.toHaveBeenCalled();
  });

  it("Resolution Gate: successfully updates status to RESOLVED with valid summary (AC-06)", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getStaffTicketDetail").mockResolvedValue({
      ...baseTicket,
      currentStatus: "IN_PROGRESS",
    });

    const validSummary = "Replaced fiber transceiver and verified 0 CRC errors.";
    const updatedTicket: api.StaffQueueTicket = {
      ...baseTicket,
      currentStatus: "RESOLVED",
      resolutionSummary: validSummary,
      updatedAt: "2026-10-29T10:15:00.000Z",
    };

    const updateStatusSpy = vi.spyOn(api, "updateStaffTicketStatus").mockResolvedValue(updatedTicket);

    render(<StaffTicketDetail ticketId={201} onBack={vi.fn()} />);
    expect(await screen.findByText("TKT-2026-000201")).toBeInTheDocument();

    const statusSelect = await screen.findByTestId("status-transition-select");
    await user.selectOptions(statusSelect, "RESOLVED");

    const summaryInput = await screen.findByTestId("resolution-summary-input");
    await user.type(summaryInput, validSummary);

    const applyBtn = screen.getByTestId("apply-status-button");
    await user.click(applyBtn);

    await waitFor(() => {
      expect(updateStatusSpy).toHaveBeenCalledWith(201, "RESOLVED", validSummary);
    });

    expect(await screen.findByText(/Status updated to Resolved/i)).toBeInTheDocument();
  });

  it("Optimistic Concurrency & Error Handling: displays error message when status update fails (BR-11, AC-08)", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getStaffTicketDetail").mockResolvedValue({
      ...baseTicket,
      currentStatus: "IN_PROGRESS",
    });

    // Mock Conflict error from API
    vi.spyOn(api, "updateStaffTicketStatus").mockRejectedValue(
      new Error("The ticket was modified by another user. Please refresh and try again.")
    );

    render(<StaffTicketDetail ticketId={201} onBack={vi.fn()} />);
    expect(await screen.findByText("TKT-2026-000201")).toBeInTheDocument();

    const statusSelect = await screen.findByTestId("status-transition-select");
    await user.selectOptions(statusSelect, "WAITING_FOR_REQUESTER");

    const applyBtn = screen.getByTestId("apply-status-button");
    await user.click(applyBtn);

    // Expect error message to be displayed
    expect(await screen.findByText(/ticket was modified by another user/i)).toBeInTheDocument();
  });

  it("API Layer: updateStaffTicketStatus passes expectedUpdatedAt when provided for concurrency protection (AC-08)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 201, currentStatus: "IN_PROGRESS" }),
    } as Response);

    await api.updateStaffTicketStatus(201, "IN_PROGRESS", undefined, initialUpdatedAt);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/staff/tickets/201/status"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          status: "IN_PROGRESS",
          resolutionSummary: undefined,
          expectedUpdatedAt: initialUpdatedAt,
        }),
      })
    );
  });

  it("API Layer: resolveAdvisoryApi calls /api/tickets/:id/resolve-advisory (FR-09, BR-08)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: "Advisory resolution recorded.",
        ticketId: 201,
        advisoryStatus: "APPEARS_RESOLVED",
      }),
    } as Response);

    const res = await api.resolveAdvisoryApi(201);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/tickets/201/resolve-advisory"),
      expect.objectContaining({
        method: "POST",
      })
    );
    expect(res.advisoryStatus).toBe("APPEARS_RESOLVED");
  });
});
