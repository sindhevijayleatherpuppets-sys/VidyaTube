import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import VideoCard from "../components/VideoCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { fetchVideos, fetchShorts, fetchRecommendations } from "../services/videoService";
import { getYouTubeTrending, getYouTubeShorts } from "../services/youtubeService";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES, mediaUrl, formatViews } from "../utils/format";

const CATEGORY_MAP = {
  Music: "10",
  Gaming: "20",
  News: "25",
  Technology: "28",
  Education: "27",
  Entertainment: "24",
  Sports: "17",
};

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
  const [nextPageToken, setNextPageToken] = useState(null);
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
    // Only show full-screen skeletons if there are no videos yet
    if (videos.length === 0) setLoading(true);
    setError("");

    try {
      const categoryId = CATEGORY_MAP[category] || "";

      // Fetch native database videos, native shorts, and real YouTube trending videos in parallel
      const [videoList, shortList, trendingData, ytShortsData] = await Promise.all([
        fetchVideos({ category, search, isShort: false }).catch(() => []),
        fetchShorts().catch(() => []),
        getYouTubeTrending({
          regionCode: "IN",
          categoryId,
          maxResults: 24,
        }).catch(() => ({ videos: [], nextPageToken: null })),
        getYouTubeShorts().catch(() => ({ shorts: [] })),
      ]);

      // Deduplicate by ID
      const seenIds = new Set();
      const combined = [];

      // 1. Native / blockbuster videos first
      for (const v of videoList || []) {
        const idKey = v.youtubeVideoId || v._id;
        if (!seenIds.has(idKey)) {
          seenIds.add(idKey);
          combined.push(v);
        }
      }

      // 2. High-engagement trending YouTube videos (30+ total videos)
      for (const v of trendingData.videos || []) {
        const idKey = v.youtubeVideoId || v._id;
        if (!seenIds.has(idKey)) {
          seenIds.add(idKey);
          combined.push(v);
        }
      }

      // 3. Shorts feed combining native + dynamic YouTube shorts
      const combinedShorts = [];
      const seenShorts = new Set();
      for (const s of [...(shortList || []), ...(ytShortsData.shorts || [])]) {
        const idKey = s.youtubeVideoId || s._id;
        if (!seenShorts.has(idKey)) {
          seenShorts.add(idKey);
          combinedShorts.push(s);
        }
      }

      setVideos(combined);
      setShorts(combinedShorts);
      setNextPageToken(trendingData.nextPageToken || null);
      setHasMore(true);

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
      if (videos.length === 0) {
        setError("Could not load videos. Ensure backend server is active.");
      }
    } finally {
      setLoading(false);
    }
  }, [category, search, user]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Infinite Scroll Observer for Continuous Feed Without Lag
  const handleObserver = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && !loading && !loadingMore && hasMore && videos.length > 0) {
        setLoadingMore(true);

        const categoryId = CATEGORY_MAP[category] || "";
        getYouTubeTrending({
          regionCode: "IN",
          categoryId,
          maxResults: 12,
          pageToken: nextPageToken || "",
        })
          .then((moreData) => {
            if (moreData.videos && moreData.videos.length > 0) {
              setVideos((prev) => {
                const seen = new Set(prev.map((x) => x.youtubeVideoId || x._id));
                const additions = moreData.videos.filter(
                  (v) => !seen.has(v.youtubeVideoId || v._id)
                );
                return additions.length > 0 ? [...prev, ...additions] : prev;
              });
              setNextPageToken(moreData.nextPageToken || null);
            } else {
              setHasMore(false);
            }
          })
          .catch(() => {
            setHasMore(false);
          })
          .finally(() => {
            setLoadingMore(false);
          });
      }
    },
    [loading, loadingMore, hasMore, videos.length, nextPageToken, category]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "200px",
    });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const featuredVideo = videos.length > 0 ? videos[0] : null;

  return (
    <AppShell>
      {/* Category Pills with Instant Switch */}
      <div className="category-bar-wrapper">
        <div className="category-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-chip${category === cat ? " active" : ""}`}
              onClick={() => {
                if (category !== cat) {
                  setCategory(cat);
                  setVideos([]);
                  setLoading(true);
                }
              }}
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

      {/* YouTube Shorts Shelf */}
      {!search && category === "All" && shorts.length > 0 && (
        <div className="shorts-shelf-container">
          <div className="shorts-shelf-header">
            <span style={{ color: "var(--accent)", fontSize: "1.4rem" }}>⚡</span>
            <span>Trending Shorts</span>
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
            {shorts.slice(0, 8).map((short) => (
              <Link key={short._id} to={`/shorts?id=${short._id}`} className="short-card">
                <div className="short-thumb-wrap">
                  <img
                    src={mediaUrl(short.thumbnailUrl)}
                    alt={short.title}
                    className="short-thumb"
                    loading="lazy"
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

      {/* Main Video Feed with Infinite Scroll */}
      <h2 className="section-heading">
        <span>
          {category === "All"
            ? "🔥 Trending & Popular Videos"
            : `📁 ${category} Feed`}
        </span>
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
          <div
            ref={observerRef}
            style={{
              height: "50px",
              margin: "30px 0",
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {loadingMore && (
              <div style={{ color: "var(--text-muted)", fontSize: "0.95rem", fontWeight: 600 }}>
                ⚡ Loading more videos...
              </div>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
};

export default Home;
