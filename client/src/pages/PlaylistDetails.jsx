import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import VideoCard from "../components/VideoCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getPlaylistById, updatePlaylist, deletePlaylist } from "../services/libraryService";
import { mediaUrl } from "../utils/format";

const PlaylistDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPlaylistById(id);
      setPlaylist(data);
    } catch (err) {
      setError("Playlist not found or access denied.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleRemoveVideo = async (videoId) => {
    try {
      const updated = await updatePlaylist(id, { action: "remove", videoId });
      setPlaylist(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!window.confirm("Are you sure you want to delete this playlist?")) return;
    try {
      await deletePlaylist(id);
      navigate("/playlists");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="video-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </AppShell>
    );
  }

  if (error || !playlist) {
    return (
      <AppShell>
        <div className="empty-state">
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>⚠️</div>
          <h3>{error || "Playlist not found"}</h3>
          <Link to="/playlists" className="btn btn-secondary" style={{ marginTop: "16px" }}>
            ← Back to Playlists
          </Link>
        </div>
      </AppShell>
    );
  }

  const videos = playlist.videos || [];
  const firstVideo = videos[0];
  const thumb = firstVideo?.thumbnailUrl
    ? mediaUrl(firstVideo.thumbnailUrl)
    : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80";

  return (
    <AppShell>
      <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", marginBottom: "32px" }}>
        {/* Left Playlist Summary Card */}
        <div
          style={{
            width: "320px",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-md)",
            height: "fit-content",
          }}
        >
          <div style={{ aspectRatio: "16 / 9", borderRadius: "var(--radius-md)", overflow: "hidden", marginBottom: "16px" }}>
            <img src={thumb} alt={playlist.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "8px" }}>{playlist.name}</h1>
          {playlist.description && (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "12px" }}>
              {playlist.description}
            </p>
          )}
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "18px" }}>
            {videos.length} videos • Created by {user?.fullName || "You"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {videos.length > 0 && (
              <Link to={`/watch/${videos[0]._id}`} className="btn btn-primary" style={{ width: "100%", textAlign: "center" }}>
                ▶ Play All
              </Link>
            )}
            <button className="btn btn-secondary" onClick={handleDeletePlaylist} style={{ color: "var(--danger)" }}>
              🗑️ Delete Playlist
            </button>
          </div>
        </div>

        {/* Right Videos Grid */}
        <div style={{ flex: 1, minWidth: "300px" }}>
          <h2 className="section-heading" style={{ marginTop: 0 }}>
            Playlist Videos ({videos.length})
          </h2>

          {videos.length === 0 && (
            <div className="empty-state">
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🎞️</div>
              <h3>No videos in this playlist</h3>
              <p>Add videos while watching any video on VidyTube.</p>
              <Link to="/home" className="btn btn-secondary" style={{ marginTop: "16px" }}>
                Browse Videos
              </Link>
            </div>
          )}

          {videos.length > 0 && (
            <div className="video-grid">
              {videos.map((v, i) => (
                <div key={v._id || i} style={{ position: "relative" }}>
                  <VideoCard video={v} />
                  <button
                    onClick={() => handleRemoveVideo(v._id)}
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
                    title="Remove from playlist"
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

export default PlaylistDetails;
