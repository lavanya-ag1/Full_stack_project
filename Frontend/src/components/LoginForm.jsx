import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Get backend URL from env
  const backendUrl = (import.meta.env.BACKEND || "http://localhost:5000").replace(/\/$/, "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send and receive HTTP-only cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      // Save user profile details in localStorage (JWT is stored safely in HTTP-only cookie)
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Navigate to home page
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <h2 className="login-title">Login to Linktree</h2>

      {error && <div className="login-error-badge">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="form-field">
          <label htmlFor="email">E-Mail Address</label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password Field */}
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Remember Me Checkbox */}
        <div className="remember-row">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="checkbox-label">Remember Me</span>
          </label>
        </div>

        {/* Login Submit Button */}
        <button type="submit" className="login-submit-btn" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Google OAuth Option */}
      <div className="auth-divider">
        <span>or</span>
      </div>

      <a href={`${backendUrl}/api/user/google`} className="google-login-btn">
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google logo"
          className="google-icon"
        />
        <span>Continue with Google</span>
      </a>

      {/* Footer Links */}
      <div className="login-links">
        <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Please contact support or register a new account."); }} className="forgot-password-link">
          Forgot Your Password?
        </a>
        <p className="signup-prompt">
          Don't have an account? <Link to="/signup" className="signup-link">Sign up here.</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginForm;
