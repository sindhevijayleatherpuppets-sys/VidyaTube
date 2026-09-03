import api from "./api";

/**
 * Search YouTube and VidyTube videos via backend YouTube service
 */
export const searchYouTubeVideos = async ({ q = "", pageToken = "", category = "", maxResults = 16 }) => {
  const { data } = await api.get("/youtube/search", {
    params: { q, pageToken, category, maxResults },
  });
  return data;
};

/**
 * Get Trending videos from YouTube Data API v3
 */
export const getYouTubeTrending = async ({ regionCode = "IN", categoryId = "", maxResults = 16, pageToken = "" }) => {
  const { data } = await api.get("/youtube/trending", {
    params: { regionCode, categoryId, maxResults, pageToken },
  });
  return data;
};

/**
 * Get detailed video information and related recommendations
 */
export const getYouTubeVideoDetails = async (videoId) => {
  const { data } = await api.get(`/youtube/videos/${videoId}`);
  return data;
};

/**
 * Get YouTube Channel details
 */
export const getYouTubeChannelDetails = async (channelId) => {
  const { data } = await api.get(`/youtube/channels/${channelId}`);
  return data;
};

/**
 * Get YouTube Shorts feed dynamically
 */
export const getYouTubeShorts = async ({ q = "shorts trending viral", pageToken = "", maxResults = 20 } = {}) => {
  const { data } = await api.get("/youtube/shorts", {
    params: { q, pageToken, maxResults },
  });
  return data;
};
