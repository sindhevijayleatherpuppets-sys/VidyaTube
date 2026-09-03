import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import VideoCard from "../components/VideoCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getFavorites, toggleFavorite } from "../services/libraryService";

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const data = await getFavorites();
        setFavorites(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleRemove = async (e, videoId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleFavorite(videoId);
      setFavorites((prev) => prev.filter((v) => (v._id || v) !== videoId));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <AppShell>
        <div className="empty-state" style={{ maxWidth: 460, margin: "60px auto" }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>⭐</div>
          <h2>Enjoy your favorite videos</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "6px", marginBottom: "20px" }}>
            Sign in to access videos that you have marked as favorite.
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
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px" }}>
          <span>⭐</span> My Favorites
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
          {favorites.length} {favorites.length === 1 ? "video" : "videos"} saved to your favorites collection
        </p>
      </div>

      {loading && (
        <div className="video-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && favorites.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>⭐</div>
          <h3>No favorite videos yet</h3>
          <p>Click the "⭐ Favorite" button while watching any video to add it here.</p>
          <Link to="/home" className="btn btn-secondary" style={{ marginTop: "16px" }}>
            Explore Videos
          </Link>
        </div>
      )}

      {!loading && favorites.length > 0 && (
        <div className="video-grid">
          {favorites.map((v) => (
            <div key={v._id} style={{ position: "relative" }}>
              <VideoCard video={v} />
              <button
                onClick={(e) => handleRemove(e, v._id)}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  zIndex: 3,
                  background: "rgba(0,0,0,0.75)",
                  color: "#ff4d4d",
                  border: "none",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  backdropFilter: "blur(4px)",
                }}
                title="Remove from favorites"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default Favorites;
