import { useState, useEffect } from "react";
import { RequesterUser, checkSystem, Category, Ticket } from "./api.js";
import DevelopmentRequesterSelector from "./components/DevelopmentRequesterSelector.js";
import CreateTicket from "./components/CreateTicket.js";
import MyTickets from "./components/MyTickets.js";
import TicketDetail from "./components/TicketDetail.js";

type UiState = "idle" | "loading" | "success" | "error";

export const DEFAULT_REQUESTER: RequesterUser = {
  id: 1,
  name: "Supanut Watthanasimakorn",
  email: "supanut.w@toktickit.local",
};

export default function App() {
  const [currentRequester, setCurrentRequester] = useState<RequesterUser>(DEFAULT_REQUESTER);
  const [showSelector, setShowSelector] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"my-tickets" | "create-ticket" | "dashboard">("my-tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [showSystemCheck, setShowSystemCheck] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

  // Health check state (from Lab 1)
  const [healthState, setHealthState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("toktickit_selected_requester");
      if (saved) {
        setCurrentRequester(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  function handleSelectRequester(requester: RequesterUser) {
    setCurrentRequester(requester);
    setShowSelector(false);
    setSelectedTicketId(null);
    try {
      localStorage.setItem("toktickit_selected_requester", JSON.stringify(requester));
    } catch {
      // ignore
    }
  }

  function handleChangeRequester() {
    setShowSelector(true);
  }

  function handleNavigate(tab: "my-tickets" | "create-ticket") {
    setSelectedTicketId(null);
    setActiveTab(tab);
    setShowSystemCheck(false);
  }

  async function handleCheckSystem() {
    setHealthState("loading");
    setErrorMessage("");
    try {
      const result = await checkSystem();
      setCategories(result.categories);
      setHealthState("success");
    } catch {
      setHealthState("error");
      setErrorMessage("Unable to connect to TokTickIT API");
    }
  }

  if (showSelector) {
    return (
      <div className="min-vh-100" style={{ backgroundColor: "#F5F7F6" }}>
        {/* Top Application Shell Navbar */}
        <nav
          className="navbar navbar-expand navbar-dark px-3 py-2 shadow-sm"
          style={{ backgroundColor: "#006B3C" }}
        >
          <div className="container-fluid">
            {/* Logo */}
            <span
              className="navbar-brand fw-bold d-flex align-items-center mb-0"
              style={{ cursor: "pointer" }}
              onClick={() => { setShowSelector(false); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="0 0 16 16" className="me-2">
                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
              </svg>
              TokTickIT
            </span>

            <div className="collapse navbar-collapse">
              <ul className="navbar-nav me-auto mb-0">
                <li className="nav-item">
                  <button
                    type="button"
                    className="btn btn-link nav-link px-3 py-1 text-white-50"
                    style={{ textDecoration: "none" }}
                    onClick={() => { setShowSelector(false); handleNavigate("my-tickets"); }}
                  >
                    📋 My Tickets
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className="btn btn-link nav-link px-3 py-1 text-white-50"
                    style={{ textDecoration: "none" }}
                    onClick={() => { setShowSelector(false); handleNavigate("create-ticket"); }}
                  >
                    ➕ Create Ticket
                  </button>
                </li>
              </ul>

              {/* Profile Dropdown (React-controlled) */}
              <div className="position-relative">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light d-flex align-items-center gap-2 rounded-pill px-3"
                  onClick={() => setProfileOpen((o) => !o)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.025 10 8 10c-2.026 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                  </svg>
                  <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentRequester.name.split(" ")[0]}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                  </svg>
                </button>
                {profileOpen && (
                  <>
                    <div
                      style={{ position: "fixed", inset: 0, zIndex: 1040 }}
                      onClick={() => setProfileOpen(false)}
                    />
                    <ul
                      className="dropdown-menu dropdown-menu-end shadow border-0 show"
                      style={{ minWidth: 220, position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 1050 }}
                    >
                      <li>
                        <div className="px-3 py-2 border-bottom">
                          <div className="fw-bold small" style={{ color: "#006B3C" }}>{currentRequester.name}</div>
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>{currentRequester.email}</div>
                        </div>
                      </li>
                      <li>
                        <button
                          className="dropdown-item small"
                          onClick={() => { setProfileOpen(false); handleChangeRequester(); }}
                        >
                          🔄 Change Requester
                        </button>
                      </li>
                      <li><hr className="dropdown-divider my-1" /></li>
                      <li>
                        <button
                          className="dropdown-item small"
                          onClick={() => { setProfileOpen(false); setShowSystemCheck(true); setShowSelector(false); }}
                        >
                          🖥️ System Check (Lab 1)
                        </button>
                      </li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Breadcrumbs */}
        <div className="container py-2" style={{ maxWidth: 960 }}>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 small">
              <li className="breadcrumb-item">
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none"
                  style={{ color: "#006B3C" }}
                  onClick={() => setShowSelector(false)}
                >
                  🏠
                </button>
              </li>
              <li className="breadcrumb-item active text-muted" aria-current="page">
                Development Requester Selection
              </li>
            </ol>
          </nav>
        </div>

        <main className="container py-2" style={{ maxWidth: 960 }}>
          <DevelopmentRequesterSelector
            onSelect={handleSelectRequester}
            onCancel={() => setShowSelector(false)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#F5F7F6" }}>
      {/* Top Application Shell Navbar (Zen Green Theme) */}
      <nav
        className="navbar navbar-expand navbar-dark px-3 py-2 shadow-sm"
        style={{ backgroundColor: "#006B3C" }}
      >
        <div className="container-fluid">
          {/* Logo */}
          <span
            className="navbar-brand fw-bold d-flex align-items-center mb-0"
            style={{ cursor: "pointer" }}
            onClick={() => handleNavigate("my-tickets")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="0 0 16 16" className="me-2">
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
            </svg>
            TokTickIT
          </span>

          <div className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto mb-0">
              <li className="nav-item">
                <button
                  type="button"
                  className={`btn btn-link nav-link px-3 py-1 ${
                    (activeTab === "my-tickets" || selectedTicketId !== null) && !showSystemCheck
                      ? "active fw-bold text-white border-bottom border-white border-2"
                      : "text-white-50"
                  }`}
                  style={{ textDecoration: "none" }}
                  onClick={() => handleNavigate("my-tickets")}
                >
                  📋 My Tickets
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`btn btn-link nav-link px-3 py-1 ${
                    activeTab === "create-ticket" && selectedTicketId === null && !showSystemCheck
                      ? "active fw-bold text-white border-bottom border-white border-2"
                      : "text-white-50"
                  }`}
                  style={{ textDecoration: "none" }}
                  onClick={() => handleNavigate("create-ticket")}
                >
                  ➕ Create Ticket
                </button>
              </li>
            </ul>

            {/* Profile Dropdown (React-controlled) */}
            <div className="position-relative">
              <button
                type="button"
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-2 rounded-pill px-3"
                onClick={() => setProfileOpen((o) => !o)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.025 10 8 10c-2.026 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                </svg>
                <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentRequester.name.split(" ")[0]}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                </svg>
              </button>
              {profileOpen && (
                <>
                  {/* Backdrop to close on outside click */}
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 1040 }}
                    onClick={() => setProfileOpen(false)}
                  />
                  <ul
                    className="dropdown-menu dropdown-menu-end shadow border-0 show"
                    style={{ minWidth: 220, position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 1050 }}
                  >
                    <li>
                      <div className="px-3 py-2 border-bottom">
                        <div className="fw-bold small" style={{ color: "#006B3C" }}>{currentRequester.name}</div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>{currentRequester.email}</div>
                      </div>
                    </li>
                    <li>
                      <button
                        className="dropdown-item small"
                        onClick={() => { setProfileOpen(false); handleChangeRequester(); }}
                      >
                        🔄 Change Requester
                      </button>
                    </li>
                    <li><hr className="dropdown-divider my-1" /></li>
                    <li>
                      <button
                        className="dropdown-item small"
                        onClick={() => { setProfileOpen(false); setShowSystemCheck(true); setSelectedTicketId(null); }}
                      >
                        🖥️ System Check (Lab 1)
                      </button>
                    </li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="container py-4" style={{ maxWidth: 960 }}>
        {/* Render Views Based on State */}
        {showSystemCheck ? (
          /* System Health Check (Lab 1 feature) */
          <div className="card border-0 shadow-sm p-4 my-4" style={{ backgroundColor: "#FFFFFF", borderRadius: 12 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h1 className="h4 fw-bold mb-0" style={{ color: "#006B3C" }}>
                TokTickIT <span className="text-success">IT Service Desk</span>
              </h1>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => { setShowSystemCheck(false); }}
              >
                ✕ Close
              </button>
            </div>

            <button
              className="btn btn-success mb-3"
              onClick={handleCheckSystem}
              disabled={healthState === "loading"}
              style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
            >
              {healthState === "loading" ? "Checking System..." : "Check System"}
            </button>

            {healthState === "loading" && (
              <div className="text-muted">
                <em>Loading system status...</em>
              </div>
            )}

            {healthState === "success" && (
              <div>
                <p className="fw-semibold mb-3">
                  System Status: <span className="text-success">Online</span>
                </p>
                {categories.length > 0 && (
                  <div>
                    <p className="fw-semibold mb-2 text-muted small">Supported IT Request Categories:</p>
                    <ol className="list-group list-group-numbered">
                      {categories.map((cat) => (
                        <li key={cat.id} className="list-group-item">
                          {cat.name}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {healthState === "error" && (
              <div>
                <p className="fw-semibold mb-2">
                  System Status: <span className="text-danger">Offline</span>
                </p>
                <div className="alert alert-danger mb-0" role="alert">
                  {errorMessage || "Unable to connect to TokTickIT API"}
                </div>
              </div>
            )}
          </div>
        ) : selectedTicketId !== null ? (
          <TicketDetail
            ticketId={selectedTicketId}
            currentRequester={currentRequester}
            onBack={() => setSelectedTicketId(null)}
          />
        ) : activeTab === "create-ticket" ? (
          <CreateTicket
            currentRequester={currentRequester}
            onCancel={() => handleNavigate("my-tickets")}
            onTicketCreated={(t: Ticket) => setSelectedTicketId(t.id)}
          />
        ) : (
          <MyTickets
            currentRequester={currentRequester}
            onCreateNew={() => handleNavigate("create-ticket")}
            onSelectTicket={(t: Ticket) => setSelectedTicketId(t.id)}
          />
        )}
      </main>
    </div>
  );
}
