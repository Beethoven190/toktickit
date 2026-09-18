import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffTicketDetail } from "../../src/components/StaffTicketDetail.js";
import TicketDetail from "../../src/components/TicketDetail.js";
import MyTickets from "../../src/components/MyTickets.js";
import * as api from "../../src/api.js";

describe("Collaboration Features: Public Comments, Confidential Internal Notes, and Problem Resolution (Issue 5)", () => {
  const mockRequester: api.RequesterUser = {
    id: 1,
    name: "Supanut Watthanasimakorn",
    email: "supanut.w@toktickit.local",
  };

  const mockStaffTicket: api.StaffQueueTicket = {
    id: 105,
    ticketNumber: "TKT-2026-000105",
    summary: "Monitor flickering issue",
    description: "External monitor flickers every few seconds when connected via HDMI.",
    categoryId: 1,
    category: { id: 1, name: "Hardware" },
    relatedSystemId: 1,
    relatedSystem: { id: 1, name: "Dell Display" },
    requesterId: 1,
    requester: { id: 1, name: "Supanut Watthanasimakorn", email: "supanut.w@toktickit.local" },
    ownerId: 2,
    owner: { id: 2, name: "Jane Staff", email: "jane.s@toktickit.local" },
    requestedPriority: "MEDIUM",
    itPriority: "HIGH",
    currentStatus: "IN_PROGRESS",
    problemResolvedReq: false,
    resolutionSummary: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: [],
    publicComments: [
      {
        id: 1,
        ticketId: 105,
        authorId: 2,
        content: "We have ordered a replacement HDMI cable for you.",
        createdAt: "2026-09-17T10:00:00.000Z",
        author: { id: 2, name: "Jane Staff", role: "STAFF" },
      },
    ],
    internalNotes: [
      {
        id: 10,
        ticketId: 105,
        authorId: 2,
        content: "Vendor warranty RMA #44892 created for faulty port.",
        createdAt: "2026-09-17T10:05:00.000Z",
        author: { id: 2, name: "Jane Staff", role: "STAFF" },
      },
    ],
  };

  const mockRequesterTicket: api.Ticket = {
    id: 105,
    ticketNumber: "TKT-2026-000105",
    requesterId: 1,
    categoryId: 1,
    relatedSystemId: 1,
    summary: "Monitor flickering issue",
    description: "External monitor flickers every few seconds when connected via HDMI.",
    requestedPriority: "MEDIUM",
    currentStatus: "IN_PROGRESS",
    problemResolvedReq: false,
    resolutionSummary: null,
    createdAt: "2026-09-17T09:00:00.000Z",
    updatedAt: "2026-09-17T10:00:00.000Z",
    category: { id: 1, name: "Hardware" },
    relatedSystem: { id: 1, name: "Dell Display" },
    requester: mockRequester,
    attachments: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Staff View: Public Comments & Internal Notes", () => {
    it("renders existing public comments and allows staff to post a new comment (FR-13, BR-05, AC-13)", async () => {
      const user = userEvent.setup();
      vi.spyOn(api, "getStaffTicketDetail").mockResolvedValue({ ...mockStaffTicket });
      vi.spyOn(api, "getStaffAssignees").mockResolvedValue([]);
      const addCommentSpy = vi.spyOn(api, "addTicketComment").mockResolvedValue({
        id: 2,
        ticketId: 105,
        authorId: 2,
        content: "Replacement cable has arrived at IT desk.",
        createdAt: new Date().toISOString(),
        author: { id: 2, name: "Jane Staff", role: "STAFF" },
      });

      render(<StaffTicketDetail ticketId={105} currentUserId={2} onBack={vi.fn()} />);

      // Public comments should be visible in tab
      expect(await screen.findByText("We have ordered a replacement HDMI cable for you.")).toBeInTheDocument();

      // Submit a new comment
      const commentInput = screen.getByTestId("staff-comment-textarea");
      await user.type(commentInput, "Replacement cable has arrived at IT desk.");

      const postBtn = screen.getByTestId("staff-submit-comment-btn");
      await user.click(postBtn);

      await waitFor(() => {
        expect(addCommentSpy).toHaveBeenCalledWith(105, "Replacement cable has arrived at IT desk.");
      });
      expect(await screen.findByText("Replacement cable has arrived at IT desk.")).toBeInTheDocument();
    });

    it("renders confidential internal notes tab and allows staff to record a note (FR-14, BR-05, AC-14)", async () => {
      const user = userEvent.setup();
      vi.spyOn(api, "getStaffTicketDetail").mockResolvedValue({ ...mockStaffTicket });
      vi.spyOn(api, "getStaffAssignees").mockResolvedValue([]);
      const addNoteSpy = vi.spyOn(api, "addTicketInternalNote").mockResolvedValue({
        id: 11,
        ticketId: 105,
        authorId: 2,
        content: "Tested monitor with testbench PSU, no further issues detected.",
        createdAt: new Date().toISOString(),
        author: { id: 2, name: "Jane Staff", role: "STAFF" },
      });

      render(<StaffTicketDetail ticketId={105} currentUserId={2} onBack={vi.fn()} />);

      // Switch to Internal Notes tab
      const notesTab = await screen.findByTestId("tab-notes");
      await user.click(notesTab);

      // Verify existing confidential note
      expect(await screen.findByText("Vendor warranty RMA #44892 created for faulty port.")).toBeInTheDocument();
      expect(screen.getByText(/Confidential:/i)).toBeInTheDocument();

      // Post new internal note
      const noteInput = screen.getByTestId("staff-note-textarea");
      await user.type(noteInput, "Tested monitor with testbench PSU, no further issues detected.");

      const postNoteBtn = screen.getByTestId("staff-submit-note-btn");
      await user.click(postNoteBtn);

      await waitFor(() => {
        expect(addNoteSpy).toHaveBeenCalledWith(105, "Tested monitor with testbench PSU, no further issues detected.");
      });
      expect(await screen.findByText("Tested monitor with testbench PSU, no further issues detected.")).toBeInTheDocument();
    });
  });

  describe("Requester View: Comments & Problem Resolved Indication", () => {
    it("renders public comments and does NOT display internal notes to requester (AC-13, AC-14)", async () => {
      const user = userEvent.setup();
      vi.spyOn(api, "getTicketDetail").mockResolvedValue({ ...mockRequesterTicket });
      vi.spyOn(api, "getTicketComments").mockResolvedValue([
        {
          id: 1,
          ticketId: 105,
          authorId: 2,
          content: "We have ordered a replacement HDMI cable for you.",
          createdAt: "2026-09-17T10:00:00.000Z",
          author: { id: 2, name: "Jane Staff", role: "STAFF" },
        },
      ]);
      const addCommentSpy = vi.spyOn(api, "addTicketComment").mockResolvedValue({
        id: 2,
        ticketId: 105,
        authorId: 1,
        content: "Thank you! I will pick it up tomorrow morning.",
        createdAt: new Date().toISOString(),
        author: { id: 1, name: "Supanut Watthanasimakorn", role: "REQUESTER" },
      });

      render(<TicketDetail ticketId={105} currentRequester={mockRequester} onBack={vi.fn()} />);

      // Verify public comment is rendered
      expect(await screen.findByText("We have ordered a replacement HDMI cable for you.")).toBeInTheDocument();

      // Ensure internal notes tab/content is completely absent
      expect(screen.queryByText(/Internal Notes/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Vendor warranty RMA/i)).not.toBeInTheDocument();

      // Requester posts a follow-up comment
      const commentInput = screen.getByTestId("requester-comment-textarea");
      await user.type(commentInput, "Thank you! I will pick it up tomorrow morning.");

      const submitBtn = screen.getByTestId("requester-submit-comment-btn");
      await user.click(submitBtn);

      await waitFor(() => {
        expect(addCommentSpy).toHaveBeenCalledWith(105, "Thank you! I will pick it up tomorrow morning.", 1);
      });
      expect(await screen.findByText("Thank you! I will pick it up tomorrow morning.")).toBeInTheDocument();
    });

    it("allows requester to toggle Problem Appears Resolved without altering ticket status (FR-07, BR-07)", async () => {
      const user = userEvent.setup();
      vi.spyOn(api, "getTicketDetail").mockResolvedValue({ ...mockRequesterTicket, problemResolvedReq: false });
      vi.spyOn(api, "getTicketComments").mockResolvedValue([]);
      const toggleSpy = vi.spyOn(api, "toggleProblemResolved").mockResolvedValue({
        ...mockRequesterTicket,
        problemResolvedReq: true,
      });

      render(<TicketDetail ticketId={105} currentRequester={mockRequester} onBack={vi.fn()} />);

      const toggleBtn = await screen.findByTestId("toggle-problem-resolved-btn");
      expect(toggleBtn).toHaveTextContent("✓ Problem Appears Resolved");

      await user.click(toggleBtn);

      await waitFor(() => {
        expect(toggleSpy).toHaveBeenCalledWith(105, true, 1);
      });

      expect(await screen.findByText("↩️ Undo Problem Resolved")).toBeInTheDocument();
      expect(screen.getByText("✓ You marked this problem as appearing resolved")).toBeInTheDocument();
    });
  });

  describe("MyTickets List View: Problem Resolution Badge", () => {
    it("displays ✓ Resolved badge for tickets with problemResolvedReq = true (FR-07)", async () => {
      vi.spyOn(api, "getCategories").mockResolvedValue([{ id: 1, name: "Hardware" }]);
      vi.spyOn(api, "getMyTickets").mockResolvedValue({
        data: [
          {
            ...mockRequesterTicket,
            id: 105,
            ticketNumber: "TKT-2026-000105",
            problemResolvedReq: true,
          },
          {
            ...mockRequesterTicket,
            id: 106,
            ticketNumber: "TKT-2026-000106",
            summary: "Keyboard key sticky",
            problemResolvedReq: false,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });

      render(
        <MyTickets
          currentRequester={mockRequester}
          onCreateNew={vi.fn()}
          onSelectTicket={vi.fn()}
        />
      );

      const ticketNumbers = await screen.findAllByText("TKT-2026-000105");
      expect(ticketNumbers.length).toBeGreaterThan(0);
      expect(screen.getByTestId("resolved-badge-105")).toBeInTheDocument();
      expect(screen.queryByTestId("resolved-badge-106")).not.toBeInTheDocument();
    });
  });
});
