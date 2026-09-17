import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChangePasswordModal from "../../src/components/ChangePasswordModal.js";
import { AuthProvider } from "../../src/context/AuthContext.js";
import * as api from "../../src/api.js";

describe("Lab 3 ChangePassword Component (AC-02, BR-02, BR-06)", () => {
  const testUser: api.AuthUser = {
    id: 5,
    name: "Newbie Requester",
    email: "newbie.requester@toktickit.local",
    role: "REQUESTER",
    mustChangePassword: true,
    isActive: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders mandatory first-time password change warning banner", () => {
    render(
      <AuthProvider initialUser={testUser}>
        <ChangePasswordModal isMandatory={true} />
      </AuthProvider>
    );

    expect(screen.getByText(/Mandatory Password Change/i)).toBeInTheDocument();
    expect(screen.getByText(/First-Time Login:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save New Password/i })).toBeInTheDocument();
  });

  it("validates that all fields are required and password complexity must be met", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider initialUser={testUser}>
        <ChangePasswordModal isMandatory={true} />
      </AuthProvider>
    );

    const submitBtn = screen.getByRole("button", { name: /Save New Password/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/Current password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/New password is required/i)).toBeInTheDocument();
  });

  it("validates password mismatch when confirm password does not match", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider initialUser={testUser}>
        <ChangePasswordModal isMandatory={true} />
      </AuthProvider>
    );

    await user.type(screen.getByLabelText(/Current Password/i), "Password123!");
    await user.type(screen.getByLabelText(/^New Password$/i), "NewStrongPassword456!");
    await user.type(screen.getByLabelText(/Confirm New Password/i), "MismatchedPassword789!");
    await user.click(screen.getByRole("button", { name: /Save New Password/i }));

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  it("validates that new password cannot be the same as current password", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider initialUser={testUser}>
        <ChangePasswordModal isMandatory={true} />
      </AuthProvider>
    );

    await user.type(screen.getByLabelText(/Current Password/i), "Password123!");
    await user.type(screen.getByLabelText(/^New Password$/i), "Password123!");
    await user.type(screen.getByLabelText(/Confirm New Password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /Save New Password/i }));

    expect(
      await screen.findByText(/New password must be different from current password/i)
    ).toBeInTheDocument();
  });

  it("successfully updates password and invokes onSuccess callback", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    vi.spyOn(api, "changePasswordApi").mockResolvedValueOnce({
      message: "Password changed successfully.",
      user: {
        ...testUser,
        mustChangePassword: false,
      },
    });

    render(
      <AuthProvider initialUser={testUser}>
        <ChangePasswordModal isMandatory={true} onSuccess={onSuccess} />
      </AuthProvider>
    );

    await user.type(screen.getByLabelText(/Current Password/i), "Password123!");
    await user.type(screen.getByLabelText(/^New Password$/i), "BrandNewSecurePassword123!");
    await user.type(screen.getByLabelText(/Confirm New Password/i), "BrandNewSecurePassword123!");
    await user.click(screen.getByRole("button", { name: /Save New Password/i }));

    expect(await screen.findByText(/Password updated successfully!/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
