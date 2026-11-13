import { useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  // Form states
  const [originalUrl, setOriginalUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isOneTime, setIsOneTime] = useState(false);
  const [password, setPassword] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Read backend URL from env
  const backendUrl = (import.meta.env.BACKEND || "http://localhost:5000").replace(/\/$/, "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/url/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send auth cookie if user is logged in
        body: JSON.stringify({
          originalUrl,
          customCode: customCode || undefined,
          expiresAt: expiresAt || undefined,
          isOneTime,
          password: password || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create short link");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "600px", marginTop: "40px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>URL Shortener</h2>
        <div>
          <Link to="/login" style={{ marginRight: "15px", textDecoration: "none", color: "#007bff" }}>Login</Link>
          <Link to="/signup" style={{ textDecoration: "none", color: "#007bff" }}>Sign Up</Link>
        </div>
      </div>

      {/* URL Shortener Form */}
      <div className="auth-card" style={{ maxWidth: "100%" }}>
        <h3 style={{ marginBottom: "15px" }}>Create Short Link</h3>

        {error && <p style={{ color: "red", marginBottom: "15px", fontSize: "14px" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          {/* Original URL */}
          <div className="form-group">
            <label htmlFor="originalUrl">Original URL *</label>
            <input
              id="originalUrl"
              type="text"
              placeholder="https://example.com/very-long-url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              required
            />
          </div>

          {/* Custom Short Code (Alias) */}
          <div className="form-group">
            <label htmlFor="customCode">Custom Alias (Optional)</label>
            <input
              id="customCode"
              type="text"
              placeholder="e.g. my-cool-link"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
            />
          </div>

          {/* Expiry Date */}
          <div className="form-group">
            <label htmlFor="expiresAt">Expires At (Optional)</label>
            <input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          {/* Password Protection */}
          <div className="form-group">
            <label htmlFor="password">Passcode Protection (Optional)</label>
            <input
              id="password"
              type="password"
              placeholder="Set a password to unlock link"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Is One-Time Link Checkbox */}
          <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
            <input
              id="isOneTime"
              type="checkbox"
              style={{ width: "auto", cursor: "pointer" }}
              checked={isOneTime}
              onChange={(e) => setIsOneTime(e.target.checked)}
            />
            <label htmlFor="isOneTime" style={{ margin: 0, cursor: "pointer" }}>
              One-Time Link (Self-destructs after first click)
            </label>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "15px" }}>
            {loading ? "Generating..." : "Generate Short Link"}
          </button>
        </form>
      </div>

      {/* Generated Result Display */}
      {result && (
        <div className="auth-card" style={{ maxWidth: "100%", marginTop: "20px", border: "2px solid #28a745" }}>
          <h3 style={{ color: "#28a745", marginBottom: "15px" }}>Short Link Created!</h3>

          <div style={{ marginBottom: "12px" }}>
            <strong>Short URL: </strong>
            <a href={result.shortUrl} target="_blank" rel="noreferrer" style={{ color: "#007bff", wordBreak: "break-all" }}>
              {result.shortUrl}
            </a>
          </div>

          <div style={{ marginBottom: "8px", fontSize: "14px" }}>
            <strong>Original URL: </strong>
            <span style={{ color: "#555", wordBreak: "break-all" }}>{result.url.originalUrl}</span>
          </div>

          <div style={{ marginBottom: "8px", fontSize: "14px" }}>
            <strong>Short Code: </strong> {result.url.shortCode}
          </div>

          {result.url.expiresAt && (
            <div style={{ marginBottom: "8px", fontSize: "14px" }}>
              <strong>Expires: </strong> {new Date(result.url.expiresAt).toLocaleString()}
            </div>
          )}

          <div style={{ marginBottom: "12px", fontSize: "14px" }}>
            <strong>One-Time Use: </strong> {result.url.isOneTime ? "Yes" : "No"}
          </div>

          {result.url.qrCode && (
            <div style={{ marginTop: "15px", textAlign: "center" }}>
              <p style={{ fontWeight: "bold", marginBottom: "8px" }}>Scan QR Code:</p>
              <img
                src={result.url.qrCode}
                alt="QR Code"
                style={{ width: "150px", height: "150px", border: "1px solid #ddd", borderRadius: "6px" }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Home;
