import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { fetchMyStudioVideos, updateVideo, deleteVideo, downloadVideoFile } from "../services/videoService";
import { mediaUrl, formatViews, formatDate, CATEGORIES } from "../utils/format";

const TABS = ["Analytics", "Content Manager", "Comment Moderation"];

const MOCK_WEEKLY_VIEWS = [
  { day: "Mon", views: 4200, height: 45 },
  { day: "Tue", views: 6800, height: 65 },
  { day: "Wed", views: 5100, height: 50 },
  { day: "Thu", views: 8900, height: 85 },
  { day: "Fri", views: 11400, height: 100 },
  { day: "Sat", views: 9800, height: 90 },
  { day: "Sun", views: 7600, height: 70 },
];

const MOCK_COMMENTS_FOR_MODERATION = [
  {
    id: "m1",
    author: "GamerZone Live",
    videoTitle: "Building a Modern Full-Stack YouTube Clone with React & Node.js",
    text: "Incredible project! The state management flow is so smooth.",
    time: "2 hours ago",
  },
  {
    id: "m2",
    author: "TechFlow Hub",
    videoTitle: "Mastering TypeScript Generics & High-Performance Design Patterns",
    text: "Can you make a dedicated follow-up on WebAssembly and Rust integrations?",
    time: "5 hours ago",
  },
  {
    id: "m3",
    author: "LoFi Chill Beats",
    videoTitle: "Lo-Fi Beats to Relax / Study / Code To",
    text: "Love the retro synthesizer transitions in this mix! 🎧✨",
    time: "1 day ago",
  },
];

