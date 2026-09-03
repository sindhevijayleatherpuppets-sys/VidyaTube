import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import GoogleSignInButton from "../components/GoogleSignInButton";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const Register = () => {
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.fullName.trim()) return "Full name is required";
    if (!form.email.trim()) return "Email is required";
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(form.email)) return "Please enter a valid email address";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await registerUser(form);
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const generatedHandle = form.fullName
    ? `@${form.fullName.toLowerCase().replace(/[^a-z0-9]/g, "")}`
    : "@yourhandle";

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            className="navbar-logo-icon"
            style={{ width: "48px", height: "36px", margin: "0 auto 12px", fontSize: "1.2rem" }}
          >
            ▶
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Join VidyTube</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
            Create your channel and start sharing your videos
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Official Real Google Sign-Up Flow */}
        <GoogleSignInButton text="signup_with" onError={(err) => setError(err)} />

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            or create with email
          </span>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
        </div>

        <label className="field">
          <span>Full Name / Channel Title</span>
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="e.g. Alex Tech & Gaming"
            autoComplete="name"
          />
          {form.fullName && (
            <span style={{ fontSize: "0.75rem", color: "var(--accent)" }}>
              Channel handle will be: <strong>{generatedHandle}</strong>
            </span>
          )}
        </label>

        <label className="field">
          <span>Email Address</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="alex@example.com"
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
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
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

        <label className="field">
          <span>Confirm Password</span>
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            autoComplete="new-password"
          />
        </label>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "10px", padding: "12px", fontSize: "1rem" }}
          disabled={submitting}
        >
          {submitting ? "Creating Channel..." : "Create Account"}
        </button>

        <p style={{ textAlign: "center", fontSize: "0.88rem", color: "var(--text-secondary)", marginTop: "20px" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: 700 }}>
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
