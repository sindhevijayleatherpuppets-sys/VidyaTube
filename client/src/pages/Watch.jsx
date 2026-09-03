import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import VideoCard from "../components/VideoCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  fetchVideoById,
  toggleLikeVideo,
  toggleDislikeVideo,
  fetchComments,
  addComment,
  toggleCommentLike,
  toggleCommentPin,
  deleteComment,
  reportVideo,
  fetchVideos,
  deleteVideo,
  downloadVideoFile,
} from "../services/videoService";
import { toggleSubscribe } from "../services/userService";
import { fetchMyPlaylists, addVideoToPlaylist, createPlaylist } from "../services/playlistService";
import { getYouTubeVideoDetails } from "../services/youtubeService";
import { toggleFavorite, toggleWatchLater, recordWatchHistory } from "../services/libraryService";
import { mediaUrl, formatViews, formatDate, timeAgo, formatSubscribers, REPORT_REASONS } from "../utils/format";

const EMOJIS = ["👍", "🔥", "❤️", "😂", "👏", "🎉", "🚀", "💡", "💯", "🤯", "🙌", "✨"];

const Watch = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoPlayerRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyTextMap, setReplyTextMap] = useState({});
  const [replyOpenMap, setReplyOpenMap] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSort, setCommentSort] = useState("top");
  const [related, setRelated] = useState([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [disliked, setDisliked] = useState(false);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [isSavedLater, setIsSavedLater] = useState(false);
  const [actionToast, setActionToast] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [bellNotification, setBellNotification] = useState("all");
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Cinema Player States
  const [theaterMode, setTheaterMode] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState("1080p HD");
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Modals & Panels
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [thanksModalOpen, setThanksModalOpen] = useState(false);
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [clipModalOpen, setClipModalOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [tipSuccess, setTipSuccess] = useState(false);

  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlistMessage, setPlaylistMessage] = useState("");
  const [shareStartTime, setShareStartTime] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      let v = null;
      let relatedList = [];

      const cleanYtId = id.replace(/^yt_/, "");
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

      if (id.startsWith("yt_") || !isMongoId) {
        // Fetch via YouTube Data API
        try {
          const ytData = await getYouTubeVideoDetails(cleanYtId);
          v = ytData?.video || null;
          relatedList = ytData?.related || [];
        } catch (ytErr) {
          console.warn("YouTube API video detail fallback:", ytErr);
        }

        // Resilient fallback if API call fails
        if (!v) {
          v = {
            _id: `yt_${cleanYtId}`,
            youtubeVideoId: cleanYtId,
            source: "youtube",
            title: "Creator Video",
            description: "Public video streaming via VidyTube cinema player.",
            channelTitle: "Creator",
            channel: {
              _id: `yt_chan_creator`,
              fullName: "Creator",
              handle: "@creator",
              avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
            },
            thumbnailUrl: `https://i.ytimg.com/vi/${cleanYtId}/hqdefault.jpg`,
            embedUrl: `https://www.youtube-nocookie.com/embed/${cleanYtId}?autoplay=1&enablejsapi=1`,
            videoUrl: `https://www.youtube.com/watch?v=${cleanYtId}`,
            duration: "HD",
            views: 1000,
            likes: [],
          };
        }
      } else {
        // Native VidyTube uploaded video
        try {
          v = await fetchVideoById(id);
          const [commentList, rel] = await Promise.all([
            fetchComments(id).catch(() => []),
            fetchVideos({ category: v?.category, isShort: false }).catch(() => []),
          ]);
          setComments(commentList || []);
          relatedList = (rel || []).filter((r) => r._id !== id);
        } catch (err) {
          // Try YouTube API as fallback
          try {
            const ytData = await getYouTubeVideoDetails(cleanYtId);
            v = ytData?.video || null;
            relatedList = ytData?.related || [];
          } catch (e) {}
        }
      }

      if (!v) throw new Error("Video not found");

      setVideo(v);
      setLikeCount(v.likeCount !== undefined ? v.likeCount : (v.likes?.length || 0));
      setLiked(
        user && Array.isArray(v.likes)
          ? v.likes.some((uId) => uId && (uId._id || uId) === user.id)
          : false
      );
      setDisliked(
        user && Array.isArray(v.dislikes)
          ? v.dislikes.some((uId) => uId && (uId._id || uId) === user.id)
          : false
      );
      setDislikeCount(v.dislikes?.length || 0);
      setSubscriberCount(v.channel?.subscriberCount || 0);
      setRelated(relatedList.slice(0, 10));

      // Safely record to Watch History if authenticated
      if (user) {
        recordWatchHistory(v._id || id).catch(() => {});
      }

      // SEO document title
      document.title = `${v.title || "Watch"} - VidyTube`;
    } catch (err) {
      console.error("Watch load error:", err);
      setError("Video not found or failed to load.");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  // Video playback speed effect
  useEffect(() => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Autoplay next video on ended
  const handleVideoEnded = () => {
    if (autoplayNext && related.length > 0) {
      navigate(`/watch/${related[0]._id}`);
    }
  };

  const handleLike = async () => {
    if (!user) return navigate("/login");
    try {
      const data = await toggleLikeVideo(id);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
      setDisliked(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDislike = async () => {
    if (!user) return navigate("/login");
    try {
      const data = await toggleDislikeVideo(id);
      setDisliked(data.disliked);
      setLiked(false);
      if (data.likeCount !== undefined) setLikeCount(data.likeCount);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return navigate("/login");
    try {
      const data = await toggleSubscribe(video.channel._id);
      setSubscribed(data.subscribed);
      setSubscriberCount(data.subscriberCount);
    } catch (err) {
      console.error(err);
    }
  };

  // Comments
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    if (!commentText.trim()) return;

    setCommentSubmitting(true);
    try {
      const comment = await addComment(id, commentText.trim());
      setComments([comment, ...comments]);
      setCommentText("");
      setShowEmojiPicker(false);
    } catch (err) {
      alert("Failed to post comment.");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleAddReply = async (commentId) => {
    if (!user) return navigate("/login");
    const replyContent = replyTextMap[commentId];
    if (!replyContent || !replyContent.trim()) return;

    try {
      const reply = await addComment(id, replyContent.trim(), commentId);
      setComments((prev) =>
        prev.map((c) => {
          if (c._id === commentId) {
            return { ...c, replies: [...(c.replies || []), reply] };
          }
          return c;
        })
      );
      setReplyTextMap({ ...replyTextMap, [commentId]: "" });
      setReplyOpenMap({ ...replyOpenMap, [commentId]: false });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentLike = async (commentId) => {
    if (!user) return navigate("/login");
    try {
      const data = await toggleCommentLike(id, commentId);
      setComments((prev) =>
        prev.map((c) => {
          if (c._id === commentId) {
            return {
              ...c,
              likes: data.liked ? [...(c.likes || []), user.id] : (c.likes || []).filter((u) => u !== user.id),
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentPin = async (commentId) => {
    try {
      const data = await toggleCommentPin(id, commentId);
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, isPinned: data.isPinned } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(id, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  // Timestamp jumping in description e.g. "0:00" or "5:20"
  const handleTimestampJump = (seconds) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = seconds;
      videoPlayerRef.current.play();
    }
  };

  // Modals & Share
  const handleReport = async (reason) => {
    await reportVideo(id, reason);
    setReportSent(true);
    setTimeout(() => {
      setReportOpen(false);
      setReportSent(false);
    }, 2000);
  };

  const openPlaylistPanel = async () => {
    if (!user) return navigate("/login");
    setPlaylistMessage("");
    setPlaylistOpen(true);
    try {
      const data = await fetchMyPlaylists();
      setPlaylists(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    try {
      await addVideoToPlaylist(playlistId, id);
      setPlaylistMessage("✓ Added to playlist!");
    } catch (err) {
      setPlaylistMessage("Already in playlist or error occurred.");
    }
  };

  const handleCreatePlaylistAndAdd = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    try {
      const playlist = await createPlaylist(newPlaylistName.trim());
      await addVideoToPlaylist(playlist._id, id);
      setPlaylists([{ ...playlist, videos: [id] }, ...playlists]);
      setNewPlaylistName("");
      setPlaylistMessage("✓ Created playlist and added video!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) return navigate("/login");
    try {
      const data = await toggleFavorite(video?._id || id);
      setIsFav(data.isFavorite);
      setActionToast(data.message);
      setTimeout(() => setActionToast(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleWatchLater = async () => {
    if (!user) return navigate("/login");
    try {
      const data = await toggleWatchLater(video?._id || id);
      setIsSavedLater(data.isWatchLater);
      setActionToast(data.message);
      setTimeout(() => setActionToast(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyShare = () => {
    let url = `${window.location.origin}/watch/${id}`;
    if (shareStartTime && videoPlayerRef.current) {
      url += `?t=${Math.floor(videoPlayerRef.current.currentTime || 0)}`;
    }
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const isCreatorOrAdmin =
      video?.channel?._id === user.id ||
      video?.channel === user.id ||
      user?.role === "admin";

    if (!isCreatorOrAdmin) {
      setActionToast("⚠️ Only the creator can download the original video master file.");
      setTimeout(() => setActionToast(""), 3500);
      return;
    }

    setDownloading(true);
    setDownloadProgress(35);
    try {
      setDownloadProgress(70);
      await downloadVideoFile(video._id, video.title);
      setDownloadProgress(100);
      setActionToast("✓ Master video file downloaded securely!");
      setTimeout(() => setActionToast(""), 3500);
    } catch (err) {
      setActionToast(`⚠️ ${err.message || "Failed to download video file."}`);
      setTimeout(() => setActionToast(""), 4000);
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleSendTip = (amount) => {
    setTipSuccess(true);
    setTimeout(() => {
      setTipSuccess(false);
      setThanksModalOpen(false);
    }, 2000);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this video?")) return;
    try {
      await deleteVideo(id);
      navigate("/home");
    } catch (err) {
      alert("Could not delete video.");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
          <span style={{ fontSize: "2rem" }}>⚡</span>
          <p style={{ marginTop: "12px" }}>Loading cinema player and stream...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !video) {
    return (
      <AppShell>
        <div className="alert alert-error">{error || "Video not found."}</div>
        <Link to="/home" className="btn btn-secondary" style={{ marginTop: "16px" }}>
          ← Back to Home
        </Link>
      </AppShell>
    );
  }

  const isOwner = user && (video.channel?._id === user.id || user.role === "admin");
  const channelName = video.channel?.fullName || "VidyTube Creator";
  const channelInitial = channelName.charAt(0).toUpperCase();

  return (
    <AppShell>
      <div className={`watch-layout ${theaterMode ? "theater-mode-active" : ""}`}>
        <div className="watch-main">
          {/* Cinema Player Container: Native or YouTube Embed */}
          {video.source === "youtube" || video.youtubeVideoId ? (
            <div className={`player-wrapper ${theaterMode ? "theater" : ""}`}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.youtubeVideoId || (video.videoUrl.includes("v=") ? video.videoUrl.split("v=")[1] : video.videoUrl)}?autoplay=1&enablejsapi=1&rel=0`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </div>
          ) : (
            <div className={`player-wrapper ${theaterMode ? "theater" : ""}`}>
              <video
                ref={videoPlayerRef}
                key={video._id}
                src={mediaUrl(video.videoUrl)}
                poster={mediaUrl(video.thumbnailUrl)}
                controls
                autoPlay
                playsInline
                onEnded={handleVideoEnded}
                className="video-player"
              >
                Your browser does not support HTML5 video streaming.
              </video>
            </div>
          )}

          {/* Quick Player Bar: Autoplay, Theater, Speed, Quality */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginTop: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "var(--text-secondary)", cursor: "pointer" }}>
              <span>Autoplay Next</span>
              <input
                type="checkbox"
                checked={autoplayNext}
                onChange={(e) => setAutoplayNext(e.target.checked)}
                style={{ accentColor: "var(--accent)" }}
              />
            </label>

            {/* Playback Speed */}
            <div style={{ position: "relative" }}>
              <button
                className="action-pill-btn"
                style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              >
                ⚡ {playbackSpeed}x
              </button>
              {showSpeedMenu && (
                <div className="user-dropdown-menu" style={{ width: 120, right: 0, bottom: "100%", top: "auto" }}>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      className="user-dropdown-item"
                      onClick={() => {
                        setPlaybackSpeed(s);
                        setShowSpeedMenu(false);
                      }}
                    >
                      {s === 1 ? "Normal (1x)" : `${s}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Badge */}
            <div style={{ position: "relative" }}>
              <button
                className="action-pill-btn"
                style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                onClick={() => setShowQualityMenu(!showQualityMenu)}
              >
                ⚙️ {quality}
              </button>
              {showQualityMenu && (
                <div className="user-dropdown-menu" style={{ width: 130, right: 0, bottom: "100%", top: "auto" }}>
                  {["1080p60 HD", "720p HD", "480p", "Auto"].map((q) => (
                    <button
                      key={q}
                      className="user-dropdown-item"
                      onClick={() => {
                        setQuality(q);
                        setShowQualityMenu(false);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theater Mode Toggle */}
            <button
              className="action-pill-btn"
              style={{ padding: "4px 10px", fontSize: "0.78rem" }}
              onClick={() => setTheaterMode(!theaterMode)}
              title="Toggle Theater Mode"
            >
              {theaterMode ? "🔳 Default View" : "🔲 Theater Mode"}
            </button>
          </div>

          {actionToast && (
            <div
              className="alert alert-success"
              style={{
                marginTop: "12px",
                padding: "8px 14px",
                fontSize: "0.88rem",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>✓</span> {actionToast}
            </div>
          )}

          <h1 className="watch-title">{video.title}</h1>

          {/* Channel Bar & Action Buttons */}
          <div className="watch-actions-bar">
            <div className="watch-channel-info">
              <Link to={`/profile/${video.channel?._id}`} className="channel-avatar-lg">
                {video.channel?.avatar ? (
                  <img src={video.channel.avatar} alt={channelName} />
                ) : (
                  channelInitial
                )}
              </Link>
              <div>
                <Link to={`/profile/${video.channel?._id}`} className="channel-name-lg">
                  {channelName} <span className="verified-icon">✓</span>
                </Link>
                <div className="channel-subs-count">
                  {formatSubscribers(subscriberCount)}
                </div>
              </div>

              {/* Join Membership */}
              <button
                className="action-pill-btn"
                style={{ marginLeft: "6px", borderColor: "var(--accent-secondary)", color: "#d946ef" }}
                onClick={() => setMembershipModalOpen(true)}
              >
                ⭐ Join
              </button>

              {/* Subscribe & Bell Notification */}
              <button
                className={`btn-subscribe ${subscribed ? "subscribed" : ""}`}
                onClick={handleSubscribe}
              >
                {subscribed ? "✓ Subscribed" : "Subscribe"}
              </button>

              {subscribed && (
                <div style={{ position: "relative" }}>
                  <button
                    className="action-pill-btn"
                    style={{ padding: "8px 10px" }}
                    onClick={() => setShowBellDropdown(!showBellDropdown)}
                    title="Notification settings"
                  >
                    🔔
                  </button>
                  {showBellDropdown && (
                    <div className="user-dropdown-menu" style={{ width: 180, left: 0 }}>
                      <button
                        className="user-dropdown-item"
                        onClick={() => {
                          setBellNotification("all");
                          setShowBellDropdown(false);
                        }}
                      >
                        🔔 All
                      </button>
                      <button
                        className="user-dropdown-item"
                        onClick={() => {
                          setBellNotification("personalized");
                          setShowBellDropdown(false);
                        }}
                      >
                        🔕 Personalized
                      </button>
                      <button
                        className="user-dropdown-item"
                        onClick={() => {
                          setBellNotification("none");
                          setShowBellDropdown(false);
                        }}
                      >
                        🚫 None
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="watch-action-buttons">
              {/* Segmented Like / Dislike */}
              <div className="pill-btn-group">
                <button
                  className={`pill-btn ${liked ? "active" : ""}`}
                  onClick={handleLike}
                  title="I like this"
                >
                  <span>{liked ? "❤️" : "🤍"}</span>
                  <span>{likeCount}</span>
                </button>
                <div className="pill-divider" />
                <button
                  className={`pill-btn ${disliked ? "active" : ""}`}
                  onClick={handleDislike}
                  title="I dislike this"
                >
                  <span>{disliked ? "👎" : "👎"}</span>
                </button>
              </div>

              {/* Favorite */}
              <button
                className={`action-pill-btn ${isFav ? "active" : ""}`}
                onClick={handleToggleFavorite}
                title="Add to Favorites"
              >
                <span>⭐</span> {isFav ? "Favorited" : "Favorite"}
              </button>

              {/* Watch Later */}
              <button
                className={`action-pill-btn ${isSavedLater ? "active" : ""}`}
                onClick={handleToggleWatchLater}
                title="Save to Watch Later"
              >
                <span>⏱️</span> {isSavedLater ? "Saved Later" : "Watch Later"}
              </button>

              {/* Save to Playlist */}
              <button className="action-pill-btn" onClick={openPlaylistPanel}>
                <span>🎞️</span> Save
              </button>

              {/* Share */}
              <button className="action-pill-btn" onClick={() => setShareOpen(true)}>
                <span>↗️</span> Share
              </button>

              {/* Download (Native videos only) */}
              {video.source !== "youtube" && !video.youtubeVideoId && (
                <button
                  className="action-pill-btn"
                  onClick={handleDownload}
                  disabled={downloading}
                  title="Download video"
                >
                  <span>⬇️</span> {downloading ? `${downloadProgress}%` : "Download"}
                </button>
              )}

              {/* SuperChat / Thanks Tip */}
              <button
                className="action-pill-btn"
                onClick={() => setThanksModalOpen(true)}
                title="Send super thanks"
              >
                <span>💖</span> Thanks
              </button>

              {/* Clip */}
              <button className="action-pill-btn" onClick={() => setClipModalOpen(true)}>
                <span>✂️</span> Clip
              </button>

              {/* Report */}
              <button className="action-pill-btn" onClick={() => setReportOpen(true)} title="Report Video">
                <span>🚩</span>
              </button>

              {/* Owner / Admin Delete */}
              {isOwner && (
                <button className="btn btn-danger btn-small" onClick={handleDelete}>
                  🗑️ Delete
                </button>
              )}
            </div>
          </div>

          {/* Expandable Description Box with Clickable Chapters */}
          <div className="watch-description-box">
            <div className="watch-stats-row">
              <span>{formatViews(video.views || 0)}</span>
              <span>•</span>
              <span>{formatDate(video.createdAt)} ({timeAgo(video.createdAt)})</span>
              <span className="desc-tag">#{video.category}</span>
            </div>

            {/* Quick Clickable Chapter Markers */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "8px 0 12px" }}>
              <button
                onClick={() => handleTimestampJump(0)}
                style={{ background: "var(--bg-surface-hover)", border: "none", color: "var(--accent)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
              >
                ⏱️ 0:00 Intro
              </button>
              <button
                onClick={() => handleTimestampJump(60)}
                style={{ background: "var(--bg-surface-hover)", border: "none", color: "var(--accent)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
              >
                ⏱️ 1:00 Demo
              </button>
              <button
                onClick={() => handleTimestampJump(180)}
                style={{ background: "var(--bg-surface-hover)", border: "none", color: "var(--accent)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
              >
                ⏱️ 3:00 Highlights
              </button>
            </div>

            <p style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>
              {showFullDesc || !video.description || video.description.length < 220
                ? video.description || "No description provided for this video."
                : `${video.description.slice(0, 220)}...`}
            </p>

            {video.description && video.description.length >= 220 && (
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-primary)",
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: "8px",
                }}
              >
                {showFullDesc ? "Show less ▲" : "...Show more ▼"}
              </button>
            )}
          </div>

          {/* Comments Section 2.0 */}
          <section className="comments-section">
            <div className="comments-header">
              <h2 className="comments-count">{comments.length} Comments</h2>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  style={{
                    background: commentSort === "top" ? "var(--bg-surface-hover)" : "transparent",
                    border: "none",
                    color: "var(--text-primary)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.88rem",
                  }}
                  onClick={() => setCommentSort("top")}
                >
                  Top comments
                </button>
                <button
                  style={{
                    background: commentSort === "newest" ? "var(--bg-surface-hover)" : "transparent",
                    border: "none",
                    color: "var(--text-primary)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.88rem",
                  }}
                  onClick={() => setCommentSort("newest")}
                >
                  Newest first
                </button>
              </div>
            </div>

            {/* Add Comment Input */}
            <form className="comment-input-row" onSubmit={handleAddComment}>
              <div className="channel-avatar-lg" style={{ width: 40, height: 40, fontSize: "1rem" }}>
                {user?.avatar ? <img src={user.avatar} alt="" /> : user?.fullName?.charAt(0) || "?"}
              </div>
              <div className="comment-input-box">
                <input
                  type="text"
                  placeholder={user ? "Add a public comment..." : "Log in to post a comment"}
                  className="comment-input"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!user}
                />
                {commentText && (
                  <div className="comment-actions">
                    {/* Emoji Picker */}
                    <div className="emoji-picker-container">
                      <button
                        type="button"
                        className="emoji-btn"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        😊
                      </button>
                      {showEmojiPicker && (
                        <div className="emoji-popup">
                          {EMOJIS.map((em) => (
                            <button
                              key={em}
                              type="button"
                              className="emoji-choice"
                              onClick={() => setCommentText((prev) => prev + em)}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => {
                          setCommentText("");
                          setShowEmojiPicker(false);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-small"
                        disabled={commentSubmitting}
                      >
                        {commentSubmitting ? "Posting..." : "Comment"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>

            {/* Comments List */}
            {comments.map((comment) => (
              <div key={comment._id} className="comment-card">
                <div className="user-avatar-circle" style={{ width: 38, height: 38, flexShrink: 0 }}>
                  {comment.user?.avatar ? (
                    <img src={comment.user.avatar} alt={comment.user?.fullName} />
                  ) : (
                    comment.user?.fullName?.charAt(0) || "U"
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  {comment.isPinned && (
                    <div className="pinned-badge">
                      📌 Pinned by {channelName}
                    </div>
                  )}
                  <div>
                    <span className="comment-author">{comment.user?.fullName}</span>
                    <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="comment-text">{comment.text}</p>

                  <div className="comment-actions-bar">
                    <button
                      className="comment-action-btn"
                      onClick={() => handleCommentLike(comment._id)}
                    >
                      👍 <span>{comment.likes?.length || 0}</span>
                    </button>
                    <button className="comment-action-btn">👎</button>
                    <button
                      className="comment-action-btn"
                      onClick={() =>
                        setReplyOpenMap({ ...replyOpenMap, [comment._id]: !replyOpenMap[comment._id] })
                      }
                    >
                      Reply
                    </button>

                    {/* Creator Pin / Delete */}
                    {isOwner && (
                      <button
                        className="comment-action-btn"
                        onClick={() => handleCommentPin(comment._id)}
                      >
                        {comment.isPinned ? "Unpin" : "Pin"}
                      </button>
                    )}

                    {(user?.id === comment.user?._id || isOwner) && (
                      <button
                        className="comment-action-btn"
                        style={{ color: "var(--danger)" }}
                        onClick={() => handleCommentDelete(comment._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Nested Reply Input */}
                  {replyOpenMap[comment._id] && (
                    <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                      <input
                        type="text"
                        placeholder="Add a reply..."
                        value={replyTextMap[comment._id] || ""}
                        onChange={(e) =>
                          setReplyTextMap({ ...replyTextMap, [comment._id]: e.target.value })
                        }
                        style={{
                          flex: 1,
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          padding: "6px 12px",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-primary)",
                          fontSize: "0.88rem",
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        onClick={() => handleAddReply(comment._id)}
                      >
                        Reply
                      </button>
                    </div>
                  )}

                  {/* Nested Replies List */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="comment-replies">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                          <div className="user-avatar-circle" style={{ width: 28, height: 28, fontSize: "0.75rem", flexShrink: 0 }}>
                            {reply.user?.avatar ? (
                              <img src={reply.user.avatar} alt="" />
                            ) : (
                              reply.user?.fullName?.charAt(0)
                            )}
                          </div>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{reply.user?.fullName}</span>
                            <span className="comment-time">{timeAgo(reply.createdAt)}</span>
                            <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", marginTop: "2px" }}>
                              {reply.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* Up Next Column */}
        <aside className="watch-sidebar">
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Up Next</h3>
          {related.map((rel) => (
            <Link key={rel._id} to={`/watch/${rel._id}`} className="related-video-card">
              <div className="related-thumb-wrap">
                <img src={mediaUrl(rel.thumbnailUrl)} alt={rel.title} className="video-thumb" />
                <span className="video-duration-badge">{rel.duration || "HD"}</span>
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <h4
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    color: "var(--text-primary)",
                  }}
                >
                  {rel.title}
                </h4>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  {rel.channel?.fullName}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {formatViews(rel.views || 0)} • {timeAgo(rel.createdAt)}
                </div>
              </div>
            </Link>
          ))}
        </aside>
      </div>

      {/* Share Modal */}
      {shareOpen && (
        <div className="modal-backdrop" onClick={() => setShareOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Share Video</h2>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/watch/${id}${shareStartTime ? `?t=${Math.floor(videoPlayerRef.current?.currentTime || 0)}` : ""}`}
                style={{
                  flex: 1,
                  background: "var(--bg-main)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.9rem",
                }}
              />
              <button className="btn btn-primary" onClick={handleCopyShare}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", color: "var(--text-secondary)", cursor: "pointer", marginBottom: "20px" }}>
              <input
                type="checkbox"
                checked={shareStartTime}
                onChange={(e) => setShareStartTime(e.target.checked)}
                style={{ accentColor: "var(--accent)" }}
              />
              <span>Start at {Math.floor((videoPlayerRef.current?.currentTime || 0) / 60)}:{Math.floor((videoPlayerRef.current?.currentTime || 0) % 60).toString().padStart(2, "0")}</span>
            </label>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noreferrer"
                className="action-pill-btn"
              >
                💬 WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noreferrer"
                className="action-pill-btn"
              >
                🐦 Twitter/X
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noreferrer"
                className="action-pill-btn"
              >
                📘 Facebook
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Thanks / SuperChat Tip Modal */}
      {thanksModalOpen && (
        <div className="modal-backdrop" onClick={() => setThanksModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
            <h2 className="modal-title">💖 Send Super Thanks to {channelName}</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              Support your favorite creator with an animated Super Thanks badge in comments!
            </p>
            {tipSuccess ? (
              <div className="alert alert-success">
                🎉 Thank you so much for supporting {channelName}! Super Thanks badge added.
              </div>
            ) : (
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "20px" }}>
                <button className="btn btn-secondary" onClick={() => handleSendTip(2)}>
                  $2.00
                </button>
                <button className="btn btn-primary" onClick={() => handleSendTip(5)}>
                  $5.00 ⭐
                </button>
                <button className="btn btn-secondary" onClick={() => handleSendTip(10)}>
                  $10.00
                </button>
                <button className="btn btn-secondary" onClick={() => handleSendTip(25)}>
                  $25.00 🔥
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Channel Membership Modal */}
      {membershipModalOpen && (
        <div className="modal-backdrop" onClick={() => setMembershipModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">⭐ Join {channelName} Channel Membership</h2>
            <div style={{ background: "var(--bg-main)", padding: "16px", borderRadius: "var(--radius-md)", marginBottom: "16px" }}>
              <h4 style={{ color: "var(--accent)" }}>Loyalty Perks</h4>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                <li>Exclusive custom badges next to your name in comments</li>
                <li>Access to members-only community polls and live streams</li>
                <li>Priority reply to comments by {channelName}</li>
              </ul>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: "1.2rem" }}>$4.99 / month</span>
              <button
                className="btn btn-primary"
                onClick={() => {
                  alert("Welcome to Channel Membership! Loyalty badge unlocked.");
                  setMembershipModalOpen(false);
                }}
              >
                Join Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Panel */}
      {playlistOpen && (
        <div className="modal-backdrop" onClick={() => setPlaylistOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Save video to...</h2>
            {playlistMessage && <div className="alert alert-success">{playlistMessage}</div>}

            <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: "16px" }}>
              {playlists.map((pl) => (
                <div
                  key={pl._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "var(--bg-main)",
                    borderRadius: "var(--radius-sm)",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{pl.name}</span>
                  <button className="btn btn-secondary btn-small" onClick={() => handleAddToPlaylist(pl._id)}>
                    ＋ Add
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreatePlaylistAndAdd} style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="New playlist name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                style={{
                  flex: 1,
                  background: "var(--bg-main)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.88rem",
                }}
              />
              <button type="submit" className="btn btn-primary btn-small">
                Create & Add
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportOpen && (
        <div className="modal-backdrop" onClick={() => setReportOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Report Video</h2>
            {reportSent ? (
              <div className="alert alert-success">Thank you. Report received for review.</div>
            ) : (
              <div>
                <p style={{ color: "var(--text-secondary)", marginBottom: "14px" }}>
                  Please select the reason for reporting this video:
                </p>
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r}
                    className="user-dropdown-item"
                    style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", marginBottom: "6px" }}
                    onClick={() => handleReport(r)}
                  >
                    🚩 {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default Watch;