const CreatorStudio = () => {
  const [activeTab, setActiveTab] = useState("Analytics");
  const [videos, setVideos] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [comments, setComments] = useState(MOCK_COMMENTS_FOR_MODERATION);
  const [replyInputMap, setReplyInputMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit Video Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "Technology",
    visibility: "public",
    tags: "",
  });

  const loadStudio = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMyStudioVideos();
      setVideos(data.videos || []);
      setAnalytics(data.analytics || null);
    } catch (err) {
      setError("Could not load Creator Studio data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "YouTube Creator Studio - VidyTube";
    loadStudio();
  }, []);

  const handleOpenEdit = (v) => {
    setEditingVideo(v);
    setEditForm({
      title: v.title,
      description: v.description || "",
      category: v.category || "Technology",
      visibility: v.visibility || "public",
      tags: Array.isArray(v.tags) ? v.tags.join(", ") : "",
    });
    setEditModalOpen(true);
  };

  const handleSaveVideo = async (e) => {
    e.preventDefault();
    if (!editingVideo) return;
    try {
      const updated = await updateVideo(editingVideo._id, editForm);
      setVideos((prev) => prev.map((v) => (v._id === editingVideo._id ? updated : v)));
      setEditModalOpen(false);
      alert("Video updated successfully!");
    } catch (err) {
      alert("Failed to update video.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this video from VidyTube?")) return;
    try {
      await deleteVideo(id);
      setVideos((prev) => prev.filter((v) => v._id !== id));
    } catch (err) {
      alert("Failed to delete video.");
    }
  };

  const handleReplyModeration = (commentId) => {
    const text = replyInputMap[commentId];
    if (!text || !text.trim()) return;
    alert(`Replied: "${text}"`);
    setReplyInputMap({ ...replyInputMap, [commentId]: "" });
  };

  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadMaster = async (v) => {
    setDownloadingId(v._id);
    try {
      await downloadVideoFile(v._id, v.title);
    } catch (err) {
      alert(err.message || "Failed to download master video file.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteModeratedComment = (commentId) => {
    setComments(comments.filter((c) => c.id !== commentId));
  };

  return (
    <AppShell>
      <div className="studio-header">
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>🎨 Channel Creator Studio</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginTop: "4px" }}>
            Monitor channel performance, manage uploads, and moderate audience comments.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/upload" className="btn btn-primary">
            ＋ Upload Video
          </Link>
        </div>
      </div>

      {/* Studio Navigation Tabs */}
      <div className="channel-tabs-bar" style={{ marginBottom: "28px" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`channel-tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "Analytics" && "📊 "}
            {tab === "Content Manager" && "🎬 "}
            {tab === "Comment Moderation" && "💬 "}
            {tab}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
          <span style={{ fontSize: "1.8rem" }}>⚡</span>
          <p style={{ marginTop: "10px" }}>Loading studio analytics...</p>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {/* Tab 1: ANALYTICS */}
      {activeTab === "Analytics" && analytics && (
        <div>
          {/* Key Metrics Cards */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value">{analytics.totalVideos}</div>
              <div className="stat-label">Total Published Videos</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatViews(analytics.totalViews)}</div>
              <div className="stat-label">Lifetime Views</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{analytics.totalLikes}</div>
              <div className="stat-label">Total Likes Received</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{analytics.estimatedWatchHours} hrs</div>
              <div className="stat-label">Watch Time (Hours)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{analytics.subscribers}</div>
              <div className="stat-label">Current Subscribers</div>
            </div>
          </div>

          {/* Interactive Weekly Growth Chart */}
          <div className="analytics-chart-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>Weekly Traffic & Viewership</h3>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Last 7 days performance • +24.8% vs previous week
                </span>
              </div>
              <span className="navbar-logo-badge" style={{ background: "rgba(16, 185, 129, 0.2)", color: "var(--success)" }}>
                📈 Growth Trending Up
              </span>
            </div>

            <div className="chart-bars-container">
              {MOCK_WEEKLY_VIEWS.map((item) => (
                <div key={item.day} className="chart-bar-column">
                  <div
                    className="chart-bar-fill"
                    style={{ height: `${item.height}%` }}
                    title={`${item.views.toLocaleString()} views on ${item.day}`}
                  />
                  <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: CONTENT MANAGER */}
      {activeTab === "Content Manager" && (
        <div>
          <h2 className="section-heading">Your Uploaded Videos ({videos.length})</h2>
          {videos.length === 0 && !loading ? (
            <div className="empty-state">
              <h3>No videos uploaded yet</h3>
              <p>Upload a video to start managing it in your studio!</p>
              <Link to="/upload" className="btn btn-primary" style={{ marginTop: "16px" }}>
                Upload Now
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="studio-table">
                <thead>
                  <tr>
                    <th>Video</th>
                    <th>Visibility</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Views</th>
                    <th>Likes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((v) => (
                    <tr key={v._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <img
                            src={mediaUrl(v.thumbnailUrl)}
                            alt={v.title}
                            style={{ width: "90px", aspectRatio: "16/9", objectFit: "cover", borderRadius: "6px" }}
                          />
                          <div>
                            <Link
                              to={v.isShort ? `/shorts?id=${v._id}` : `/watch/${v._id}`}
                              style={{ fontWeight: 700, color: "var(--text-primary)", display: "block" }}
                            >
                              {v.title}
                            </Link>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {v.duration || "HD"} {v.isShort ? "• Short" : ""}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`visibility-badge ${v.visibility || "public"}`}>
                          {v.visibility === "private" ? "🔒 Private" : "🌐 Public"}
                        </span>
                      </td>
                      <td>{v.category}</td>
                      <td>{formatDate(v.createdAt)}</td>
                      <td>{formatViews(v.views || 0)}</td>
                      <td>{v.likes ? v.likes.length : 0}</td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button className="btn btn-secondary btn-small" onClick={() => handleOpenEdit(v)}>
                            ✏️ Edit
                          </button>
                          {!v.youtubeVideoId && v.source !== "youtube" && (
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() => handleDownloadMaster(v)}
                              disabled={downloadingId === v._id}
                              title="Download original master video file"
                            >
                              {downloadingId === v._id ? "⏳" : "⬇️ Download"}
                            </button>
                          )}
                          <button
                            className="btn btn-danger btn-small"
                            onClick={() => handleDelete(v._id)}
                            title="Delete video"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: COMMENT MODERATION */}
      {activeTab === "Comment Moderation" && (
        <div style={{ maxWidth: "900px" }}>
          <h2 className="section-heading">Recent Audience Comments ({comments.length})</h2>
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                background: "var(--bg-surface)",
                padding: "20px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{c.author}</span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{c.time}</span>
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--accent)", marginBottom: "6px" }}>
                On: "{c.videoTitle}"
              </div>
              <p style={{ color: "var(--text-primary)", fontSize: "0.92rem", marginBottom: "14px" }}>
                {c.text}
              </p>

              {/* Quick Reply Form */}
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Type a creator reply..."
                  value={replyInputMap[c.id] || ""}
                  onChange={(e) => setReplyInputMap({ ...replyInputMap, [c.id]: e.target.value })}
                  style={{
                    flex: 1,
                    background: "var(--bg-main)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  onClick={() => handleReplyModeration(c.id)}
                >
                  Reply
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-small"
                  onClick={() => handleDeleteModeratedComment(c.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Video Modal */}
      {editModalOpen && (
        <div className="modal-backdrop" onClick={() => setEditModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">✏️ Edit Video Details</h2>
            <form onSubmit={handleSaveVideo}>
              <label className="field">
                <span>Title</span>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </label>

              <label className="field">
                <span>Description</span>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </label>

              <label className="field">
                <span>Category</span>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Visibility</span>
                <select
                  value={editForm.visibility}
                  onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })}
                >
                  <option value="public">🌐 Public (Everyone can watch)</option>
                  <option value="unlisted">🔗 Unlisted (Anyone with link)</option>
                  <option value="private">🔒 Private (Only you)</option>
                </select>
              </label>

              <label className="field">
                <span>Tags (comma separated)</span>
                <input
                  type="text"
                  placeholder="react, coding, tutorial"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                />
              </label>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default CreatorStudio;
