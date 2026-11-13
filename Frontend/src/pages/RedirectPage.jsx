import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

function RedirectPage() {
  const { id } = useParams(); // shortCode from URL

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const backendUrl = (import.meta.env.BACKEND || "http://localhost:5000").replace(/\/$/, "");

  const fetchAndRedirect = async (providedPassword = "") => {
    try {
      setError("");
      setPasswordError("");

      let url = `${backendUrl}/api/url/${id}`;
      if (providedPassword) {
        url += `?password=${encodeURIComponent(providedPassword)}`;
      }

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      // Case 1: Password required to unlock
      if (data.passwordRequired) {
        setNeedsPassword(true);
        setLoading(false);
        return;
      }

      // Case 2: Error (Expired, Inactive, Not Found, or Wrong Password)
      if (!response.ok) {
        if (needsPassword) {
          setPasswordError(data.message || "Incorrect password");
          setLoading(false);
          return;
        }
        throw new Error(data.message || "Unable to access this link");
      }

      // Case 3: Success! Redirect to original URL
      if (data.originalUrl) {
        window.location.href = data.originalUrl;
      } else {
        throw new Error("Invalid destination URL");
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAndRedirect();
    }
  }, [id]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchAndRedirect(password);
  };

  return (
    <div className="auth-container">
      {/* Loading State */}
      {loading && !needsPassword && !error && (
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h2>Redirecting...</h2>
          <p style={{ marginTop: "10px", color: "#666" }}>
            Please wait, taking you to your destination...
          </p>
        </div>
      )}

      {/* Password Prompt State */}
      {needsPassword && !error && (
        <div className="auth-card">
          <h2>Protected Link</h2>
          <p style={{ marginBottom: "15px", color: "#666", fontSize: "14px" }}>
            This short link is passcode-protected. Enter the password to continue:
          </p>

          {passwordError && (
            <p style={{ color: "red", marginBottom: "12px", fontSize: "14px" }}>
              {passwordError}
            </p>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="linkPassword">Password</label>
              <input
                id="linkPassword"
                type="password"
                placeholder="Enter passcode"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Checking..." : "Unlock & Continue"}
            </button>
          </form>

          <div className="auth-footer" style={{ marginTop: "15px" }}>
            <Link to="/home">Go to Home</Link>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h2 style={{ color: "#dc3545" }}>Link Unavailable</h2>
          <p style={{ margin: "15px 0", color: "#555" }}>{error}</p>
          <Link to="/home">
            <button className="btn-primary" style={{ maxWidth: "200px" }}>
              Go to Home
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default RedirectPage;

