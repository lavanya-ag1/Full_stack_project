import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import CreateLinkModal from "../components/CreateLinkModal";
import LinkItem from "../components/LinkItem";

function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const backendUrl = (import.meta.env.BACKEND || "http://localhost:5000").replace(/\/$/, "");

  // Format current week range e.g. 11/9/2026 – 11/15/2026
  const getFormattedDateRange = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const format = (d) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    return `${format(startOfWeek)} – ${format(endOfWeek)}`;
  };

  // Fetch current authenticated user via HTTP-only cookie
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/user/me`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("Failed to load user:", e);
      setUser(null);
    }
  };

  const fetchUserLinks = async () => {
    try {
      setLoadingLinks(true);
      const response = await fetch(`${backendUrl}/api/url/my-links`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setLinks(data.links || []);
      }
    } catch (e) {
      console.error("Failed to load user links:", e);
    } finally {
      setLoadingLinks(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUserLinks();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${backendUrl}/api/user/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  const handleLinkCreated = (newLinkData) => {
    const formatted = {
      ...newLinkData.url,
      shortUrl: newLinkData.shortUrl,
      analytics: {
        clicks: 0,
        monetizedClicks: 0,
      },
    };
    setLinks((prev) => [formatted, ...prev]);
  };

  const handleDeleteLink = async (id) => {
    if (!window.confirm("Are you sure you want to delete this short link?")) return;
    try {
      const response = await fetch(`${backendUrl}/api/url/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setLinks((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (e) {
      console.error("Error deleting link:", e);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Top Header Bar */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="header-title">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "links" && "Short Links"}
              {activeTab === "revenue" && "Revenue"}
              {activeTab === "settings" && "Settings"}
            </h1>
          </div>

          <div className="header-actions">
            {/* + Create Link Primary Button */}
            <button
              type="button"
              className="btn-create-link"
              onClick={() => setIsModalOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create Link</span>
            </button>

            {/* Search Icon */}
            <button type="button" className="header-icon-btn" title="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Help Icon */}
            <button type="button" className="header-icon-btn" title="Help & Support">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="10" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>

            {/* Profile Avatar & Dropdown */}
            <div className="user-profile-menu">
              <button
                type="button"
                className="header-avatar-btn"
                onClick={() => setUserDropdown(!userDropdown)}
                title="Account menu"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>

              {userDropdown && (
                <div className="profile-dropdown">
                  <div className="dropdown-user-info">
                    <strong>{user?.name || "Guest User"}</strong>
                    <span>{user?.email || "Not signed in"}</span>
                  </div>
                  <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "6px 0" }} />
                  {user ? (
                    <button type="button" className="dropdown-item" onClick={handleLogout}>
                      Sign out
                    </button>
                  ) : (
                    <>
                      <Link to="/login" className="dropdown-item">Log in</Link>
                      <Link to="/signup" className="dropdown-item">Sign up</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="dashboard-content">
          {/* Subheader Filters Row */}
          <div className="dashboard-filters-row">
            <button type="button" className="btn-filter-dropdown">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              <span>Filters</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <div className="date-range-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{getFormattedDateRange()}</span>
            </div>
          </div>

          {/* Conditional Display: List vs Empty State */}
          {links.length > 0 ? (
            /* Links List Container */
            <div className="links-list-container">
              {links.map((link) => (
                <LinkItem
                  key={link._id || link.shortCode}
                  link={link}
                  user={user}
                  onDelete={handleDeleteLink}
                />
              ))}
            </div>
          ) : (
            /* Empty State Card matching screenshot */
            <div className="dashboard-card">
              <div className="mint-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#233c3a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>

              <h2 className="dashboard-card-title">Create your first short link</h2>
              <p className="dashboard-card-subtitle">
                Share a short link to start seeing visits and QR scans.
              </p>

              <div className="dashboard-card-actions">
                <button
                  type="button"
                  className="btn-card-primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  <span>Create your first link</span>
                  <span style={{ fontSize: "16px" }}>→</span>
                </button>

                <button
                  type="button"
                  className="btn-card-secondary"
                  onClick={() => alert("Filter options: You can filter by Date, Device, or Location.")}
                >
                  Adjust filters
                </button>
              </div>

              <div className="dashboard-card-features">
                <div className="feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                    <path d="M13 13l6 6" />
                  </svg>
                  <span>Visits and QR scans</span>
                </div>

                <div className="feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span>Visitor locations</span>
                </div>

                <div className="feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span>Traffic sources</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal to Create Link */}
      <CreateLinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLinkCreated={handleLinkCreated}
      />
    </div>
  );
}

export default Home;
