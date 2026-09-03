import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateTicket from "../../src/components/CreateTicket.js";
import * as api from "../../src/api.js";

const mockRequester = {
  id: 1,
  name: "Supanut Watthanasimakorn",
  email: "supanut.w@toktickit.local",
};

describe("CreateTicket Component", () => {
  it("renders form fields with categories, systems, and requester name", async () => {
    vi.spyOn(api, "getCategories").mockResolvedValueOnce([
      { id: 1, name: "Hardware" },
      { id: 2, name: "Software" },
    ]);
    vi.spyOn(api, "getRelatedSystems").mockResolvedValueOnce([
      { id: 1, name: "Corporate Laptop" },
      { id: 2, name: "Email" },
    ]);

    render(<CreateTicket currentRequester={mockRequester} />);

    expect(await screen.findByText(/Create IT Support Ticket/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Related System/i)).toBeInTheDocument();
    expect(screen.getByText("Supanut Watthanasimakorn")).toBeInTheDocument();
  });

  it("shows validation error when summary or description is invalid (BR-06, BR-07)", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getCategories").mockResolvedValueOnce([
      { id: 1, name: "Hardware" },
    ]);
    vi.spyOn(api, "getRelatedSystems").mockResolvedValueOnce([
      { id: 1, name: "Corporate Laptop" },
    ]);

    render(<CreateTicket currentRequester={mockRequester} />);

    await screen.findByText(/Create IT Support Ticket/i);

    // Enter short summary
    const summaryInput = screen.getByLabelText(/Ticket Summary/i);
    await user.type(summaryInput, "Hi");

    // Click submit
    const submitBtn = screen.getByRole("button", { name: /Submit Ticket/i });
    await user.click(submitBtn);

    expect(
      screen.getByText(/Summary must be between 5 and 150 characters/i)
    ).toBeInTheDocument();
  });

  it("submits ticket successfully and displays generated ticket number (AC-01)", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getCategories").mockResolvedValueOnce([
      { id: 1, name: "Hardware" },
    ]);
    vi.spyOn(api, "getRelatedSystems").mockResolvedValueOnce([
      { id: 1, name: "Corporate Laptop" },
    ]);

    const createdTicketMock = {
      id: 10,
      ticketNumber: "TKT-2026-000010",
      requesterId: 1,
      categoryId: 1,
      relatedSystemId: 1,
      summary: "Laptop keyboard keys not responding",
      description: "Several keys including spacebar and enter are physically stuck.",
      requestedPriority: "MEDIUM" as const,
      currentStatus: "NEW",
      createdAt: "2026-09-03T10:00:00.000Z",
      updatedAt: "2026-09-03T10:00:00.000Z",
    };

    vi.spyOn(api, "createTicket").mockResolvedValueOnce(createdTicketMock);

    render(<CreateTicket currentRequester={mockRequester} />);

    await screen.findByText(/Create IT Support Ticket/i);

    await user.type(
      screen.getByLabelText(/Ticket Summary/i),
      "Laptop keyboard keys not responding"
    );
    await user.type(
      screen.getByLabelText(/Description/i),
      "Several keys including spacebar and enter are physically stuck."
    );

    const submitBtn = screen.getByRole("button", { name: /Submit Ticket/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText(/Ticket Submitted Successfully!/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("created-ticket-number")).toHaveTextContent(
      "TKT-2026-000010"
    );
  });
});
