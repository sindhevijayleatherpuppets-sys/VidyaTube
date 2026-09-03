import { useState, useEffect } from "react";
import AppShell from "../components/AppShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { clearWatchHistory } from "../services/libraryService";

const Settings = () => {
  const { user } = useAuth();
  const { themeMode, resolvedTheme, setTheme } = useTheme();

  // Playback settings (persisted in localStorage)
  const [autoplayNext, setAutoplayNext] = useState(() => {
    return localStorage.getItem("vidytube_autoplay_next") !== "false";
  });
  const [defaultQuality, setDefaultQuality] = useState(() => {
    return localStorage.getItem("vidytube_default_quality") || "1080p HD";
  });
  const [defaultSpeed, setDefaultSpeed] = useState(() => {
    return localStorage.getItem("vidytube_default_speed") || "1";
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [historyClearSuccess, setHistoryClearSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem("vidytube_autoplay_next", autoplayNext);
    localStorage.setItem("vidytube_default_quality", defaultQuality);
    localStorage.setItem("vidytube_default_speed", defaultSpeed);
  }, [autoplayNext, defaultQuality, defaultSpeed]);

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your entire watch history?")) return;
    try {
      await clearWatchHistory();
      setHistoryClearSuccess(true);
      setTimeout(() => setHistoryClearSuccess(false), 3500);
    } catch (err) {
      alert("Failed to clear watch history.");
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px" }}>
            <span>⚙️</span> VidyTube Settings
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginTop: "4px" }}>
            Customize your visual theme, playback preferences, and account security
          </p>
        </div>

        {/* 1. APPEARANCE & THEME SYSTEM */}
        <div
          className="settings-card"
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            border: "1px solid var(--border-subtle)",
            marginBottom: "24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "1.3rem" }}>🎨</span>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Appearance & Theme</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "20px" }}>
            Select how VidyTube looks to you. Choose light, dark, or automatically sync with your device system settings.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            {/* Dark Mode Card */}
            <div
              onClick={() => setTheme("dark")}
              style={{
                background: themeMode === "dark" ? "rgba(255, 0, 51, 0.08)" : "var(--bg-main)",
                border: `2px solid ${themeMode === "dark" ? "var(--accent)" : "var(--border-subtle)"}`,
                borderRadius: "var(--radius-md)",
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "1.5rem" }}>🌙</span>
                <input
                  type="radio"
                  name="theme"
                  checked={themeMode === "dark"}
                  onChange={() => setTheme("dark")}
                  style={{ accentColor: "var(--accent)" }}
                />
              </div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "4px" }}>Dark Theme</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Cinematic deep obsidian contrast. Ideal for watching in the dark.
              </p>
            </div>

            {/* Light Mode Card */}
            <div
              onClick={() => setTheme("light")}
              style={{
                background: themeMode === "light" ? "rgba(255, 0, 51, 0.08)" : "var(--bg-main)",
                border: `2px solid ${themeMode === "light" ? "var(--accent)" : "var(--border-subtle)"}`,
                borderRadius: "var(--radius-md)",
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "1.5rem" }}>☀️</span>
                <input
                  type="radio"
                  name="theme"
                  checked={themeMode === "light"}
                  onChange={() => setTheme("light")}
                  style={{ accentColor: "var(--accent)" }}
                />
              </div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "4px" }}>Light Theme</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Clean, crisp soft neutral layout. Easy on eyes in bright rooms.
              </p>
            </div>

            {/* System Default Card */}
            <div
              onClick={() => setTheme("system")}
              style={{
                background: themeMode === "system" ? "rgba(255, 0, 51, 0.08)" : "var(--bg-main)",
                border: `2px solid ${themeMode === "system" ? "var(--accent)" : "var(--border-subtle)"}`,
                borderRadius: "var(--radius-md)",
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "1.5rem" }}>💻</span>
                <input
                  type="radio"
                  name="theme"
                  checked={themeMode === "system"}
                  onChange={() => setTheme("system")}
                  style={{ accentColor: "var(--accent)" }}
                />
              </div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "4px" }}>System Default</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Automatically matches your computer or phone's OS theme.
              </p>
            </div>
          </div>

          <div style={{ marginTop: "16px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Currently active mode: <strong style={{ color: "var(--text-primary)" }}>{resolvedTheme.toUpperCase()}</strong>
          </div>
        </div>

        {/* 2. PLAYBACK PREFERENCES */}
        <div
          className="settings-card"
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            border: "1px solid var(--border-subtle)",
            marginBottom: "24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "1.3rem" }}>🎬</span>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Playback & Cinema Experience</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Autoplay toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>Autoplay Next Video</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                  When you finish a video, another recommended video will start automatically.
                </div>
              </div>
              <label className="switch" style={{ position: "relative", display: "inline-block", width: "46px", height: "24px" }}>
                <input
                  type="checkbox"
                  checked={autoplayNext}
                  onChange={(e) => setAutoplayNext(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: autoplayNext ? "var(--accent)" : "var(--bg-main)",
                    borderRadius: "24px",
                    transition: "0.3s",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: "''",
                      height: "18px",
                      width: "18px",
                      left: autoplayNext ? "24px" : "3px",
                      bottom: "2px",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      transition: "0.3s",
                    }}
                  />
                </span>
              </label>
            </div>

            <div style={{ height: "1px", background: "var(--border-subtle)" }} />

            {/* Default Quality */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>Default Video Quality</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                  Preferred stream resolution for videos on desktop.
                </div>
              </div>
              <select
                value={defaultQuality}
                onChange={(e) => setDefaultQuality(e.target.value)}
                style={{
                  background: "var(--bg-main)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                <option value="1080p60 HD">1080p60 HD</option>
                <option value="1080p HD">1080p HD</option>
                <option value="720p HD">720p HD</option>
                <option value="480p">480p (Data Saver)</option>
                <option value="Auto">Auto (Adaptive)</option>
              </select>
            </div>

            <div style={{ height: "1px", background: "var(--border-subtle)" }} />

            {/* Default Speed */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>Default Playback Speed</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                  Speed multiplier for videos and tutorials.
                </div>
              </div>
              <select
                value={defaultSpeed}
                onChange={(e) => setDefaultSpeed(e.target.value)}
                style={{
                  background: "var(--bg-main)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                <option value="0.75">0.75x</option>
                <option value="1">1.0x (Normal)</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2.0x</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. ACCOUNT & GOOGLE OAUTH INFORMATION */}
        <div
          className="settings-card"
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            border: "1px solid var(--border-subtle)",
            marginBottom: "24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "1.3rem" }}>👤</span>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Account & Identity</h2>
          </div>

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <img
                src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"}
                alt={user.fullName}
                style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--accent)" }}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{user.fullName}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>{user.email}</p>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <span
                    style={{
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "var(--success)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    ✓ Authenticated
                  </span>
                  <span
                    style={{
                      background: "var(--bg-surface-hover)",
                      color: "var(--text-secondary)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    Role: {user.role?.toUpperCase() || "CREATOR"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
              You are currently browsing as a guest. Sign in with Google to access your creator studio and profile.
            </p>
          )}
        </div>

        {/* 4. PRIVACY & WATCH HISTORY CONTROLS */}
        <div
          className="settings-card"
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            border: "1px solid var(--border-subtle)",
            marginBottom: "24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "1.3rem" }}>🔒</span>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Privacy & History</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "16px" }}>
            Manage the videos you've watched, search data, and personalized recommendations.
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>Clear Watch History</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                Permanently delete all videos recorded in your watch history.
              </div>
            </div>
            <button
              className="btn btn-secondary btn-small"
              onClick={handleClearHistory}
              style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
            >
              🗑️ Clear History
            </button>
          </div>

          {historyClearSuccess && (
            <div className="alert alert-success" style={{ marginTop: "14px", fontSize: "0.85rem" }}>
              ✓ Your watch history has been successfully cleared.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Settings;
