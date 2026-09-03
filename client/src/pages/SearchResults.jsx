import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { searchYouTubeVideos } from "../services/youtubeService";
import { fetchVideos } from "../services/videoService";
import { mediaUrl, formatViews, timeAgo, formatSubscribers } from "../utils/format";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || searchParams.get("search") || "";

  const [videos, setVideos] = useState([]);
  const [channels, setChannels] = useState([]);
  const [nativeVideos, setNativeVideos] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isKeyMissing, setIsKeyMissing] = useState(false);
  const [errorType, setErrorType] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    document.title = query ? `"${query}" - VidyTube Search` : "Search Videos - VidyTube";
  }, [query]);

  const loadResults = useCallback(async () => {
    if (!query) {
      setVideos([]);
      setChannels([]);
      setNativeVideos([]);
      setLoading(false);
      setIsKeyMissing(false);
      return;
    }

    setLoading(true);
    setIsKeyMissing(false);
    setErrorType(null);
    setErrorMessage("");
    try {
      // 1. Fetch real-time YouTube Data API search
      const ytData = await searchYouTubeVideos({
        q: query,
        category: categoryFilter !== "All" ? categoryFilter : "",
      });

      // 2. Fetch native VidyTube uploaded videos
      const nativeData = await fetchVideos({
        search: query,
        category: categoryFilter,
      });

      setVideos(ytData.videos || []);
      setChannels(ytData.channels || []);
      setNextPageToken(ytData.nextPageToken || null);
      setNativeVideos(nativeData || []);
      setIsKeyMissing(!!ytData.isKeyMissing);
      setErrorType(ytData.errorType || null);
      setErrorMessage(ytData.error || "");
    } catch (err) {
      console.error("Search fetch error:", err);
      setErrorMessage("Network error connecting to VidyTube backend server.");
    } finally {
      setLoading(false);
    }
  }, [query, categoryFilter]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const handleLoadMore = async () => {
    if (!nextPageToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await searchYouTubeVideos({
        q: query,
        pageToken: nextPageToken,
        category: categoryFilter !== "All" ? categoryFilter : "",
      });
      setVideos((prev) => [...prev, ...(data.videos || [])]);
      setNextPageToken(data.nextPageToken || null);
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const filteredList = [
    ...(sourceFilter === "all" || sourceFilter === "native" ? nativeVideos : []),
    ...(sourceFilter === "all" || sourceFilter === "youtube" ? videos : []),
  ];

  return (
    <AppShell>
      <div className="search-results-layout" style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Search Header & Filter Toggle */}
        <div
          className="search-filter-bar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            paddingBottom: "12px",
            borderBottom: "1px solid var(--border-subtle)",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              {isKeyMissing ? (
                <>Searching for <strong style={{ color: "var(--text-primary)" }}>"{query}"</strong></>
              ) : (
                <>Live results for <strong style={{ color: "var(--text-primary)" }}>"{query}"</strong> ({filteredList.length} videos)</>
              )}
            </span>
          </div>
          {!isKeyMissing && (
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            >
              <span>⚙️</span> {filterPanelOpen ? "Hide Filters ▲" : "Filters ▼"}
            </button>
          )}
        </div>

        {/* API Key Missing Setup Guide Card */}
        {isKeyMissing && !loading && videos.length === 0 && (
          <div
            style={{
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              padding: "28px",
              border: "1px solid var(--border-highlight)",
              marginBottom: "28px",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <span style={{ fontSize: "1.6rem" }}>🔑</span>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>YouTube Data API Key Setup Required</h2>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: "20px" }}>
              VidyTube's dynamic search engine is connected to the official <strong>YouTube Data API v3</strong>. To stream real matching videos for <strong>"{query}"</strong> and any query in real time, add your Google Cloud API key:
            </p>

            <div
              style={{
                background: "var(--bg-main)",
                borderRadius: "var(--radius-md)",
                padding: "18px 20px",
                border: "1px solid var(--border-subtle)",
                marginBottom: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.88rem" }}>
                <span style={{ background: "var(--accent)", color: "#fff", width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, flexShrink: 0 }}>1</span>
                <div>
                  Go to <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "underline" }}>Google Cloud Console &gt; YouTube Data API v3</a> in your project <code>VidyTube</code> and click <strong>Enable</strong>.
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.88rem" }}>
                <span style={{ background: "var(--accent)", color: "#fff", width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, flexShrink: 0 }}>2</span>
                <div>
                  Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "underline" }}>APIs &amp; Services &gt; Credentials</a> and click <strong>+ Create Credentials &gt; API key</strong>.
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.88rem" }}>
                <span style={{ background: "var(--accent)", color: "#fff", width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, flexShrink: 0 }}>3</span>
                <div>
                  Paste the generated key into <code style={{ color: "var(--accent)", fontWeight: 700 }}>server/.env</code> as:
                  <div style={{ background: "rgba(0,0,0,0.5)", padding: "8px 12px", borderRadius: "var(--radius-sm)", marginTop: "6px", fontFamily: "monospace", fontSize: "0.84rem", color: "#6ee7b7" }}>
                    YOUTUBE_API_KEY=AIzaSy...
                  </div>
                </div>
              </div>
            </div>

            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              After saving the file, restart the server (or it will auto-reload) and all searches will instantly stream live matching YouTube results.
            </p>
          </div>
        )}

        {/* Quota or API Error Banner */}
        {!isKeyMissing && errorType && videos.length === 0 && (
          <div className="alert alert-error" style={{ marginBottom: "24px", fontSize: "0.88rem" }}>
            <strong>{errorType === "QUOTA_EXCEEDED" ? "Daily API Quota Exceeded:" : "YouTube API Notice:"}</strong> {errorMessage}
          </div>
        )}

        {/* Expandable Filter Panel */}
        {filterPanelOpen && (
          <div
            className="search-filter-panel"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
              background: "var(--bg-surface)",
              padding: "16px",
              borderRadius: "var(--radius-md)",
              marginBottom: "24px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              <div className="filter-group-title" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                Source
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { id: "all", label: "All Sources" },
                  { id: "native", label: "VidyTube Originals" },
                  { id: "youtube", label: "Global Content" },
                ].map((s) => (
                  <button
                    key={s.id}
                    className={`filter-option-btn ${sourceFilter === s.id ? "active" : ""}`}
                    onClick={() => setSourceFilter(s.id)}
                    style={{
                      textAlign: "left",
                      padding: "6px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      background: sourceFilter === s.id ? "var(--bg-surface-hover)" : "transparent",
                      color: sourceFilter === s.id ? "var(--accent)" : "var(--text-secondary)",
                      cursor: "pointer",
                      fontWeight: sourceFilter === s.id ? 700 : 400,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="filter-group-title" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                Category
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {["All", "Technology", "Education", "Gaming", "Music", "Entertainment", "News"].map((cat) => (
                  <button
                    key={cat}
                    className={`filter-option-btn ${categoryFilter === cat ? "active" : ""}`}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      textAlign: "left",
                      padding: "6px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      background: categoryFilter === cat ? "var(--bg-surface-hover)" : "transparent",
                      color: categoryFilter === cat ? "var(--accent)" : "var(--text-secondary)",
                      cursor: "pointer",
                      fontWeight: categoryFilter === cat ? 700 : 400,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} horizontal />
            ))}
          </div>
        )}

        {/* Empty State (Only if API key is present but no videos matched) */}
        {!loading && !isKeyMissing && filteredList.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔍</div>
            <h3>No results found for "{query}"</h3>
            <p>Try different keywords or check spelling to discover videos.</p>
          </div>
        )}

        {/* Channels Spotlight Section */}
        {!loading && channels.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            {channels.map((chan) => (
              <div
                key={chan._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  padding: "16px 20px",
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-subtle)",
                  marginBottom: "12px",
                }}
              >
                <img
                  src={chan.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"}
                  alt={chan.fullName}
                  style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover" }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "2px" }}>{chan.fullName}</h3>
                  <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                    {chan.handle} • {chan.subscriberCount > 0 ? `${formatSubscribers(chan.subscriberCount)} subscribers` : "Official Creator"}
                  </p>
                  {chan.description && (
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {chan.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search Results List */}
        {!loading && filteredList.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredList.map((v) => {
              const watchLink = `/watch/${v.youtubeVideoId ? `yt_${v.youtubeVideoId}` : v._id}`;
              const channelTitle = v.channel?.fullName || v.channelTitle || "Creator";
              const channelAvatar = v.channel?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200";

              return (
                <div
                  key={v._id}
                  className="search-card-horizontal"
                  style={{
                    display: "flex",
                    gap: "16px",
                    background: "var(--bg-surface)",
                    padding: "12px",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border-subtle)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-highlight)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  {/* Thumbnail */}
                  <Link
                    to={watchLink}
                    style={{
                      position: "relative",
                      width: "300px",
                      minWidth: "220px",
                      aspectRatio: "16 / 9",
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={mediaUrl(v.thumbnailUrl)}
                      alt={v.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        bottom: "6px",
                        right: "6px",
                        background: "rgba(0,0,0,0.85)",
                        color: "#fff",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {v.duration || "03:45"}
                    </span>
                  </Link>

                  {/* Metadata */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <Link to={watchLink}>
                        <h3
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            lineHeight: 1.4,
                            marginBottom: "6px",
                          }}
                        >
                          {v.title}
                        </h3>
                      </Link>

                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                        <span>{formatViews(v.views || 0)} views</span> •{" "}
                        <span>{timeAgo(v.createdAt || v.publishedAt)}</span>
                      </div>

                      {/* Channel Info */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                        <img
                          src={mediaUrl(channelAvatar)}
                          alt={channelTitle}
                          style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
                        />
                        <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                          {channelTitle}
                        </span>
                      </div>

                      {/* Description preview */}
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-secondary)",
                          lineHeight: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {v.description || "Watch this creator video on VidyTube."}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More Button for Real-Time Pagination */}
            {nextPageToken && (
              <div style={{ textAlign: "center", marginTop: "24px", marginBottom: "16px" }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{ padding: "10px 28px", fontWeight: 600 }}
                >
                  {loadingMore ? "Loading more videos..." : "Load More Results"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default SearchResults;
