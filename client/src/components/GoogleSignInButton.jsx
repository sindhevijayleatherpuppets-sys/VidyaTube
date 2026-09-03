import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { googleAuthLogin } from "../services/authService";
import { useAuth } from "../context/AuthContext.jsx";

const GoogleSignInButton = ({ text = "signin_with", onError }) => {
  const buttonRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hasClientId, setHasClientId] = useState(true);

  useEffect(() => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "118337636187-r8ae5m2es5l1b6ikiph4f6msfplntoc1.apps.googleusercontent.com";

    if (!clientId) {
      setHasClientId(false);
      return;
    }

    setHasClientId(true);

    const handleCredentialResponse = async (response) => {
      if (!response || !response.credential) {
        if (onError) onError("No credential received from Google.");
        return;
      }

      setLoading(true);
      try {
        const data = await googleAuthLogin({ credential: response.credential });
        login(data.token, data.user);
        navigate("/home", { replace: true });
      } catch (err) {
        const errorMsg =
          err.response?.data?.message || "Google authentication failed. Please try again.";
        if (onError) onError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    const initializeGoogle = () => {
      if (window.google?.accounts?.id && buttonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            shape: "pill",
            text: text, // "signin_with" | "signup_with" | "continue_with"
            logo_alignment: "left",
            width: 320,
          });
        } catch (err) {
          console.error("Google Identity Services initialization error:", err);
        }
      }
    };

    // Load Google Identity Services SDK script dynamically if not present
    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const existingScript = document.getElementById("google-gsi-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-gsi-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogle;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener("load", initializeGoogle);
      }
    }
  }, [login, navigate, text, onError]);

  const handleConfigNotice = () => {
    if (onError) {
      onError(
        "Google Sign-In Setup Required: Please add your Google OAuth Client ID in your project settings."
      );
    }
  };

  if (!hasClientId) {
    return (
      <div style={{ marginBottom: "16px", textAlign: "center" }}>
        <button
          type="button"
          onClick={handleConfigNotice}
          className="btn btn-secondary"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            background: "#ffffff",
            color: "#1f1f1f",
            borderRadius: "24px",
            border: "1px solid #747775",
            fontWeight: 600,
            fontSize: "0.92rem",
            padding: "10px 16px",
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Configure Google Sign-In</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center", minHeight: "44px" }}>
      {loading ? (
        <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", padding: "10px" }}>
          Authenticating with Google...
        </div>
      ) : (
        <div ref={buttonRef} style={{ width: "100%", display: "flex", justifyContent: "center" }} />
      )}
    </div>
  );
};

export default GoogleSignInButton;
