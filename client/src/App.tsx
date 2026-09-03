import { useState, useEffect } from "react";
import { RequesterUser, checkSystem, Category } from "./api.js";
import DevelopmentRequesterSelector from "./components/DevelopmentRequesterSelector.js";
import CreateTicket from "./components/CreateTicket.js";
import MyTickets from "./components/MyTickets.js";

type UiState = "idle" | "loading" | "success" | "error";

export const DEFAULT_REQUESTER: RequesterUser = {
  id: 1,
  name: "Supanut Watthanasimakorn",
  email: "supanut.w@toktickit.local",
};

export default function App() {
  const [currentRequester, setCurrentRequester] = useState<RequesterUser>(DEFAULT_REQUESTER);
  const [showSelector, setShowSelector] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "my-tickets" | "create-ticket">("dashboard");

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
    try {
      localStorage.setItem("toktickit_selected_requester", JSON.stringify(requester));
    } catch {
      // ignore
    }
  }

  function handleChangeRequester() {
    setShowSelector(true);
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
      <DevelopmentRequesterSelector
        onSelect={handleSelectRequester}
        onCancel={() => setShowSelector(false)}
      />
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
          <span
            className="navbar-brand fw-bold d-flex align-items-center mb-0"
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="me-2 fs-5">⏱️</span> Service Desk
          </span>

          <div className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto mb-0">
              <li className="nav-item">
                <button
                  type="button"
                  className={`btn btn-link nav-link px-3 py-1 ${
                    activeTab === "dashboard" ? "active fw-bold text-white" : "text-white-50"
                  }`}
                  style={{ textDecoration: "none" }}
                  onClick={() => setActiveTab("dashboard")}
                >
                  🏠 Dashboard
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`btn btn-link nav-link px-3 py-1 ${
                    activeTab === "my-tickets" ? "active fw-bold text-white" : "text-white-50"
                  }`}
                  style={{ textDecoration: "none" }}
                  onClick={() => setActiveTab("my-tickets")}
                >
                  📋 My Tickets
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`btn btn-link nav-link px-3 py-1 ${
                    activeTab === "create-ticket" ? "active fw-bold text-white" : "text-white-50"
                  }`}
                  style={{ textDecoration: "none" }}
                  onClick={() => setActiveTab("create-ticket")}
                >
                  ➕ Create Ticket
                </button>
              </li>
            </ul>

            {/* Active Requester Display & Switch Action */}
            <div className="d-flex align-items-center bg-white bg-opacity-10 px-3 py-1 rounded-pill">
              <span className="me-2 text-white small">👤 {currentRequester.name}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-light py-0 px-2 rounded-pill ms-2"
                style={{ fontSize: "0.75rem" }}
                onClick={handleChangeRequester}
              >
                Change Requester
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="container py-4" style={{ maxWidth: 960 }}>
        {/* Render Views Based on Active Tab */}
        {activeTab === "create-ticket" && (
          <CreateTicket
            currentRequester={currentRequester}
            onCancel={() => setActiveTab("my-tickets")}
            onTicketCreated={() => setActiveTab("my-tickets")}
          />
        )}

        {activeTab === "my-tickets" && (
          <MyTickets
            currentRequester={currentRequester}
            onCreateNew={() => setActiveTab("create-ticket")}
          />
        )}

        {activeTab === "dashboard" && (
          <>
            {/* Banner showing active requester context */}
            <div
              className="card border-0 shadow-sm p-4 mb-4"
              style={{ backgroundColor: "#FFFFFF", borderRadius: 12 }}
            >
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <div>
                  <h2 className="h4 fw-bold mb-1" style={{ color: "#006B3C" }}>
                    Welcome, {currentRequester.name}
                  </h2>
                  <p className="text-muted mb-0 small">
                    Logged in as simulated requester: <span>{currentRequester.name}</span>
                  </p>
                </div>
                <div className="d-flex gap-2 mt-2 mt-sm-0">
                  <button
                    type="button"
                    className="btn btn-sm px-3 text-white"
                    style={{ backgroundColor: "#006B3C" }}
                    onClick={() => setActiveTab("my-tickets")}
                  >
                    📋 View My Tickets
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success px-3"
                    onClick={() => setActiveTab("create-ticket")}
                  >
                    ➕ New Ticket
                  </button>
                </div>
              </div>
            </div>

            {/* System Health Check & Categories Verification */}
            <div className="card border-0 shadow-sm p-4" style={{ backgroundColor: "#FFFFFF", borderRadius: 12 }}>
              <h1 className="h4 fw-bold mb-3" style={{ color: "#006B3C" }}>
                TokTickIT <span className="text-success">IT Service Desk</span>
              </h1>

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
          </>
        )}
      </main>
    </div>
  );
}
