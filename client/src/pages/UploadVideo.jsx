import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { uploadVideo, importYouTubeVideo } from "../services/videoService";
import { CATEGORIES } from "../utils/format";

const UploadVideo = () => {
  const [activeMode, setActiveMode] = useState("file"); // "file" or "youtube"

  // Standard File Upload State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");
  const [visibility, setVisibility] = useState("public");
  const [isShort, setIsShort] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [videoDragging, setVideoDragging] = useState(false);
  const [thumbDragging, setThumbDragging] = useState(false);

  // YouTube Sync State (Phase 4E)
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [ytTitle, setYtTitle] = useState("");
  const [ytDescription, setYtDescription] = useState("");
  const [ytCategory, setYtCategory] = useState("Technology");
  const [ytIsShort, setYtIsShort] = useState(false);

  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const selectableCategories = CATEGORIES.filter((c) => c !== "All");

  const handleAddTag = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(/,/g, "");
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleThumbnailSelect = (file) => {
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setThumbnailPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const insertChapterTemplate = () => {
    const template = `\nChapters:\n0:00 - Introduction\n1:30 - Setup & Installation\n4:45 - Core Architecture\n8:20 - Live Demo & Walkthrough\n12:00 - Conclusion\n`;
    setDescription((prev) => prev + template);
  };

  // 1. Submit Native File Upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) return setError("Title is required");
    if (!videoFile) return setError("Video file is required");
    if (!thumbnailFile) return setError("Thumbnail is required");

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("category", category);
    formData.append("visibility", visibility);
    formData.append("isShort", isShort);
    formData.append("tags", tags.join(","));
    formData.append("video", videoFile);
    formData.append("thumbnail", thumbnailFile);

    setSubmitting(true);
    try {
      const video = await uploadVideo(formData, (evt) => {
        if (evt.total) {
          setProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      });
      navigate(isShort ? `/shorts?id=${video._id}` : `/watch/${video._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try again.");
      setSubmitting(false);
    }
  };

  // 2. Submit YouTube Sync / Import (Phase 4E)
  const handleYouTubeImport = async (e) => {
    e.preventDefault();
    setError("");

    if (!youtubeUrl.trim()) {
      return setError("Please enter a YouTube video link or Video ID.");
    }

    setSubmitting(true);
    try {
      const video = await importYouTubeVideo({
        youtubeUrl: youtubeUrl.trim(),
        title: ytTitle.trim() || undefined,
        description: ytDescription.trim() || undefined,
        category: ytCategory,
        isShort: ytIsShort,
        tags: ["youtube", "synced", ytCategory.toLowerCase()],
      });
      navigate(ytIsShort ? `/shorts?id=${video._id}` : `/watch/${video._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to import YouTube video.");
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: "880px", margin: "0 auto", padding: "16px 0" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, marginBottom: "8px" }}>
          🎬 Publish & Sync Content
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: "20px" }}>
          Upload MP4 video files directly or auto-sync content from YouTube channels.
        </p>

        {/* Mode Switcher Tabs */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          <button
            className={`btn ${activeMode === "file" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveMode("file")}
          >
            📁 Direct File Upload
          </button>
          <button
            className={`btn ${activeMode === "youtube" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveMode("youtube")}
          >
            🌐 Auto-Sync from YouTube (Phase 4E)
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* MODE 1: FILE UPLOAD */}
        {activeMode === "file" && (
          <form
            onSubmit={handleFileUpload}
            style={{
              background: "var(--bg-surface)",
              padding: "28px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {/* Drag and Drop Video Dropzone */}
            <div style={{ marginBottom: "24px" }}>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Video File (MP4, WebM, QuickTime — max 200MB)
              </span>
              <div
                className={`dropzone-container ${videoDragging ? "dragging" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setVideoDragging(true);
                }}
                onDragLeave={() => setVideoDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setVideoDragging(false);
                  if (e.dataTransfer.files?.[0]) setVideoFile(e.dataTransfer.files[0]);
                }}
                onClick={() => document.getElementById("video-file-input").click()}
              >
                <input
                  id="video-file-input"
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
                  style={{ display: "none" }}
                  onChange={(e) => setVideoFile(e.target.files[0])}
                />
                <div className="dropzone-icon">{videoFile ? "✅" : "📤"}</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                  {videoFile ? videoFile.name : "Drag & drop video file here, or browse"}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "4px" }}>
                  {videoFile
                    ? `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`
                    : "Recommended 1080p 60FPS MP4"}
                </p>
              </div>
            </div>

            {/* Drag and Drop Thumbnail Dropzone */}
            <div style={{ marginBottom: "24px" }}>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Video Thumbnail (JPG, PNG, WebP — max 5MB)
              </span>
              <div
                className={`dropzone-container ${thumbDragging ? "dragging" : ""}`}
                style={{ padding: "28px" }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setThumbDragging(true);
                }}
                onDragLeave={() => setThumbDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setThumbDragging(false);
                  if (e.dataTransfer.files?.[0]) handleThumbnailSelect(e.dataTransfer.files[0]);
                }}
                onClick={() => document.getElementById("thumb-file-input").click()}
              >
                <input
                  id="thumb-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: "none" }}
                  onChange={(e) => handleThumbnailSelect(e.target.files[0])}
                />
                {thumbnailPreview ? (
                  <div>
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      style={{
                        maxWidth: "240px",
                        aspectRatio: "16/9",
                        objectFit: "cover",
                        borderRadius: "var(--radius-sm)",
                        marginBottom: "8px",
                      }}
                    />
                    <div style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: 700 }}>
                      Click to change thumbnail
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🖼️</div>
                    <h4 style={{ fontSize: "1rem", fontWeight: 600 }}>Select or drop a high-res thumbnail</h4>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      16:9 aspect ratio recommended
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Short Format Toggle */}
            <div
              style={{
                background: "var(--bg-main)",
                padding: "14px 18px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>⚡ Publish as YouTube Short</span>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  Feature in the vertical YouTube Shorts shelf and feed.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isShort}
                onChange={(e) => setIsShort(e.target.checked)}
                style={{ width: "20px", height: "20px", accentColor: "var(--accent)", cursor: "pointer" }}
              />
            </div>

            {/* Title */}
            <label className="field">
              <span>Video Title (required)</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Building a Modern Full-Stack Video App from Scratch"
                maxLength={150}
              />
            </label>

            {/* Description */}
            <label className="field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Description</span>
                <button
                  type="button"
                  onClick={insertChapterTemplate}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--accent)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ＋ Insert Chapters Template
                </button>
              </div>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your video, include timestamps chapters, and add hashtags #react #coding..."
              />
            </label>

            {/* Category & Visibility Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <label className="field">
                <span>Category</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {selectableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Visibility</span>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                  <option value="public">🌐 Public (Everyone can watch)</option>
                  <option value="unlisted">🔗 Unlisted (Anyone with link)</option>
                  <option value="private">🔒 Private (Only you)</option>
                </select>
              </label>
            </div>

            {/* Tags */}
            <label className="field">
              <span>Tags (Press Enter or comma to add)</span>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tags e.g. webdev, tutorial, react"
              />
              {tags.length > 0 && (
                <div className="upload-tags-container">
                  {tags.map((tag) => (
                    <span key={tag} className="upload-tag-chip">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </label>

            {/* Progress Bar */}
            {submitting && (
              <div style={{ margin: "20px 0" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    marginBottom: "6px",
                  }}
                >
                  <span>Uploading to VidyTube...</span>
                  <span>{progress}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "12px 32px" }}
                disabled={submitting}
              >
                {submitting ? `Uploading (${progress}%)...` : "Publish Video"}
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: YOUTUBE SYNC / IMPORT (Phase 4E) */}
        {activeMode === "youtube" && (
          <form
            onSubmit={handleYouTubeImport}
            style={{
              background: "var(--bg-surface)",
              padding: "28px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-highlight)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div
              style={{
                background: "rgba(255, 0, 51, 0.08)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                marginBottom: "20px",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>💡</span>
              <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                <strong style={{ color: "var(--text-primary)" }}>Instant YouTube Web Embedding:</strong> Paste any
                YouTube video link or Video ID. VidyTube will embed the player and sync thumbnail & metadata without
                re-hosting video files, fully complying with YouTube API Terms.
              </div>
            </div>

            <label className="field">
              <span>YouTube Video URL or ID (required)</span>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ or dQw4w9WgXcQ"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
            </label>

            <label className="field">
              <span>Custom Title (optional - defaults to video ID)</span>
              <input
                type="text"
                placeholder="e.g. Complete Web Development Bootcamp 2026"
                value={ytTitle}
                onChange={(e) => setYtTitle(e.target.value)}
              />
            </label>

            <label className="field">
              <span>Custom Description (optional)</span>
              <textarea
                rows={3}
                placeholder="Add notes, timestamp chapters, or hashtags for your VidyTube audience..."
                value={ytDescription}
                onChange={(e) => setYtDescription(e.target.value)}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <label className="field">
                <span>Category</span>
                <select value={ytCategory} onChange={(e) => setYtCategory(e.target.value)}>
                  {selectableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--bg-main)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                  marginTop: "24px",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>⚡ Is YouTube Short</span>
                <input
                  type="checkbox"
                  checked={ytIsShort}
                  onChange={(e) => setYtIsShort(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "var(--accent)" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "12px 32px" }}
                disabled={submitting}
              >
                {submitting ? "Syncing Video..." : "⚡ Sync & Publish from YouTube"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
};

export default UploadVideo;
