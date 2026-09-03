import api from "./api";

const localCache = new Map();
const LOCAL_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const getLocalCached = (key) => {
  const item = localCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    localCache.delete(key);
    return null;
  }
  return item.data;
};

const setLocalCached = (key, data, ttl = LOCAL_CACHE_TTL) => {
  localCache.set(key, { data, expiresAt: Date.now() + ttl });
};

export const fetchVideos = async ({ category, search, isShort, sort, channel } = {}) => {
  const cacheKey = `v_${category || ""}_${search || ""}_${isShort}_${sort || ""}_${channel || ""}`;
  const cached = getLocalCached(cacheKey);
  if (cached) return cached;

  const params = {};
  if (category && category !== "All") params.category = category;
  if (search) params.search = search;
  if (isShort !== undefined) params.isShort = isShort;
  if (sort) params.sort = sort;
  if (channel) params.channel = channel;

  const res = await api.get("/videos", { params });
  const videos = res.data.videos || [];
  setLocalCached(cacheKey, videos);
  return videos;
};

export const fetchShorts = async () => {
  const cacheKey = "shorts_feed";
  const cached = getLocalCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/videos/shorts");
  const shorts = res.data.shorts || [];
  setLocalCached(cacheKey, shorts);
  return shorts;
};

export const fetchVideoById = async (id) => {
  const cacheKey = `video_${id}`;
  const cached = getLocalCached(cacheKey);
  if (cached) return cached;

  const res = await api.get(`/videos/${id}`);
  const video = res.data.video;
  if (video) setLocalCached(cacheKey, video);
  return video;
};

export const uploadVideo = async (formData, onUploadProgress) => {
  const res = await api.post("/videos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return res.data.video;
};

export const updateVideo = async (id, data) => {
  const res = await api.put(`/videos/${id}`, data);
  return res.data.video;
};

export const deleteVideo = async (id) => {
  const res = await api.delete(`/videos/${id}`);
  return res.data;
};

export const toggleLikeVideo = async (id) => {
  const res = await api.post(`/videos/${id}/like`);
  return res.data;
};

export const toggleDislikeVideo = async (id) => {
  const res = await api.post(`/videos/${id}/dislike`);
  return res.data;
};

export const fetchComments = async (videoId) => {
  const res = await api.get(`/videos/${videoId}/comments`);
  return res.data.comments;
};

export const addComment = async (videoId, text, parentId = null) => {
  const res = await api.post(`/videos/${videoId}/comments`, { text, parentId });
  return res.data.comment;
};

export const toggleCommentLike = async (videoId, commentId) => {
  const res = await api.post(`/videos/${videoId}/comments/${commentId}/like`);
  return res.data;
};

export const toggleCommentPin = async (videoId, commentId) => {
  const res = await api.put(`/videos/${videoId}/comments/${commentId}/pin`);
  return res.data;
};

export const deleteComment = async (videoId, commentId) => {
  const res = await api.delete(`/videos/${videoId}/comments/${commentId}`);
  return res.data;
};

export const reportVideo = async (videoId, reason) => {
  const res = await api.post(`/videos/${videoId}/report`, { reason });
  return res.data;
};

export const fetchTrending = async () => {
  const res = await api.get("/videos/trending/list");
  return res.data.videos;
};

export const fetchRecommendations = async () => {
  const res = await api.get("/videos/recommendations/list");
  return res.data.videos;
};

export const fetchMyStudioVideos = async () => {
  const res = await api.get("/videos/studio/mine");
  return res.data;
};

export const fetchLikedVideos = async () => {
  const res = await api.get("/videos/user/liked");
  return res.data.videos;
};

export const importYouTubeVideo = async (payload) => {
  const res = await api.post("/videos/youtube/import", payload);
  return res.data.video;
};

/**
 * Securely download VidyTube-hosted video (Creator / Owner only)
 */
export const downloadVideoFile = async (videoId, title = "video") => {
  const token = localStorage.getItem("vidytube_token");
  const response = await fetch(`/api/videos/${videoId}/download`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || "Download failed. Only the original creator can download this source video.");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50) || "video"}.mp4`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
};
