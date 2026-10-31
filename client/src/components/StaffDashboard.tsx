import { useState, useEffect, useCallback } from "react";
import {
  StaffDashboardData,
  StaffDashboardRecentTicket,
  getStaffDashboard,
} from "../api.js";

interface StaffDashboardProps {
  onNavigateToQueue: (filters?: { status?: string; owner?: string; search?: string }) => void;
  onNavigateToCreate: () => void;
  onSelectTicket?: (ticketId: number) => void;
}

export default function StaffDashboard({
  onNavigateToQueue,
  onNavigateToCreate,
  onSelectTicket,
}: StaffDashboardProps) {
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const result = await getStaffDashboard();
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load staff dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading && !data) {
    return (
      <div className="container py-5 text-center" data-testid="dashboard-loading">
        <div className="spinner-border text-success" role="status" style={{ color: "#006B3C" }}>
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
        <div className="text-muted mt-2 small">Loading operational metrics...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="alert alert-danger mx-auto mt-4 p-4 shadow-sm" style={{ maxWidth: 600 }}>
        <h5 className="alert-heading fw-bold">⚠️ Dashboard Error</h5>
        <p className="mb-2">{error}</p>
        <button
          type="button"
          className="btn btn-outline-danger btn-sm"
          onClick={() => loadDashboard()}
        >
          Try Again
        </button>
      </div>
    );
  }

  const metrics = data?.metrics;
  const recentTickets: StaffDashboardRecentTicket[] = data?.recentTickets || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return <span className="badge bg-light text-dark border">New</span>;
      case "OPEN":
        return <span className="badge bg-info text-dark">Open</span>;
      case "IN_PROGRESS":
        return <span className="badge bg-primary">In Progress</span>;
      case "WAITING_FOR_REQUESTER":
        return <span className="badge bg-warning text-dark">Waiting for Requester</span>;
      case "RESOLVED":
        return <span className="badge bg-success">Resolved</span>;
      case "CLOSED":
        return <span className="badge bg-secondary">Closed</span>;
      case "CANCELLED":
        return <span className="badge bg-danger">Cancelled</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "CRITICAL":
      case "HIGH":
        return <span className="badge bg-danger text-white">{priority}</span>;
      case "MEDIUM":
        return <span className="badge bg-warning text-dark">{priority}</span>;
      case "LOW":
        return <span className="badge bg-secondary text-white">{priority}</span>;
      default:
        return <span className="badge bg-light text-dark border">{priority || "NORMAL"}</span>;
    }
  };

  return (
    <div className="staff-dashboard" data-testid="staff-dashboard">
      {/* 1. Header Banner & Welcome Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-4 pb-2 border-bottom">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">
            Welcome back, {data?.user.name ? data.user.name.split(" ")[0] : "Staff"}!
          </h1>
          <p className="text-muted small mb-0">Here's what's happening with your queue today.</p>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-success d-flex align-items-center gap-2 rounded-pill px-3 shadow-sm"
          style={{ borderColor: "#006B3C", color: "#006B3C" }}
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          data-testid="refresh-dashboard-btn"
        >
          <span className={refreshing ? "spinner-border spinner-border-sm" : ""}>
            {!refreshing && "🔄"}
          </span>
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* 2. KPI Metrics Grid (5 Cards - Screen 8.1 / AC-04 / AC-09) */}
      <div className="row g-3 mb-4">
        {/* Card 1: New */}
        <div className="col-12 col-sm-6 col-lg">
          <div
            className="card border shadow-sm h-100 p-3 rounded-3 cursor-pointer text-decoration-none"
            style={{ borderColor: "#E2E8F0", cursor: "pointer", transition: "transform 0.15s, border-color 0.15s" }}
            onClick={() => onNavigateToQueue({ status: "NEW" })}
            data-testid="kpi-card-new"
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-bold small text-uppercase" style={{ fontSize: "11px" }}>New</span>
              <span className="fs-5">📥</span>
            </div>
            <div className="h2 fw-bold text-dark mb-1" data-testid="kpi-count-new">
              {metrics?.new.count ?? 0}
            </div>
            <div className="small text-muted" style={{ fontSize: "11px" }}>
              <span className="text-success fw-semibold">{metrics?.new.delta}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Open */}
        <div className="col-12 col-sm-6 col-lg">
          <div
            className="card border shadow-sm h-100 p-3 rounded-3 cursor-pointer"
            style={{ borderColor: "#E2E8F0", cursor: "pointer" }}
            onClick={() => onNavigateToQueue({ status: "OPEN" })}
            data-testid="kpi-card-open"
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-bold small text-uppercase" style={{ fontSize: "11px" }}>Open</span>
              <span className="fs-5">📂</span>
            </div>
            <div className="h2 fw-bold text-dark mb-1" data-testid="kpi-count-open">
              {metrics?.open.count ?? 0}
            </div>
            <div className="small text-muted" style={{ fontSize: "11px" }}>
              <span className="text-success fw-semibold">{metrics?.open.delta}</span>
            </div>
          </div>
        </div>

        {/* Card 3: In Progress */}
        <div className="col-12 col-sm-6 col-lg">
          <div
            className="card border shadow-sm h-100 p-3 rounded-3 cursor-pointer"
            style={{ borderColor: "#E2E8F0", cursor: "pointer" }}
            onClick={() => onNavigateToQueue({ status: "IN_PROGRESS" })}
            data-testid="kpi-card-inprogress"
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-bold small text-uppercase" style={{ fontSize: "11px" }}>In Progress</span>
              <span className="fs-5">⚙️</span>
            </div>
            <div className="h2 fw-bold text-dark mb-1" data-testid="kpi-count-inprogress">
              {metrics?.inProgress.count ?? 0}
            </div>
            <div className="small text-muted" style={{ fontSize: "11px" }}>
              <span className="text-secondary fw-semibold">{metrics?.inProgress.delta}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Waiting for Requester */}
        <div className="col-12 col-sm-6 col-lg">
          <div
            className="card border shadow-sm h-100 p-3 rounded-3 cursor-pointer"
            style={{ borderColor: "#E2E8F0", cursor: "pointer" }}
            onClick={() => onNavigateToQueue({ status: "WAITING_FOR_REQUESTER" })}
            data-testid="kpi-card-waiting"
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-bold small text-uppercase" style={{ fontSize: "11px" }}>Waiting for Requester</span>
              <span className="fs-5">⏳</span>
            </div>
            <div className="h2 fw-bold text-dark mb-1" data-testid="kpi-count-waiting">
              {metrics?.waitingForRequester.count ?? 0}
            </div>
            <div className="small text-muted" style={{ fontSize: "11px" }}>
              <span className="text-muted fw-semibold">{metrics?.waitingForRequester.delta}</span>
            </div>
          </div>
        </div>

        {/* Card 5: My Assigned (AC-09) */}
        <div className="col-12 col-sm-6 col-lg">
          <div
            className="card border shadow-sm h-100 p-3 rounded-3 cursor-pointer"
            style={{
              borderColor: "#006B3C",
              backgroundColor: "#EAF6EF",
              cursor: "pointer",
            }}
            onClick={() => onNavigateToQueue({ owner: "me" })}
            data-testid="kpi-card-assigned"
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="fw-bold small text-uppercase" style={{ color: "#006B3C", fontSize: "11px" }}>
                My Assigned
              </span>
              <span className="fs-5">👤</span>
            </div>
            <div className="h2 fw-bold mb-1" style={{ color: "#006B3C" }} data-testid="kpi-count-assigned">
              {metrics?.myAssigned.count ?? 0}
            </div>
            <div className="small" style={{ fontSize: "11px", color: "#0B7A46" }}>
              <span className="fw-semibold">{metrics?.myAssigned.delta}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Operational Content Section (2 Columns) */}
      <div className="row g-4">
        {/* Left Column (70%): Recent Tickets */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0 rounded-3 h-100 bg-white">
            <div className="card-header bg-white border-bottom py-3 px-3 px-md-4 d-flex justify-content-between align-items-center">
              <h2 className="h6 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <span>📋</span>
                <span>My Recent Tickets</span>
              </h2>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                style={{ color: "#006B3C" }}
                onClick={() => onNavigateToQueue()}
                data-testid="view-all-queue-link"
              >
                View all →
              </button>
            </div>

            <div className="card-body p-0">
              {recentTickets.length === 0 ? (
                <div
                  className="p-4 text-center text-muted"
                  data-testid="empty-recent-tickets"
                >
                  <div className="fs-3 mb-1">🎉</div>
                  <div className="fw-semibold">No recent tickets to display.</div>
                  <div className="small">Your queue is clear!</div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" data-testid="recent-tickets-table">
                    <thead className="table-light text-muted small">
                      <tr>
                        <th className="px-3 py-2">Ticket #</th>
                        <th className="py-2">Summary</th>
                        <th className="py-2">Category</th>
                        <th className="py-2">Priority</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 px-3 text-end">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTickets.map((t) => (
                        <tr
                          key={t.id}
                          className="cursor-pointer"
                          style={{ cursor: "pointer" }}
                          onClick={() => onSelectTicket && onSelectTicket(t.id)}
                          data-testid={`recent-ticket-row-${t.id}`}
                        >
                          <td className="px-3 font-monospace fw-bold small text-success" style={{ color: "#006B3C" }}>
                            {t.ticketNumber}
                          </td>
                          <td className="small fw-semibold text-dark text-truncate" style={{ maxWidth: 220 }}>
                            {t.summary}
                          </td>
                          <td className="small text-muted">{t.category}</td>
                          <td>{getPriorityBadge(t.itPriority)}</td>
                          <td>{getStatusBadge(t.status)}</td>
                          <td className="px-3 text-end small text-muted">
                            {new Date(t.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (30%): Quick Actions Card */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 rounded-3 bg-white p-3 p-md-4">
            <h2 className="h6 fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <span>⚡</span>
              <span>Quick Actions</span>
            </h2>
            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn text-white fw-semibold d-flex align-items-center justify-content-center gap-2 py-2 shadow-sm rounded-2"
                style={{ backgroundColor: "#006B3C" }}
                onClick={onNavigateToCreate}
                data-testid="quick-action-create"
              >
                <span>+</span>
                <span>Create Ticket</span>
              </button>
              <button
                type="button"
                className="btn btn-outline-success fw-semibold d-flex align-items-center justify-content-center gap-2 py-2 rounded-2"
                style={{ borderColor: "#006B3C", color: "#006B3C" }}
                onClick={() => onNavigateToQueue({ search: "" })}
                data-testid="quick-action-search"
              >
                <span>🔍</span>
                <span>Search Tickets</span>
              </button>
              <button
                type="button"
                className="btn btn-light border fw-semibold d-flex align-items-center justify-content-center gap-2 py-2 rounded-2"
                onClick={() => onNavigateToQueue()}
                data-testid="quick-action-queue"
              >
                <span>📋</span>
                <span>My Queue</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

