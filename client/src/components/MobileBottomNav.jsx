import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const MobileBottomNav = () => {
  const { user } = useAuth();

  return (
    <nav className="mobile-bottom-nav">
      <NavLink
        to="/home"
        className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
      >
        <span className="mobile-nav-icon">🏠</span>
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/shorts"
        className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
      >
        <span className="mobile-nav-icon">⚡</span>
        <span>Shorts</span>
      </NavLink>

      <NavLink
        to="/upload"
        className="mobile-nav-item"
        style={{ flex: 0.8 }}
        title="Upload Video"
      >
        <div className="mobile-nav-create">＋</div>
      </NavLink>

      <NavLink
        to="/subscriptions"
        className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
      >
        <span className="mobile-nav-icon">📺</span>
        <span>Subs</span>
      </NavLink>

      <NavLink
        to={user ? `/profile/${user.id}` : "/login"}
        className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
      >
        <span className="mobile-nav-icon">👤</span>
        <span>You</span>
      </NavLink>
    </nav>
  );
};

export default MobileBottomNav;
