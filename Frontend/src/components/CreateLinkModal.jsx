import { useState } from "react";

function CreateLinkModal({ isOpen, onClose, onLinkCreated }) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isOneTime, setIsOneTime] = useState(false);
  const [password, setPassword] = useState("");
  const [enableRevenue, setEnableRevenue] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdResult, setCreatedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const backendUrl = (import.meta.env.BACKEND || "http://localhost:5000").replace(/\/$/, "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/url/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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

      setCreatedResult(data);
      if (onLinkCreated) onLinkCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (createdResult?.shortUrl) {
      navigator.clipboard.writeText(createdResult.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setOriginalUrl("");
    setCustomCode("");
    setExpiresAt("");
    setIsOneTime(false);
    setPassword("");
    setEnableRevenue(false);
    setCreatedResult(null);
    setError("");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={resetForm}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3>Create Short Link</h3>
          <button type="button" className="modal-close-btn" onClick={resetForm}>
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {error && <div className="login-error-badge">{error}</div>}

          {!createdResult ? (
            <form onSubmit={handleSubmit}>
              {/* Destination URL */}
              <div className="form-field">
                <label htmlFor="modalOriginalUrl">Destination URL *</label>
                <input
                  id="modalOriginalUrl"
                  type="text"
                  placeholder="https://example.com/very-long-url"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  required
                />
              </div>

              {/* Custom Alias */}
              <div className="form-field">
                <label htmlFor="modalCustomCode">Custom Alias (Optional)</label>
                <input
                  id="modalCustomCode"
                  type="text"
                  placeholder="e.g. my-custom-link"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                />
              </div>

              {/* Expiry Date */}
              <div className="form-field">
                <label htmlFor="modalExpiresAt">Expires At (Optional)</label>
                <input
                  id="modalExpiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              {/* Password Protection */}
              <div className="form-field">
                <label htmlFor="modalPassword">Passcode Protection (Optional)</label>
                <input
                  id="modalPassword"
                  type="password"
                  placeholder="Enter passcode to protect link"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Checkboxes Row */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "14px 0" }}>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={isOneTime}
                    onChange={(e) => setIsOneTime(e.target.checked)}
                  />
                  <span className="checkbox-label">One-Time Link (Self-destructs after first access)</span>
                </label>

                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={enableRevenue}
                    onChange={(e) => setEnableRevenue(e.target.checked)}
                  />
                  <span className="checkbox-label" style={{ color: "#0d7b74", fontWeight: "600" }}>
                    Enable Revenue Mode (Monetize link with 10s ad page)
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="login-submit-btn" style={{ width: "auto", padding: "10px 24px" }} disabled={loading}>
                  {loading ? "Creating..." : "Create Link"}
                </button>
              </div>
            </form>
          ) : (
            <div className="link-success-view">
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>🎉</div>
                <h4 style={{ fontSize: "18px", color: "#111827", marginBottom: "4px" }}>Link Created Successfully!</h4>
                <p style={{ fontSize: "13px", color: "#6b7280" }}>Your short link is ready to share.</p>
              </div>

              <div className="copy-link-box">
                <span className="copy-link-text">{createdResult.shortUrl}</span>
                <button type="button" className="copy-btn" onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              {createdResult.url?.qrCode && (
                <div style={{ textAlign: "center", margin: "20px 0" }}>
                  <img
                    src={createdResult.url.qrCode}
                    alt="QR Code"
                    style={{ width: "140px", height: "140px", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  />
                  <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>Scan to visit on mobile</p>
                </div>
              )}

              <button
                type="button"
                className="login-submit-btn"
                onClick={resetForm}
                style={{ width: "100%", marginTop: "10px" }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateLinkModal;
