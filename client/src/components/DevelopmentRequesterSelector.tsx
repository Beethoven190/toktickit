import { useState, useEffect } from "react";
import { RequesterUser, getActiveRequesters } from "../api.js";

interface Props {
  onSelect: (requester: RequesterUser) => void;
  onCancel?: () => void;
}

export default function DevelopmentRequesterSelector({ onSelect, onCancel }: Props) {
  const [requesters, setRequesters] = useState<RequesterUser[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("" );

  useEffect(() => {
    async function loadRequesters() {
      setLoading(true);
      setError("");
      try {
        const data = await getActiveRequesters();
        setRequesters(data);
        if (data.length > 0) {
          setSelectedId(String(data[0].id));
        }
      } catch {
        setError("Failed to load development requesters. Please ensure the backend server is running.");
      } finally {
        setLoading(false);
      }
    }
    loadRequesters();
  }, []);

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    const found = requesters.find((r) => String(r.id) === selectedId);
    if (found) {
      onSelect(found);
    }
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{ backgroundColor: "#F5F7F6" }}
    >
      <div
        className="card shadow-sm border-0 p-4 p-md-5"
        style={{ maxWidth: 540, width: "100%", borderRadius: 12 }}
      >
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center mb-3 rounded-circle"
            style={{ width: 60, height: 60, backgroundColor: "#EAF6EF" }}
          >
            <span style={{ fontSize: 28 }}>👤</span>
          </div>
          <h1 className="h4 fw-bold" style={{ color: "#006B3C" }}>
            Select Development Requester
          </h1>
          <p className="text-muted small mb-0">
            Choose a development requester to simulate user context for Lab 2.
            This is for testing only and is not a login screen.
          </p>
        </div>

        {loading && (
          <div className="text-center py-4 text-muted">
            <div className="spinner-border spinner-border-sm text-success me-2" role="status" />
            <span>Loading active requesters...</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && requesters.length === 0 && (
          <div className="alert alert-warning" role="alert">
            No active development requesters found in the database.
          </div>
        )}

        {!loading && !error && requesters.length > 0 && (
          <form onSubmit={handleContinue}>
            <div className="mb-4">
              <label htmlFor="requester-select" className="form-label fw-semibold">
                Development Requester <span className="text-danger">*</span>
              </label>
              <select
                id="requester-select"
                className="form-select form-select-lg"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                required
              >
                {requesters.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.name} ({req.email})
                  </option>
                ))}
              </select>
              <div className="form-text mt-2 text-muted small">
                ℹ️ Only active development requesters are shown. Inactive accounts are excluded.
              </div>
            </div>

            <div
              className="p-3 mb-4 rounded"
              style={{ backgroundColor: "#EAF6EF", border: "1px solid #D2DDD7" }}
            >
              <div className="d-flex align-items-start">
                <span className="me-2">🛡️</span>
                <small className="text-muted">
                  <strong>Authentication coming in Lab 3:</strong> In Lab 3, this selection will be
                  replaced with secure authentication so you can access the system with your own
                  account.
                </small>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              {onCancel && (
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn px-4 text-white"
                style={{ backgroundColor: "#006B3C" }}
              >
                → Continue
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
