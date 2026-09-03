import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import VideoCard from "../components/VideoCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  updatePlaylist,
} from "../services/libraryService";
import { mediaUrl } from "../utils/format";

const Playlists = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPlaylists();
      setPlaylists(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      const p = await createPlaylist({ name: newTitle.trim(), description: newDesc.trim() });
      setPlaylists([p, ...playlists]);
      setNewTitle("");
      setNewDesc("");
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this playlist?")) return;
    try {
      await deletePlaylist(id);
      setPlaylists(playlists.filter((p) => p._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <AppShell>
        <div className="empty-state" style={{ maxWidth: 460, margin: "60px auto" }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎞️</div>
          <h2>Create and manage custom playlists</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "6px", marginBottom: "20px" }}>
            Sign in to create playlists and organize videos into custom collections.
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px" }}>
            <span>🎞️</span> Playlists
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
            Custom video collections and mixtapes created by you
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          ➕ New Playlist
        </button>
      </div>

      {loading && (
        <div className="video-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && playlists.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎞️</div>
          <h3>No custom playlists yet</h3>
          <p>Create a playlist to group your favorite tutorials, music, and creator videos together.</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ marginTop: "16px" }}>
            Create First Playlist
          </button>
        </div>
      )}

      {!loading && playlists.length > 0 && (
        <div className="video-grid">
          {playlists.map((p) => {
            const firstVideo = p.videos?.[0];
            const thumb = firstVideo?.thumbnailUrl
              ? mediaUrl(firstVideo.thumbnailUrl)
              : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80";

            return (
              <div
                key={p._id}
                className="playlist-card-container"
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-subtle)",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Thumbnail Layer */}
                <Link to={`/playlist/${p._id}`} style={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden", display: "block" }}>
                  <img src={thumb} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {/* Playlist Overlay Badge */}
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: "35%",
                      background: "rgba(0,0,0,0.8)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      gap: "4px",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>🎞️</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>{p.videos?.length || 0}</span>
                  </div>
                </Link>

                {/* Metadata */}
                <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flex: 1 }}>
                  <div>
                    <Link to={`/playlist/${p._id}`}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
                        {p.name}
                      </h3>
                    </Link>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {p.videos?.length || 0} videos • View full playlist
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, p._id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "1rem",
                      padding: "4px",
                    }}
                    title="Delete playlist"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "16px" }}>Create New Playlist</h2>
            <form onSubmit={handleCreate}>
              <label className="field" style={{ marginBottom: "12px" }}>
                <span>Playlist Name</span>
                <input
                  type="text"
                  placeholder="e.g. Favorite Coding Tutorials"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </label>

              <label className="field" style={{ marginBottom: "18px" }}>
                <span>Description (optional)</span>
                <textarea
                  placeholder="What is this playlist about?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Playlist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default Playlists;
