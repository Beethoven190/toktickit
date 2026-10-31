import React, { useState } from "react";
import {
  ActionTaken,
  CreateActionTakenDto,
  UpdateActionTakenDto,
  createStaffTicketAction,
  updateStaffTicketAction,
} from "../api.js";

interface ActionsTakenSectionProps {
  ticketId: number;
  actions?: ActionTaken[];
  canManage: boolean; // true for STAFF or ADMIN, false for REQUESTER (read-only)
  currentUserName?: string;
  isTicketTerminal?: boolean; // true for CLOSED or CANCELLED tickets
  onActionsUpdated?: () => void;
}

export const ActionsTakenSection: React.FC<ActionsTakenSectionProps> = ({
  ticketId,
  actions = [],
  canManage,
  currentUserName = "Current Staff",
  isTicketTerminal = false,
  onActionsUpdated,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionTaken | null>(null);

  // Form State
  const [actionDateTime, setActionDateTime] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(false);
  const [followUpNote, setFollowUpNote] = useState<string>("");
  const [attachmentNotes, setAttachmentNotes] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Format current local time for datetime-local input
  const getLocalDateTimeString = (date?: Date) => {
    const d = date ? new Date(date) : new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  const handleOpenCreateModal = () => {
    setEditingAction(null);
    setActionDateTime(getLocalDateTimeString());
    setDescription("");
    setResult("");
    setFollowUpRequired(false);
    setFollowUpNote("");
    setAttachmentNotes("");
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (action: ActionTaken) => {
    setEditingAction(action);
    setActionDateTime(getLocalDateTimeString(new Date(action.actionDateTime)));
    setDescription(action.description);
    setResult(action.result);
    setFollowUpRequired(action.followUpRequired);
    setFollowUpNote(action.followUpNote || "");
    setAttachmentNotes(action.attachmentNotes || "");
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAction(null);
    setFormError(null);
  };

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validations (BR-04, BR-05)
    const trimmedDesc = description.trim();
    if (!trimmedDesc || trimmedDesc.length < 10) {
      setFormError("Action description is required and must be at least 10 characters.");
      return;
    }

    const trimmedResult = result.trim();
    if (!trimmedResult || trimmedResult.length < 3) {
      setFormError("Result is required and must be at least 3 characters.");
      return;
    }

    const trimmedFollowUpNote = followUpNote.trim();
    if (followUpRequired && (!trimmedFollowUpNote || trimmedFollowUpNote.length < 3)) {
      setFormError("Follow-up note is required (at least 3 characters) when follow-up is checked.");
      return;
    }

    try {
      setSaving(true);
      if (editingAction) {
        const updateDto: UpdateActionTakenDto = {
          description: trimmedDesc,
          result: trimmedResult,
          followUpRequired,
          followUpNote: followUpRequired ? trimmedFollowUpNote : null,
          attachmentNotes: attachmentNotes.trim() || null,
          actionDateTime: actionDateTime ? new Date(actionDateTime).toISOString() : undefined,
        };
        await updateStaffTicketAction(ticketId, editingAction.id, updateDto);
      } else {
        const createDto: CreateActionTakenDto = {
          description: trimmedDesc,
          result: trimmedResult,
          followUpRequired,
          followUpNote: followUpRequired ? trimmedFollowUpNote : null,
          attachmentNotes: attachmentNotes.trim() || null,
          actionDateTime: actionDateTime ? new Date(actionDateTime).toISOString() : undefined,
        };
        await createStaffTicketAction(ticketId, createDto);
      }

      handleCloseModal();
      if (onActionsUpdated) {
        onActionsUpdated();
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save Action Taken");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: 10, background: "#FFFFFF" }}>
      {/* Section Header */}
      <div
        className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2"
        style={{ borderTopLeftRadius: 10, borderTopRightRadius: 10 }}
      >
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: "1.25rem" }}>🛠️</span>
          <div>
            <h5 className="mb-0 fw-bold" style={{ color: "#1E293B", fontSize: "1.05rem" }}>
              Actions Taken <span className="badge bg-light text-dark border ms-1">{actions.length}</span>
            </h5>
            <div className="text-muted small" style={{ fontSize: "0.8rem" }}>
              Technical diagnostics, hardware repairs, and procedural interventions.
            </div>
          </div>
        </div>

        {/* Action Button: Staff/Admin only */}
        {canManage && !isTicketTerminal && (
          <button
            type="button"
            className="btn btn-sm text-white fw-medium d-inline-flex align-items-center gap-1 shadow-sm"
            style={{
              backgroundColor: "#006B3C",
              borderColor: "#006B3C",
              borderRadius: 6,
              padding: "6px 14px",
            }}
            onClick={handleOpenCreateModal}
            data-testid="add-action-taken-btn"
          >
            <span>+</span> Add Action Taken
          </button>
        )}

        {isTicketTerminal && canManage && (
          <span className="badge bg-light text-muted border px-2 py-1 small">
            🔒 Ticket is closed/cancelled (Actions locked)
          </span>
        )}
      </div>

      {/* Body: Actions List / Table */}
      <div className="card-body p-4">
        {actions.length === 0 ? (
          <div
            className="text-center py-4 px-3 rounded-3"
            style={{ backgroundColor: "#F8FAFC", border: "1px dashed #CBD5E1" }}
            data-testid="actions-taken-empty"
          >
            <div className="text-muted mb-1" style={{ fontSize: "1.5rem" }}>📋</div>
            <div className="fw-semibold text-secondary" style={{ fontSize: "0.95rem" }}>
              No actions taken recorded for this ticket yet.
            </div>
            <div className="text-muted small">
              {canManage && !isTicketTerminal
                ? "Click \"+ Add Action Taken\" to log diagnostics, repairs, or procedures performed."
                : "IT Staff have not recorded diagnostic or repair interventions yet."}
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" data-testid="actions-taken-table">
              <thead className="table-light">
                <tr style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  <th style={{ width: "18%" }}>Date &amp; Time</th>
                  <th style={{ width: "26%" }}>Description</th>
                  <th style={{ width: "22%" }}>Result</th>
                  <th style={{ width: "14%" }}>Performed By</th>
                  <th style={{ width: "12%" }}>Follow-Up</th>
                  {canManage && !isTicketTerminal && <th style={{ width: "8%", textAlign: "center" }}>Edit</th>}
                </tr>
              </thead>
              <tbody style={{ fontSize: "0.875rem" }}>
                {actions.map((act) => {
                  const formattedDate = new Date(act.actionDateTime).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  });

                  return (
                    <tr key={act.id} data-testid={`action-row-${act.id}`}>
                      {/* Date & Time */}
                      <td className="text-muted small fw-medium">
                        {formattedDate}
                      </td>

                      {/* Description & Attachment hint */}
                      <td>
                        <div className="fw-semibold text-dark">{act.description}</div>
                        {act.attachmentNotes && (
                          <div className="text-muted small mt-1 d-flex align-items-center gap-1" style={{ fontSize: "0.78rem" }}>
                            <span>📎</span>
                            <span className="fst-italic">{act.attachmentNotes}</span>
                          </div>
                        )}
                      </td>

                      {/* Result */}
                      <td className="text-dark">
                        {act.result}
                      </td>

                      {/* Performed By Badge */}
                      <td>
                        <span
                          className="badge px-2 py-1 rounded"
                          style={{
                            backgroundColor: "#EAF6EF",
                            color: "#006B3C",
                            border: "1px solid #A7F3D0",
                            fontWeight: 600,
                            fontSize: "0.78rem",
                          }}
                        >
                          {act.performedBy?.name || `Staff #${act.performedById}`}
                        </span>
                      </td>

                      {/* Follow-Up Status */}
                      <td>
                        {act.followUpRequired ? (
                          <div>
                            <span
                              className="badge px-2 py-1 rounded-pill"
                              style={{
                                backgroundColor: "#FEF3C7",
                                color: "#B45309",
                                border: "1px solid #FCD34D",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            >
                              ⚠️ Required
                            </span>
                            {act.followUpNote && (
                              <div
                                className="small mt-1 text-muted fst-italic"
                                style={{ fontSize: "0.78rem" }}
                                title={act.followUpNote}
                              >
                                {act.followUpNote}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="badge bg-light text-secondary border px-2 py-0.5 rounded-pill" style={{ fontSize: "0.75rem" }}>
                            None
                          </span>
                        )}
                      </td>

                      {/* Actions: Edit button (Staff/Admin) */}
                      {canManage && !isTicketTerminal && (
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-0 px-2"
                            style={{ fontSize: "0.75rem", borderRadius: 4 }}
                            onClick={() => handleOpenEditModal(act)}
                            data-testid={`edit-action-btn-${act.id}`}
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog: Create / Edit Action Taken */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(2px)", zIndex: 1050 }}
          data-testid="action-taken-modal"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: 12 }}>
              <form onSubmit={handleSaveAction} noValidate>
                <div
                  className="modal-header text-white"
                  style={{ backgroundColor: "#006B3C", borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                >
                  <h5 className="modal-title fs-6 fw-bold">
                    {editingAction ? "Edit Action Taken" : "Record Action Taken"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label="Close"
                    onClick={handleCloseModal}
                    disabled={saving}
                  />
                </div>

                <div className="modal-body p-4">
                  {/* Error Alert */}
                  {formError && (
                    <div className="alert alert-danger py-2 px-3 small mb-3" data-testid="action-form-error">
                      <strong>Validation Error:</strong> {formError}
                    </div>
                  )}

                  <div className="row g-3">
                    {/* Action Date & Time */}
                    <div className="col-md-6">
                      <label htmlFor="actionDateTime" className="form-label small fw-bold text-dark">
                        Action Date &amp; Time
                      </label>
                      <input
                        id="actionDateTime"
                        type="datetime-local"
                        className="form-control"
                        value={actionDateTime}
                        onChange={(e) => setActionDateTime(e.target.value)}
                        disabled={saving}
                        data-testid="action-datetime-input"
                      />
                    </div>

                    {/* Performed by (Read-Only Auto Attribution) */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">
                        Performed By (Auto-Attributed)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingAction?.performedBy?.name || currentUserName}
                        readOnly
                        disabled
                        style={{ backgroundColor: "#F1F5F9", color: "#475569" }}
                        data-testid="action-performer-display"
                      />
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <label htmlFor="actionDescription" className="form-label small fw-bold text-dark">
                        Action Description <span className="text-danger">*</span> (min 10 chars)
                      </label>
                      <textarea
                        id="actionDescription"
                        className="form-control"
                        rows={3}
                        placeholder="Describe specific technical diagnostics, part replacements, or configuration procedures performed..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={saving}
                        data-testid="action-description-input"
                      />
                    </div>

                    {/* Result */}
                    <div className="col-12">
                      <label htmlFor="actionResult" className="form-label small fw-bold text-dark">
                        Operational Result <span className="text-danger">*</span> (min 3 chars)
                      </label>
                      <textarea
                        id="actionResult"
                        className="form-control"
                        rows={2}
                        placeholder="Observable test result, hardware diagnostic outcome, or current operational state..."
                        value={result}
                        onChange={(e) => setResult(e.target.value)}
                        disabled={saving}
                        data-testid="action-result-input"
                      />
                    </div>

                    {/* Follow-up Required Toggle */}
                    <div className="col-12">
                      <div
                        className="p-3 rounded-3"
                        style={{
                          backgroundColor: followUpRequired ? "#FEF3C7" : "#F8FAFC",
                          border: followUpRequired ? "1px solid #FCD34D" : "1px solid #E2E8F0",
                        }}
                      >
                        <div className="form-check form-switch mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="followUpSwitch"
                            checked={followUpRequired}
                            onChange={(e) => setFollowUpRequired(e.target.checked)}
                            disabled={saving}
                            data-testid="follow-up-switch"
                          />
                          <label className="form-check-label fw-bold text-dark small ms-2" htmlFor="followUpSwitch">
                            Follow-Up Required?
                          </label>
                          <div className="text-muted small mt-1 ms-2" style={{ fontSize: "0.78rem" }}>
                            Toggle on if this intervention requires subsequent monitoring, part verification, or confirmation with user.
                          </div>
                        </div>

                        {/* Conditional Follow-up Note */}
                        {followUpRequired && (
                          <div className="mt-3 ps-2">
                            <label htmlFor="followUpNoteInput" className="form-label small fw-bold text-dark">
                              Follow-Up Note <span className="text-danger">*</span> (Mandatory when follow-up is required)
                            </label>
                            <textarea
                              id="followUpNoteInput"
                              className="form-control"
                              rows={2}
                              placeholder="Specify follow-up instructions, timeline, and what conditions to check..."
                              value={followUpNote}
                              onChange={(e) => setFollowUpNote(e.target.value)}
                              disabled={saving}
                              data-testid="follow-up-note-input"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Attachment Notes */}
                    <div className="col-12">
                      <label htmlFor="attachmentNotesInput" className="form-label small fw-bold text-dark">
                        Attachment Notes (Optional)
                      </label>
                      <input
                        id="attachmentNotesInput"
                        type="text"
                        className="form-control"
                        placeholder="Reference diagnostic log names, serial number photos, or test outputs (e.g. memtest_pass.png)..."
                        value={attachmentNotes}
                        onChange={(e) => setAttachmentNotes(e.target.value)}
                        disabled={saving}
                        data-testid="attachment-notes-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="modal-footer bg-light px-4 py-2" style={{ borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3"
                    onClick={handleCloseModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm text-white px-4 fw-medium"
                    style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                    disabled={saving}
                    data-testid="submit-action-taken-btn"
                  >
                    {saving ? "Saving..." : editingAction ? "Update Action" : "Save Action Taken"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
