import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchMySubscriptions } from "../services/userService";

const primaryLinks = [
  { to: "/home", label: "Home", icon: "🏠" },
  { to: "/shorts", label: "Shorts", icon: "⚡", badge: "New" },
  { to: "/subscriptions", label: "Subscriptions", icon: "📺" },
];

const youLinks = [
  { to: "/history", label: "History", icon: "🕒" },
  { to: "/favorites", label: "Favorites", icon: "⭐" },
  { to: "/watch-later", label: "Watch Later", icon: "⏱️" },
  { to: "/liked-videos", label: "Liked Videos", icon: "👍" },
  { to: "/playlists", label: "Playlists", icon: "🎞️" },
  { to: "/studio", label: "Your Videos", icon: "🎬" },
];

const exploreCategories = [
  { name: "Trending", icon: "🔥", to: "/trending" },
  { name: "Music", icon: "🎵", to: "/home?category=Music" },
  { name: "Gaming", icon: "🎮", to: "/home?category=Gaming" },
  { name: "Technology", icon: "💻", to: "/home?category=Technology" },
  { name: "Science", icon: "🔬", to: "/home?category=Science" },
  { name: "Comedy", icon: "🎭", to: "/home?category=Comedy" },
  { name: "Sports", icon: "🏆", to: "/home?category=Sports" },
  { name: "News", icon: "📰", to: "/home?category=News" },
];

const Sidebar = ({ collapsed }) => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    if (user) {
      fetchMySubscriptions()
        .then((subs) => setSubscriptions(subs || []))
        .catch(() => {});
    }
  }, [user]);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Primary Feed */}
      <div className="sidebar-section">
        <nav>
          {primaryLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              title={link.label}
            >
              <span className="sidebar-icon">{link.icon}</span>
              {!collapsed && <span>{link.label}</span>}
              {!collapsed && link.badge && <span className="sidebar-badge">{link.badge}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="user-dropdown-divider" />

      {/* Library / You */}
      <div className="sidebar-section">
        {!collapsed && <div className="sidebar-section-title">You ›</div>}
        <nav>
          <NavLink
            to={`/profile/${user?.id}`}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            title="Your Channel"
          >
            <span className="sidebar-icon">👤</span>
            {!collapsed && <span>Your Channel</span>}
          </NavLink>
          {youLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              title={link.label}
            >
              <span className="sidebar-icon">{link.icon}</span>
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="user-dropdown-divider" />

      {/* Subscriptions */}
      {!collapsed && subscriptions.length > 0 && (
        <>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Subscriptions</div>
            <nav>
              {subscriptions.slice(0, 6).map((sub) => (
                <Link
                  key={sub._id}
                  to={`/profile/${sub._id}`}
                  className="sidebar-sub-item"
                >
                  {sub.avatar ? (
                    <img src={sub.avatar} alt={sub.fullName} className="sub-avatar" />
                  ) : (
                    <span className="user-avatar-circle" style={{ width: 24, height: 24, fontSize: "0.75rem" }}>
                      {sub.fullName?.charAt(0)}
                    </span>
                  )}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {sub.fullName}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="user-dropdown-divider" />
        </>
      )}

      {/* Explore */}
      {!collapsed && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">Explore</div>
          <nav>
            {exploreCategories.map((cat) => (
              <NavLink
                key={cat.name}
                to={cat.to}
                className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              >
                <span className="sidebar-icon">{cat.icon}</span>
                <span>{cat.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      <div className="user-dropdown-divider" />

      {/* Tools & Admin */}
      <div className="sidebar-section">
        {!collapsed && <div className="sidebar-section-title">Studio & Tools</div>}
        <nav>
          <NavLink
            to="/studio"
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            title="YouTube Studio"
          >
            <span className="sidebar-icon">🎨</span>
            {!collapsed && <span>Creator Studio</span>}
          </NavLink>
          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              title="Admin Dashboard"
            >
              <span className="sidebar-icon">🛡️</span>
              {!collapsed && <span>Admin Dashboard</span>}
            </NavLink>
          )}
          <NavLink
            to="/settings"
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            title="Settings"
          >
            <span className="sidebar-icon">⚙️</span>
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
