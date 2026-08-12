import { useState } from "react";
import { checkSystem, Category } from "./api.js";

type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleCheck() {
    setState("loading");
    setErrorMessage("");
    try {
      const result = await checkSystem();
      setCategories(result.categories);
      setState("success");
    } catch {
      setState("error");
      setErrorMessage("Unable to connect to TokTickIT API");
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      <button
        className="btn btn-success mb-4"
        onClick={handleCheck}
        disabled={state === "loading"}
      >
        {state === "loading" ? "Loading…" : "Check System"}
      </button>

      {state === "loading" && (
        <div className="text-muted">
          <em>Loading system status...</em>
        </div>
      )}

      {state === "success" && (
        <div>
          <p className="fw-semibold">
            System Status: <span className="text-success">Online</span>
          </p>
          {categories.length > 0 && (
            <div>
              <p className="fw-semibold mb-2">Supported Request Categories:</p>
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

      {state === "error" && (
        <div>
          <p className="fw-semibold">
            System Status: <span className="text-danger">Offline</span>
          </p>
          <div className="alert alert-danger" role="alert">
            {errorMessage || "Unable to connect to TokTickIT API"}
          </div>
        </div>
      )}
    </div>
  );
}
