import { useState } from "react";

function LinkItem({ link, user, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const shortCode = link.shortCode;
  const shortUrl = link.shortUrl || `${window.location.origin}/${shortCode}`;
  const originalUrl = link.originalUrl;
  const visits = link.analytics?.clicks ?? 0;
  const monetized = link.analytics?.monetizedClicks ?? 0;

  // Format short URL display (e.g. linktree/DwYOU or full URL)
  const displayShortUrl = shortUrl.replace(/^https?:\/\//, "");

  // Format creation date e.g. "Nov 15, 11:22am"
  const formatCreationDate = (dateString) => {
    if (!dateString) return "Just now";
    const d = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const day = d.getDate();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    return `${month} ${day}, ${hours}:${minutes}${ampm}`;
  };

  // Get user initials (e.g. "Ayush Sharma" -> "AS")
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if link was created in the last 24 hours
  const isNew = () => {
    if (!link.createdAt) return true;
    const diff = Date.now() - new Date(link.createdAt).getTime();
    return diff < 24 * 60 * 60 * 1000;
  };

  // Favicon detector
  const isYouTube = /youtube\.com|youtu\.be/i.test(originalUrl);

  return (
    <div className="link-item-card">
      {/* Left Column: QR icon, Short URL, Destination */}
      <div className="link-item-left">
        {/* QR Thumbnail Box */}
        <button
          type="button"
          className="link-qr-thumb-btn"
          onClick={() => setShowQrModal(true)}
          title="Click to view QR Code"
        >
          {link.qrCode ? (
            <img src={link.qrCode} alt="QR Code" className="link-qr-thumb-img" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#233c3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          )}
        </button>

        {/* Links info */}
        <div className="link-details">
          {/* Top row: Short code, Copy button, Badges */}
          <div className="link-top-row">
            <a
              href={shortUrl}
              target="_blank"
              rel="noreferrer"
              className="link-short-text"
            >
              {displayShortUrl}
            </a>

            <button
              type="button"
              className="link-copy-icon-btn"
              onClick={handleCopy}
              title="Copy link"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copied && <span className="copy-tooltip">Copied!</span>}
            </button>

            {isNew() && <span className="link-badge-new">New</span>}

            {link.enableRevenue && (
              <span className="link-badge-revenue" title="Revenue model enabled">
                $ Monetized
              </span>
            )}

            {link.isOneTime && (
              <span className="link-badge-onetime" title="One-time use link">
                1-Time
              </span>
            )}
          </div>

          {/* Bottom row: Curve arrow + favicon + original URL */}
          <div className="link-dest-row">
            <span className="link-arrow">↳</span>
            {isYouTube ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff0000" style={{ flexShrink: 0 }}>
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            )}
            <a
              href={originalUrl}
              target="_blank"
              rel="noreferrer"
              className="link-orig-text"
              title={originalUrl}
            >
              {originalUrl}
            </a>
          </div>
        </div>
      </div>

      {/* Right Column: Stats Box (Visits & Monetized), Author & 3-dots */}
      <div className="link-item-right">
        {/* Top Right: Stats Badge + 3-dots Menu */}
        <div className="link-stats-group">
          {/* Stats Pill Box: VISITS | MONETIZED */}
          <div className="stats-pill-container">
            <div className="stats-col">
              <span className="stats-col-label">VISITS</span>
              <span className="stats-col-val">{visits}</span>
            </div>
            <div className="stats-divider" />
            <div className="stats-col">
              <span className="stats-col-label">MONETIZED</span>
              <span className="stats-col-val">{monetized}</span>
            </div>
          </div>

          {/* 3-dots Menu Button */}
          <div className="dots-menu-wrapper">
            <button
              type="button"
              className="link-dots-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              title="More options"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>

            {menuOpen && (
              <div className="dots-dropdown-menu">
                <button
                  type="button"
                  className="dots-item"
                  onClick={() => {
                    handleCopy();
                    setMenuOpen(false);
                  }}
                >
                  Copy Link
                </button>
                <button
                  type="button"
                  className="dots-item"
                  onClick={() => {
                    setShowQrModal(true);
                    setMenuOpen(false);
                  }}
                >
                  View QR Code
                </button>
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="dots-item"
                  onClick={() => setMenuOpen(false)}
                >
                  Open in New Tab
                </a>
                {onDelete && (
                  <button
                    type="button"
                    className="dots-item text-danger"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(link._id);
                    }}
                  >
                    Delete Link
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Right: User Avatar initials + Name + Date */}
        <div className="link-creator-row">
          <div className="creator-avatar-badge">
            {getInitials(user?.name || "User")}
          </div>
          <div className="creator-text-info">
            <span className="creator-name">{user?.name || "Ayush Sharma"}</span>
            <span className="creator-date">{formatCreationDate(link.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* QR Code Modal Preview */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-container" style={{ maxWidth: "340px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ fontSize: "16px", margin: 0 }}>QR Code</h4>
              <button type="button" className="modal-close-btn" onClick={() => setShowQrModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: "20px" }}>
              {link.qrCode ? (
                <img src={link.qrCode} alt="QR Code" style={{ width: "200px", height: "200px", borderRadius: "8px" }} />
              ) : (
                <p>No QR Code available</p>
              )}
              <p style={{ marginTop: "12px", fontSize: "13px", color: "#6b7280" }}>{displayShortUrl}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LinkItem;
