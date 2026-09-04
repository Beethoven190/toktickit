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

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

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
          limit: 10,
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
  }, [currentRequester.id, searchTerm, selectedCategory, selectedPriority, selectedStatus, page]);

  function handleClearFilters() {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedPriority("");
    setSelectedStatus("");
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
        return <span className="badge bg-danger text-white">🔴 High</span>;
      case "MEDIUM":
        return <span className="badge bg-warning text-dark">🟡 Medium</span>;
      case "LOW":
        return (
          <span className="badge" style={{ backgroundColor: "#EAF6EF", color: "#006B3C" }}>
            🟢 Low
          </span>
        );
      default:
        return <span className="badge bg-secondary">{priority}</span>;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "NEW":
        return <span className="badge bg-success text-white">New</span>;
      case "OPEN":
      case "IN_PROGRESS":
        return <span className="badge bg-primary text-white">In Progress</span>;
      case "RESOLVED":
      case "CLOSED":
        return <span className="badge bg-secondary text-white">Resolved</span>;
      default:
        return <span className="badge bg-info text-dark">{status}</span>;
    }
  }

  return (
    <div
      className="card border-0 shadow-sm p-4 p-md-5 my-4"
      style={{ backgroundColor: "#FFFFFF", borderRadius: 12 }}
    >
      {/* Header Bar */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 pb-3 border-bottom">
        <div>
          <h2 className="h4 fw-bold mb-1" style={{ color: "#006B3C" }}>
            My Tickets
          </h2>
          <p className="text-muted small mb-0">
            Tickets submitted by <strong>{currentRequester.name}</strong> ({totalCount} total)
          </p>
        </div>
        <button
          type="button"
          className="btn px-4 text-white d-flex align-items-center"
          style={{ backgroundColor: "#006B3C" }}
          onClick={onCreateNew}
        >
          ➕ Create Ticket
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-3 mb-4 rounded" style={{ backgroundColor: "#F5F7F6" }}>
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">🔍</span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by summary or ticket #..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="col-6 col-md-2 text-end">
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            )}
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
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" style={{ width: "16%" }}>Ticket #</th>
                  <th scope="col" style={{ width: "14%" }}>Date</th>
                  <th scope="col">Summary</th>
                  <th scope="col" style={{ width: "14%" }}>Category</th>
                  <th scope="col" style={{ width: "12%" }}>Priority</th>
                  <th scope="col" style={{ width: "12%" }}>Status</th>
                  <th scope="col" className="text-end" style={{ width: "10%" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="fw-bold text-success font-monospace">
                        {t.ticketNumber}
                      </span>
                    </td>
                    <td className="text-muted small">{formatDate(t.createdAt)}</td>
                    <td>
                      <div className="fw-semibold text-truncate" style={{ maxWidth: 280 }}>
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
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        onClick={() => onSelectTicket && onSelectTicket(t)}
                      >
                        View
                      </button>
                    </td>
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
                style={{ borderRadius: 8 }}
                onClick={() => onSelectTicket && onSelectTicket(t)}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold text-success font-monospace">{t.ticketNumber}</span>
                  <div>
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
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} tickets)
            </small>

            <div className="btn-group">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Previous
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
