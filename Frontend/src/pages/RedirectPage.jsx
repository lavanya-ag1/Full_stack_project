import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";

function RedirectPage() {
  const { id } = useParams(); // shortCode from URL

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Revenue & Ad states
  const [showAd, setShowAd] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [destinationUrl, setDestinationUrl] = useState("");
  const [submittingMonetize, setSubmittingMonetize] = useState(false);

  // Prevent double-fetch in React StrictMode
  const hasFetched = useRef(false);

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

      // Case 3: Success!
      if (data.originalUrl) {
        if (data.enableRevenue) {
          // If revenue is enabled: display 10s ad screen before continuing
          setDestinationUrl(data.originalUrl);
          setShowAd(true);
          setLoading(false);
        } else {
          // If regular link: redirect immediately
          window.location.href = data.originalUrl;
        }
      } else {
        throw new Error("Invalid destination URL");
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && !hasFetched.current) {
      hasFetched.current = true;
      fetchAndRedirect();
    }
  }, [id]);

  // Handle 10-second countdown when ad interstitial is active
  useEffect(() => {
    if (showAd && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showAd, countdown]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchAndRedirect(password);
  };

  // Triggered ONLY when the user clicks the final continue button after 10s
  const handleContinue = async () => {
    if (!destinationUrl) return;
    setSubmittingMonetize(true);

    try {
      // Record monetized click on the backend
      await fetch(`${backendUrl}/api/url/${id}/monetized-click`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Failed to record monetized click:", err);
    } finally {
      window.location.href = destinationUrl;
    }
  };

  return (
    <div className="auth-container">
      {/* 1. Normal Loading State */}
      {loading && !needsPassword && !error && !showAd && (
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h2>Redirecting...</h2>
          <p style={{ marginTop: "10px", color: "#666" }}>
            Please wait, taking you to your destination...
          </p>
        </div>
      )}

      {/* 2. Revenue Ad Interstitial (10s Countdown) */}
      {showAd && !error && (
        <div className="auth-card" style={{ maxWidth: "500px", textAlign: "center" }}>
          <div style={{ backgroundColor: "#eef9ff", border: "1px solid #b8daff", padding: "10px", borderRadius: "6px", marginBottom: "15px" }}>
            <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#0056b3", fontWeight: "bold" }}>
              Sponsored Advertisement
            </span>
          </div>

          <h3 style={{ marginBottom: "10px" }}>Your link is almost ready!</h3>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
            Please wait while we prepare your destination link.
          </p>

          {/* Mock Ad Box */}
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              padding: "30px 20px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            }}
          >
            <h4 style={{ fontSize: "18px", marginBottom: "8px" }}>Boost Your Productivity</h4>
            <p style={{ fontSize: "13px", opacity: 0.9 }}>
              Discover powerful tools to organize links, manage analytics, and grow faster.
            </p>
          </div>

          {/* Countdown & Continue Button */}
          {countdown > 0 ? (
            <button
              type="button"
              className="btn-primary"
              disabled
              style={{ backgroundColor: "#aaa", cursor: "not-allowed" }}
            >
              Please wait {countdown}s...
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={handleContinue}
              disabled={submittingMonetize}
              style={{ backgroundColor: "#28a745" }}
            >
              {submittingMonetize ? "Redirecting..." : "Continue to Destination →"}
            </button>
          )}

          <p style={{ marginTop: "12px", fontSize: "12px", color: "#888" }}>
            Thank you for supporting the creator!
          </p>
        </div>
      )}

      {/* 3. Password Prompt State */}
      {needsPassword && !error && !showAd && (
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

      {/* 4. Error State */}
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
