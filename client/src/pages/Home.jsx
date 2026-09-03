import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import VideoCard from "../components/VideoCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { fetchVideos, fetchShorts, fetchRecommendations } from "../services/videoService";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES, mediaUrl, formatViews } from "../utils/format";

const Home = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  const [category, setCategory] = useState("All");
  const [videos, setVideos] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const observerRef = useRef(null);

  // SEO document title
  useEffect(() => {
    document.title = search
      ? `"${search}" - VidyTube Search`
      : category !== "All"
      ? `${category} Videos - VidyTube`
      : "VidyTube - Watch, Stream & Share Creator Videos";
  }, [search, category]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [videoList, shortList] = await Promise.all([
        fetchVideos({ category, search, isShort: false }),
        fetchShorts(),
      ]);
      setVideos(videoList || []);
      setShorts(shortList || []);

      if (user && !search && category === "All") {
        try {
          const recs = await fetchRecommendations();
          setRecommended(recs.filter((r) => !r.isShort));
        } catch {
          setRecommended([]);
        }
      } else {
        setRecommended([]);
      }
    } catch (err) {
      setError("Could not load videos. Ensure backend server is active.");
    } finally {
      setLoading(false);
    }
  }, [category, search, user]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Infinite Scroll Observer
  const handleObserver = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && !loading && !loadingMore && hasMore && videos.length > 0) {
        setLoadingMore(true);
        setTimeout(() => {
          // Append next batch from existing feed to simulate continuous infinite stream
          setVideos((prev) => [...prev, ...prev.slice(0, 4)]);
          setLoadingMore(false);
        }, 800);
      }
    },
    [loading, loadingMore, hasMore, videos.length]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const featuredVideo = videos.length > 0 ? videos[0] : null;

  return (
    <AppShell>
      {/* Category Pills */}
      <div className="category-bar-wrapper">
        <div className="category-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-chip${category === cat ? " active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat === "All" ? "✨ All" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Spotlight on Home Feed */}
      {!search && category === "All" && featuredVideo && (
        <div className="hero-banner">
          <div className="hero-content">
            <span className="hero-badge">🌟 Spotlight Premiere</span>
            <h1 className="hero-title">{featuredVideo.title}</h1>
            <p className="hero-desc">
              {featuredVideo.description
                ? featuredVideo.description.slice(0, 180) + "..."
                : "Stream high-definition creator content on VidyTube."}
            </p>
            <div className="hero-actions">
              <Link to={`/watch/${featuredVideo._id}`} className="btn btn-primary">
                ▶ Watch Now
              </Link>
              <Link to="/upload" className="btn btn-secondary">
                ＋ Upload Video
              </Link>
            </div>
          </div>
        </div>
      )}

      {search && (
        <h2 className="section-heading">
          🔍 Search results for <span style={{ color: "var(--accent)" }}>"{search}"</span>
        </h2>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {/* YouTube Shorts Shelf (Show on All / no search) */}
      {!search && category === "All" && shorts.length > 0 && (
        <div className="shorts-shelf-container">
          <div className="shorts-shelf-header">
            <span style={{ color: "var(--accent)", fontSize: "1.4rem" }}>⚡</span>
            <span>YouTube Shorts</span>
            <Link
              to="/shorts"
              style={{
                marginLeft: "auto",
                fontSize: "0.85rem",
                color: "var(--accent)",
                fontWeight: 700,
              }}
            >
              View all ›
            </Link>
          </div>
          <div className="shorts-shelf-grid">
            {shorts.slice(0, 6).map((short) => (
              <Link key={short._id} to={`/shorts?id=${short._id}`} className="short-card">
                <div className="short-thumb-wrap">
                  <img
                    src={mediaUrl(short.thumbnailUrl)}
                    alt={short.title}
                    className="short-thumb"
                  />
                  <span className="video-duration-badge" style={{ background: "var(--accent)" }}>
                    SHORT
                  </span>
                </div>
                <h4 className="short-title">{short.title}</h4>
                <span className="short-views">{formatViews(short.views || 0)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Shelf */}
      {recommended.length > 0 && (
        <>
          <h2 className="section-heading">
            <span>✨ Recommended For You</span>
          </h2>
          <div className="video-grid">
            {recommended.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        </>
      )}

      {/* Main Video Feed with Skeleton Loading */}
      <h2 className="section-heading">
        <span>{category === "All" ? "🔥 Latest Uploads" : `📁 ${category}`}</span>
      </h2>

      {loading ? (
        <div className="video-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: "3.2rem", marginBottom: "12px" }}>🎬</div>
          <h3>No videos found</h3>
          <p style={{ marginTop: "6px", color: "var(--text-muted)" }}>
            Try selecting another category or upload your first video!
          </p>
          <Link to="/upload" className="btn btn-primary" style={{ marginTop: "18px" }}>
            ⬆️ Upload Video
          </Link>
        </div>
      ) : (
        <>
          <div className="video-grid">
            {videos.map((video, idx) => (
              <VideoCard key={`${video._id}-${idx}`} video={video} />
            ))}
          </div>

          {/* Infinite Scroll Trigger & Skeleton */}
          <div ref={observerRef} style={{ height: "40px", margin: "20px 0", textAlign: "center" }}>
            {loadingMore && (
              <div className="video-grid" style={{ marginTop: "16px" }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
};

export default Home;
