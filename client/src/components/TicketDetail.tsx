import { useState, useEffect } from "react";
import {
  Ticket,
  Attachment,
  RequesterUser,
  getTicketDetail,
  uploadAttachment,
  getAttachmentDownloadUrl,
  softRemoveAttachment,
} from "../api.js";

interface Props {
  ticketId: number;
  currentRequester: RequesterUser;
  onBack: () => void;
}

export default function TicketDetail({ ticketId, currentRequester, onBack }: Props) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Uploading state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");

  // Soft-removal modal state
  const [removingAttachment, setRemovingAttachment] = useState<Attachment | null>(null);
  const [removalReason, setRemovalReason] = useState<string>("");
  const [removalError, setRemovalError] = useState<string>("");
  const [isRemoving, setIsRemoving] = useState<boolean>(false);

  async function loadTicket() {
    setLoading(true);
    setError("");
    try {
      const data = await getTicketDetail(ticketId, currentRequester.id);
      setTicket(data);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTicket();
  }, [ticketId, currentRequester.id]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadError("");

    // Validate size (5MB, BR-10)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File exceeds the maximum limit of 5 MB.");
      e.target.value = "";
      return;
    }

    // Validate mime type (BR-09)
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setUploadError("Unsupported file type. Only JPG, PNG, WEBP, and PDF files are permitted.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      await uploadAttachment(ticketId, currentRequester.id, file);
      e.target.value = "";
      await loadTicket();
    } catch (err: unknown) {
      setUploadError((err as Error).message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  }

  function openRemovalModal(att: Attachment) {
    setRemovingAttachment(att);
    setRemovalReason("");
    setRemovalError("");
  }

  function closeRemovalModal() {
    setRemovingAttachment(null);
    setRemovalReason("");
    setRemovalError("");
  }

  async function handleConfirmRemoval() {
    if (!removingAttachment) return;
    const trimmed = removalReason.trim();
    if (trimmed.length < 5) {
      setRemovalError("Removal reason is required and must be at least 5 characters.");
      return;
    }

    setIsRemoving(true);
    try {
      await softRemoveAttachment(ticketId, removingAttachment.id, currentRequester.id, trimmed);
      closeRemovalModal();
      await loadTicket();
    } catch (err: unknown) {
      setRemovalError((err as Error).message || "Failed to remove attachment");
    } finally {
      setIsRemoving(false);
    }
  }

  function formatDate(iso: string) {
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getPriorityBadge(priority: string) {
    switch (priority) {
      case "HIGH":
        return <span className="badge bg-danger text-white">🔴 High Priority</span>;
      case "MEDIUM":
        return <span className="badge bg-warning text-dark">🟡 Medium Priority</span>;
      case "LOW":
        return (
          <span className="badge" style={{ backgroundColor: "#EAF6EF", color: "#006B3C" }}>
            🟢 Low Priority
          </span>
        );
      default:
        return <span className="badge bg-secondary">{priority}</span>;
    }
  }

  if (loading) {
    return (
      <div className="card border-0 shadow-sm p-5 text-center my-4" style={{ borderRadius: 12 }}>
        <div className="spinner-border spinner-border-sm text-success me-2" role="status" />
        <span>Loading ticket details...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="card border-0 shadow-sm p-4 my-4" style={{ borderRadius: 12 }}>
        <div className="alert alert-danger mb-3" role="alert">
          {error || "Ticket not found"}
        </div>
        <button type="button" className="btn btn-outline-secondary" onClick={onBack}>
          ← Back to My Tickets
        </button>
      </div>
    );
  }

  const activeAttachments = ticket.attachments?.filter((a) => !a.isRemoved) || [];
  const removedAttachments = ticket.attachments?.filter((a) => a.isRemoved) || [];
  const canUploadMore = activeAttachments.length < 5;

  return (
    <div className="my-4">
      {/* Top Navigation */}
      <div className="mb-3">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary px-3"
          onClick={onBack}
        >
          ← Back to My Tickets
        </button>
      </div>

      {/* Main Ticket Card */}
      <div
        className="card border-0 shadow-sm p-4 p-md-5 mb-4"
        style={{ backgroundColor: "#FFFFFF", borderRadius: 12 }}
      >
        {/* Ticket Header */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-3 mb-4 border-bottom">
          <div>
            <span className="text-muted small d-block">Official Ticket Number</span>
            <h1 className="h3 fw-bold text-success font-monospace mb-0" data-testid="ticket-detail-number">
              {ticket.ticketNumber}
            </h1>
          </div>
          <div className="d-flex gap-2">
            {getPriorityBadge(ticket.requestedPriority)}
            <span className="badge bg-success px-3 py-2 text-white">Status: {ticket.currentStatus}</span>
          </div>
        </div>

        {/* Read-Only Grid */}
        <div className="row g-3 p-3 rounded mb-4" style={{ backgroundColor: "#F5F7F6" }}>
          <div className="col-12 col-md-3">
            <span className="text-muted small d-block">Requester</span>
            <strong className="d-block">{ticket.requester?.name || currentRequester.name}</strong>
            <small className="text-muted">{ticket.requester?.email || currentRequester.email}</small>
          </div>
          <div className="col-12 col-md-3">
            <span className="text-muted small d-block">Category</span>
            <strong>{ticket.category?.name}</strong>
          </div>
          <div className="col-12 col-md-3">
            <span className="text-muted small d-block">Related System</span>
            <strong>{ticket.relatedSystem?.name}</strong>
          </div>
          <div className="col-12 col-md-3">
            <span className="text-muted small d-block">Created Date</span>
            <span>{formatDate(ticket.createdAt)}</span>
          </div>
        </div>

        {/* Summary & Description */}
        <div className="mb-4">
          <h2 className="h6 fw-bold text-muted text-uppercase mb-2">Summary</h2>
          <div className="fs-5 fw-semibold p-3 rounded border" style={{ backgroundColor: "#FFFFFF" }}>
            {ticket.summary}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="h6 fw-bold text-muted text-uppercase mb-2">Description</h2>
          <div
            className="p-3 rounded border text-secondary"
            style={{ backgroundColor: "#FAFAFA", whiteSpace: "pre-wrap", minHeight: 100 }}
          >
            {ticket.description}
          </div>
        </div>

        {/* Attachments Section */}
        <div className="pt-3 border-top">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 fw-bold mb-0" style={{ color: "#006B3C" }}>
              📎 Attachments ({activeAttachments.length}/5 active)
            </h2>
          </div>

          {uploadError && (
            <div className="alert alert-danger py-2" role="alert">
              {uploadError}
            </div>
          )}

          {/* Active Attachments List */}
          {activeAttachments.length === 0 ? (
            <p className="text-muted small mb-3">No active attachments attached to this ticket.</p>
          ) : (
            <div className="list-group mb-3">
              {activeAttachments.map((att) => (
                <div
                  key={att.id}
                  className="list-group-item d-flex justify-content-between align-items-center p-3"
                  data-testid={`attachment-item-${att.id}`}
                >
                  <div className="d-flex align-items-center">
                    <span className="fs-4 me-3">📄</span>
                    <div>
                      <div className="fw-semibold text-break">{att.originalName}</div>
                      <small className="text-muted">
                        {formatBytes(att.size)} • Uploaded {formatDate(att.createdAt)}
                      </small>
                    </div>
                  </div>
                  <div className="btn-group">
                    <a
                      href={getAttachmentDownloadUrl(ticket.id, att.id, currentRequester.id)}
                      className="btn btn-sm btn-outline-success"
                      download
                      target="_blank"
                      rel="noreferrer"
                    >
                      ⬇️ Download
                    </a>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => openRemovalModal(att)}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Soft-Removed Attachments List (BR-12, BR-13) */}
          {removedAttachments.length > 0 && (
            <div className="mt-4 pt-3 border-top">
              <h3 className="h6 fw-bold text-muted mb-2">Removed Attachments (Audit History)</h3>
              <div className="list-group">
                {removedAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="list-group-item list-group-item-light p-3 opacity-75"
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <span className="text-decoration-line-through text-muted fw-semibold">
                          📄 {att.originalName}
                        </span>
                        <div className="text-muted small mt-1">
                          Removed on {att.removedAt ? formatDate(att.removedAt) : "N/A"}
                        </div>
                        <div className="badge bg-secondary mt-1">
                          Reason: {att.removalReason}
                        </div>
                      </div>
                      <span className="badge bg-light text-danger border border-danger">
                        Download Blocked
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New Attachment Trigger */}
          {canUploadMore ? (
            <div className="mt-4 p-3 rounded" style={{ backgroundColor: "#F5F7F6" }}>
              <label htmlFor="attachment-upload" className="form-label fw-semibold small mb-1">
                Add Attachment (JPG, PNG, WEBP, PDF up to 5 MB)
              </label>
              <div className="input-group">
                <input
                  id="attachment-upload"
                  type="file"
                  className="form-control"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </div>
              {isUploading && (
                <div className="text-muted small mt-2">
                  <div className="spinner-border spinner-border-sm text-success me-1" role="status" />
                  Uploading attachment...
                </div>
              )}
            </div>
          ) : (
            <div className="alert alert-info small mt-3" role="alert">
              ℹ️ Maximum limit of 5 active attachments reached for this ticket.
            </div>
          )}
        </div>
      </div>

      {/* Soft-Removal Reason Modal */}
      {removingAttachment && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom-0 pb-0">
                <h3 className="modal-title h5 fw-bold text-danger">Confirm Attachment Removal</h3>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeRemovalModal}
                  disabled={isRemoving}
                />
              </div>
              <div className="modal-body">
                <p className="small text-muted mb-3">
                  Are you sure you want to remove <strong>{removingAttachment.originalName}</strong>?
                  The attachment file will be blocked from downloading, and your reason will be recorded.
                </p>

                {removalError && (
                  <div className="alert alert-danger py-2 small" role="alert">
                    {removalError}
                  </div>
                )}

                <label htmlFor="removal-reason-input" className="form-label fw-semibold small">
                  Reason for Removal <span className="text-danger">*</span>
                </label>
                <textarea
                  id="removal-reason-input"
                  className="form-control"
                  rows={3}
                  placeholder="e.g. Uploaded confidential document by mistake"
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  disabled={isRemoving}
                  required
                />
                <div className="form-text text-muted small">
                  Please provide a reason (at least 5 characters).
                </div>
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={closeRemovalModal}
                  disabled={isRemoving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleConfirmRemoval}
                  disabled={isRemoving}
                >
                  {isRemoving ? "Removing..." : "Confirm Removal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
