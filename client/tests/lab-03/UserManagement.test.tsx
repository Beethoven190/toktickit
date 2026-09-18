import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserManagement from "../../src/components/UserManagement.js";
import { AuthProvider } from "../../src/context/AuthContext.js";
import * as api from "../../src/api.js";

const mockAdminUser: api.AuthUser = {
  id: 100,
  name: "Master Admin",
  email: "admin@toktickit.local",
  role: "ADMIN",
  mustChangePassword: false,
  isActive: true,
};

const mockUsers: api.AdminUser[] = [
  {
    id: 100,
    name: "Master Admin",
    email: "admin@toktickit.local",
    role: "ADMIN",
    mustChangePassword: false,
    isActive: true,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: 101,
    name: "John Staff",
    email: "john.s@toktickit.local",
    role: "STAFF",
    mustChangePassword: false,
    isActive: true,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: 102,
    name: "Supanut Requester",
    email: "supanut.w@toktickit.local",
    role: "REQUESTER",
    mustChangePassword: false,
    isActive: true,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: 103,
    name: "Inactive User",
    email: "inactive@toktickit.local",
    role: "REQUESTER",
    mustChangePassword: false,
    isActive: false,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
];

describe("Lab 3 UserManagement Component (Issue 6, AC-15..AC-19, Teacher Mockup 4)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.spyOn(api, "getAdminUsers").mockResolvedValue([...mockUsers]);
  });

  it("renders user table with headers, role badges, and active status pills (AC-15)", async () => {
    render(
      <AuthProvider initialUser={mockAdminUser}>
        <UserManagement />
      </AuthProvider>
    );

    expect(await screen.findByText(/User Management/i)).toBeInTheDocument();
    expect(screen.getByTestId("create-user-btn")).toBeInTheDocument();
    expect(screen.getByTestId("user-search-input")).toBeInTheDocument();
    expect(screen.getByTestId("role-filter-select")).toBeInTheDocument();
    expect(screen.getByTestId("status-filter-select")).toBeInTheDocument();

    // Verify users appear in table
    expect(await screen.findByText("Master Admin")).toBeInTheDocument();
    expect(screen.getByText("John Staff")).toBeInTheDocument();
    expect(screen.getByText("Supanut Requester")).toBeInTheDocument();
    expect(screen.getByText("Inactive User")).toBeInTheDocument();

    // Verify role badges inside table
    const table = screen.getByTestId("users-table");
    expect(within(table).getByText("Administrator")).toBeInTheDocument();
    expect(within(table).getByText("IT Staff")).toBeInTheDocument();
    expect(within(table).getAllByText("Requester").length).toBeGreaterThanOrEqual(1);

    // Verify active/inactive indicators
    expect(within(table).getAllByText(/● Active/i).length).toBe(3);
    expect(within(table).getByText(/○ Inactive/i)).toBeInTheDocument();
  });

  it("filters users dynamically by search input and role filter (AC-15)", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider initialUser={mockAdminUser}>
        <UserManagement />
      </AuthProvider>
    );

    await screen.findByText("Master Admin");

    // Search by name
    const searchInput = screen.getByTestId("user-search-input");
    await user.type(searchInput, "John");

    expect(screen.getByText("John Staff")).toBeInTheDocument();
    expect(screen.queryByText("Master Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Supanut Requester")).not.toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);
    expect(screen.getByText("Master Admin")).toBeInTheDocument();

    // Filter by role
    const roleSelect = screen.getByTestId("role-filter-select");
    await user.selectOptions(roleSelect, "STAFF");

    expect(screen.getByText("John Staff")).toBeInTheDocument();
    expect(screen.queryByText("Master Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Supanut Requester")).not.toBeInTheDocument();
  });

  it("opens create user drawer and successfully creates user with initial password (AC-16)", async () => {
    const user = userEvent.setup();
    const createdUser: api.AdminUser = {
      id: 200,
      name: "New Tech Specialist",
      email: "new.tech@toktickit.local",
      role: "STAFF",
      mustChangePassword: true,
      isActive: true,
      createdAt: "2026-09-04T00:00:00.000Z",
      updatedAt: "2026-09-04T00:00:00.000Z",
    };

    const createSpy = vi.spyOn(api, "createAdminUser").mockResolvedValue(createdUser);

    render(
      <AuthProvider initialUser={mockAdminUser}>
        <UserManagement />
      </AuthProvider>
    );

    await screen.findByText("Master Admin");

    // Click Create User
    await user.click(screen.getByTestId("create-user-btn"));

    expect(screen.getByText("➕ Create New User")).toBeInTheDocument();
    expect(screen.getByTestId("user-form-name")).toBeInTheDocument();
    expect(screen.getByTestId("user-form-email")).toBeInTheDocument();
    expect(screen.getByTestId("user-form-password")).toBeInTheDocument();

    // Fill form
    await user.type(screen.getByTestId("user-form-name"), "New Tech Specialist");
    await user.type(screen.getByTestId("user-form-email"), "new.tech@toktickit.local");
    await user.selectOptions(screen.getByTestId("user-form-role"), "STAFF");
    await user.type(screen.getByTestId("user-form-password"), "InitialPass123!");

    // Submit
    await user.click(screen.getByTestId("save-user-btn"));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        name: "New Tech Specialist",
        email: "new.tech@toktickit.local",
        role: "STAFF",
        isActive: true,
        initialPassword: "InitialPass123!",
      });
    });

    expect(await screen.findByTestId("form-success-alert")).toBeInTheDocument();
  });

  it("opens drawer on user row click for editing (AC-15)", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider initialUser={mockAdminUser}>
        <UserManagement />
      </AuthProvider>
    );

    await screen.findByText("John Staff");

    // Click row for John Staff
    await user.click(screen.getByTestId("user-row-101"));

    expect(screen.getByText("✏️ Edit User")).toBeInTheDocument();
    expect(screen.getByTestId("user-form-name")).toHaveValue("John Staff");
    expect(screen.getByTestId("user-form-email")).toHaveValue("john.s@toktickit.local");
    expect(screen.getByTestId("user-form-role")).toHaveValue("STAFF");
  });

  it("enforces self-deactivation guard: hides deactivation button on own admin profile (AC-17, BR-13)", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider initialUser={mockAdminUser}>
        <UserManagement />
      </AuthProvider>
    );

    await screen.findByText("Master Admin");

    // Click own admin row (id: 100)
    await user.click(screen.getByTestId("user-row-100"));

    expect(screen.getByText("✏️ Edit User")).toBeInTheDocument();
    // Deactivate User button MUST NOT be rendered on self
    expect(screen.queryByTestId("deactivate-user-btn")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Logged-in Administrator account cannot be deactivated/i)
    ).toBeInTheDocument();
  });

  it("allows deactivating another user when confirmed (AC-17, BR-13)", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const updateSpy = vi.spyOn(api, "updateAdminUser").mockResolvedValue({
      ...mockUsers[1],
      isActive: false,
    });

    render(
      <AuthProvider initialUser={mockAdminUser}>
        <UserManagement />
      </AuthProvider>
    );

    await screen.findByText("John Staff");

    // Click John Staff row (id: 101)
    await user.click(screen.getByTestId("user-row-101"));

    // Deactivate button should be visible for other user
    const deactivateBtn = screen.getByTestId("deactivate-user-btn");
    expect(deactivateBtn).toBeInTheDocument();

    await user.click(deactivateBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(101, { isActive: false });
    });
  });

  it("resets user initial password and forces password change on next login (AC-19)", async () => {
    const user = userEvent.setup();
    const resetSpy = vi.spyOn(api, "resetAdminUserPassword").mockResolvedValue({
      message: "Password reset successfully",
      user: { ...mockUsers[1], mustChangePassword: true },
    });

    render(
      <AuthProvider initialUser={mockAdminUser}>
        <UserManagement />
      </AuthProvider>
    );

    await screen.findByText("John Staff");

    // Click John Staff row
    await user.click(screen.getByTestId("user-row-101"));

    // Toggle reset password section
    const toggleBtn = screen.getByTestId("toggle-reset-password-btn");
    await user.click(toggleBtn);

    const pwdInput = screen.getByTestId("reset-password-input");
    await user.type(pwdInput, "NewTempPass123!");

    const confirmBtn = screen.getByTestId("confirm-reset-password-btn");
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith(101, "NewTempPass123!");
    });

    expect(
      await screen.findByText(/Initial password has been reset/i)
    ).toBeInTheDocument();
  });
});
