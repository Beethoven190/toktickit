import React, { useState, useEffect, useMemo } from "react";
import {
  AdminUser,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
  UserRole,
} from "../api.js";
import { useAuth } from "../context/AuthContext.js";

const ROLE_LABELS: Record<UserRole, string> = {
  REQUESTER: "Requester",
  STAFF: "IT Staff",
  ADMIN: "Administrator",
};

const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  REQUESTER: "bg-emerald-100 text-emerald-800 border-emerald-200",
  STAFF: "bg-blue-100 text-blue-800 border-blue-200",
  ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();

  // User list state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Sorting
  const [sortField, setSortField] = useState<"name" | "role" | "status">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Drawer / Form State
  const [drawerMode, setDrawerMode] = useState<"none" | "create" | "edit">("none");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form inputs
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("REQUESTER");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formPassword, setFormPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Reset password state for edit mode
  const [showResetSection, setShowResetSection] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");

  // Form submission feedback
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users on load
  const loadUsers = async () => {
    setIsLoading(true);
    setListError("");
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setListError(err.message || "Failed to load user accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail) return false;
      }
      // Role
      if (roleFilter !== "ALL" && u.role !== roleFilter) {
        return false;
      }
      // Status
      if (statusFilter === "ACTIVE" && !u.isActive) return false;
      if (statusFilter === "INACTIVE" && u.isActive) return false;

      return true;
    }).sort((a, b) => {
      let valA = "";
      let valB = "";
      if (sortField === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortField === "role") {
        valA = a.role;
        valB = b.role;
      } else if (sortField === "status") {
        valA = a.isActive ? "active" : "inactive";
        valB = b.isActive ? "active" : "inactive";
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [users, searchQuery, roleFilter, statusFilter, sortField, sortOrder]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Adjust page if out of range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSort = (field: "name" | "role" | "status") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Open Create Form
  const handleOpenCreate = () => {
    setSelectedUser(null);
    setDrawerMode("create");
    setFormName("");
    setFormEmail("");
    setFormRole("REQUESTER");
    setFormIsActive(true);
    setFormPassword("");
    setShowPassword(false);
    setShowResetSection(false);
    setResetPasswordInput("");
    setResetSuccessMessage("");
    setFormError("");
    setFormSuccess("");
  };

  // Open Edit Form
  const handleSelectUser = (user: AdminUser) => {
    setSelectedUser(user);
    setDrawerMode("edit");
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormIsActive(user.isActive);
    setFormPassword("");
    setShowResetSection(false);
    setResetPasswordInput("");
    setResetSuccessMessage("");
    setFormError("");
    setFormSuccess("");
  };

  const handleCloseDrawer = () => {
    setDrawerMode("none");
    setSelectedUser(null);
    setFormError("");
    setFormSuccess("");
  };

  // Check if target user is self or last active admin
  const isSelf = currentUser && selectedUser && currentUser.id === selectedUser.id;
  const activeAdminCount = useMemo(() => {
    return users.filter((u) => u.role === "ADMIN" && u.isActive).length;
  }, [users]);
  const isLastActiveAdmin = selectedUser?.role === "ADMIN" && selectedUser.isActive && activeAdminCount <= 1;

  // Password validation helper
  const isPasswordValid = (pwd: string) => {
    return (
      pwd.length >= 8 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    );
  };

  // Save User (Create or Update)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formName.trim()) {
      setFormError("Full Name is required");
      return;
    }
    if (!formEmail.trim() || !formEmail.includes("@")) {
      setFormError("Valid Email Address is required");
      return;
    }

    if (drawerMode === "create") {
      if (!formPassword) {
        setFormError("Initial Password is required");
        return;
      }
      if (!isPasswordValid(formPassword)) {
        setFormError("Password must be at least 8 characters with upper, lower, digit, and special character");
        return;
      }

      setIsSubmitting(true);
      try {
        const created = await createAdminUser({
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          role: formRole,
          isActive: formIsActive,
          initialPassword: formPassword,
        });
        setFormSuccess(`User ${created.name} created successfully!`);
        await loadUsers();
        // Switch to editing created user
        setSelectedUser(created);
        setDrawerMode("edit");
      } catch (err: any) {
        setFormError(err.message || "Failed to create user");
      } finally {
        setIsSubmitting(false);
      }
    } else if (drawerMode === "edit" && selectedUser) {
      setIsSubmitting(true);
      try {
        const updated = await updateAdminUser(selectedUser.id, {
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          role: formRole,
          isActive: formIsActive,
        });
        setFormSuccess("User details updated successfully!");
        setSelectedUser(updated);
        await loadUsers();
      } catch (err: any) {
        setFormError(err.message || "Failed to update user");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Deactivate User handler
  const handleDeactivate = async () => {
    if (!selectedUser) return;
    if (isSelf) {
      setFormError("You cannot deactivate your own account.");
      return;
    }
    if (isLastActiveAdmin) {
      setFormError("Cannot deactivate the last remaining active Administrator.");
      return;
    }

    if (!window.confirm(`Are you sure you want to deactivate ${selectedUser.name}?`)) {
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    try {
      const updated = await updateAdminUser(selectedUser.id, { isActive: false });
      setFormSuccess(`User ${updated.name} has been deactivated.`);
      setSelectedUser(updated);
      setFormIsActive(false);
      await loadUsers();
    } catch (err: any) {
      setFormError(err.message || "Failed to deactivate user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Initial Password handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setResetSuccessMessage("");
    setFormError("");

    if (!resetPasswordInput) {
      setFormError("Please enter a new initial password");
      return;
    }
    if (!isPasswordValid(resetPasswordInput)) {
      setFormError("Password must be at least 8 characters with upper, lower, digit, and special character");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetAdminUserPassword(selectedUser.id, resetPasswordInput);
      setResetSuccessMessage("Initial password has been reset. User will be prompted to change password on next login.");
      setResetPasswordInput("");
      setShowResetSection(false);
      await loadUsers();
    } catch (err: any) {
      setFormError(err.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Header & Filter Bar */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h1 className="h4 fw-bold mb-1" style={{ color: "#006B3C" }}>
                👥 User Management
              </h1>
              <p className="text-muted small mb-0">
                Manage system users, assign roles, control active statuses, and issue initial credentials.
              </p>
            </div>
            <button
              type="button"
              className="btn text-white fw-semibold px-3 py-2 d-flex align-items-center gap-2 shadow-sm"
              style={{ backgroundColor: "#006B3C", borderColor: "#006B3C", borderRadius: 8 }}
              onClick={handleOpenCreate}
              data-testid="create-user-btn"
            >
              <span>➕</span> Create User
            </button>
          </div>

          <hr className="my-3" />

          {/* Search and Filters Bar */}
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted">🔍</span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  data-testid="user-search-input"
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    type="button"
                    onClick={() => setSearchQuery("")}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                data-testid="role-filter-select"
              >
                <option value="ALL">All Roles</option>
                <option value="REQUESTER">Requester</option>
                <option value="STAFF">IT Staff</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                data-testid="status-filter-select"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="col-12 col-md-1 text-md-end">
              <span className="badge bg-light text-muted border px-2 py-1 small">
                {filteredUsers.length} Users
              </span>
            </div>
          </div>
        </div>
      </div>

      {listError && (
        <div className="alert alert-danger shadow-sm" role="alert">
          {listError}
        </div>
      )}

      {/* Main Two-Panel Layout (Teacher Mockup 4) */}
      <div className="row g-4">
        {/* Left Panel: Users Table (60% width on desktop when drawer open, 100% when closed) */}
        <div className={drawerMode !== "none" ? "col-12 col-lg-7" : "col-12"}>
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-0 pt-3 pb-2 px-3 d-flex justify-content-between align-items-center">
              <h2 className="h5 fw-bold mb-0 text-dark">
                User Accounts
              </h2>
              <span className="text-muted small">
                Click row to view or edit
              </span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" data-testid="users-table">
                <thead className="table-light">
                  <tr>
                    <th
                      style={{ cursor: "pointer", width: "40%" }}
                      onClick={() => handleSort("name")}
                      className="user-select-none"
                    >
                      Name {sortField === "name" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                    </th>
                    <th
                      style={{ cursor: "pointer", width: "30%" }}
                      onClick={() => handleSort("role")}
                      className="user-select-none"
                    >
                      Role {sortField === "role" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                    </th>
                    <th
                      style={{ cursor: "pointer", width: "30%" }}
                      onClick={() => handleSort("status")}
                      className="user-select-none"
                    >
                      Status {sortField === "status" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="text-center py-5">
                        <div className="spinner-border text-success spinner-border-sm me-2" role="status" />
                        <span className="text-muted">Loading user accounts...</span>
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-5 text-muted">
                        No user accounts match the current search or filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => {
                      const isRowSelected = selectedUser?.id === user.id && drawerMode !== "none";
                      return (
                        <tr
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          style={{
                            cursor: "pointer",
                            backgroundColor: isRowSelected ? "#EAF6EF" : undefined,
                          }}
                          data-testid={`user-row-${user.id}`}
                        >
                          <td>
                            <div className="fw-semibold text-dark">{user.name}</div>
                            <div className="text-muted small" style={{ fontSize: "0.8rem" }}>
                              {user.email}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge border ${ROLE_BADGE_CLASSES[user.role]} rounded-pill px-2 py-1`}
                              style={{ fontSize: "0.75rem" }}
                            >
                              {ROLE_LABELS[user.role]}
                            </span>
                          </td>
                          <td>
                            {user.isActive ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1">
                                ● Active
                              </span>
                            ) : (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2 py-1">
                                ○ Inactive
                              </span>
                            )}
                            {user.mustChangePassword && (
                              <span
                                className="badge bg-warning text-dark ms-1"
                                style={{ fontSize: "0.65rem" }}
                                title="Must change password on next login"
                              >
                                🔑 Reset
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="card-footer bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                <span className="text-muted small">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                </span>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        &lt; Prev
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                      <li
                        key={num}
                        className={`page-item ${currentPage === num ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          style={
                            currentPage === num
                              ? { backgroundColor: "#006B3C", borderColor: "#006B3C" }
                              : {}
                          }
                          onClick={() => setCurrentPage(num)}
                        >
                          {num}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next &gt;
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: User Details / Drawer (40% width on desktop) */}
        {drawerMode !== "none" && (
          <div className="col-12 col-lg-5">
            <div className="card border-0 shadow-sm sticky-top" style={{ borderRadius: 12, top: "1rem" }}>
              <div
                className="card-header bg-white border-0 pt-3 pb-2 px-4 d-flex justify-content-between align-items-center"
                style={{ borderBottom: "1px solid #EAF6EF" }}
              >
                <h2 className="h5 fw-bold mb-0" style={{ color: "#006B3C" }}>
                  {drawerMode === "create" ? "➕ Create New User" : `✏️ Edit User`}
                </h2>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-circle"
                  style={{ width: 32, height: 32, padding: 0 }}
                  onClick={handleCloseDrawer}
                  aria-label="Close drawer"
                >
                  ✕
                </button>
              </div>

              <div className="card-body p-4">
                {formError && (
                  <div className="alert alert-danger py-2 small shadow-sm" role="alert" data-testid="form-error-alert">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="alert alert-success py-2 small shadow-sm" role="alert" data-testid="form-success-alert">
                    {formSuccess}
                  </div>
                )}
                {resetSuccessMessage && (
                  <div className="alert alert-info py-2 small shadow-sm" role="alert">
                    {resetSuccessMessage}
                  </div>
                )}

                <form onSubmit={handleSaveUser}>
                  {/* Full Name */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Alex Thompson"
                      required
                      data-testid="user-form-name"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. alex.t@toktickit.com"
                      required
                      data-testid="user-form-email"
                    />
                  </div>

                  {/* Role Selector */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as UserRole)}
                      data-testid="user-form-role"
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="STAFF">IT Staff</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>

                  {/* Active Toggle Switch */}
                  <div className="mb-3 p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold small">Active Account</div>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                        Inactive accounts cannot log into the platform.
                      </div>
                    </div>
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="userActiveSwitch"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        disabled={Boolean(isSelf || (isLastActiveAdmin && formIsActive))}
                        style={{ cursor: "pointer", transform: "scale(1.2)" }}
                        data-testid="user-form-active-switch"
                      />
                    </div>
                  </div>

                  {/* Initial Password Section for Create Mode */}
                  {drawerMode === "create" && (
                    <div className="mb-3 p-3 border rounded-3 bg-light">
                      <label className="form-label small fw-semibold">
                        Initial Password <span className="text-danger">*</span>
                      </label>
                      <div className="input-group mb-2">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control"
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          placeholder="Min 8 chars, Aa1!"
                          required
                          data-testid="user-form-password"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? "🙈" : "👁️"}
                        </button>
                      </div>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                        Must be at least 8 characters with uppercase, lowercase, digit, and special symbol.
                        User will be required to change this on first login.
                      </div>
                    </div>
                  )}

                  {/* Edit Mode: Reset Password Action */}
                  {drawerMode === "edit" && selectedUser && (
                    <div className="mb-3 p-3 border rounded-3 bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <div className="fw-semibold small">Initial Password Reset</div>
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                            Forces user to change password on their next login.
                          </div>
                        </div>
                        {!showResetSection && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setShowResetSection(true)}
                            data-testid="toggle-reset-password-btn"
                          >
                            🔑 Reset Password
                          </button>
                        )}
                      </div>

                      {showResetSection && (
                        <div className="mt-2 pt-2 border-top">
                          <div className="input-group mb-2">
                            <input
                              type="password"
                              className="form-control form-control-sm"
                              placeholder="New temporary password"
                              value={resetPasswordInput}
                              onChange={(e) => setResetPasswordInput(e.target.value)}
                              data-testid="reset-password-input"
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-warning text-dark fw-semibold"
                              onClick={handleResetPassword}
                              disabled={isSubmitting}
                              data-testid="confirm-reset-password-btn"
                            >
                              Apply Reset
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setShowResetSection(false);
                                setResetPasswordInput("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                          <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                            Must be at least 8 chars with upper, lower, number, and special character.
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="d-flex flex-column gap-2 pt-2">
                    <button
                      type="submit"
                      className="btn text-white fw-semibold w-100 py-2"
                      style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                      disabled={isSubmitting}
                      data-testid="save-user-btn"
                    >
                      {isSubmitting ? "Saving..." : drawerMode === "create" ? "Create User" : "Save Changes"}
                    </button>

                    {/* Deactivate User button: BR-13 prevents deactivating self; BR-14 prevents deactivating last admin */}
                    {drawerMode === "edit" && selectedUser && selectedUser.isActive && !isSelf && !isLastActiveAdmin && (
                      <button
                        type="button"
                        className="btn btn-outline-danger w-100 py-2"
                        onClick={handleDeactivate}
                        disabled={isSubmitting}
                        data-testid="deactivate-user-btn"
                      >
                        Deactivate User
                      </button>
                    )}

                    {isSelf && drawerMode === "edit" && (
                      <div className="text-muted text-center small fst-italic">
                        (Logged-in Administrator account cannot be deactivated)
                      </div>
                    )}

                    {isLastActiveAdmin && !isSelf && drawerMode === "edit" && (
                      <div className="text-muted text-center small fst-italic">
                        (Last active Administrator cannot be deactivated)
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-link text-muted text-decoration-none w-100"
                      onClick={handleCloseDrawer}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
