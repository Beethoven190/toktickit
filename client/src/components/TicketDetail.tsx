import { useState, useEffect } from "react";
import {
  Ticket,
  Attachment,
  RequesterUser,
  TicketComment,
  getTicketDetail,
  uploadAttachment,
  getAttachmentDownloadUrl,
  softRemoveAttachment,
  getTicketComments,
  addTicketComment,
  toggleProblemResolved,
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

  // Comments state (FR-13, BR-05, BR-06)
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [commentContent, setCommentContent] = useState<string>("");
  const [postingComment, setPostingComment] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string>("");

  // Problem Resolved state (BR-07)
  const [isTogglingResolved, setIsTogglingResolved] = useState<boolean>(false);
  const [resolveError, setResolveError] = useState<string>("");

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

  async function loadComments() {
    setLoadingComments(true);
    try {
      const data = await getTicketComments(ticketId, currentRequester.id);
      setComments(data);
    } catch {
      // Non-blocking
    } finally {
      setLoadingComments(false);
    }
  }

  useEffect(() => {
    loadTicket();
    loadComments();
  }, [ticketId, currentRequester.id]);

  async function handleToggleResolved() {
    if (!ticket) return;
    setIsTogglingResolved(true);
    setResolveError("");
    try {
      const nextResolvedState = !ticket.problemResolvedReq;
      const updated = await toggleProblemResolved(ticket.id, nextResolvedState, currentRequester.id);
      setTicket((prev) => (prev ? { ...prev, problemResolvedReq: updated.problemResolvedReq } : null));
    } catch (err: unknown) {
      setResolveError((err as Error).message || "Failed to update problem resolution status");
    } finally {
      setIsTogglingResolved(false);
    }
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = commentContent.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      setCommentError("Comment cannot exceed 2,000 characters.");
      return;
    }
    setPostingComment(true);
    setCommentError("");
    try {
      const created = await addTicketComment(ticketId, trimmed, currentRequester.id);
      setComments((prev) => [...prev, created]);
      setCommentContent("");
    } catch (err: unknown) {
      setCommentError((err as Error).message || "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  }

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
      {/* Breadcrumbs + Back Button Row */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 small">
            <li className="breadcrumb-item">
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none"
                style={{ color: "#006B3C" }}
                onClick={onBack}
              >
                My Tickets
              </button>
            </li>
            <li className="breadcrumb-item active text-muted" aria-current="page">
              Ticket Details
            </li>
          </ol>
        </nav>
        <button
          type="button"
          className="btn btn-sm btn-outline-success px-3"
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
            <h1 className="h3 fw-bold font-monospace mb-0" style={{ color: "#006B3C" }} data-testid="ticket-detail-number">
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

        {/* Resolution Summary (read-only) */}
        <div className="mb-4">
          <h2 className="h6 fw-bold text-muted text-uppercase mb-2">Resolution Summary</h2>
          <div
            className="p-3 rounded border"
            style={{
              backgroundColor: "#FAFAFA",
              minHeight: 60,
              color: ticket.resolutionSummary ? "#1E293B" : "#aaa",
              fontStyle: ticket.resolutionSummary ? "normal" : "italic",
            }}
          >
            {ticket.resolutionSummary || "No resolution summary available yet."}
          </div>
        </div>

        {/* Problem Appears Resolved Indicator Card (BR-07) */}
        <div
          className="p-3 mb-4 rounded border d-flex justify-content-between align-items-center flex-wrap gap-2"
          style={{
            backgroundColor: ticket.problemResolvedReq ? "#EAF6EF" : "#F8FAFC",
            borderColor: ticket.problemResolvedReq ? "#006B3C" : "#E2E8F0",
          }}
          data-testid="problem-resolved-section"
        >
          <div>
            <div className="fw-semibold small" style={{ color: ticket.problemResolvedReq ? "#006B3C" : "#1E293B" }}>
              {ticket.problemResolvedReq ? "✓ You marked this problem as appearing resolved" : "Is your problem resolved?"}
            </div>
            <div className="text-muted small">
              {ticket.problemResolvedReq
                ? "The IT team has been notified that your problem appears resolved. Official status remains active until closed by staff."
                : "Indicate if your issue appears resolved without prematurely closing the ticket."}
            </div>
            {resolveError && <div className="text-danger small mt-1">{resolveError}</div>}
          </div>
          <button
            type="button"
            className={`btn btn-sm ${ticket.problemResolvedReq ? "btn-outline-secondary" : "btn-success"}`}
            style={!ticket.problemResolvedReq ? { backgroundColor: "#006B3C", borderColor: "#006B3C" } : {}}
            onClick={handleToggleResolved}
            disabled={isTogglingResolved}
            data-testid="toggle-problem-resolved-btn"
          >
            {isTogglingResolved
              ? "Updating..."
              : ticket.problemResolvedReq
              ? "↩️ Undo Problem Resolved"
              : "✓ Problem Appears Resolved"}
          </button>
        </div>

        {/* Attachments Tab-style Section */}
        <div className="border-top pt-0">
          {/* Tab-style header bar */}
          <div className="d-flex border-bottom mb-3">
            <div
              className="px-4 py-2 fw-semibold small d-flex align-items-center gap-2"
              style={{
                color: "#006B3C",
                borderBottom: "2px solid #006B3C",
                marginBottom: "-1px",
                cursor: "default",
                backgroundColor: "#EAF6EF",
              }}
            >
              <span>📎</span>
              Attachments
              <span
                className="badge rounded-pill ms-1"
                style={{ backgroundColor: "#006B3C", color: "white", fontSize: "0.7rem" }}
              >
                {activeAttachments.length}
              </span>
            </div>
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

        {/* Public Comments Section (FR-13, BR-05, BR-06) */}
        <div className="border-top pt-4 mt-4" data-testid="requester-comments-section">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="h6 fw-bold text-muted text-uppercase mb-0">
              💬 Public Discussion ({comments.length})
            </h3>
            <span className="text-muted small">Visible to IT Staff & Requester</span>
          </div>

          {commentError && (
            <div className="alert alert-danger py-2 small mb-3" role="alert">
              {commentError}
            </div>
          )}

          {/* Comment input form */}
          <form onSubmit={handlePostComment} className="p-3 rounded mb-4" style={{ backgroundColor: "#F5F7F6" }} data-testid="requester-comment-form">
            <label htmlFor="requester-comment-input" className="form-label fw-semibold small mb-1">
              Add a comment or follow-up note
            </label>
            <textarea
              id="requester-comment-input"
              className="form-control"
              rows={3}
              maxLength={2000}
              placeholder="Provide additional details or reply to the IT support team..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              disabled={postingComment}
              data-testid="requester-comment-textarea"
            />
            <div className="d-flex justify-content-between align-items-center mt-2">
              <span className="text-muted small">
                {commentContent.length} / 2,000 characters
              </span>
              <button
                type="submit"
                className="btn btn-sm text-white px-3"
                style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                disabled={postingComment || !commentContent.trim()}
                data-testid="requester-submit-comment-btn"
              >
                {postingComment ? "Posting..." : "✈️ Post Comment"}
              </button>
            </div>
          </form>

          {/* Comments List */}
          {loadingComments ? (
            <div className="text-center py-3 text-muted small">
              <div className="spinner-border spinner-border-sm text-success me-1" role="status" />
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-muted small text-center py-3 bg-light rounded" data-testid="no-comments-msg">
              No comments yet on this ticket.
            </div>
          ) : (
            <div className="d-flex flex-column gap-3" data-testid="requester-comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 border rounded bg-white shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className={`badge ${
                          comment.author?.role === "STAFF"
                            ? "bg-primary"
                            : comment.author?.role === "ADMIN"
                            ? "bg-dark"
                            : "bg-success"
                        }`}
                      >
                        {comment.author?.role || "REQUESTER"}
                      </span>
                      <strong className="small">{comment.author?.name || "User"}</strong>
                    </div>
                    <span className="text-muted small">{formatDate(comment.createdAt)}</span>
                  </div>
                  <div className="text-secondary small" style={{ whiteSpace: "pre-wrap" }}>
                    {comment.content}
                  </div>
                </div>
              ))}
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
