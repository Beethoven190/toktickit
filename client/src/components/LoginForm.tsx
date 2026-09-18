import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errAny = err as any;
      if (errAny.fields) {
        setFieldErrors(errAny.fields);
      }
      setErrorMessage(errAny.message || "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillSample = (sampleEmail: string) => {
    setEmail(sampleEmail);
    setPassword("Password123!");
    setErrorMessage("");
    setFieldErrors({});
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column justify-content-center align-items-center px-3 py-5"
      style={{ backgroundColor: "#F5F7F6" }}
    >
      <div
        className="card border-0 shadow-sm p-4 p-md-5"
        style={{
          maxWidth: 440,
          width: "100%",
          borderRadius: 16,
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle mb-3"
            style={{ backgroundColor: "#EAF6EF" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              fill="#006B3C"
              viewBox="0 0 16 16"
            >
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
            </svg>
          </div>
          <h1 className="h3 fw-bold mb-1" style={{ color: "#006B3C" }}>
            TokTickIT
          </h1>
          <p className="text-muted small mb-0">Sign in to your IT service account</p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            className="alert alert-danger d-flex align-items-center py-2 px-3 mb-3 small"
            role="alert"
            data-testid="login-error-alert"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="me-2 flex-shrink-0"
              viewBox="0 0 16 16"
            >
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
            </svg>
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="mb-3">
            <label htmlFor="login-email" className="form-label small fw-semibold text-secondary">
              Email address
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
              placeholder="user@toktickit.local"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: "" }));
                }
              }}
              disabled={isSubmitting}
            />
            {fieldErrors.email && (
              <div className="invalid-feedback small">{fieldErrors.email}</div>
            )}
          </div>

          {/* Password */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label htmlFor="login-password" className="form-label small fw-semibold text-secondary mb-0">
                Password
              </label>
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none small"
                style={{ color: "#006B3C", fontSize: "0.8rem" }}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`form-control ${fieldErrors.password ? "is-invalid" : ""}`}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: "" }));
                }
              }}
              disabled={isSubmitting}
            />
            {fieldErrors.password && (
              <div className="invalid-feedback small">{fieldErrors.password}</div>
            )}
          </div>

          {/* Submit Button with Busy State */}
          <button
            type="submit"
            className="btn w-100 py-2 fw-semibold text-white shadow-sm"
            style={{
              backgroundColor: "#006B3C",
              borderColor: "#006B3C",
              borderRadius: 8,
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Quick Demo Accounts Selection */}
        <div className="mt-4 pt-3 border-top text-center">
          <p className="text-muted small mb-2" style={{ fontSize: "0.75rem" }}>
            Quick Demo Login (Password: <code>Password123!</code>):
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-1">
            <button
              type="button"
              className="btn btn-sm btn-outline-success py-1 px-2"
              style={{ fontSize: "0.75rem" }}
              onClick={() => fillSample("supanut.w@toktickit.local")}
            >
              👤 Requester
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary py-1 px-2"
              style={{ fontSize: "0.75rem" }}
              onClick={() => fillSample("john.s@toktickit.local")}
            >
              🛠️ IT Staff
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-dark py-1 px-2"
              style={{ fontSize: "0.75rem" }}
              onClick={() => fillSample("admin@toktickit.local")}
            >
              ⚙️ Admin
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-warning py-1 px-2"
              style={{ fontSize: "0.75rem" }}
              onClick={() => fillSample("newbie.requester@toktickit.local")}
            >
              🔑 1st-Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
