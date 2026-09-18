import React, { useState, useEffect, useCallback } from "react";
import {
  StaffQueueTicket,
  StaffAssignee,
  getStaffTicketDetail,
  getStaffAssignees,
  claimStaffTicket,
  assignStaffTicket,
  updateStaffTicketPriority,
  updateStaffTicketStatus,
  addTicketComment,
  addTicketInternalNote,
} from "../api.js";

interface StaffTicketDetailProps {
  ticketId: number;
  currentUserId?: number;
  onBack: () => void;
}

// Permitted status transitions per BR-09
const PERMITTED_TRANSITIONS: Record<string, string[]> = {
  NEW: ["OPEN", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CLOSED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  CANCELLED: [],
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_REQUESTER: "Waiting for Requester",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REOPENED: "Reopened",
  CANCELLED: "Cancelled",
};

export const StaffTicketDetail: React.FC<StaffTicketDetailProps> = ({
  ticketId,
  currentUserId,
  onBack,
}) => {
  const [ticket, setTicket] = useState<StaffQueueTicket | null>(null);
  const [assignees, setAssignees] = useState<StaffAssignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Status transition state
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [resolutionSummary, setResolutionSummary] = useState<string>("");

  // Tabs state
  const [activeTab, setActiveTab] = useState<"comments" | "notes" | "attachments" | "actions">("comments");
  const [newCommentText, setNewCommentText] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [isPostingNote, setIsPostingNote] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ticketData, assigneesData] = await Promise.all([
        getStaffTicketDetail(ticketId),
        getStaffAssignees(),
      ]);
      setTicket(ticketData);
      setAssignees(assigneesData);
      setTargetStatus(ticketData.currentStatus);
      setResolutionSummary(ticketData.resolutionSummary || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // 1. Claim ticket
  const handleClaim = async () => {
    if (!ticket) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await claimStaffTicket(ticket.id);
      setTicket(updated);
      setTargetStatus(updated.currentStatus);
      showSuccess("Ticket claimed successfully! Status updated to Open.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to claim ticket");
    } finally {
      setSaving(false);
    }
  };

  // 2. Assign ticket
  const handleAssign = async (newOwnerIdStr: string) => {
    if (!ticket) return;
    try {
      setSaving(true);
      setError(null);
      const newOwnerId = newOwnerIdStr === "unassigned" || newOwnerIdStr === "" ? null : Number(newOwnerIdStr);
      const updated = await assignStaffTicket(ticket.id, newOwnerId);
      setTicket(updated);
      showSuccess(newOwnerId ? "Ticket assigned successfully." : "Ticket unassigned.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to assign ticket");
    } finally {
      setSaving(false);
    }
  };

  // 3. Update IT Priority
  const handlePriorityChange = async (newPriority: "LOW" | "MEDIUM" | "HIGH") => {
    if (!ticket) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await updateStaffTicketPriority(ticket.id, newPriority);
      setTicket(updated);
      showSuccess(`IT Priority updated to ${newPriority}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update IT Priority");
    } finally {
      setSaving(false);
    }
  };

  // 4. Update Status
  const handleStatusChange = async () => {
    if (!ticket || targetStatus === ticket.currentStatus) return;

    if (
      (targetStatus === "RESOLVED" || targetStatus === "CLOSED") &&
      (!resolutionSummary || resolutionSummary.trim().length < 5)
    ) {
      setError("A resolution summary of at least 5 characters is required when resolving or closing a ticket.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await updateStaffTicketStatus(
        ticket.id,
        targetStatus,
        targetStatus === "RESOLVED" || targetStatus === "CLOSED" ? resolutionSummary : undefined
      );
      setTicket(updated);
      showSuccess(`Status updated to ${STATUS_LABELS[targetStatus] || targetStatus}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  // 5. Post Public Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !newCommentText.trim()) return;
    try {
      setIsPostingComment(true);
      setError(null);
      const created = await addTicketComment(ticket.id, newCommentText.trim());
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              publicComments: [...(prev.publicComments || []), created],
            }
          : null
      );
      setNewCommentText("");
      showSuccess("Public comment posted successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsPostingComment(false);
    }
  };

  // 6. Post Internal Note
  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !newNoteText.trim()) return;
    try {
      setIsPostingNote(true);
      setError(null);
      const created = await addTicketInternalNote(ticket.id, newNoteText.trim());
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              internalNotes: [...(prev.internalNotes || []), created],
            }
          : null
      );
      setNewNoteText("");
      showSuccess("Internal note recorded successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post internal note");
    } finally {
      setIsPostingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center" data-testid="staff-detail-loading">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading ticket...</span>
        </div>
        <div className="text-muted mt-2">Loading ticket details...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Ticket not found or error loading ticket.
          <button className="btn btn-link" onClick={onBack}>
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentUserId && ticket.ownerId === currentUserId;
  const isResolvingOrClosing = targetStatus === "RESOLVED" || targetStatus === "CLOSED";
  const permittedNextStatuses = PERMITTED_TRANSITIONS[ticket.currentStatus] || [];

  return (
    <div className="container-fluid px-3 px-md-4 py-4" style={{ maxWidth: 1200 }}>
      {/* Breadcrumbs & Navigation Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none"
                style={{ color: "#006B3C", fontWeight: 500 }}
                onClick={onBack}
              >
                My Queue
              </button>
            </li>
            <li className="breadcrumb-item active text-muted" aria-current="page">
              Ticket Detail
            </li>
          </ol>
        </nav>
        <button
          type="button"
          className="btn btn-outline-success btn-sm px-3"
          style={{ borderColor: "#006B3C", color: "#006B3C", fontWeight: 500 }}
          onClick={onBack}
        >
          ← Back to Queue
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert" data-testid="detail-error">
          <strong>Error:</strong> {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert" data-testid="detail-success">
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}></button>
        </div>
      )}

      {/* Main Ticket Card (Teacher Mockup 3) */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: 10, background: "#FFFFFF" }}>
        <div
          className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center"
          style={{ borderTopLeftRadius: 10, borderTopRightRadius: 10 }}
        >
          <div className="d-flex align-items-center gap-3">
            <h5 className="mb-0 font-monospace fw-bold" style={{ color: "#006B3C" }}>
              {ticket.ticketNumber}
            </h5>
            <span
              className={`badge ${
                ticket.currentStatus === "RESOLVED" || ticket.currentStatus === "CLOSED"
                  ? "bg-success"
                  : ticket.currentStatus === "IN_PROGRESS"
                  ? "bg-primary"
                  : ticket.currentStatus === "OPEN"
                  ? "bg-info text-dark"
                  : "bg-secondary"
              }`}
              style={{ fontSize: "0.85rem", padding: "6px 10px" }}
            >
              {STATUS_LABELS[ticket.currentStatus] || ticket.currentStatus}
            </span>
          </div>
          <div className="text-muted small">
            Created: {new Date(ticket.createdAt).toLocaleString()}
          </div>
        </div>

        <div className="card-body p-4">
          {/* Requester Resolution Indicator */}
          {ticket.problemResolvedReq && (
            <div
              className="alert d-flex align-items-center gap-2 mb-3 py-2 px-3"
              style={{ backgroundColor: "#EAF6EF", borderColor: "#A7F3D0", color: "#006B3C" }}
              data-testid="requester-resolved-indicator"
            >
              <span className="fw-bold">✓ Requester Indicated Problem Appears Resolved</span>
              <small className="text-muted ms-auto">
                Requester reported resolution. Please verify before formally setting status to Resolved/Closed.
              </small>
            </div>
          )}

          {/* Row 1: Ticket No | Category | Related System */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Ticket No.</label>
              <input
                type="text"
                className="form-control font-monospace fw-bold"
                value={ticket.ticketNumber}
                readOnly
                style={{ backgroundColor: "#F9FAFB" }}
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Category</label>
              <input
                type="text"
                className="form-control"
                value={ticket.category?.name || "General"}
                readOnly
                style={{ backgroundColor: "#F9FAFB" }}
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Related System</label>
              <input
                type="text"
                className="form-control"
                value={ticket.relatedSystem?.name || "None"}
                readOnly
                style={{ backgroundColor: "#F9FAFB" }}
              />
            </div>
          </div>

          {/* Row 2: Requester | Requested Priority | Current Status */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Requester</label>
              <input
                type="text"
                className="form-control"
                value={`${ticket.requester?.name || "Unknown"} (${ticket.requester?.email || ""})`}
                readOnly
                style={{ backgroundColor: "#F9FAFB" }}
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Req. Priority</label>
              <div>
                <span
                  className={`badge ${
                    ticket.requestedPriority === "HIGH"
                      ? "bg-danger"
                      : ticket.requestedPriority === "MEDIUM"
                      ? "bg-warning text-dark"
                      : "bg-info text-dark"
                  }`}
                  style={{ fontSize: "0.9rem", padding: "8px 12px" }}
                >
                  {ticket.requestedPriority}
                </span>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Status Workflow</label>
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  value={targetStatus}
                  disabled={saving || permittedNextStatuses.length === 0}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  data-testid="status-transition-select"
                >
                  <option value={ticket.currentStatus}>
                    {STATUS_LABELS[ticket.currentStatus] || ticket.currentStatus} (Current)
                  </option>
                  {permittedNextStatuses.map((st) => (
                    <option key={st} value={st}>
                      ➔ {STATUS_LABELS[st] || st}
                    </option>
                  ))}
                </select>
                {targetStatus !== ticket.currentStatus && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm px-3"
                    style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                    onClick={handleStatusChange}
                    disabled={saving}
                    data-testid="apply-status-button"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Ticket Owner | IT Priority */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label text-muted small fw-bold text-uppercase mb-0">
                  Ticket Owner
                </label>
                {!isOwner && (
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm py-0 px-2"
                    style={{ fontSize: "0.8rem", borderColor: "#006B3C", color: "#006B3C" }}
                    onClick={handleClaim}
                    disabled={saving}
                    data-testid="claim-ticket-button"
                  >
                    🙋 Claim Ticket
                  </button>
                )}
              </div>
              <select
                className="form-select"
                value={ticket.ownerId ? String(ticket.ownerId) : "unassigned"}
                onChange={(e) => handleAssign(e.target.value)}
                disabled={saving}
                data-testid="ticket-owner-select"
              >
                <option value="unassigned">Unassigned</option>
                {assignees.map((staff) => (
                  <option key={staff.id} value={String(staff.id)}>
                    {staff.name} ({staff.role === "ADMIN" ? "Admin" : "IT Staff"})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label text-muted small fw-bold text-uppercase">IT Priority</label>
              <select
                className="form-select"
                value={ticket.itPriority || "MEDIUM"}
                onChange={(e) => handlePriorityChange(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
                disabled={saving}
                data-testid="it-priority-select"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* Row 4: Summary */}
          <div className="mb-3">
            <label className="form-label text-muted small fw-bold text-uppercase">Summary</label>
            <input
              type="text"
              className="form-control"
              value={ticket.summary}
              readOnly
              style={{ backgroundColor: "#F9FAFB" }}
            />
          </div>

          {/* Row 5: Detailed Description */}
          <div className="mb-3">
            <label className="form-label text-muted small fw-bold text-uppercase">Detailed Description</label>
            <textarea
              className="form-control"
              rows={4}
              value={ticket.description}
              readOnly
              style={{ backgroundColor: "#F9FAFB", resize: "none" }}
            />
          </div>

          {/* Row 6: Resolution Summary (Input / Required for RESOLVED and CLOSED) */}
          <div className={`p-3 rounded mb-2 ${isResolvingOrClosing ? "border border-success bg-light" : ""}`}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label text-muted small fw-bold text-uppercase mb-0">
                Resolution Summary {isResolvingOrClosing && <span className="text-danger">* (Required &gt;= 5 chars)</span>}
              </label>
              {targetStatus === ticket.currentStatus && (ticket.currentStatus === "RESOLVED" || ticket.currentStatus === "CLOSED") && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm py-0 px-2"
                  style={{ fontSize: "0.75rem" }}
                  disabled={saving || !resolutionSummary || resolutionSummary.trim().length < 5}
                  onClick={async () => {
                    try {
                      setSaving(true);
                      await updateStaffTicketStatus(ticket.id, ticket.currentStatus, resolutionSummary);
                      showSuccess("Resolution summary updated.");
                    } catch (err: unknown) {
                      setError(err instanceof Error ? err.message : "Failed to update resolution summary");
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Save Summary
                </button>
              )}
            </div>
            <input
              type="text"
              className={`form-control ${isResolvingOrClosing && (!resolutionSummary || resolutionSummary.trim().length < 5) ? "is-invalid" : ""}`}
              placeholder="Add resolution summary (visible to requester)..."
              value={resolutionSummary}
              onChange={(e) => setResolutionSummary(e.target.value)}
              disabled={saving}
              data-testid="resolution-summary-input"
            />
            {isResolvingOrClosing && (!resolutionSummary || resolutionSummary.trim().length < 5) && (
              <div className="invalid-feedback">
                Please enter a resolution summary with at least 5 characters before applying status.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section: Collaboration & Attachments (Teacher Mockup 3) */}
      <div className="card shadow-sm border-0" style={{ borderRadius: 10, background: "#FFFFFF" }}>
        <div className="card-header bg-white border-bottom p-0" style={{ borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
          <ul className="nav nav-tabs border-bottom-0 px-3 pt-2">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === "comments" ? "active fw-bold text-success" : "text-muted"}`}
                style={{
                  borderBottom: activeTab === "comments" ? "2px solid #006B3C" : "none",
                  backgroundColor: "transparent",
                }}
                onClick={() => setActiveTab("comments")}
                data-testid="tab-comments"
              >
                💬 Public Comments ({ticket.publicComments?.length || 0})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === "notes" ? "active fw-bold text-warning" : "text-muted"}`}
                style={{
                  borderBottom: activeTab === "notes" ? "2px solid #D97706" : "none",
                  backgroundColor: "transparent",
                }}
                onClick={() => setActiveTab("notes")}
                data-testid="tab-notes"
              >
                📝 Internal Notes ({ticket.internalNotes?.length || 0})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === "attachments" ? "active fw-bold text-success" : "text-muted"}`}
                style={{
                  borderBottom: activeTab === "attachments" ? "2px solid #006B3C" : "none",
                  backgroundColor: "transparent",
                }}
                onClick={() => setActiveTab("attachments")}
                data-testid="tab-attachments"
              >
                📎 Attachments ({ticket.attachments?.length || 0})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className="nav-link text-muted disabled"
                style={{ backgroundColor: "transparent", opacity: 0.6 }}
                disabled
              >
                🛠️ Service Actions (0)
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {/* Public Comments Tab */}
          {activeTab === "comments" && (
            <div>
              {/* Comment Input Form */}
              <form onSubmit={handlePostComment} className="p-3 bg-light rounded-3 mb-4" data-testid="staff-comment-form">
                <label htmlFor="staff-comment-input" className="form-label fw-semibold small text-dark mb-1">
                  Add Public Comment (visible to requester)
                </label>
                <textarea
                  id="staff-comment-input"
                  className="form-control"
                  rows={3}
                  maxLength={2000}
                  placeholder="Type your message for the requester here..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  disabled={isPostingComment}
                  data-testid="staff-comment-textarea"
                />
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <span className="text-muted small">
                    {newCommentText.length} / 2,000 characters
                  </span>
                  <button
                    type="submit"
                    className="btn btn-sm text-white px-3"
                    style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                    disabled={isPostingComment || !newCommentText.trim()}
                    data-testid="staff-submit-comment-btn"
                  >
                    {isPostingComment ? "Posting..." : "✈️ Post Comment"}
                  </button>
                </div>
              </form>

              {/* Comments Thread */}
              {ticket.publicComments && ticket.publicComments.length > 0 ? (
                <div className="d-flex flex-column gap-3" data-testid="staff-comments-list">
                  {ticket.publicComments.map((comment) => (
                    <div key={comment.id} className="p-3 border rounded bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge ${comment.author?.role === "STAFF" ? "bg-primary" : comment.author?.role === "ADMIN" ? "bg-dark" : "bg-secondary"}`}>
                            {comment.author?.role || "USER"}
                          </span>
                          <span className="fw-bold small">{comment.author?.name}</span>
                        </div>
                        <span className="text-muted small">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mb-0 text-secondary" style={{ whiteSpace: "pre-wrap" }}>{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted text-center py-4">
                  No public comments yet on this ticket.
                </div>
              )}
            </div>
          )}

          {/* Internal Notes Tab */}
          {activeTab === "notes" && (
            <div>
              <div
                className="p-2 mb-3 rounded text-muted small"
                style={{ backgroundColor: "#FEF3C7", border: "1px solid #FDE68A" }}
              >
                🔒 <strong>Confidential:</strong> Internal notes are strictly visible to IT Staff and Administrators only.
              </div>

              {/* Internal Note Input Form */}
              <form onSubmit={handlePostNote} className="p-3 rounded-3 mb-4" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }} data-testid="staff-note-form">
                <label htmlFor="staff-note-input" className="form-label fw-semibold small text-dark mb-1">
                  Add Internal Note (confidential to staff)
                </label>
                <textarea
                  id="staff-note-input"
                  className="form-control"
                  rows={3}
                  maxLength={2000}
                  placeholder="Record confidential diagnosis, vendor notes, or internal observations..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  disabled={isPostingNote}
                  data-testid="staff-note-textarea"
                />
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <span className="text-muted small">
                    {newNoteText.length} / 2,000 characters
                  </span>
                  <button
                    type="submit"
                    className="btn btn-sm btn-warning text-dark px-3 fw-bold"
                    disabled={isPostingNote || !newNoteText.trim()}
                    data-testid="staff-submit-note-btn"
                  >
                    {isPostingNote ? "Saving..." : "🔒 Add Note"}
                  </button>
                </div>
              </form>

              {/* Notes Thread */}
              {ticket.internalNotes && ticket.internalNotes.length > 0 ? (
                <div className="d-flex flex-column gap-3" data-testid="staff-notes-list">
                  {ticket.internalNotes.map((note) => (
                    <div key={note.id} className="p-3 border rounded" style={{ backgroundColor: "#FFFBEB" }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-warning text-dark">
                            {note.author?.role || "STAFF"}
                          </span>
                          <span className="fw-bold small">{note.author?.name}</span>
                        </div>
                        <span className="text-muted small">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mb-0 text-secondary" style={{ whiteSpace: "pre-wrap" }}>{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted text-center py-4">
                  No internal notes recorded yet.
                </div>
              )}
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === "attachments" && (
            <div>
              {ticket.attachments && ticket.attachments.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {ticket.attachments.map((att) => (
                    <li
                      key={att.id}
                      className="list-group-item d-flex justify-content-between align-items-center px-0"
                    >
                      <div>
                        <span className="fw-bold">{att.originalName}</span>
                        <span className="text-muted small ms-2">
                          ({(att.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <span className="badge bg-light text-muted border">
                        {att.isRemoved ? "Removed" : "Active"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted text-center py-4">No attachments on this ticket.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
