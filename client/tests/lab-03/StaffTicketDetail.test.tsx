import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffTicketDetail } from "../../src/components/StaffTicketDetail.js";
import * as api from "../../src/api.js";

describe("StaffTicketDetail Component (Issue 4, AC-09, AC-10, AC-11, AC-12)", () => {
  const mockTicket: api.StaffQueueTicket = {
    id: 101,
    ticketNumber: "TKT-2025-000101",
    summary: "VPN Connection drops frequently",
    description: "User experiences disconnections every 15 minutes while working remotely.",
    categoryId: 2,
    category: { id: 2, name: "Network" },
    relatedSystemId: 3,
    relatedSystem: { id: 3, name: "Cisco AnyConnect" },
    requesterId: 1,
    requester: { id: 1, name: "Supanut W.", email: "supanut.w@toktickit.local" },
    ownerId: null,
    owner: null,
    requestedPriority: "MEDIUM",
    itPriority: "MEDIUM",
    currentStatus: "NEW",
    resolutionSummary: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: [
      {
        id: 1,
        ticketId: 101,
        originalName: "vpn-logs.txt",
        storedName: "vpn-logs-123.txt",
        mimeType: "text/plain",
        size: 2048,
        isRemoved: false,
        removalReason: null,
        createdAt: new Date().toISOString(),
      },
    ],
    publicComments: [],
    internalNotes: [],
  };

  const mockAssignees: api.StaffAssignee[] = [
    { id: 2, name: "John Staff", email: "john.s@toktickit.local", role: "STAFF" },
    { id: 3, name: "Sarah Staff", email: "sarah.c@toktickit.local", role: "STAFF" },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getStaffTicketDetail").mockResolvedValue({ ...mockTicket });
    vi.spyOn(api, "getStaffAssignees").mockResolvedValue([...mockAssignees]);
  });

  it("renders ticket details correctly (ticket number, summary, category, requester)", async () => {
    render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

    expect(await screen.findByText("TKT-2025-000101")).toBeInTheDocument();
    expect(screen.getByDisplayValue("VPN Connection drops frequently")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Network")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Cisco AnyConnect")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Supanut W. (supanut.w@toktickit.local)")).toBeInTheDocument();
  });

  it("claims ticket when Claim button is clicked (AC-09)", async () => {
    const user = userEvent.setup();
    const claimSpy = vi.spyOn(api, "claimStaffTicket").mockResolvedValue({
      ...mockTicket,
      ownerId: 2,
      owner: { id: 2, name: "John Staff", email: "john.s@toktickit.local" },
      currentStatus: "OPEN",
    });

    render(<StaffTicketDetail ticketId={101} currentUserId={2} onBack={vi.fn()} />);

    const claimBtn = await screen.findByTestId("claim-ticket-button");
    expect(claimBtn).toBeInTheDocument();

    await user.click(claimBtn);

    expect(claimSpy).toHaveBeenCalledWith(101);
    expect(await screen.findByText(/Ticket claimed successfully/i)).toBeInTheDocument();
  });

  it("assigns ticket to another staff member via owner dropdown (AC-09, BR-11)", async () => {
    const user = userEvent.setup();
    const assignSpy = vi.spyOn(api, "assignStaffTicket").mockResolvedValue({
      ...mockTicket,
      ownerId: 3,
      owner: { id: 3, name: "Sarah Staff", email: "sarah.c@toktickit.local" },
    });

    render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

    const ownerSelect = await screen.findByTestId("ticket-owner-select");
    expect(ownerSelect).toBeInTheDocument();

    await user.selectOptions(ownerSelect, "3");

    expect(assignSpy).toHaveBeenCalledWith(101, 3);
    expect(await screen.findByText(/Ticket assigned successfully/i)).toBeInTheDocument();
  });

  it("updates IT Priority independently (AC-10)", async () => {
    const user = userEvent.setup();
    const prioritySpy = vi.spyOn(api, "updateStaffTicketPriority").mockResolvedValue({
      ...mockTicket,
      itPriority: "HIGH",
    });

    render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

    const prioritySelect = await screen.findByTestId("it-priority-select");
    expect(prioritySelect).toBeInTheDocument();

    await user.selectOptions(prioritySelect, "HIGH");

    expect(prioritySpy).toHaveBeenCalledWith(101, "HIGH");
    expect(await screen.findByText(/IT Priority updated to HIGH/i)).toBeInTheDocument();
  });

  it("requires resolution summary when transitioning to RESOLVED (AC-12, BR-10)", async () => {
    const user = userEvent.setup();
    // Start with ticket in OPEN status so RESOLVED is an allowed next state
    vi.spyOn(api, "getStaffTicketDetail").mockResolvedValue({
      ...mockTicket,
      currentStatus: "OPEN",
    });

    render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

    const statusSelect = await screen.findByTestId("status-transition-select");
    await user.selectOptions(statusSelect, "RESOLVED");

    const applyBtn = screen.getByTestId("apply-status-button");
    await user.click(applyBtn);

    // Should show error requiring resolution summary
    expect(
      await screen.findByText(/A resolution summary of at least 5 characters is required/i)
    ).toBeInTheDocument();
  });

  it("successfully transitions to RESOLVED with valid resolution summary (AC-11, AC-12)", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getStaffTicketDetail").mockResolvedValue({
      ...mockTicket,
      currentStatus: "OPEN",
    });

    const statusSpy = vi.spyOn(api, "updateStaffTicketStatus").mockResolvedValue({
      ...mockTicket,
      currentStatus: "RESOLVED",
      resolutionSummary: "Updated VPN configuration on gateway and verified user connectivity.",
    });

    render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

    const statusSelect = await screen.findByTestId("status-transition-select");
    await user.selectOptions(statusSelect, "RESOLVED");

    const resolutionInput = screen.getByTestId("resolution-summary-input");
    await user.type(resolutionInput, "Updated VPN configuration on gateway and verified user connectivity.");

    const applyBtn = screen.getByTestId("apply-status-button");
    await user.click(applyBtn);

    expect(statusSpy).toHaveBeenCalledWith(
      101,
      "RESOLVED",
      "Updated VPN configuration on gateway and verified user connectivity."
    );
    expect(await screen.findByText(/Status updated to Resolved/i)).toBeInTheDocument();
  });

  it("switches tabs and displays attachments", async () => {
    const user = userEvent.setup();
    render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

    const attachmentsTab = await screen.findByTestId("tab-attachments");
    await user.click(attachmentsTab);

    expect(await screen.findByText("vpn-logs.txt")).toBeInTheDocument();
  });

  it("calls onBack when clicking back button", async () => {
    const user = userEvent.setup();
    const onBackMock = vi.fn();
    render(<StaffTicketDetail ticketId={101} onBack={onBackMock} />);

    const backBtn = await screen.findByRole("button", { name: /Back to Queue/i });
    await user.click(backBtn);

    expect(onBackMock).toHaveBeenCalled();
  });
});
