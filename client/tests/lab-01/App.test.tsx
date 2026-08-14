import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("App", () => {
  it("renders the TokTickIT heading", () => {
    render(<App />);
    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
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

    render(<App />);
    const checkButton = screen.getByRole("button", { name: /Check System/i });
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

    render(<App />);
    const checkButton = screen.getByRole("button", { name: /Check System/i });
    await user.click(checkButton);

    expect(await screen.findByText(/Offline/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Unable to connect to TokTickIT API/i)
    ).toBeInTheDocument();
  });
});
