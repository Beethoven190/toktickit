import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("App", () => {
  it("renders the TokTickIT heading", async () => {
    vi.spyOn(api, "getCategories").mockResolvedValue([]);
    vi.spyOn(api, "getMyTickets").mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });
    render(<App />);
    const matches = await screen.findAllByText(/TokTickIT/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("shows Online and the seeded categories on success", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "checkSystem").mockResolvedValueOnce({
      online: true,
      categories: [
        { id: 1, name: "Account and Access" },
        { id: 2, name: "Hardware" },
        { id: 3, name: "Software" },
        { id: 4, name: "Network" },
      ],
    });
    // Also mock getMyTickets so My Tickets page loads cleanly
    vi.spyOn(api, "getCategories").mockResolvedValue([]);
    vi.spyOn(api, "getMyTickets").mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });

    render(<App />);
    // Open Profile dropdown then click System Check
    // Profile button now shows the first name of the default requester
    const profileBtn = screen.getByText(/Supanut/i);
    await user.click(profileBtn);
    const systemCheckBtn = await screen.findByText(/System Check/i);
    await user.click(systemCheckBtn);

    const checkButton = await screen.findByRole("button", { name: /Check System/i });
    await user.click(checkButton);

    expect(await screen.findByText(/Online/i)).toBeInTheDocument();
    expect(screen.getByText(/Account and Access/i)).toBeInTheDocument();
    expect(screen.getByText(/Hardware/i)).toBeInTheDocument();
    expect(screen.getByText(/Software/i)).toBeInTheDocument();
    expect(screen.getByText(/Network/i)).toBeInTheDocument();
  });


  it("shows an Offline error message when the API is unavailable", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "checkSystem").mockRejectedValueOnce(
      new Error("API unavailable")
    );
    vi.spyOn(api, "getCategories").mockResolvedValue([]);
    vi.spyOn(api, "getMyTickets").mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });

    render(<App />);
    // Open Profile dropdown then click System Check
    // The profile button now shows the first name of the default requester
    const profileBtn = screen.getByText(/Supanut/i);
    await user.click(profileBtn);
    const systemCheckBtn = await screen.findByText(/System Check/i);
    await user.click(systemCheckBtn);

    const checkButton = await screen.findByRole("button", { name: /Check System/i });
    await user.click(checkButton);

    expect(await screen.findByText(/Offline/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Unable to connect to TokTickIT API/i)
    ).toBeInTheDocument();
  });

});
