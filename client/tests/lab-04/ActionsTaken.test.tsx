import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionsTakenSection } from "../../src/components/ActionsTakenSection.js";
import * as api from "../../src/api.js";

describe("Lab 4 Issue 3: Actions Taken UI Component (Screen 8.3, AC-01, AC-02, AC-03, BR-01..BR-06)", () => {
  const mockActions: api.ActionTaken[] = [
    {
      id: 1,
      ticketId: 101,
      actionDateTime: "2026-10-29T10:00:00.000Z",
      description: "Tested memory modules and motherboard power rails with multimeter.",
      result: "Voltages normal at 1.2V; memory timings stable.",
      performedById: 2,
      performedBy: {
        id: 2,
        name: "John Staff",
        email: "john.s@toktickit.local",
        role: "STAFF",
      },
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: "multimeter_readings.pdf",
      createdAt: "2026-10-29T10:05:00.000Z",
      updatedAt: "2026-10-29T10:05:00.000Z",
    },
    {
      id: 2,
      ticketId: 101,
      actionDateTime: "2026-10-29T11:30:00.000Z",
      description: "Replaced keyboard matrix assembly with new OEM replacement unit.",
      result: "Key switches operational; verified all keystrokes in terminal.",
      performedById: 3,
      performedBy: {
        id: 3,
        name: "Alex Tech",
        email: "alex.t@toktickit.local",
        role: "STAFF",
      },
      followUpRequired: true,
      followUpNote: "Check with user tomorrow morning after 24 hours of standard usage.",
      attachmentNotes: "keyboard_sn.jpg",
      createdAt: "2026-10-29T11:35:00.000Z",
      updatedAt: "2026-10-29T11:35:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("IT Staff View (Management Mode, canManage = true)", () => {
    it("renders the Actions Taken table with count badge, actions, performers, and follow-up alerts", () => {
      render(
        <ActionsTakenSection
          ticketId={101}
          actions={mockActions}
          canManage={true}
          currentUserName="John Staff"
        />
      );

      // Verify header and count
      expect(screen.getByText("Actions Taken")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();

      // Verify button present
      expect(screen.getByTestId("add-action-taken-btn")).toBeInTheDocument();

      // Verify action rows
      expect(screen.getByText("Tested memory modules and motherboard power rails with multimeter.")).toBeInTheDocument();
      expect(screen.getByText("John Staff")).toBeInTheDocument();
      expect(screen.getByText("Replaced keyboard matrix assembly with new OEM replacement unit.")).toBeInTheDocument();
      expect(screen.getByText("Alex Tech")).toBeInTheDocument();

      // Verify follow-up indicators
      expect(screen.getByText("⚠️ Required")).toBeInTheDocument();
      expect(screen.getByText("Check with user tomorrow morning after 24 hours of standard usage.")).toBeInTheDocument();
      expect(screen.getByText("None")).toBeInTheDocument();

      // Verify attachment notes
      expect(screen.getByText("multimeter_readings.pdf")).toBeInTheDocument();
      expect(screen.getByText("keyboard_sn.jpg")).toBeInTheDocument();

      // Verify edit buttons present for both
      expect(screen.getByTestId("edit-action-btn-1")).toBeInTheDocument();
      expect(screen.getByTestId("edit-action-btn-2")).toBeInTheDocument();
    });

    it("displays informative empty state when ticket has no actions taken", () => {
      render(
        <ActionsTakenSection
          ticketId={101}
          actions={[]}
          canManage={true}
          currentUserName="John Staff"
        />
      );

      expect(screen.getByTestId("actions-taken-empty")).toBeInTheDocument();
      expect(screen.getByText("No actions taken recorded for this ticket yet.")).toBeInTheDocument();
      expect(screen.getByTestId("add-action-taken-btn")).toBeInTheDocument();
    });

    it("opens create action modal with auto-attributed performer and saves valid action (AC-01)", async () => {
      const user = userEvent.setup();
      const mockCreate = vi.spyOn(api, "createStaffTicketAction").mockResolvedValue({
        action: {
          id: 3,
          ticketId: 101,
          actionDateTime: new Date().toISOString(),
          description: "New diagnostic action recorded by current staff member.",
          result: "Diagnostics passed without warnings.",
          performedById: 2,
          performedBy: { id: 2, name: "John Staff", email: "john.s@toktickit.local" },
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      const onUpdated = vi.fn();

      render(
        <ActionsTakenSection
          ticketId={101}
          actions={mockActions}
          canManage={true}
          currentUserName="John Staff"
          onActionsUpdated={onUpdated}
        />
      );

      // Click Add Action Taken
      await user.click(screen.getByTestId("add-action-taken-btn"));

      // Verify modal opened
      expect(screen.getByTestId("action-taken-modal")).toBeInTheDocument();
      expect(screen.getByTestId("action-performer-display")).toHaveValue("John Staff");

      // Fill in description & result
      await user.type(screen.getByTestId("action-description-input"), "Inspected network cable RJ45 connectors.");
      await user.type(screen.getByTestId("action-result-input"), "Re-crimped connector pin 3 and link restored.");

      // Submit form
      await user.click(screen.getByTestId("submit-action-taken-btn"));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(mockCreate).toHaveBeenCalledWith(
          101,
          expect.objectContaining({
            description: "Inspected network cable RJ45 connectors.",
            result: "Re-crimped connector pin 3 and link restored.",
            followUpRequired: false,
          })
        );
        expect(onUpdated).toHaveBeenCalledTimes(1);
      });
    });

    it("dynamically shows follow-up note input when toggle is checked and enforces validation (BR-04, AC-02)", async () => {
      const user = userEvent.setup();

      render(
        <ActionsTakenSection
          ticketId={101}
          actions={mockActions}
          canManage={true}
          currentUserName="John Staff"
        />
      );

      await user.click(screen.getByTestId("add-action-taken-btn"));

      // Initially follow-up note input is not visible
      expect(screen.queryByTestId("follow-up-note-input")).not.toBeInTheDocument();

      // Fill description and result
      await user.type(screen.getByTestId("action-description-input"), "Temporary patch applied to firewall interface.");
      await user.type(screen.getByTestId("action-result-input"), "Traffic flowing.");

      // Toggle follow-up switch ON
      await user.click(screen.getByTestId("follow-up-switch"));

      // Now follow-up note input must appear
      expect(screen.getByTestId("follow-up-note-input")).toBeInTheDocument();

      // Attempt to submit with empty follow-up note
      await user.click(screen.getByTestId("submit-action-taken-btn"));

      // Expect validation error
      expect(screen.getByTestId("action-form-error")).toHaveTextContent("Follow-up note is required");

      // Enter valid follow-up note
      await user.type(screen.getByTestId("follow-up-note-input"), "Verify persistent rules after scheduled reboot tonight.");

      const mockCreate = vi.spyOn(api, "createStaffTicketAction").mockResolvedValue({
        action: {
          id: 4,
          ticketId: 101,
          actionDateTime: new Date().toISOString(),
          description: "Temporary patch applied to firewall interface.",
          result: "Traffic flowing.",
          performedById: 2,
          performedBy: { id: 2, name: "John Staff", email: "john.s@toktickit.local" },
          followUpRequired: true,
          followUpNote: "Verify persistent rules after scheduled reboot tonight.",
          attachmentNotes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      await user.click(screen.getByTestId("submit-action-taken-btn"));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          101,
          expect.objectContaining({
            followUpRequired: true,
            followUpNote: "Verify persistent rules after scheduled reboot tonight.",
          })
        );
      });
    });

    it("opens edit modal and updates existing action taken (FR-03)", async () => {
      const user = userEvent.setup();
      const mockUpdate = vi.spyOn(api, "updateStaffTicketAction").mockResolvedValue({
        action: {
          ...mockActions[0],
          result: "Updated result: Memory tested under heavy load.",
        },
      });

      render(
        <ActionsTakenSection
          ticketId={101}
          actions={mockActions}
          canManage={true}
          currentUserName="John Staff"
        />
      );

      // Click Edit on action 1
      await user.click(screen.getByTestId("edit-action-btn-1"));

      // Verify modal is populated with action 1 data
      expect(screen.getByTestId("action-description-input")).toHaveValue(mockActions[0].description);
      expect(screen.getByTestId("action-result-input")).toHaveValue(mockActions[0].result);

      // Update result field
      await user.clear(screen.getByTestId("action-result-input"));
      await user.type(screen.getByTestId("action-result-input"), "Updated result: Memory tested under heavy load.");

      // Submit
      await user.click(screen.getByTestId("submit-action-taken-btn"));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          101,
          1,
          expect.objectContaining({
            result: "Updated result: Memory tested under heavy load.",
          })
        );
      });
    });
  });

  describe("Requester Read-Only View (canManage = false, AC-03, FR-04)", () => {
    it("renders Actions Taken table in read-only mode, completely hiding Add and Edit controls (AC-03)", () => {
      render(
        <ActionsTakenSection
          ticketId={101}
          actions={mockActions}
          canManage={false}
        />
      );

      // Header and actions are visible
      expect(screen.getByText("Actions Taken")).toBeInTheDocument();
      expect(screen.getByText("Tested memory modules and motherboard power rails with multimeter.")).toBeInTheDocument();
      expect(screen.getByText("John Staff")).toBeInTheDocument();

      // Add and Edit buttons are strictly NOT rendered
      expect(screen.queryByTestId("add-action-taken-btn")).not.toBeInTheDocument();
      expect(screen.queryByTestId("edit-action-btn-1")).not.toBeInTheDocument();
      expect(screen.queryByTestId("edit-action-btn-2")).not.toBeInTheDocument();
    });

    it("displays clean empty state for Requester when no actions have been taken yet", () => {
      render(
        <ActionsTakenSection
          ticketId={101}
          actions={[]}
          canManage={false}
        />
      );

      expect(screen.getByTestId("actions-taken-empty")).toBeInTheDocument();
      expect(screen.queryByTestId("add-action-taken-btn")).not.toBeInTheDocument();
    });
  });
});
