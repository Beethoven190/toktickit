import { useState, useEffect } from "react";
import {
  Ticket,
  Category,
  RequesterUser,
  getMyTickets,
  getCategories,
} from "../api.js";

interface Props {
  currentRequester: RequesterUser;
  onCreateNew: () => void;
  onSelectTicket?: (ticket: Ticket) => void;
}

type SortField = "createdAt" | "ticketNumber" | "requestedPriority" | "currentStatus" | "updatedAt";
type SortOrder = "asc" | "desc";

export default function MyTickets({ currentRequester, onCreateNew, onSelectTicket }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    async function loadFilterCategories() {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch {
        // non-blocking for category filters
      }
    }
    loadFilterCategories();
  }, []);

  useEffect(() => {
    async function fetchTickets() {
      setLoading(true);
      setError("");
      try {
        const res = await getMyTickets({
          requesterId: currentRequester.id,
          search: searchTerm.trim() || undefined,
          categoryId: selectedCategory || undefined,
          priority: selectedPriority || undefined,
          status: selectedStatus || undefined,
          page,
          limit: ITEMS_PER_PAGE,
          sort: sortField,
          order: sortOrder,
        });

        setTickets(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.total);
      } catch {
        setError("Failed to load tickets. Please ensure the backend server is running.");
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, [currentRequester.id, searchTerm, selectedCategory, selectedPriority, selectedStatus, page, sortField, sortOrder]);

  function handleClearFilters() {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedPriority("");
    setSelectedStatus("");
    setPage(1);
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedCategory !== "" ||
    selectedPriority !== "" ||
    selectedStatus !== "";

  function formatDate(iso: string) {
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  function getPriorityBadge(priority: string) {
    switch (priority) {
      case "HIGH":
        return <span className="badge bg-danger text-white">High</span>;
      case "MEDIUM":
        return <span className="badge bg-warning text-dark">Medium</span>;
      case "LOW":
        return (
          <span className="badge" style={{ backgroundColor: "#EAF6EF", color: "#006B3C", border: "1px solid #B2D8C4" }}>
            Low
          </span>
        );
      default:
        return <span className="badge bg-secondary">{priority}</span>;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "NEW":
        return <span className="badge" style={{ backgroundColor: "#EAF6EF", color: "#006B3C", border: "1px solid #B2D8C4" }}>New</span>;
      case "OPEN":
        return <span className="badge bg-primary text-white">Open</span>;
      case "IN_PROGRESS":
        return <span className="badge bg-primary text-white">In Progress</span>;
      case "PENDING":
        return <span className="badge bg-warning text-dark">Pending</span>;
      case "RESOLVED":
        return <span className="badge bg-secondary text-white">Resolved</span>;
      case "CLOSED":
        return <span className="badge bg-dark text-white">Closed</span>;
      default:
        return <span className="badge bg-info text-dark">{status}</span>;
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) {
      return <span className="ms-1 text-muted" style={{ fontSize: "0.65rem", opacity: 0.5 }}>↕</span>;
    }
    return (
      <span className="ms-1" style={{ fontSize: "0.7rem", color: "#006B3C" }}>
        {sortOrder === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  // Build page number buttons
  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [];
    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }
    return pages;
  }

  const startItem = totalCount === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(page * ITEMS_PER_PAGE, totalCount);

  return (
    <div
      className="card border-0 shadow-sm p-4 p-md-5 my-4"
      style={{ backgroundColor: "#FFFFFF", borderRadius: 12 }}
    >
      {/* Header Bar with Clear Filters + Create Ticket */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 pb-3 border-bottom">
        <div>
          <h2 className="h4 fw-bold mb-1" style={{ color: "#006B3C" }}>
            My Tickets
          </h2>
          <p className="text-muted small mb-0">
            View and track all of your support requests.
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-1"
              onClick={handleClearFilters}
            >
              <span>↺</span> Clear Filters
            </button>
          )}
          <button
            type="button"
            className="btn px-4 text-white d-flex align-items-center gap-1"
            style={{ backgroundColor: "#006B3C" }}
            onClick={onCreateNew}
          >
            ＋ Create Ticket
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-3 mb-4 rounded" style={{ backgroundColor: "#F5F7F6" }}>
        <div className="row g-2 align-items-center">
          {/* Search */}
          <div className="col-12 col-md-12 col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">🔍</span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by ticket number or summary..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Category */}
          <div className="col-6 col-md-3 col-lg-2">
            <select
              className="form-select form-select-sm"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              aria-label="Category filter"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Requested Priority */}
          <div className="col-6 col-md-3 col-lg-2">
            <select
              className="form-select form-select-sm"
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              aria-label="Requested Priority filter"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* Current Status */}
          <div className="col-6 col-md-3 col-lg-2">
            <select
              className="form-select form-select-sm"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Status filter"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border spinner-border-sm text-success me-2" role="status" />
          <span>Loading tickets...</span>
        </div>
      )}

      {/* Empty State (0 tickets submitted by user) */}
      {!loading && !error && tickets.length === 0 && !hasActiveFilters && (
        <div className="text-center py-5">
          <div style={{ fontSize: 48 }} className="mb-3">
            📋
          </div>
          <h3 className="h5 fw-bold mb-2" style={{ color: "#006B3C" }}>
            No tickets submitted yet
          </h3>
          <p className="text-muted small mb-4">
            You haven't submitted any support requests. Click below to create your first ticket.
          </p>
          <button
            type="button"
            className="btn px-4 text-white"
            style={{ backgroundColor: "#006B3C" }}
            onClick={onCreateNew}
          >
            ➕ Create Ticket
          </button>
        </div>
      )}

      {/* No-Results State (filters returned 0 results) */}
      {!loading && !error && tickets.length === 0 && hasActiveFilters && (
        <div className="text-center py-5">
          <div style={{ fontSize: 40 }} className="mb-2">
            🔎
          </div>
          <h3 className="h5 fw-bold mb-2">No tickets match your search filters</h3>
          <p className="text-muted small mb-3">
            Try adjusting your search query or clearing some of the filters.
          </p>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleClearFilters}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Data Display: Desktop Table View (>= 768px) */}
      {!loading && !error && tickets.length > 0 && (
        <>
          <div className="table-responsive d-none d-md-block">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.9rem" }}>
              <thead className="table-light">
                <tr>
                  <th
                    scope="col"
                    style={{ width: "15%", cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("ticketNumber")}
                  >
                    Ticket No. <SortIcon field="ticketNumber" />
                  </th>
                  <th
                    scope="col"
                    style={{ width: "12%", cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("createdAt")}
                  >
                    Created Date <SortIcon field="createdAt" />
                  </th>
                  <th scope="col">Summary</th>
                  <th scope="col" style={{ width: "11%" }}>Category</th>
                  <th
                    scope="col"
                    style={{ width: "11%", cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("requestedPriority")}
                  >
                    Requested Priority <SortIcon field="requestedPriority" />
                  </th>
                  <th
                    scope="col"
                    style={{ width: "11%", cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("currentStatus")}
                  >
                    Current Status <SortIcon field="currentStatus" />
                  </th>
                  <th
                    scope="col"
                    style={{ width: "11%", cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("updatedAt")}
                  >
                    Last Updated <SortIcon field="updatedAt" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => onSelectTicket && onSelectTicket(t)}
                  >
                    <td>
                      <span
                        className="fw-bold font-monospace"
                        style={{ color: "#006B3C" }}
                      >
                        {t.ticketNumber}
                      </span>
                    </td>
                    <td className="text-muted small">{formatDate(t.createdAt)}</td>
                    <td>
                      <div className="fw-semibold text-truncate" style={{ maxWidth: 240 }}>
                        {t.summary}
                      </div>
                      <small className="text-muted">{t.relatedSystem?.name}</small>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {t.category?.name || "General"}
                      </span>
                    </td>
                    <td>{getPriorityBadge(t.requestedPriority)}</td>
                    <td>{getStatusBadge(t.currentStatus)}</td>
                    <td className="text-muted small">{formatDate(t.updatedAt || t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Data Display: Mobile Card View (< 768px) */}
          <div className="d-md-none">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="card border p-3 mb-3 shadow-sm"
                style={{ borderRadius: 8, cursor: "pointer" }}
                onClick={() => onSelectTicket && onSelectTicket(t)}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold font-monospace" style={{ color: "#006B3C" }}>{t.ticketNumber}</span>
                  <div className="d-flex gap-1">
                    {getPriorityBadge(t.requestedPriority)} {getStatusBadge(t.currentStatus)}
                  </div>
                </div>
                <h3 className="h6 fw-bold mb-1">{t.summary}</h3>
                <div className="text-muted small mb-2">{t.description.slice(0, 80)}...</div>
                <div className="d-flex justify-content-between align-items-center text-muted small pt-2 border-top">
                  <span>{t.category?.name}</span>
                  <span>{formatDate(t.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-4 border-top mt-3">
            <small className="text-muted">
              Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{" "}
              <strong>{totalCount}</strong> ticket{totalCount !== 1 ? "s" : ""}
            </small>

            <nav aria-label="Ticket list pagination">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    aria-label="Previous page"
                  >
                    ‹ Previous
                  </button>
                </li>

                {getPageNumbers().map((pageNum, idx) =>
                  pageNum === "..." ? (
                    <li key={`ellipsis-${idx}`} className="page-item disabled">
                      <span className="page-link">…</span>
                    </li>
                  ) : (
                    <li key={pageNum} className={`page-item ${page === pageNum ? "active" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => setPage(pageNum as number)}
                        style={page === pageNum ? { backgroundColor: "#006B3C", borderColor: "#006B3C" } : {}}
                      >
                        {pageNum}
                      </button>
                    </li>
                  )
                )}

                <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    aria-label="Next page"
                  >
                    Next ›
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
