import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import VideoCard from "../components/VideoCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getWatchLater, toggleWatchLater } from "../services/libraryService";

const WatchLater = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getWatchLater();
        setVideos(data || []);
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
      await toggleWatchLater(videoId);
      setVideos((prev) => prev.filter((v) => (v._id || v) !== videoId));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <AppShell>
        <div className="empty-state" style={{ maxWidth: 460, margin: "60px auto" }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>⏱️</div>
          <h2>Save videos to watch later</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "6px", marginBottom: "20px" }}>
            Sign in to access your Watch Later list anytime, anywhere.
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
      <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", marginBottom: "32px" }}>
        {/* Playlist Hero Badge */}
        <div
          style={{
            width: "300px",
            background: "linear-gradient(180deg, rgba(255, 30, 68, 0.25) 0%, var(--bg-surface) 100%)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            border: "1px solid var(--border-highlight)",
            boxShadow: "var(--shadow-md)",
            height: "fit-content",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>⏱️</div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Watch Later</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: "6px 0 16px" }}>
            {videos.length} video{videos.length === 1 ? "" : "s"} saved • Updated recently
          </p>

          {videos.length > 0 && (
            <Link to={`/watch/${videos[0]._id}`} className="btn btn-primary" style={{ width: "100%" }}>
              ▶ Play All
            </Link>
          )}
        </div>

        {/* Video List */}
        <div style={{ flex: 1, minWidth: "300px" }}>
          <h2 className="section-heading" style={{ marginTop: 0 }}>Saved Queue</h2>

          {loading && (
            <div className="video-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!loading && videos.length === 0 && (
            <div className="empty-state">
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>⏱️</div>
              <h3>Your Watch Later queue is empty</h3>
              <p>Save videos to watch later while browsing VidyTube.</p>
              <Link to="/home" className="btn btn-secondary" style={{ marginTop: "16px" }}>
                Browse Videos
              </Link>
            </div>
          )}

          {!loading && videos.length > 0 && (
            <div className="video-grid">
              {videos.map((v) => (
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
                      color: "#fff",
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
                    title="Remove from Watch Later"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default WatchLater;
