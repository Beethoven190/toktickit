import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

interface ChangePasswordModalProps {
  onSuccess?: () => void;
  isMandatory?: boolean;
  onCancel?: () => void;
}

export default function ChangePasswordModal({
  onSuccess,
  isMandatory = false,
  onCancel,
}: ChangePasswordModalProps) {
  const { changePassword, logout, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Real-time password complexity checklist
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      errors.newPassword = "New password is required";
    } else if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      errors.newPassword =
        "Password must be at least 8 characters with upper, lower, numbers, and special characters";
    }

    if (newPassword && newPassword === currentPassword) {
      errors.newPassword = "New password must be different from current password";
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMessage("Password updated successfully!");
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 800);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errAny = err as any;
      if (errAny.fields) {
        setFieldErrors(errAny.fields);
      }
      setErrorMessage(errAny.message || "Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={isMandatory ? "min-vh-100 d-flex justify-content-center align-items-center p-3" : ""}
      style={{ backgroundColor: isMandatory ? "#F5F7F6" : "transparent" }}
    >
      <div
        className="card border-0 shadow-sm p-4 p-md-5"
        style={{
          maxWidth: 480,
          width: "100%",
          borderRadius: 16,
          backgroundColor: "#FFFFFF",
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle p-2"
              style={{ backgroundColor: "#EAF6EF" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#006B3C" viewBox="0 0 16 16">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              </svg>
            </div>
            <h2 className="h5 fw-bold mb-0" style={{ color: "#006B3C" }}>
              {isMandatory ? "Mandatory Password Change" : "Change Password"}
            </h2>
          </div>
          {!isMandatory && onCancel && (
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onCancel}
            />
          )}
        </div>

        {isMandatory && (
          <div className="alert alert-warning py-2 px-3 small mb-3">
            <strong>First-Time Login:</strong> You must change your initial temporary password before you can access the application.
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success py-2 px-3 small mb-3" role="alert">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* User notice */}
          <div className="mb-3 text-muted small">
            Signed in as: <strong>{user?.email}</strong>
          </div>

          {/* Current Password */}
          <div className="mb-3">
            <label htmlFor="current-password-input" className="form-label small fw-semibold text-secondary">
              Current Password
            </label>
            <input
              id="current-password-input"
              type="password"
              className={`form-control ${fieldErrors.currentPassword ? "is-invalid" : ""}`}
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (fieldErrors.currentPassword) {
                  setFieldErrors((prev) => ({ ...prev, currentPassword: "" }));
                }
              }}
              disabled={isSubmitting}
            />
            {fieldErrors.currentPassword && (
              <div className="invalid-feedback small">{fieldErrors.currentPassword}</div>
            )}
          </div>

          {/* New Password */}
          <div className="mb-2">
            <label htmlFor="new-password-input" className="form-label small fw-semibold text-secondary">
              New Password
            </label>
            <input
              id="new-password-input"
              type="password"
              className={`form-control ${fieldErrors.newPassword ? "is-invalid" : ""}`}
              placeholder="Enter new strong password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (fieldErrors.newPassword) {
                  setFieldErrors((prev) => ({ ...prev, newPassword: "" }));
                }
              }}
              disabled={isSubmitting}
            />
            {fieldErrors.newPassword && (
              <div className="invalid-feedback small">{fieldErrors.newPassword}</div>
            )}
          </div>

          {/* Complexity Rules Checklist */}
          <div className="p-3 mb-3 rounded" style={{ backgroundColor: "#F9FAF9", fontSize: "0.78rem" }}>
            <div className="fw-semibold text-secondary mb-1">Password Requirements:</div>
            <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
              <li className={hasMinLength ? "text-success fw-medium" : "text-muted"}>
                {hasMinLength ? "✓" : "○"} At least 8 characters
              </li>
              <li className={hasUpper ? "text-success fw-medium" : "text-muted"}>
                {hasUpper ? "✓" : "○"} At least one uppercase letter (A-Z)
              </li>
              <li className={hasLower ? "text-success fw-medium" : "text-muted"}>
                {hasLower ? "✓" : "○"} At least one lowercase letter (a-z)
              </li>
              <li className={hasNumber ? "text-success fw-medium" : "text-muted"}>
                {hasNumber ? "✓" : "○"} At least one number (0-9)
              </li>
              <li className={hasSpecial ? "text-success fw-medium" : "text-muted"}>
                {hasSpecial ? "✓" : "○"} At least one special character (!@#$%^&*...)
              </li>
            </ul>
          </div>

          {/* Confirm New Password */}
          <div className="mb-4">
            <label htmlFor="confirm-password-input" className="form-label small fw-semibold text-secondary">
              Confirm New Password
            </label>
            <input
              id="confirm-password-input"
              type="password"
              className={`form-control ${fieldErrors.confirmPassword ? "is-invalid" : ""}`}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }
              }}
              disabled={isSubmitting}
            />
            {fieldErrors.confirmPassword && (
              <div className="invalid-feedback small">{fieldErrors.confirmPassword}</div>
            )}
            {passwordsMatch && (
              <div className="text-success small mt-1">✓ Passwords match</div>
            )}
          </div>

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn flex-grow-1 py-2 text-white fw-semibold"
              style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  Updating Password...
                </span>
              ) : (
                "Save New Password"
              )}
            </button>

            {isMandatory ? (
              <button
                type="button"
                className="btn btn-outline-secondary px-3"
                onClick={logout}
                title="Log out and sign in with a different account"
              >
                Log Out
              </button>
            ) : onCancel ? (
              <button
                type="button"
                className="btn btn-outline-secondary px-3"
                onClick={onCancel}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
