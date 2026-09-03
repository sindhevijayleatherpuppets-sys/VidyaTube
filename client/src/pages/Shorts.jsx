import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { fetchShorts, toggleLikeVideo, toggleDislikeVideo, fetchComments, addComment } from "../services/videoService";
import { getYouTubeShorts } from "../services/youtubeService";
import { toggleSubscribe } from "../services/userService";
import { useAuth } from "../context/AuthContext.jsx";
import { mediaUrl, formatViews, formatSubscribers } from "../utils/format";

const Shorts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get("id");

  const [shorts, setShorts] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [disliked, setDisliked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);

  // Comments drawer for shorts
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  const videoRef = useRef(null);

  const loadShorts = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch live YouTube shorts + native database shorts
      const [ytData, nativeData] = await Promise.all([
        getYouTubeShorts().catch(() => ({ shorts: [] })),
        fetchShorts().catch(() => []),
      ]);

      const combined = [...(nativeData || []), ...(ytData.shorts || [])];
      setShorts(combined);
      setNextPageToken(ytData.nextPageToken || null);

      if (initialId && combined.length > 0) {
        const foundIdx = combined.findIndex(
          (s) => s._id === initialId || s.youtubeVideoId === initialId.replace(/^yt_/, "")
        );
        if (foundIdx !== -1) setCurrentIndex(foundIdx);
      }
    } catch (err) {
      console.error("Shorts fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [initialId]);

  useEffect(() => {
    loadShorts();
  }, [loadShorts]);

  const currentShort = shorts[currentIndex] || null;

  useEffect(() => {
    if (currentShort) {
      const isYt = currentShort.source === "youtube" || !!currentShort.youtubeVideoId;
      setLiked(user && Array.isArray(currentShort.likes) ? currentShort.likes.includes(user.id) : false);
      setLikeCount(currentShort.likeCount !== undefined ? currentShort.likeCount : (currentShort.likes?.length || 0));
      setDisliked(user && Array.isArray(currentShort.dislikes) ? currentShort.dislikes.includes(user.id) : false);
      setSubCount(currentShort.channel?.subscriberCount || 0);

      // Load comments if native video
      if (!isYt && currentShort._id) {
        fetchComments(currentShort._id)
          .then((c) => setComments(c || []))
          .catch(() => setComments([]));
      } else {
        setComments([]);
      }
    }
  }, [currentShort, user]);

  const handleNext = useCallback(async () => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (nextPageToken && !loadingMore) {
      // Fetch more live YouTube shorts automatically
      setLoadingMore(true);
      try {
        const moreData = await getYouTubeShorts({ pageToken: nextPageToken });
        if (moreData.shorts?.length > 0) {
          setShorts((prev) => [...prev, ...moreData.shorts]);
          setNextPageToken(moreData.nextPageToken || null);
          setCurrentIndex((prev) => prev + 1);
        }
      } catch (e) {
      } finally {
        setLoadingMore(false);
      }
    }
  }, [currentIndex, shorts.length, nextPageToken, loadingMore]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation (ArrowUp, ArrowDown, Space, Mute)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  const handleLike = async () => {
    if (!user) return navigate("/login");
    if (!currentShort) return;
    try {
      const data = await toggleLikeVideo(currentShort._id);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
      setDisliked(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDislike = async () => {
    if (!user) return navigate("/login");
    if (!currentShort) return;
    try {
      const data = await toggleDislikeVideo(currentShort._id);
      setDisliked(data.disliked);
      setLiked(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return navigate("/login");
    if (!currentShort?.channel?._id) return;
    try {
      const data = await toggleSubscribe(currentShort.channel._id);
      setSubscribed(data.subscribed);
      setSubCount(data.subscriberCount);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    if (!currentShort) return;
    const url = `${window.location.origin}/shorts?id=${currentShort.youtubeVideoId ? `yt_${currentShort.youtubeVideoId}` : currentShort._id}`;
    navigator.clipboard?.writeText(url);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    if (!newComment.trim() || !currentShort) return;

    setCommentLoading(true);
    try {
      const added = await addComment(currentShort._id, newComment.trim());
      setComments([added, ...comments]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-secondary)" }}>
          <span style={{ fontSize: "2.5rem", animation: "pulseGlow 1.5s infinite", display: "inline-block" }}>⚡</span>
          <p style={{ marginTop: "16px", fontWeight: 600 }}>Streaming live YouTube Shorts feed...</p>
        </div>
      </AppShell>
    );
  }

  if (!currentShort) {
    return (
      <AppShell>
        <div className="empty-state" style={{ maxWidth: 500, margin: "60px auto" }}>
          <span style={{ fontSize: "2.5rem" }}>⚡</span>
          <h3 style={{ marginTop: 12 }}>No Shorts Available</h3>
          <p>Be the first to create and upload a YouTube Short!</p>
          <Link to="/upload" className="btn btn-primary" style={{ marginTop: "16px" }}>
            Create Short
          </Link>
        </div>
      </AppShell>
    );
  }

  const isYt = currentShort.source === "youtube" || !!currentShort.youtubeVideoId;
  const channelName = currentShort.channel?.fullName || currentShort.channelTitle || "Creator";
  const channelAvatar = currentShort.channel?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200";

  return (
    <AppShell>
      <div className="shorts-page-wrapper">
        <div className="shorts-reel-container">
          {/* Main Vertical Short Video Player */}
          <div className="shorts-video-box" style={{ background: "#000", position: "relative", overflow: "hidden" }}>
            {isYt ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${currentShort.youtubeVideoId}?autoplay=1&enablejsapi=1&loop=1&playlist=${currentShort.youtubeVideoId}&controls=1&modestbranding=1&rel=0`}
                title={currentShort.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              />
            ) : (
              <video
                ref={videoRef}
                key={currentShort._id}
                src={mediaUrl(currentShort.videoUrl)}
                poster={mediaUrl(currentShort.thumbnailUrl)}
                autoPlay
                loop
                playsInline
                controls={false}
                onClick={() => {
                  if (videoRef.current) {
                    if (videoRef.current.paused) videoRef.current.play();
                    else videoRef.current.pause();
                  }
                }}
                className="shorts-video-element"
              />
            )}

            {/* Bottom Overlay Information for Native Videos */}
            {!isYt && (
              <div className="shorts-overlay-bottom">
                <div className="shorts-creator-row">
                  <Link
                    to={`/profile/${currentShort.channel?._id}`}
                    className="channel-avatar-lg"
                    style={{ width: 38, height: 38 }}
                  >
                    <img src={mediaUrl(channelAvatar)} alt={channelName} />
                  </Link>
                  <div>
                    <Link
                      to={`/profile/${currentShort.channel?._id}`}
                      style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}
                    >
                      {channelName}
                    </Link>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)" }}>
                      {formatSubscribers(subCount)}
                    </div>
                  </div>
                  <button
                    className={`btn-subscribe ${subscribed ? "subscribed" : ""}`}
                    style={{ marginLeft: "auto", padding: "6px 14px", fontSize: "0.82rem" }}
                    onClick={handleSubscribe}
                  >
                    {subscribed ? "Subscribed" : "Subscribe"}
                  </button>
                </div>

                <h2 style={{ fontSize: "0.98rem", fontWeight: 600, color: "#fff", lineHeight: 1.35 }}>
                  {currentShort.title}
                </h2>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "rgba(255,255,255,0.8)" }}>
                  <span>🎵 Original audio - VidyTube Sound</span>
                  <span>•</span>
                  <span>{formatViews(currentShort.views || 0)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Action Rail */}
          <div className="shorts-action-rail">
            {/* Like */}
            <div style={{ textAlign: "center" }}>
              <button
                className={`shorts-action-btn ${liked ? "active" : ""}`}
                onClick={handleLike}
                title="Like"
              >
                {liked ? "❤️" : "🤍"}
              </button>
              <div className="shorts-action-label">{likeCount}</div>
            </div>

            {/* Dislike */}
            <div style={{ textAlign: "center" }}>
              <button
                className={`shorts-action-btn ${disliked ? "active" : ""}`}
                onClick={handleDislike}
                title="Dislike"
              >
                👎
              </button>
              <div className="shorts-action-label">Dislike</div>
            </div>

            {/* Comments (for native videos) */}
            {!isYt && (
              <div style={{ textAlign: "center" }}>
                <button
                  className="shorts-action-btn"
                  onClick={() => setCommentDrawerOpen(!commentDrawerOpen)}
                  title="Comments"
                >
                  💬
                </button>
                <div className="shorts-action-label">{comments.length}</div>
              </div>
            )}

            {/* Share */}
            <div style={{ textAlign: "center" }}>
              <button className="shorts-action-btn" onClick={handleShare} title="Share Short">
                ↗️
              </button>
              <div className="shorts-action-label">{shareToast ? "Copied!" : "Share"}</div>
            </div>

            {/* Next / Prev Navigation */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
              <button
                className="shorts-action-btn"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                title="Previous Short (Up Arrow)"
                style={{ opacity: currentIndex === 0 ? 0.4 : 1 }}
              >
                ▲
              </button>
              <button
                className="shorts-action-btn"
                onClick={handleNext}
                title="Next Short (Down Arrow)"
              >
                ▼
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Shorts;
