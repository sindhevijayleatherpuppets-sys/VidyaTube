import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import VideoCard from "../components/VideoCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchUserProfile, updateUserProfile, toggleSubscribe } from "../services/userService";
import { fetchChannelPosts, createCommunityPost, voteCommunityPoll, toggleLikeCommunityPost } from "../services/communityService";
import { formatViews, formatSubscribers, formatDate, timeAgo, mediaUrl } from "../utils/format";

const TABS = ["Home", "Videos", "Shorts", "Community", "About"];

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("Home");
  const [videoSort, setVideoSort] = useState("latest");
  const [subscribed, setSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Channel Customization Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    handle: "",
    bio: "",
    avatar: "",
    banner: "",
  });

  // Create Community Post Form
  const [newPostText, setNewPostText] = useState("");
  const [pollOptionsInput, setPollOptionsInput] = useState(["", ""]);
  const [showPollInputs, setShowPollInputs] = useState(false);
  const [postSubmitting, setPostSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchUserProfile(id);
      setProfile(data.user);
      setVideos(data.videos || []);
      setShorts(data.shorts || []);
      setSubscribed(data.isSubscribed);
      setSubCount(data.user?.subscriberCount || 0);
      setEditForm({
        fullName: data.user?.fullName || "",
        handle: data.user?.handle || "",
        bio: data.user?.bio || "",
        avatar: data.user?.avatar || "",
        banner: data.user?.banner || "",
      });

      // Load community posts
      const posts = await fetchChannelPosts(id);
      setCommunityPosts(posts || []);

      // SEO document title
      document.title = `${data.user?.fullName} (@${data.user?.handle || data.user?.fullName}) - VidyTube`;
    } catch (err) {
      setError("Channel not found.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubscribe = async () => {
    const data = await toggleSubscribe(id);
    setSubscribed(data.subscribed);
    setSubCount(data.subscriberCount);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateUserProfile(editForm);
      setProfile((prev) => ({ ...prev, ...updated }));
      setEditModalOpen(false);
      alert("Channel customized successfully!");
    } catch (err) {
      alert("Failed to update profile.");
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    setPostSubmitting(true);
    try {
      const payload = {
        text: newPostText.trim(),
        pollOptions: showPollInputs ? pollOptionsInput.filter(Boolean) : [],
      };
      const created = await createCommunityPost(payload);
      setCommunityPosts([created, ...communityPosts]);
      setNewPostText("");
      setPollOptionsInput(["", ""]);
      setShowPollInputs(false);
    } catch (err) {
      alert("Failed to create post.");
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleVotePoll = async (postId, optionIndex) => {
    try {
      const updatedPost = await voteCommunityPoll(postId, optionIndex);
      setCommunityPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const data = await toggleLikeCommunityPost(postId);
      setCommunityPosts((prev) =>
        prev.map((p) => {
          if (p._id === postId) {
            return {
              ...p,
              likes: data.liked
                ? [...(p.likes || []), currentUser?.id]
                : (p.likes || []).filter((id) => id !== currentUser?.id),
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
          <span style={{ fontSize: "2rem" }}>⚡</span>
          <p style={{ marginTop: "12px" }}>Loading channel...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !profile) {
    return (
      <AppShell>
        <div className="alert alert-error">{error}</div>
      </AppShell>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const channelInitial = profile.fullName?.[0]?.toUpperCase() || "U";

  // Sort videos
  const sortedVideos = [...videos].sort((a, b) => {
    if (videoSort === "popular") return (b.views || 0) - (a.views || 0);
    if (videoSort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const featuredTrailer = videos.length > 0 ? videos[0] : null;

  return (
    <AppShell>
      {/* Channel Header Banner */}
      <div className="channel-banner-container">
        <img
          src={profile.banner || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80"}
          alt="Channel Banner"
          className="channel-banner-img"
        />
      </div>

      {/* Channel Profile Info Header */}
      <div className="channel-profile-header">
        <div className="channel-avatar-xl">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.fullName} />
          ) : (
            channelInitial
          )}
        </div>

        <div className="channel-meta-box">
          <h1 className="channel-title-xl">
            {profile.fullName} <span className="verified-icon" style={{ fontSize: "1.1rem" }}>✓</span>
          </h1>
          <div className="channel-sub-info">
            <strong>{profile.handle || `@${profile.fullName.toLowerCase().replace(/\s+/g, "")}`}</strong> •{" "}
            {formatSubscribers(subCount)} • {videos.length + shorts.length} videos
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "700px" }}>
            {profile.bio || "Welcome to my official VidyTube channel!"}
          </p>
        </div>

        <div>
          {isOwnProfile ? (
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn btn-secondary" onClick={() => setEditModalOpen(true)}>
                ✏️ Customize Channel
              </button>
              <Link to="/studio" className="btn btn-primary">
                🎨 Manage Videos
              </Link>
            </div>
          ) : (
            <button
              className={`btn ${subscribed ? "btn-secondary" : "btn-primary"}`}
              onClick={handleSubscribe}
            >
              {subscribed ? "✓ Subscribed 🔔" : "Subscribe"}
            </button>
          )}
        </div>
      </div>

      {/* Channel Tabs Bar */}
      <div className="channel-tabs-bar">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`channel-tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "Home" && "🏠 "}
            {tab === "Videos" && "🎬 "}
            {tab === "Shorts" && "⚡ "}
            {tab === "Community" && "💬 "}
            {tab === "About" && "ℹ️ "}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: HOME */}
      {activeTab === "Home" && (
        <div>
          {/* Spotlight Trailer */}
          {featuredTrailer && (
            <div className="hero-banner" style={{ padding: "24px", marginBottom: "28px" }}>
              <span className="hero-badge">🌟 Channel Spotlight Trailer</span>
              <h2 style={{ fontSize: "1.4rem", margin: "8px 0" }}>{featuredTrailer.title}</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "16px" }}>
                {featuredTrailer.description ? featuredTrailer.description.slice(0, 160) + "..." : ""}
              </p>
              <Link to={`/watch/${featuredTrailer._id}`} className="btn btn-primary btn-small">
                ▶ Watch Spotlight
              </Link>
            </div>
          )}

          <h2 className="section-heading">Latest Uploads</h2>
          {videos.length === 0 ? (
            <div className="empty-state">No videos uploaded yet.</div>
          ) : (
            <div className="video-grid">
              {videos.slice(0, 6).map((v) => (
                <VideoCard key={v._id} video={{ ...v, channel: profile }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: VIDEOS */}
      {activeTab === "Videos" && (
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <button
              className={`category-chip ${videoSort === "latest" ? "active" : ""}`}
              onClick={() => setVideoSort("latest")}
            >
              Latest
            </button>
            <button
              className={`category-chip ${videoSort === "popular" ? "active" : ""}`}
              onClick={() => setVideoSort("popular")}
            >
              Popular
            </button>
            <button
              className={`category-chip ${videoSort === "oldest" ? "active" : ""}`}
              onClick={() => setVideoSort("oldest")}
            >
              Oldest
            </button>
          </div>

          {sortedVideos.length === 0 ? (
            <div className="empty-state">No long-form videos uploaded yet.</div>
          ) : (
            <div className="video-grid">
              {sortedVideos.map((v) => (
                <VideoCard key={v._id} video={{ ...v, channel: profile }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: SHORTS */}
      {activeTab === "Shorts" && (
        <div>
          {shorts.length === 0 ? (
            <div className="empty-state">No YouTube Shorts created yet.</div>
          ) : (
            <div className="shorts-shelf-grid">
              {shorts.map((short) => (
                <Link key={short._id} to={`/shorts?id=${short._id}`} className="short-card">
                  <div className="short-thumb-wrap">
                    <img src={mediaUrl(short.thumbnailUrl)} alt={short.title} className="short-thumb" />
                    <span className="video-duration-badge" style={{ background: "var(--accent)" }}>
                      SHORT
                    </span>
                  </div>
                  <h4 className="short-title">{short.title}</h4>
                  <span className="short-views">{formatViews(short.views || 0)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: COMMUNITY (Posts & Interactive Polls) */}
      {activeTab === "Community" && (
        <div className="community-container">
          {/* Create Post (Owner only) */}
          {isOwnProfile && (
            <div className="create-post-card">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "12px" }}>
                Post an update to your subscribers
              </h3>
              <form onSubmit={handleCreatePost}>
                <textarea
                  placeholder="What's happening? Ask a question or share an update..."
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    background: "var(--bg-main)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    marginBottom: "12px",
                  }}
                />

                {showPollInputs && (
                  <div style={{ marginBottom: "16px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                      Poll Options:
                    </span>
                    {pollOptionsInput.map((opt, idx) => (
                      <input
                        key={idx}
                        type="text"
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...pollOptionsInput];
                          updated[idx] = e.target.value;
                          setPollOptionsInput(updated);
                        }}
                        style={{
                          width: "100%",
                          background: "var(--bg-main)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-primary)",
                          padding: "8px 12px",
                          borderRadius: "var(--radius-sm)",
                          marginTop: "6px",
                        }}
                      />
                    ))}
                    {pollOptionsInput.length < 4 && (
                      <button
                        type="button"
                        onClick={() => setPollOptionsInput([...pollOptionsInput, ""])}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--accent)",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          marginTop: "6px",
                        }}
                      >
                        ＋ Add option
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    type="button"
                    className="action-pill-btn"
                    style={{ fontSize: "0.82rem" }}
                    onClick={() => setShowPollInputs(!showPollInputs)}
                  >
                    📊 {showPollInputs ? "Remove Poll" : "Add Poll"}
                  </button>
                  <button type="submit" className="btn btn-primary btn-small" disabled={postSubmitting}>
                    {postSubmitting ? "Posting..." : "Post"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Posts List */}
          {communityPosts.length === 0 ? (
            <div className="empty-state">No community posts yet.</div>
          ) : (
            communityPosts.map((post) => {
              const totalVotes = post.pollOptions?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0;

              return (
                <div key={post._id} className="community-post-card">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <div className="user-avatar-circle" style={{ width: 36, height: 36 }}>
                      {profile.avatar ? <img src={profile.avatar} alt="" /> : channelInitial}
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{profile.fullName}</span>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{timeAgo(post.createdAt)}</div>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                    {post.text}
                  </p>

                  {/* Interactive Poll */}
                  {post.pollOptions && post.pollOptions.length > 0 && (
                    <div style={{ margin: "14px 0" }}>
                      {post.pollOptions.map((opt, optIdx) => {
                        const optVotes = opt.votes?.length || 0;
                        const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                        const hasVotedThis = opt.votes?.includes(currentUser?.id);

                        return (
                          <div
                            key={opt._id || optIdx}
                            className="poll-option-row"
                            onClick={() => handleVotePoll(post._id, optIdx)}
                          >
                            <div className="poll-option-bar" style={{ width: `${percentage}%` }} />
                            <div className="poll-option-content">
                              <span>
                                {hasVotedThis ? "✓ " : ""}
                                {opt.text}
                              </span>
                              <span style={{ color: "var(--text-secondary)" }}>{percentage}%</span>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        {totalVotes} total vote{totalVotes === 1 ? "" : "s"}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "12px" }}>
                    <button className="comment-action-btn" onClick={() => handleLikePost(post._id)}>
                      👍 <span>{post.likes?.length || 0}</span>
                    </button>
                    <button className="comment-action-btn">👎</button>
                    <button
                      className="comment-action-btn"
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        alert("Post link copied!");
                      }}
                    >
                      ↗️ Share
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 5: ABOUT */}
      {activeTab === "About" && (
        <div style={{ maxWidth: "800px", background: "var(--bg-surface)", padding: "28px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "16px" }}>About Channel</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "24px" }}>
            {profile.bio || "No description provided."}
          </p>

          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "12px" }}>Stats</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.92rem", color: "var(--text-secondary)" }}>
            <div>📅 Joined {formatDate(profile.createdAt)}</div>
            <div>👁️ {formatViews(profile.totalViews || 0)}</div>
            <div>👥 {formatSubscribers(subCount)}</div>
            <div>🎬 {videos.length + shorts.length} total videos uploaded</div>
          </div>
        </div>
      )}

      {/* Customize Channel Modal */}
      {editModalOpen && (
        <div className="modal-backdrop" onClick={() => setEditModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">✏️ Customize Channel Profile</h2>
            <form onSubmit={handleSaveProfile}>
              <label className="field">
                <span>Channel Name</span>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                />
              </label>

              <label className="field">
                <span>Handle (e.g. @alicecreates)</span>
                <input
                  type="text"
                  value={editForm.handle}
                  onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                />
              </label>

              <label className="field">
                <span>Bio / Description</span>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                />
              </label>

              <label className="field">
                <span>Avatar Image URL</span>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={editForm.avatar}
                  onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                />
              </label>

              <label className="field">
                <span>Banner Image URL</span>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={editForm.banner}
                  onChange={(e) => setEditForm({ ...editForm, banner: e.target.value })}
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

export default Profile;
