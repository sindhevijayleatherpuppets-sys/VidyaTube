import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import VideoCard from "../components/VideoCard.jsx";
import { fetchLikedVideos } from "../services/videoService";

const LikedVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchLikedVideos();
        setVideos(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AppShell>
      <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", marginBottom: "32px" }}>
        <div
          style={{
            width: "320px",
            background: "linear-gradient(180deg, rgba(121, 40, 202, 0.3) 0%, var(--bg-surface) 100%)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            border: "1px solid var(--border-highlight)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>👍</div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Liked Videos</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: "6px 0 16px" }}>
            {videos.length} video{videos.length === 1 ? "" : "s"} • Auto-generated playlist
          </p>

          {videos.length > 0 && (
            <Link to={`/watch/${videos[0]._id}`} className="btn btn-primary" style={{ width: "100%" }}>
              ▶ Play All
            </Link>
          )}
        </div>

        <div style={{ flex: 1, minWidth: "300px" }}>
          <h2 className="section-heading" style={{ marginTop: 0 }}>Liked Videos</h2>
          {loading && <p style={{ color: "var(--text-secondary)" }}>Loading liked videos...</p>}

          {!loading && videos.length === 0 && (
            <div className="empty-state">
              <h3>No liked videos yet</h3>
              <p style={{ marginTop: "6px" }}>Like videos you enjoy to see them here.</p>
            </div>
          )}

          <div className="video-grid">
            {videos.map((v) => (
              <VideoCard key={v._id} video={v} />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default LikedVideos;
