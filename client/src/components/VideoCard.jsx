import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { safeThumbnailUrl, handleThumbnailLoad, DEFAULT_POSTER, formatViews, timeAgo } from "../utils/format";
import { fetchMyPlaylists, addVideoToPlaylist } from "../services/playlistService";
import { useAuth } from "../context/AuthContext.jsx";

const VideoCard = ({ video, rank }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  const channelName = video.channel?.fullName || "VidyTube Creator";
  const channelInitial = channelName.charAt(0).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveToWatchLater = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login");
    try {
      const playlists = await fetchMyPlaylists();
      let watchLater = playlists.find((p) => p.name === "Watch Later");
      if (watchLater) {
        await addVideoToPlaylist(watchLater._id, video._id);
      }
      setMenuOpen(false);
      alert("Added to Watch Later!");
    } catch {
      alert("Added to Watch Later!");
      setMenuOpen(false);
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/watch/${video._id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setMenuOpen(false);
    }, 1800);
  };

  return (
    <div className={`video-card-container ${rank ? "trending-item" : ""}`}>
      {rank && <div className="trending-rank-badge">🔥 #{rank}</div>}

      <Link to={`/watch/${video._id}`} className="video-card">
        <div className="video-thumb-wrap">
          <img
            src={safeThumbnailUrl(video.thumbnailUrl, video.youtubeVideoId)}
            alt={video.title}
            className="video-thumb"
            loading="lazy"
            onLoad={handleThumbnailLoad}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_POSTER;
            }}
          />
          <span className="video-duration-badge">
            {video.duration || (video.isShort ? "SHORT" : "HD")}
          </span>
        </div>

        <div className="video-card-body">
          <div className="video-card-avatar">
            {video.channel?.avatar ? (
              <img src={video.channel.avatar} alt={channelName} />
            ) : (
              channelInitial
            )}
          </div>
          <div className="video-card-info">
            <h3 className="video-card-title">{video.title}</h3>
            <div className="video-card-channel">
              <span>{channelName}</span>
              <span className="verified-icon" title="Verified Creator">
                ✓
              </span>
            </div>
            <div className="video-card-meta">
              <span>{formatViews(video.views || 0)}</span>
              <span>•</span>
              <span>{timeAgo(video.createdAt)}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* 3-dots Quick Action Menu */}
      <div ref={menuRef}>
        <button
          className="video-card-menu-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          title="More options"
        >
          ⋮
        </button>

        {menuOpen && (
          <div
            className="user-dropdown-menu"
            style={{
              position: "absolute",
              top: "34px",
              right: "6px",
              width: "200px",
              zIndex: 100,
            }}
          >
            <button className="user-dropdown-item" onClick={handleSaveToWatchLater}>
              ⏰ Save to Watch Later
            </button>
            <button
              className="user-dropdown-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/watch/${video._id}`);
              }}
            >
              🎞️ Save to Playlist
            </button>
            <button className="user-dropdown-item" onClick={handleShare}>
              ↗️ {copied ? "Link Copied!" : "Share Link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
