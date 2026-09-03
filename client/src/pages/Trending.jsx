import { useEffect, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import VideoCard from "../components/VideoCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { getYouTubeTrending } from "../services/youtubeService";
import { fetchTrending } from "../services/videoService";

const REGIONS = [
  { code: "IN", label: "🇮🇳 India" },
  { code: "US", label: "🇺🇸 United States" },
  { code: "GB", label: "🇬🇧 United Kingdom" },
  { code: "JP", label: "🇯🇵 Japan" },
  { code: "AU", label: "🇦🇺 Australia" },
];

const CATEGORIES = [
  { id: "", label: "🔥 All Trending" },
  { id: "10", label: "🎵 Music" },
  { id: "20", label: "🎮 Gaming" },
  { id: "28", label: "💻 Tech & Science" },
  { id: "25", label: "📰 News & Politics" },
  { id: "24", label: "🎬 Entertainment" },
];

const Trending = () => {
  const [videos, setVideos] = useState([]);
  const [nativeTrending, setNativeTrending] = useState([]);
  const [region, setRegion] = useState("IN");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadTrending = async () => {
      setLoading(true);
      setNotice("");
      try {
        const data = await getYouTubeTrending({ regionCode: region, categoryId: category });
        if (isMounted) {
          setVideos(data.videos || []);
          setNativeTrending(data.nativeTrending || []);
          if (data.notice) setNotice(data.notice);
          if ((!data.videos || data.videos.length === 0) && (!data.nativeTrending || data.nativeTrending.length === 0)) {
            // Fallback to local trending
            const local = await fetchTrending();
            setVideos(local);
          }
        }
      } catch (err) {
        console.warn("Trending fetch fallback:", err);
        const local = await fetchTrending();
        if (isMounted) setVideos(local);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTrending();
    return () => {
      isMounted = false;
    };
  }, [region, category]);

  const allDisplayVideos = [...nativeTrending, ...videos];

  return (
    <AppShell>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px" }}>
              <span>🔥</span> Trending on VidyTube
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
              Most watched, shared, and discussed creator videos right now
            </p>
          </div>

          {/* Region Switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>REGION:</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="categories-pill-bar" style={{ marginTop: "18px" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`category-pill ${category === cat.id ? "active" : ""}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {notice && (
          <div className="alert alert-info" style={{ marginTop: "16px", fontSize: "0.85rem" }}>
            ℹ️ {notice}
          </div>
        )}
      </div>

      {loading && (
        <div className="video-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && allDisplayVideos.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔥</div>
          <h3>No trending videos found in this region</h3>
          <p>Try switching to another region or selecting "All Trending".</p>
        </div>
      )}

      {!loading && allDisplayVideos.length > 0 && (
        <div className="video-grid">
          {allDisplayVideos.map((v, i) => (
            <div key={v._id || i} className="trending-item" style={{ position: "relative" }}>
              <span
                className="trending-rank"
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  zIndex: 2,
                  background: i < 3 ? "var(--accent)" : "rgba(0,0,0,0.75)",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.78rem",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                  backdropFilter: "blur(4px)",
                }}
              >
                #{i + 1}
              </span>
              <VideoCard video={v} />
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default Trending;
