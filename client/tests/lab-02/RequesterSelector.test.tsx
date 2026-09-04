import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DevelopmentRequesterSelector from "../../src/components/DevelopmentRequesterSelector.js";
import * as api from "../../src/api.js";

describe("DevelopmentRequesterSelector", () => {
  it("renders heading and loads active development requesters", async () => {
    vi.spyOn(api, "getActiveRequesters").mockResolvedValueOnce([
      { id: 1, name: "Jennifer Anderson", email: "jennifer.a@toktickit.local" },
      { id: 2, name: "David Lee", email: "david.l@toktickit.local" },
    ]);

    const onSelect = vi.fn();
    render(<DevelopmentRequesterSelector onSelect={onSelect} />);

    expect(screen.getByText(/Select Development Requester/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("option", { name: /Jennifer Anderson/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /David Lee/i })
    ).toBeInTheDocument();
  });

  it("submits the selected requester on continue click", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getActiveRequesters").mockResolvedValueOnce([
      { id: 1, name: "Jennifer Anderson", email: "jennifer.a@toktickit.local" },
      { id: 2, name: "David Lee", email: "david.l@toktickit.local" },
    ]);

    const onSelect = vi.fn();
    render(<DevelopmentRequesterSelector onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "2");

    const continueBtn = screen.getByRole("button", { name: /Continue/i });
    await user.click(continueBtn);

    expect(onSelect).toHaveBeenCalledWith({
      id: 2,
      name: "David Lee",
      email: "david.l@toktickit.local",
    });
  });
});
