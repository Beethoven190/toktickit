import { useState, useEffect, useCallback } from "react";
import {
  StaffQueueTicket,
  StaffQueueParams,
  Category,
  getStaffQueue,
  getCategories,
} from "../api.js";

interface StaffTicketQueueProps {
  onSelectTicket: (ticket: StaffQueueTicket) => void;
}

export default function StaffTicketQueue({ onSelectTicket }: StaffTicketQueueProps) {
  const [tickets, setTickets] = useState<StaffQueueTicket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Counts
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [summaryCounts, setSummaryCounts] = useState({
    all: 0,
    unassigned: 0,
    myTickets: 0,
    inProgress: 0,
  });

  // Filter & Search states
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [quickFilter, setQuickFilter] = useState<string>("all");

  // Sorting
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Load categories
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  // Fetch Queue Data
  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: StaffQueueParams = {
        page,
        limit,
        sort: sortField,
        order: sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedPriority) params.priority = selectedPriority;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedOwner) params.ownerId = selectedOwner;
      if (quickFilter !== "all") params.quickFilter = quickFilter;

      const res = await getStaffQueue(params);
      setTickets(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
      if (res.summaryCounts) {
        setSummaryCounts(res.summaryCounts);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to load ticket queue.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortField, sortOrder, search, selectedCategory, selectedPriority, selectedStatus, selectedOwner, quickFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  function handleQuickFilter(filterKey: string) {
    setQuickFilter(filterKey);
    setPage(1);
    if (filterKey === "unassigned") {
      setSelectedOwner("unassigned");
    } else if (filterKey === "my") {
      setSelectedOwner("me");
    } else if (filterKey === "in-progress") {
      setSelectedStatus("IN_PROGRESS");
    } else {
      setSelectedOwner("");
      setSelectedStatus("");
    }
  }

  function handleResetFilters() {
    setSearch("");
    setSelectedCategory("");
    setSelectedPriority("");
    setSelectedStatus("");
    setSelectedOwner("");
    setQuickFilter("all");
    setSortField("createdAt");
    setSortOrder("desc");
    setPage(1);
  }

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  // Format Helpers
  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderPriorityBadge(prio?: string | null) {
    if (!prio) return <span className="text-muted small">-</span>;
    switch (prio.toUpperCase()) {
      case "HIGH":
        return <span className="badge bg-danger text-white rounded-pill px-2 py-1">High</span>;
      case "MEDIUM":
        return <span className="badge bg-warning text-dark rounded-pill px-2 py-1">Medium</span>;
      case "LOW":
        return <span className="badge bg-secondary text-white rounded-pill px-2 py-1">Low</span>;
      default:
        return <span className="badge bg-light text-dark rounded-pill px-2 py-1">{prio}</span>;
    }
  }

  function renderStatusBadge(status: string) {
    switch (status.toUpperCase()) {
      case "NEW":
        return (
          <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: "#EAF6EF", color: "#006B3C", border: "1px solid #A7F3D0" }}>
            New
          </span>
        );
      case "OPEN":
        return (
          <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
            Open
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: "#EAF6EF", color: "#0B7A46", border: "1px solid #6EE7B7" }}>
            In Progress
          </span>
        );
      case "WAITING_FOR_REQUESTER":
      case "PENDING":
        return (
          <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A" }}>
            Waiting
          </span>
        );
      case "RESOLVED":
        return (
          <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: "#CCFBF1", color: "#0F766E", border: "1px solid #99F6E4" }}>
            Resolved
          </span>
        );
      case "CLOSED":
        return (
          <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1" }}>
            Closed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: "#FFE4E6", color: "#BE123C", border: "1px solid #FECDD3" }}>
            Cancelled
          </span>
        );
      default:
        return <span className="badge bg-light text-dark rounded-pill px-2 py-1">{status}</span>;
    }
  }

  const fromCount = total === 0 ? 0 : (page - 1) * limit + 1;
  const toCount = Math.min(page * limit, total);

  return (
    <div className="container-fluid px-0">
      {/* 1. Page Header & KPI Summary Cards */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
        <div>
          <h1 className="h4 fw-bold mb-1" style={{ color: "#006B3C" }}>
            IT Staff Ticket Queue
          </h1>
          <p className="text-muted small mb-0">
            {total > 0
              ? `Showing ${fromCount} to ${toCount} of ${total} tickets`
              : "No tickets in queue"}
          </p>
        </div>

        {/* Quick KPI Filter Pills */}
        <div className="d-flex flex-wrap gap-2 mt-2 mt-md-0" role="group" aria-label="Queue KPI Filters">
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 ${
              quickFilter === "all" ? "text-white" : "btn-outline-secondary"
            }`}
            style={{
              backgroundColor: quickFilter === "all" ? "#006B3C" : "transparent",
              borderColor: quickFilter === "all" ? "#006B3C" : undefined,
            }}
            onClick={() => handleQuickFilter("all")}
          >
            All <span className="badge bg-light text-dark ms-1 rounded-pill">{summaryCounts.all}</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 ${
              quickFilter === "unassigned" ? "text-white" : "btn-outline-secondary"
            }`}
            style={{
              backgroundColor: quickFilter === "unassigned" ? "#D97706" : "transparent",
              borderColor: quickFilter === "unassigned" ? "#D97706" : undefined,
            }}
            onClick={() => handleQuickFilter("unassigned")}
          >
            Unassigned <span className="badge bg-light text-dark ms-1 rounded-pill">{summaryCounts.unassigned}</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 ${
              quickFilter === "my" ? "text-white" : "btn-outline-secondary"
            }`}
            style={{
              backgroundColor: quickFilter === "my" ? "#006B3C" : "transparent",
              borderColor: quickFilter === "my" ? "#006B3C" : undefined,
            }}
            onClick={() => handleQuickFilter("my")}
          >
            Assigned to Me <span className="badge bg-light text-dark ms-1 rounded-pill">{summaryCounts.myTickets}</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 ${
              quickFilter === "in-progress" ? "text-white" : "btn-outline-secondary"
            }`}
            style={{
              backgroundColor: quickFilter === "in-progress" ? "#0B7A46" : "transparent",
              borderColor: quickFilter === "in-progress" ? "#0B7A46" : undefined,
            }}
            onClick={() => handleQuickFilter("in-progress")}
          >
            In Progress <span className="badge bg-light text-dark ms-1 rounded-pill">{summaryCounts.inProgress}</span>
          </button>
        </div>
      </div>

      {/* 2. Search and Multi-Criteria Filter Bar */}
      <div className="card border-0 shadow-sm mb-3 p-3" style={{ borderRadius: 10, backgroundColor: "#FFFFFF" }}>
        <div className="row g-2 align-items-center">
          {/* Keyword Search */}
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0 text-muted">
                🔍
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search ticket #, summary, requester..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                data-testid="queue-search-input"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              data-testid="queue-category-select"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              data-testid="queue-priority-select"
            >
              <option value="">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              data-testid="queue-status-select"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_REQUESTER">Waiting</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          <div className="col-6 col-md-2 text-end">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={handleResetFilters}
              title="Clear all filters"
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </div>

      {/* 3. Error Alert */}
      {error && (
        <div className="alert alert-danger py-2 small" role="alert">
          {error}
        </div>
      )}

      {/* 4. Table / Cards Container */}
      <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 10, backgroundColor: "#FFFFFF" }}>
        {isLoading ? (
          <div className="py-5 text-center">
            <div className="spinner-border text-success" role="status" style={{ width: "2.5rem", height: "2.5rem" }}>
              <span className="visually-hidden">Loading queue...</span>
            </div>
            <p className="text-muted small mt-2">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-5 text-center text-muted">
            <div className="mb-2" style={{ fontSize: "2rem" }}>📭</div>
            <h6 className="fw-bold">No tickets found</h6>
            <p className="small mb-3">There are no tickets matching your active filter criteria.</p>
            <button
              type="button"
              className="btn btn-sm text-white rounded-pill px-3"
              style={{ backgroundColor: "#006B3C" }}
              onClick={handleResetFilters}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table Presentation (d-none d-md-block) */}
            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover align-middle mb-0" data-testid="staff-queue-table">
                <thead style={{ backgroundColor: "#F8FAFC" }}>
                  <tr className="text-secondary small fw-semibold text-uppercase" style={{ letterSpacing: "0.03em" }}>
                    <th
                      style={{ cursor: "pointer", width: "16%" }}
                      onClick={() => toggleSort("ticketNumber")}
                      className="ps-3"
                    >
                      Ticket No. {sortField === "ticketNumber" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                    </th>
                    <th
                      style={{ cursor: "pointer", width: "14%" }}
                      onClick={() => toggleSort("createdAt")}
                    >
                      Created {sortField === "createdAt" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                    </th>
                    <th style={{ width: "24%" }}>Summary</th>
                    <th
                      style={{ cursor: "pointer", width: "12%" }}
                      onClick={() => toggleSort("category")}
                    >
                      Category {sortField === "category" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                    </th>
                    <th style={{ width: "10%" }}>Req. Prio</th>
                    <th
                      style={{ cursor: "pointer", width: "10%" }}
                      onClick={() => toggleSort("itPriority")}
                    >
                      IT Prio {sortField === "itPriority" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                    </th>
                    <th
                      style={{ cursor: "pointer", width: "11%" }}
                      onClick={() => toggleSort("status")}
                    >
                      Status {sortField === "status" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                    </th>
                    <th
                      style={{ cursor: "pointer", width: "13%" }}
                      onClick={() => toggleSort("owner")}
                      className="pe-3"
                    >
                      Owner {sortField === "owner" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => onSelectTicket(t)}
                      data-testid={`ticket-row-${t.id}`}
                    >
                      <td className="ps-3 font-monospace fw-bold" style={{ color: "#006B3C" }}>
                        {t.ticketNumber}
                      </td>
                      <td className="text-muted small">
                        {formatDate(t.createdAt)}
                      </td>
                      <td>
                        <div
                          className="text-truncate fw-semibold"
                          style={{ maxWidth: 320, color: "#1E293B" }}
                          title={t.summary}
                        >
                          {t.summary}
                        </div>
                        <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                          by {t.requester?.name || "Unknown"}
                        </div>
                      </td>
                      <td className="small text-secondary">
                        {t.category?.name || "-"}
                      </td>
                      <td>{renderPriorityBadge(t.requestedPriority)}</td>
                      <td>{renderPriorityBadge(t.itPriority)}</td>
                      <td>{renderStatusBadge(t.currentStatus)}</td>
                      <td className="pe-3">
                        {t.owner ? (
                          <div className="d-flex align-items-center gap-1">
                            <span
                              className="badge rounded-circle text-white d-inline-flex align-items-center justify-content-center"
                              style={{ width: 22, height: 22, backgroundColor: "#006B3C", fontSize: "0.65rem" }}
                            >
                              {t.owner.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="small fw-semibold text-truncate" style={{ maxWidth: 90 }}>
                              {t.owner.name.split(" ")[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="badge bg-light text-secondary border rounded-pill px-2 py-1 small">
                            Unassigned
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Presentation (d-md-none) */}
            <div className="d-md-none p-2">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="card border shadow-none mb-2 p-3"
                  style={{ borderRadius: 8, cursor: "pointer" }}
                  onClick={() => onSelectTicket(t)}
                  data-testid={`ticket-card-${t.id}`}
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <span className="font-monospace fw-bold" style={{ color: "#006B3C" }}>
                      {t.ticketNumber}
                    </span>
                    {renderStatusBadge(t.currentStatus)}
                  </div>
                  <h6 className="fw-semibold mb-1" style={{ color: "#1E293B" }}>
                    {t.summary}
                  </h6>
                  <div className="d-flex flex-wrap gap-2 align-items-center small text-muted mb-2">
                    <span>📁 {t.category?.name}</span>
                    <span>•</span>
                    <span>Priority: {renderPriorityBadge(t.itPriority || t.requestedPriority)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top small text-muted">
                    <span>Req: {t.requester?.name.split(" ")[0]}</span>
                    <span>
                      {t.owner ? (
                        <span className="text-dark fw-semibold">👤 {t.owner.name.split(" ")[0]}</span>
                      ) : (
                        <span className="text-warning fw-semibold">Unassigned</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 5. Pagination Footer */}
            {totalPages > 1 && (
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center px-3 py-2 border-top bg-light gap-2">
                <span className="text-muted small">
                  Page {page} of {totalPages} ({total} total tickets)
                </span>
                <nav aria-label="Ticket Queue Pagination">
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        &lt; Previous
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                      .map((p, idx, arr) => (
                        <span key={p} className="d-flex">
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <li className="page-item disabled">
                              <span className="page-link border-0">...</span>
                            </li>
                          )}
                          <li className={`page-item ${page === p ? "active" : ""}`}>
                            <button
                              type="button"
                              className="page-link"
                              style={{
                                backgroundColor: page === p ? "#006B3C" : undefined,
                                borderColor: page === p ? "#006B3C" : undefined,
                              }}
                              onClick={() => setPage(p)}
                            >
                              {p}
                            </button>
                          </li>
                        </span>
                      ))}
                    <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                      >
                        Next &gt;
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
