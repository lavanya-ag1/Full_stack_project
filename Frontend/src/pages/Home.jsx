import { useState } from "react";
import Navbar from "../components/Navbar";

function Home() {
  // Form states
  const [originalUrl, setOriginalUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isOneTime, setIsOneTime] = useState(false);
  const [password, setPassword] = useState("");
  const [enableRevenue, setEnableRevenue] = useState(false);

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
          enableRevenue,
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
    <div style={{ minHeight: "100vh", backgroundColor: "#e4e8e5" }}>
      <Navbar />

      <div className="container" style={{ maxWidth: "600px", marginTop: "30px" }}>
        {/* URL Shortener Form */}
        <div className="auth-card" style={{ maxWidth: "100%" }}>
          <h2 style={{ marginBottom: "15px", color: "#111827", fontSize: "22px" }}>
            Create Short Link
          </h2>

          {error && <div className="login-error-badge">{error}</div>}

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

            {/* Revenue Model Checkbox */}
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
              <input
                id="enableRevenue"
                type="checkbox"
                style={{ width: "auto", cursor: "pointer" }}
                checked={enableRevenue}
                onChange={(e) => setEnableRevenue(e.target.checked)}
              />
              <label htmlFor="enableRevenue" style={{ margin: 0, cursor: "pointer", color: "#0d7b74", fontWeight: "bold" }}>
                Enable Revenue (Monetize link with 10s ad interstitial)
              </label>
            </div>

            {/* Submit Button */}
            <button type="submit" className="login-submit-btn" disabled={loading} style={{ marginTop: "15px" }}>
              {loading ? "Generating..." : "Generate Short Link"}
            </button>
          </form>
        </div>

        {/* Generated Result Display */}
        {result && (
          <div className="auth-card" style={{ maxWidth: "100%", marginTop: "20px", border: "2px solid #233c3a" }}>
            <h3 style={{ color: "#233c3a", marginBottom: "15px" }}>Short Link Created!</h3>

            <div style={{ marginBottom: "12px" }}>
              <strong>Short URL: </strong>
              <a href={result.shortUrl} target="_blank" rel="noreferrer" style={{ color: "#0d7b74", wordBreak: "break-all", fontWeight: "600" }}>
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

            <div style={{ marginBottom: "8px", fontSize: "14px" }}>
              <strong>One-Time Use: </strong> {result.url.isOneTime ? "Yes" : "No"}
            </div>

            <div style={{ marginBottom: "12px", fontSize: "14px" }}>
              <strong>Revenue Mode: </strong> {result.url.enableRevenue ? "Enabled (Monetized)" : "Disabled"}
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
    </div>
  );
}

export default Home;
