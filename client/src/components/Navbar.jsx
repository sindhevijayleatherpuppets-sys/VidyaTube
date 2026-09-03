import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { fetchNotifications, markAllNotificationsRead } from "../services/notificationService";

const POPULAR_SEARCH_SUGGESTIONS = [
  "Building a Modern Full-Stack YouTube Clone",
  "Next-Gen AI & Machine Learning Breakdown",
  "Lo-Fi Beats to Relax / Study",
  "Unreal Engine 5.5 Next-Gen Graphics",
  "Mastering TypeScript Generics",
  "Cyberpunk 2077 Night City 8K",
  "James Webb Space Telescope",
  "CSS Tricks Nobody Told You About",
  "Formula 1 2026 Season",
];

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { themeMode, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const userMenuRef = useRef(null);
  const createMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const searchRef = useRef(null);

  // Load notifications
  useEffect(() => {
    if (user) {
      fetchNotifications()
        .then((data) => {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (createMenuRef.current && !createMenuRef.current.contains(e.target)) {
        setCreateMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setNotifMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleSuggestionClick = (query) => {
    setSearch(query);
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartVoice = () => {
    setVoiceModalOpen(true);
    setVoiceListening(true);
    setTimeout(() => {
      setVoiceListening(false);
      setSearch("Full-Stack Web Development");
    }, 2500);
  };

  const handleVoiceConfirm = () => {
    setVoiceModalOpen(false);
    navigate(`/home?search=${encodeURIComponent(search || "Full-Stack Web Development")}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const userInitial = user?.fullName?.charAt(0)?.toUpperCase() || "U";
  const filteredSuggestions = POPULAR_SEARCH_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 6);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title="Toggle Navigation Guide"
          aria-label="Toggle Guide"
        >
          ☰
        </button>

        <Link to="/home" className="navbar-logo">
          <div className="navbar-logo-icon">
            ▶
          </div>
          <span>Vidy<strong style={{ color: "var(--accent)" }}>Tube</strong></span>
          <span className="navbar-logo-badge">HD</span>
        </Link>
      </div>

      <div className="navbar-search-container" ref={searchRef}>
        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
          <form className="navbar-search" style={{ flex: 1 }} onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search videos, creators, topics..."
              value={search}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
            <button type="submit" className="search-submit-btn" aria-label="Search">
              🔍
            </button>
          </form>

          <button
            type="button"
            className="voice-search-btn"
            onClick={handleStartVoice}
            title="Search with your voice"
          >
            🎙️
          </button>
        </div>

        {/* Autocomplete Suggestions */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="search-suggestions-dropdown">
            {filteredSuggestions.map((item, i) => (
              <div
                key={i}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(item)}
              >
                <span>🔍</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="navbar-right">
        {/* Create Dropdown */}
        <div className="user-menu-wrapper" ref={createMenuRef}>
          <button
            className="btn-create-nav"
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
          >
            <span>＋</span> Create
          </button>

          {createMenuOpen && (
            <div className="user-dropdown-menu" style={{ width: 220 }}>
              <Link
                to="/upload"
                className="user-dropdown-item"
                onClick={() => setCreateMenuOpen(false)}
              >
                <span>🎬</span> Upload Video
              </Link>
              <Link
                to="/upload"
                className="user-dropdown-item"
                onClick={() => setCreateMenuOpen(false)}
              >
                <span>⚡</span> Create Short
              </Link>
              <Link
                to={`/profile/${user?.id}`}
                className="user-dropdown-item"
                onClick={() => setCreateMenuOpen(false)}
              >
                <span>💬</span> Create Post
              </Link>
            </div>
          )}
        </div>

        {/* Quick Theme Switcher Button */}
        <button
          className="nav-icon-btn"
          title={`Current theme: ${themeMode.toUpperCase()} (${resolvedTheme} active). Click to toggle.`}
          onClick={toggleTheme}
          aria-label="Toggle Theme"
        >
          {resolvedTheme === "dark" ? "🌙" : "☀️"}
        </button>

        {/* Notifications Dropdown */}
        <div className="user-menu-wrapper" ref={notifMenuRef}>
          <button
            className="nav-icon-btn"
            title="Notifications"
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
          >
            🔔
            {unreadCount > 0 && <span className="nav-badge-count">{unreadCount}</span>}
          </button>

          {notifMenuOpen && (
            <div className="user-dropdown-menu" style={{ width: 340 }}>
              <div
                className="user-dropdown-header"
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
              >
                <span className="dropdown-user-name">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--accent)",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className="user-dropdown-item"
                      style={{
                        fontSize: "0.85rem",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: "3px",
                        background: notif.isRead ? "transparent" : "rgba(255, 0, 51, 0.06)",
                      }}
                    >
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                        {notif.type === "new_video" ? "🎬 New Upload" : notif.type === "subscribe" ? "👤 Subscriber" : "💬 Activity"}
                      </span>
                      <span style={{ color: "var(--text-secondary)" }}>{notif.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="user-menu-wrapper" ref={userMenuRef}>
          <div
            className="user-menu-trigger"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="user-avatar-circle">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.fullName} />
              ) : (
                userInitial
              )}
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>▼</span>
          </div>

          {userMenuOpen && (
            <div className="user-dropdown-menu">
              <div className="user-dropdown-header">
                <div className="dropdown-user-name">{user?.fullName}</div>
                <div className="dropdown-user-email">{user?.email}</div>
                {user?.role === "admin" && (
                  <span className="navbar-logo-badge" style={{ marginTop: "6px", alignSelf: "flex-start" }}>
                    Administrator
                  </span>
                )}
              </div>

              <Link
                to={`/profile/${user?.id}`}
                className="user-dropdown-item"
                onClick={() => setUserMenuOpen(false)}
              >
                👤 Your Channel
              </Link>
              <Link
                to="/studio"
                className="user-dropdown-item"
                onClick={() => setUserMenuOpen(false)}
              >
                🎨 Creator Studio
              </Link>
              <Link
                to="/favorites"
                className="user-dropdown-item"
                onClick={() => setUserMenuOpen(false)}
              >
                ⭐ My Favorites
              </Link>
              <Link
                to="/watch-later"
                className="user-dropdown-item"
                onClick={() => setUserMenuOpen(false)}
              >
                ⏱️ Watch Later
              </Link>
              <Link
                to="/liked-videos"
                className="user-dropdown-item"
                onClick={() => setUserMenuOpen(false)}
              >
                👍 Liked Videos
              </Link>
              <Link
                to="/playlists"
                className="user-dropdown-item"
                onClick={() => setUserMenuOpen(false)}
              >
                🎞️ Your Playlists
              </Link>
              <Link
                to="/history"
                className="user-dropdown-item"
                onClick={() => setUserMenuOpen(false)}
              >
                🕒 Watch History
              </Link>
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className="user-dropdown-item"
                  onClick={() => setUserMenuOpen(false)}
                >
                  🛡️ Admin Dashboard
                </Link>
              )}
              <Link
                to="/settings"
                className="user-dropdown-item"
                onClick={() => setUserMenuOpen(false)}
              >
                ⚙️ Settings
              </Link>

              <div className="user-dropdown-divider" />
              <div style={{ padding: "6px 14px", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Theme ({themeMode})
              </div>
              <button
                className="user-dropdown-item"
                style={{ fontWeight: themeMode === "dark" ? 700 : 400, color: themeMode === "dark" ? "var(--accent)" : "inherit" }}
                onClick={() => setTheme("dark")}
              >
                🌙 Dark Theme {themeMode === "dark" ? "✓" : ""}
              </button>
              <button
                className="user-dropdown-item"
                style={{ fontWeight: themeMode === "light" ? 700 : 400, color: themeMode === "light" ? "var(--accent)" : "inherit" }}
                onClick={() => setTheme("light")}
              >
                ☀️ Light Theme {themeMode === "light" ? "✓" : ""}
              </button>
              <button
                className="user-dropdown-item"
                style={{ fontWeight: themeMode === "system" ? 700 : 400, color: themeMode === "system" ? "var(--accent)" : "inherit" }}
                onClick={() => setTheme("system")}
              >
                💻 System Default {themeMode === "system" ? "✓" : ""}
              </button>

              <div className="user-dropdown-divider" />

              <button
                className="user-dropdown-item"
                style={{ color: "var(--danger)" }}
                onClick={handleLogout}
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Voice Search Modal Simulation */}
      {voiceModalOpen && (
        <div className="modal-backdrop" onClick={() => setVoiceModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
            <h2 className="modal-title">Search with Voice</h2>
            <div style={{ fontSize: "3.5rem", margin: "24px 0", animation: voiceListening ? "pulse 1.2s infinite" : "none" }}>
              🎙️
            </div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              {voiceListening ? "Listening... Speak now" : `Heard: "${search || "Full-Stack Web Development"}"`}
            </p>
            {!voiceListening && (
              <button className="btn btn-primary" onClick={handleVoiceConfirm}>
                Search Now
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
