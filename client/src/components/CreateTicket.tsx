import { useState, useEffect } from "react";
import {
  Category,
  RelatedSystem,
  RequesterUser,
  getCategories,
  getRelatedSystems,
  createTicket,
  Ticket,
} from "../api.js";

interface Props {
  currentRequester: RequesterUser;
  onCancel?: () => void;
  onTicketCreated?: (ticket: Ticket) => void;
}

export default function CreateTicket({ currentRequester, onCancel, onTicketCreated }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [systems, setSystems] = useState<RelatedSystem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>("");

  // Form Fields
  const [categoryId, setCategoryId] = useState<string>("");
  const [relatedSystemId, setRelatedSystemId] = useState<string>("");
  const [requestedPriority, setRequestedPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // UI States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    async function loadOptions() {
      setLoadingData(true);
      setLoadError("");
      try {
        const [cats, syss] = await Promise.all([getCategories(), getRelatedSystems()]);
        setCategories(cats);
        setSystems(syss);
        if (cats.length > 0) setCategoryId(String(cats[0].id));
        if (syss.length > 0) setRelatedSystemId(String(syss[0].id));
      } catch {
        setLoadError("Failed to load ticket categories and related systems. Please check your backend.");
      } finally {
        setLoadingData(false);
      }
    }
    loadOptions();
  }, []);

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!categoryId) {
      errors.categoryId = "Category is required.";
    }

    if (!relatedSystemId) {
      errors.relatedSystemId = "Related system is required.";
    }

    const trimmedSummary = summary.trim();
    if (!trimmedSummary) {
      errors.summary = "Ticket Summary is required.";
    } else if (trimmedSummary.length < 5 || trimmedSummary.length > 150) {
      errors.summary = "Summary must be between 5 and 150 characters.";
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      errors.description = "Description is required.";
    } else if (trimmedDesc.length < 10 || trimmedDesc.length > 2000) {
      errors.description = "Description must be between 10 and 2000 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError("");

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await createTicket({
        requesterId: currentRequester.id,
        categoryId: Number(categoryId),
        relatedSystemId: Number(relatedSystemId),
        summary: summary.trim(),
        description: description.trim(),
        requestedPriority,
      });

      setCreatedTicket(ticket);
      if (onTicketCreated) {
        onTicketCreated(ticket);
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: Record<string, string> };
      if (apiErr.errors) {
        setFieldErrors(apiErr.errors);
      } else {
        setGeneralError(apiErr.message || "Failed to submit ticket. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setCreatedTicket(null);
    setSummary("");
    setDescription("");
    setRequestedPriority("MEDIUM");
    setFieldErrors({});
    setGeneralError("");
  }

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  if (loadingData) {
    return (
      <div className="card border-0 shadow-sm p-5 text-center my-4" style={{ borderRadius: 12 }}>
        <div className="spinner-border spinner-border-sm text-success me-2" role="status" />
        <span>Loading ticket form options...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="alert alert-danger my-4" role="alert">
        {loadError}
      </div>
    );
  }

  // Success Confirmation Screen
  if (createdTicket) {
    return (
      <div
        className="card border-0 shadow-sm p-4 p-md-5 my-4"
        style={{ backgroundColor: "#FFFFFF", borderRadius: 12 }}
      >
        <div className="text-center">
          <div
            className="d-inline-flex align-items-center justify-content-center mb-3 rounded-circle"
            style={{ width: 64, height: 64, backgroundColor: "#EAF6EF" }}
          >
            <span style={{ fontSize: 32 }}>✅</span>
          </div>
          <h2 className="h4 fw-bold" style={{ color: "#006B3C" }}>
            Ticket Submitted Successfully!
          </h2>
          <p className="text-muted">Your IT support ticket has been recorded with initial status <strong>NEW</strong>.</p>

          <div
            className="p-3 my-4 rounded d-inline-block text-start"
            style={{ backgroundColor: "#F5F7F6", border: "1px solid #D2DDD7", minWidth: 320 }}
          >
            <div className="mb-2">
              <span className="text-muted small d-block">Official Ticket Number:</span>
              <span className="fs-4 fw-bold text-success" data-testid="created-ticket-number">
                {createdTicket.ticketNumber}
              </span>
            </div>
            <div className="mb-1">
              <span className="text-muted small">Summary: </span>
              <strong>{createdTicket.summary}</strong>
            </div>
            <div>
              <span className="text-muted small">Priority: </span>
              <span className="badge bg-warning text-dark">{createdTicket.requestedPriority}</span>
            </div>
          </div>

          <div className="d-flex justify-content-center gap-3 mt-3">
            <button
              type="button"
              className="btn btn-outline-success px-4"
              onClick={handleReset}
            >
              Create Another Ticket
            </button>
            {onCancel && (
              <button
                type="button"
                className="btn px-4 text-white"
                style={{ backgroundColor: "#006B3C" }}
                onClick={onCancel}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card border-0 shadow-sm p-4 p-md-5 my-4"
      style={{ backgroundColor: "#FFFFFF", borderRadius: 12 }}
    >
      <div className="border-bottom pb-3 mb-4">
        <h2 className="h4 fw-bold mb-1" style={{ color: "#006B3C" }}>
          Create IT Support Ticket
        </h2>
        <p className="text-muted small mb-0">
          Fill out the details below to request technical assistance from TokTickIT service desk.
        </p>
      </div>

      {generalError && (
        <div className="alert alert-danger" role="alert">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Read-Only Information Grid */}
        <div className="row g-3 mb-4 p-3 rounded" style={{ backgroundColor: "#F5F7F6" }}>
          <div className="col-12 col-md-6">
            <label className="form-label text-muted small fw-semibold mb-1">Requester Name</label>
            <div className="fw-bold">{currentRequester.name}</div>
            <div className="text-muted small">{currentRequester.email}</div>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label text-muted small fw-semibold mb-1">Ticket Date</label>
            <div className="fw-bold">{todayFormatted}</div>
            <div className="text-muted small">Current Status: <span className="badge bg-success">NEW</span></div>
          </div>
        </div>

        {/* Dropdowns: Category & Related System */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label htmlFor="category-select" className="form-label fw-semibold">
              Category <span className="text-danger">*</span>
            </label>
            <select
              id="category-select"
              className={`form-select ${fieldErrors.categoryId ? "is-invalid" : ""}`}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId && (
              <div className="invalid-feedback">{fieldErrors.categoryId}</div>
            )}
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="system-select" className="form-label fw-semibold">
              Related System <span className="text-danger">*</span>
            </label>
            <select
              id="system-select"
              className={`form-select ${fieldErrors.relatedSystemId ? "is-invalid" : ""}`}
              value={relatedSystemId}
              onChange={(e) => setRelatedSystemId(e.target.value)}
              required
            >
              {systems.map((sys) => (
                <option key={sys.id} value={sys.id}>
                  {sys.name}
                </option>
              ))}
            </select>
            {fieldErrors.relatedSystemId && (
              <div className="invalid-feedback">{fieldErrors.relatedSystemId}</div>
            )}
          </div>
        </div>

        {/* Requested Priority */}
        <div className="mb-3">
          <label className="form-label fw-semibold">
            Requested Priority <span className="text-danger">*</span>
          </label>
          <div className="d-flex gap-4">
            {(["LOW", "MEDIUM", "HIGH"] as const).map((p) => (
              <div className="form-check" key={p}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="requestedPriority"
                  id={`priority-${p}`}
                  value={p}
                  checked={requestedPriority === p}
                  onChange={() => setRequestedPriority(p)}
                />
                <label className="form-check-label" htmlFor={`priority-${p}`}>
                  {p === "LOW" && "🟢 Low"}
                  {p === "MEDIUM" && "🟡 Medium (Default)"}
                  {p === "HIGH" && "🔴 High"}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Summary */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <label htmlFor="ticket-summary" className="form-label fw-semibold mb-1">
              Ticket Summary <span className="text-danger">*</span>
            </label>
            <small className={`text-muted ${summary.length > 150 ? "text-danger fw-bold" : ""}`}>
              {summary.length} / 150
            </small>
          </div>
          <input
            id="ticket-summary"
            type="text"
            className={`form-control ${fieldErrors.summary ? "is-invalid" : ""}`}
            placeholder="e.g. Cannot connect to campus Wi-Fi from classroom 302"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={160}
            required
          />
          {fieldErrors.summary && (
            <div className="invalid-feedback">{fieldErrors.summary}</div>
          )}
          <div className="form-text text-muted small">
            Brief overview of the issue (5 to 150 characters).
          </div>
        </div>

        {/* Detailed Description */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <label htmlFor="ticket-description" className="form-label fw-semibold mb-1">
              Description <span className="text-danger">*</span>
            </label>
            <small className={`text-muted ${description.length > 2000 ? "text-danger fw-bold" : ""}`}>
              {description.length} / 2000
            </small>
          </div>
          <textarea
            id="ticket-description"
            className={`form-control ${fieldErrors.description ? "is-invalid" : ""}`}
            rows={5}
            placeholder="Please describe what happened, any error messages seen, and steps to reproduce..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2100}
            required
          />
          {fieldErrors.description && (
            <div className="invalid-feedback">{fieldErrors.description}</div>
          )}
          <div className="form-text text-muted small">
            Detailed explanation of the issue (at least 10 characters).
          </div>
        </div>

        {/* Form Actions */}
        <div className="d-flex justify-content-end gap-2 pt-2 border-top">
          {onCancel && (
            <button
              type="button"
              className="btn btn-outline-secondary px-4"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn px-4 text-white d-flex align-items-center"
            style={{ backgroundColor: "#006B3C" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Submitting Ticket...
              </>
            ) : (
              "Submit Ticket →"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
