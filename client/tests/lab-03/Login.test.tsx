import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "../../src/components/LoginForm.js";
import { AuthProvider } from "../../src/context/AuthContext.js";
import * as api from "../../src/api.js";

describe("Lab 3 LoginForm Component (AC-01, BR-01)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders login form with TokTickIT brand, inputs, and submit button", () => {
    render(
      <AuthProvider initialUser={null}>
        <LoginForm />
      </AuthProvider>
    );

    expect(screen.getByRole("heading", { name: /TokTickIT/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });

  it("shows client-side validation errors when submitting empty inputs", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider initialUser={null}>
        <LoginForm />
      </AuthProvider>
    );

    const submitBtn = screen.getByRole("button", { name: /Sign In/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
  });

  it("displays server error banner when invalid credentials are provided", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "loginApi").mockRejectedValueOnce(
      new Error("Invalid email or password.")
    );

    render(
      <AuthProvider initialUser={null}>
        <LoginForm />
      </AuthProvider>
    );

    await user.type(screen.getByLabelText(/Email address/i), "wrong@toktickit.local");
    await user.type(screen.getByLabelText(/^Password/i), "WrongPassword!");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));

    expect(await screen.findByTestId("login-error-alert")).toBeInTheDocument();
    expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
  });

  it("calls login API successfully and triggers onLoginSuccess callback", async () => {
    const user = userEvent.setup();
    const onLoginSuccess = vi.fn();

    vi.spyOn(api, "loginApi").mockResolvedValueOnce({
      token: "mock-jwt-token-xyz",
      user: {
        id: 1,
        name: "Supanut Watthanasimakorn",
        email: "supanut.w@toktickit.local",
        role: "REQUESTER",
        mustChangePassword: false,
        isActive: true,
      },
    });

    render(
      <AuthProvider initialUser={null}>
        <LoginForm onLoginSuccess={onLoginSuccess} />
      </AuthProvider>
    );

    await user.type(screen.getByLabelText(/Email address/i), "supanut.w@toktickit.local");
    await user.type(screen.getByLabelText(/^Password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("toggles password visibility between password and text", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider initialUser={null}>
        <LoginForm />
      </AuthProvider>
    );

    const passwordInput = screen.getByLabelText(/^Password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByRole("button", { name: /Show/i });
    await user.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /Hide/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
