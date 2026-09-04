import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketDetail from "../../src/components/TicketDetail.js";
import * as api from "../../src/api.js";

const mockRequester = {
  id: 1,
  name: "Supanut Watthanasimakorn",
  email: "supanut.w@toktickit.local",
};

const mockTicket: api.Ticket = {
  id: 42,
  ticketNumber: "TKT-2026-000042",
  requesterId: 1,
  categoryId: 1,
  relatedSystemId: 1,
  summary: "Laptop displays blue screen on startup",
  description: "Stop code CRITICAL_PROCESS_DIED immediately after boot.",
  requestedPriority: "HIGH",
  currentStatus: "NEW",
  createdAt: "2026-09-03T10:00:00.000Z",
  updatedAt: "2026-09-03T10:00:00.000Z",
  category: { id: 1, name: "Hardware" },
  relatedSystem: { id: 1, name: "Corporate Laptop" },
  requester: mockRequester,
  attachments: [
    {
      id: 99,
      ticketId: 42,
      originalName: "bsod_screenshot.png",
      storedName: "12345-bsod_screenshot.png",
      mimeType: "image/png",
      size: 1048576,
      isRemoved: false,
      createdAt: "2026-09-03T10:05:00.000Z",
    },
  ],
};

describe("TicketDetail Component", () => {
  it("renders ticket detail information, badges, and active attachments", async () => {
    vi.spyOn(api, "getTicketDetail").mockResolvedValueOnce(mockTicket);

    render(<TicketDetail ticketId={42} currentRequester={mockRequester} onBack={() => {}} />);

    expect(await screen.findByText("TKT-2026-000042")).toBeInTheDocument();
    expect(screen.getByText("Laptop displays blue screen on startup")).toBeInTheDocument();
    expect(screen.getByText("Stop code CRITICAL_PROCESS_DIED immediately after boot.")).toBeInTheDocument();
    expect(screen.getByText("bsod_screenshot.png")).toBeInTheDocument();
  });

  it("opens soft-removal modal and validates required removal reason (BR-12, BR-13)", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(mockTicket);
    const softRemoveSpy = vi.spyOn(api, "softRemoveAttachment").mockResolvedValueOnce({
      ...mockTicket.attachments![0],
      isRemoved: true,
      removalReason: "Confidential crash log uploaded by accident",
    });

    render(<TicketDetail ticketId={42} currentRequester={mockRequester} onBack={() => {}} />);

    const removeBtn = await screen.findByRole("button", { name: /Remove/i });
    await user.click(removeBtn);

    expect(screen.getByText(/Confirm Attachment Removal/i)).toBeInTheDocument();

    const reasonInput = screen.getByLabelText(/Reason for Removal/i);
    await user.type(reasonInput, "Confidential crash log uploaded by accident");

    const confirmBtn = screen.getByRole("button", { name: /Confirm Removal/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(softRemoveSpy).toHaveBeenCalledWith(
        42,
        99,
        1,
        "Confidential crash log uploaded by accident"
      );
    });
  });
});
