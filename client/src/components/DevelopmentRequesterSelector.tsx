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
      className="d-flex align-items-center justify-content-center py-5"
      style={{ minHeight: "70vh" }}
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
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#006B3C" viewBox="0 0 16 16">
              <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm.256 7a4.474 4.474 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.975 10 8 10c.007 0 .013 0 .02.001A4.47 4.47 0 0 1 9 9.102a4.49 4.49 0 0 1 1.659-.34 4.5 4.5 0 0 1 .255.004A3 3 0 0 0 9 7.5a3 3 0 0 0-3 3c0 .34.057.665.16.968a4.459 4.459 0 0 0-.16-.968zM16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zm-3.5-2a.5.5 0 0 0-.5.5v1h-1a.5.5 0 0 0 0 1h1v1a.5.5 0 0 0 1 0v-1h1a.5.5 0 0 0 0-1h-1v-1a.5.5 0 0 0-.5-.5z"/>
            </svg>
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
              {/* Info box: active requesters only */}
              <div
                className="d-flex align-items-center gap-2 mt-2 px-3 py-2 rounded small"
                style={{ backgroundColor: "#EAF6EF", border: "1px solid #B2D8C4", color: "#1B6840" }}
              >
                <span>ℹ️</span>
                <span>Only active development requesters are shown.</span>
              </div>
            </div>

            {/* Authentication coming in Lab 3 notice */}
            <div
              className="p-3 mb-4 rounded d-flex align-items-start gap-2"
              style={{ backgroundColor: "#F5F5F5", border: "1px solid #DEDEDE" }}
            >
              <span className="mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#888" viewBox="0 0 16 16">
                  <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                </svg>
              </span>
              <small className="text-muted">
                <strong>Authentication coming in Lab 3:</strong> In Lab 3, this selection will be
                replaced with secure authentication so you can access the system with your own
                account.
              </small>
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
                className="btn px-4 text-white d-flex align-items-center gap-2"
                style={{ backgroundColor: "#006B3C" }}
              >
                Continue →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
