import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleSignInButton from "../components/GoogleSignInButton";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const justRegistered = location.state?.registered;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleQuickLogin = (email, password) => {
    setForm({ email, password });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required");
      return;
    }

    setSubmitting(true);
    try {
      const data = await loginUser(form);
      login(data.token, data.user);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            className="navbar-logo-icon"
            style={{ width: "48px", height: "36px", margin: "0 auto 12px", fontSize: "1.2rem" }}
          >
            ▶
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Sign in to VidyTube</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
            Stream, upload, and explore next-generation creator content
          </p>
        </div>

        {justRegistered && (
          <div className="alert alert-success">
            Registration successful! Please log in to your new account.
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Official Real Google Sign-In Flow */}
        <GoogleSignInButton text="signin_with" onError={(err) => setError(err)} />

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            or sign in with password
          </span>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
        </div>

        <label className="field">
          <span>Email address</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="admin@vidytube.com"
            autoComplete="email"
          />
        </label>

        <label className="field">
          <span>Password</span>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{ width: "100%" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </label>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "8px" }}
          disabled={submitting}
        >
          {submitting ? "Signing in..." : "Sign In"}
        </button>

        {/* 1-Click Quick Demo Login */}
        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--text-muted)",
              letterSpacing: "0.05em",
            }}
          >
            Quick Demo Accounts:
          </span>
          <div className="quick-login-pills">
            <button
              type="button"
              className="quick-login-pill"
              onClick={() => handleQuickLogin("admin@vidytube.com", "Password123")}
            >
              🛡️ Admin
            </button>
            <button
              type="button"
              className="quick-login-pill"
              onClick={() => handleQuickLogin("alice@vidytube.com", "Password123")}
            >
              🎬 Alice (Creator)
            </button>
            <button
              type="button"
              className="quick-login-pill"
              onClick={() => handleQuickLogin("bob@vidytube.com", "Password123")}
            >
              💻 Bob (Coder)
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.88rem", color: "var(--text-secondary)", marginTop: "20px" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--accent)", fontWeight: 700 }}>
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
