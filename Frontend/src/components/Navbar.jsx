import { Link } from "react-router-dom";
import treeLogo from "../assets/tree-logo.png";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <Link to="/home" className="navbar-brand">
          <img src={treeLogo} alt="Linktree Logo" className="navbar-logo-img" />
          <span className="navbar-logo-text">linktree</span>
        </Link>

        {/* Auth Buttons */}
        <div className="navbar-actions">
          <Link to="/login" className="navbar-btn-login">
            Log in
          </Link>
          <Link to="/signup" className="navbar-btn-signup">
            Sign up free
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
