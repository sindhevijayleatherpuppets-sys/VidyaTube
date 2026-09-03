import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import VideoCard from "../components/VideoCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getWatchHistory, removeHistoryItem, clearWatchHistory } from "../services/libraryService";
import { formatDate, timeAgo } from "../utils/format";

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getWatchHistory();
        setHistory(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleRemove = async (e, historyId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removeHistoryItem(historyId);
      setHistory((prev) => prev.filter((h) => h._id !== historyId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Are you sure you want to clear your entire watch history?")) return;
    try {
      await clearWatchHistory();
      setHistory([]);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <AppShell>
        <div className="empty-state" style={{ maxWidth: 460, margin: "60px auto" }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🕒</div>
          <h2>Keep track of what you watch</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "6px", marginBottom: "20px" }}>
            Sign in to view your watch history across all devices.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            Sign In
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px" }}>
            <span>🕒</span> Watch History
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
            Videos you have watched on VidyTube
          </p>
        </div>

        {history.length > 0 && (
          <button className="btn btn-secondary btn-small" onClick={handleClear} style={{ color: "var(--danger)" }}>
            🗑️ Clear all history
          </button>
        )}
      </div>

      {loading && (
        <div className="video-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && history.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🕒</div>
          <h3>No watch history yet</h3>
          <p>Videos you watch will show up here.</p>
          <Link to="/home" className="btn btn-secondary" style={{ marginTop: "16px" }}>
            Start Watching
          </Link>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="video-grid">
          {history.map((h) => {
            if (!h.video) return null;
            return (
              <div key={h._id} style={{ position: "relative" }}>
                <VideoCard video={h.video} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", fontSize: "0.75rem", color: "var(--text-muted)", padding: "0 4px" }}>
                  <span>Watched {timeAgo(h.watchedAt)}</span>
                  <button
                    onClick={(e) => handleRemove(e, h._id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                    title="Remove from history"
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
};

export default History;
