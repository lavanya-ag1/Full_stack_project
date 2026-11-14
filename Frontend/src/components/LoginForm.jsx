import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="auth-card">
      <h2>Login</h2>

      {error && <p style={{ color: "red", marginBottom: "15px", fontSize: "14px" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Google OAuth Option */}
      <div style={{ textAlign: "center", margin: "15px 0", color: "#888", fontSize: "14px" }}>
        or
      </div>

      <a href={`${backendUrl}/api/user/google`} style={{ textDecoration: "none" }}>
        <button
          type="button"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#ffffff",
            color: "#444",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={{ width: "18px", height: "18px" }}
          />
          Continue with Google
        </button>
      </a>

      <div className="auth-footer" style={{ marginTop: "15px" }}>
        Don't have an account? <Link to="/signup">Sign up here</Link>
      </div>
    </div>
  );
}

export default LoginForm;
