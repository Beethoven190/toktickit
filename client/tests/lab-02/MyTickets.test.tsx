import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyTickets from "../../src/components/MyTickets.js";
import * as api from "../../src/api.js";

const mockRequester = {
  id: 1,
  name: "Supanut Watthanasimakorn",
  email: "supanut.w@toktickit.local",
};

describe("MyTickets Component", () => {
  it("renders tickets table with ticket number, summary, and badges", async () => {
    vi.spyOn(api, "getCategories").mockResolvedValueOnce([
      { id: 1, name: "Hardware" },
    ]);
    vi.spyOn(api, "getMyTickets").mockResolvedValueOnce({
      data: [
        {
          id: 101,
          ticketNumber: "TKT-2026-000101",
          requesterId: 1,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Broken laptop screen after commute",
          description: "Screen displays flickering vertical lines.",
          requestedPriority: "HIGH",
          currentStatus: "NEW",
          createdAt: "2026-09-03T10:00:00.000Z",
          updatedAt: "2026-09-03T10:00:00.000Z",
          category: { id: 1, name: "Hardware" },
          relatedSystem: { id: 1, name: "Corporate Laptop" },
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });

    render(<MyTickets currentRequester={mockRequester} onCreateNew={() => {}} />);

    const ticketNumbers = await screen.findAllByText("TKT-2026-000101");
    expect(ticketNumbers.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Broken laptop screen after commute")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/High/i)[0]).toBeInTheDocument();
  });

  it("renders empty state when requester has no tickets", async () => {
    vi.spyOn(api, "getCategories").mockResolvedValueOnce([]);
    vi.spyOn(api, "getMyTickets").mockResolvedValueOnce({
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });

    render(<MyTickets currentRequester={mockRequester} onCreateNew={() => {}} />);

    expect(await screen.findByText(/No tickets submitted yet/i)).toBeInTheDocument();
  });

  it("handles search input and triggers new fetch", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getCategories").mockResolvedValueOnce([]);
    const getMyTicketsSpy = vi.spyOn(api, "getMyTickets").mockResolvedValue({
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });

    render(<MyTickets currentRequester={mockRequester} onCreateNew={() => {}} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by summary or ticket #/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by summary or ticket #/i);
    await user.type(searchInput, "Screen");

    await waitFor(() => {
      expect(getMyTicketsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Screen",
        })
      );
    });
  });
});
