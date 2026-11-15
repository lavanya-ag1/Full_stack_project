import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Get backend URL from env
  const backendUrl = (import.meta.env.BACKEND || "http://localhost:5000").replace(/\/$/, "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/user/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to sign up");
      }

      setMessage("Account created successfully! Redirecting to login...");

      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <h2 className="login-title">Sign Up for Linktree</h2>

      {error && <div className="login-error-badge">{error}</div>}
      {message && <div className="login-success-badge">{message}</div>}

      <form onSubmit={handleSubmit}>
        {/* Name Field */}
        <div className="form-field">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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

        {/* Submit Button */}
        <button type="submit" className="login-submit-btn" disabled={loading} style={{ marginTop: "10px" }}>
          {loading ? "Creating Account..." : "Create Account"}
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
        <p className="signup-prompt">
          Already have an account? <Link to="/login" className="signup-link">Log in here.</Link>
        </p>
      </div>
    </div>
  );
}

export default SignupForm;
