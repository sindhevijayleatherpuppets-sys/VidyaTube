import api from "./api";

const CLIENT_YOUTUBE_API_KEY =
  import.meta.env.VITE_YOUTUBE_API_KEY ||
  "AIzaSyBDF1RokJqU1NsMhXsgwr1JemhzXoL9fMQ";

// Fast Client-Side In-Memory Cache (0ms latency, zero lag on navigation & category switches)
const clientCache = new Map();
const CLIENT_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const getCached = (key) => {
  const item = clientCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    clientCache.delete(key);
    return null;
  }
  return item.data;
};

const setCached = (key, data, ttl = CLIENT_CACHE_TTL) => {
  if (clientCache.size > 300) {
    const firstKey = clientCache.keys().next().value;
    clientCache.delete(firstKey);
  }
  clientCache.set(key, { data, expiresAt: Date.now() + ttl });
};

/**
 * Search YouTube and VidyTube videos via backend YouTube service with browser direct fallback and instant cache
 */
export const searchYouTubeVideos = async ({
  q = "",
  pageToken = "",
  category = "",
  maxResults = 16,
}) => {
  const cacheKey = `search_${(q || "").toLowerCase().trim()}_${pageToken}_${category}_${maxResults}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 1. Try Backend API first
  try {
    const { data } = await api.get("/youtube/search", {
      params: { q, pageToken, category, maxResults },
    });
    if (data && data.videos && data.videos.length > 0) {
      setCached(cacheKey, data);
      return data;
    }
  } catch (backendErr) {
    console.warn("Backend YouTube search warning:", backendErr);
  }

  // 2. Fail-Safe Browser Direct Fetch using official Google YouTube Data API v3
  if (q && CLIENT_YOUTUBE_API_KEY) {
    try {
      const queryParams = new URLSearchParams({
        part: "snippet",
        type: "video",
        maxResults: maxResults.toString(),
        q: q.trim(),
        key: CLIENT_YOUTUBE_API_KEY,
        ...(pageToken ? { pageToken } : {}),
      });

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${queryParams.toString()}`
      );
      if (res.ok) {
        const ytJson = await res.json();
        const items = ytJson.items || [];
        const videos = items
          .filter((it) => it.id?.videoId)
          .map((item) => {
            const vidId = item.id.videoId;
            const snip = item.snippet;
            return {
              _id: `yt_${vidId}`,
              youtubeVideoId: vidId,
              source: "youtube",
              title: snip.title,
              description: snip.description,
              channelTitle: snip.channelTitle,
              channel: {
                _id: `yt_chan_${snip.channelId || "creator"}`,
                fullName: snip.channelTitle,
                handle: `@${(snip.channelTitle || "creator")
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "")}`,
                avatar:
                  snip.thumbnails?.default?.url ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
              },
              thumbnailUrl:
                snip.thumbnails?.high?.url ||
                snip.thumbnails?.medium?.url ||
                `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
              embedUrl: `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&enablejsapi=1`,
              videoUrl: `https://www.youtube.com/watch?v=${vidId}`,
              duration: "HD",
              views: 250000,
              likes: [],
              likeCount: 8500,
              commentCount: 210,
              category: snip.categoryId || "General",
              publishedAt: snip.publishedAt,
              createdAt: snip.publishedAt,
              visibility: "public",
            };
          });

        const result = {
          videos,
          channels: [],
          nextPageToken: ytJson.nextPageToken || null,
          totalResults: ytJson.pageInfo?.totalResults || videos.length,
        };
        setCached(cacheKey, result);
        return result;
      }
    } catch (directErr) {
      console.warn("Direct YouTube API fetch warning:", directErr);
    }
  }

  return { videos: [], channels: [], nextPageToken: null, totalResults: 0 };
};

/**
 * Get Trending videos from YouTube Data API v3 with browser fallback and instant cache
 */
export const getYouTubeTrending = async ({
  regionCode = "IN",
  categoryId = "",
  maxResults = 20,
  pageToken = "",
}) => {
  const cacheKey = `trending_${regionCode}_${categoryId}_${pageToken}_${maxResults}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await api.get("/youtube/trending", {
      params: { regionCode, categoryId, maxResults, pageToken },
    });
    if (data && data.videos && data.videos.length > 0) {
      setCached(cacheKey, data);
      return data;
    }
  } catch (backendErr) {
    console.warn("Backend trending error, trying direct:", backendErr);
  }

  // Direct fetch fallback for Trending
  if (CLIENT_YOUTUBE_API_KEY) {
    try {
      const queryParams = new URLSearchParams({
        part: "snippet,contentDetails,statistics",
        chart: "mostPopular",
        regionCode: regionCode || "IN",
        maxResults: maxResults.toString(),
        key: CLIENT_YOUTUBE_API_KEY,
        ...(pageToken ? { pageToken } : {}),
        ...(categoryId ? { videoCategoryId: categoryId } : {}),
      });

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?${queryParams.toString()}`
      );
      if (res.ok) {
        const ytJson = await res.json();
        const items = ytJson.items || [];
        const videos = items.map((item) => {
          const snip = item.snippet;
          const stats = item.statistics || {};
          return {
            _id: `yt_${item.id}`,
            youtubeVideoId: item.id,
            source: "youtube",
            title: snip.title,
            description: snip.description,
            channelTitle: snip.channelTitle,
            channel: {
              _id: `yt_chan_${snip.channelId || "creator"}`,
              fullName: snip.channelTitle,
              handle: `@${(snip.channelTitle || "creator")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "")}`,
              avatar:
                snip.thumbnails?.default?.url ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
            },
            thumbnailUrl:
              snip.thumbnails?.high?.url ||
              snip.thumbnails?.medium?.url ||
              `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
            embedUrl: `https://www.youtube-nocookie.com/embed/${item.id}?autoplay=1&enablejsapi=1`,
            videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
            duration: "HD",
            views: parseInt(stats.viewCount || 0, 10),
            likes: [],
            likeCount: parseInt(stats.likeCount || 0, 10),
            commentCount: parseInt(stats.commentCount || 0, 10),
            category: snip.categoryId || "General",
            publishedAt: snip.publishedAt,
            createdAt: snip.publishedAt,
            visibility: "public",
          };
        });

        const result = {
          videos,
          nextPageToken: ytJson.nextPageToken || null,
          totalResults: ytJson.pageInfo?.totalResults || videos.length,
        };
        setCached(cacheKey, result);
        return result;
      }
    } catch (err) {
      console.warn("Direct trending fetch warning:", err);
    }
  }

  return { videos: [], nextPageToken: null, totalResults: 0 };
};

/**
 * Get detailed video information and related recommendations
 */
export const getYouTubeVideoDetails = async (videoId) => {
  const cleanId = (videoId || "").replace(/^yt_/, "").trim();
  const cacheKey = `video_detail_${cleanId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await api.get(`/youtube/videos/${videoId}`);
    if (data && data.video) {
      setCached(cacheKey, data, 30 * 60 * 1000);
      return data;
    }
  } catch (err) {
    console.warn("Backend video details warning:", err);
  }

  // Direct fetch fallback for video details
  if (cleanId && CLIENT_YOUTUBE_API_KEY) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${cleanId}&key=${CLIENT_YOUTUBE_API_KEY}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.items && json.items.length > 0) {
          const item = json.items[0];
          const snip = item.snippet;
          const stats = item.statistics || {};
          const result = {
            video: {
              _id: `yt_${item.id}`,
              youtubeVideoId: item.id,
              source: "youtube",
              title: snip.title,
              description: snip.description,
              channelTitle: snip.channelTitle,
              channel: {
                _id: `yt_chan_${snip.channelId || "creator"}`,
                fullName: snip.channelTitle,
                handle: `@${(snip.channelTitle || "creator")
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "")}`,
                avatar:
                  snip.thumbnails?.default?.url ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
              },
              thumbnailUrl:
                snip.thumbnails?.maxres?.url ||
                snip.thumbnails?.high?.url ||
                `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
              embedUrl: `https://www.youtube-nocookie.com/embed/${item.id}?autoplay=1&enablejsapi=1`,
              videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
              duration: "HD",
              views: parseInt(stats.viewCount || 0, 10),
              likes: [],
              likeCount: parseInt(stats.likeCount || 0, 10),
              commentCount: parseInt(stats.commentCount || 0, 10),
              category: snip.categoryId || "General",
              publishedAt: snip.publishedAt,
              createdAt: snip.publishedAt,
              visibility: "public",
            },
            related: [],
          };
          setCached(cacheKey, result, 30 * 60 * 1000);
          return result;
        }
      }
    } catch (err) {}
  }

  return { video: null, related: [] };
};

/**
 * Get YouTube Channel details
 */
export const getYouTubeChannelDetails = async (channelId) => {
  const cacheKey = `channel_${channelId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await api.get(`/youtube/channels/${channelId}`);
    if (data) setCached(cacheKey, data, 60 * 60 * 1000);
    return data;
  } catch (err) {
    return null;
  }
};

/**
 * Get YouTube Shorts feed dynamically
 */
export const getYouTubeShorts = async ({
  q = "#shorts trending viral",
  pageToken = "",
  maxResults = 20,
} = {}) => {
  const cacheKey = `shorts_${(q || "").trim()}_${pageToken}_${maxResults}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await api.get("/youtube/shorts", {
      params: { q, pageToken, maxResults },
    });
    if (data && data.shorts && data.shorts.length > 0) {
      setCached(cacheKey, data);
      return data;
    }
  } catch (err) {}

  // Direct fetch fallback for shorts
  if (CLIENT_YOUTUBE_API_KEY) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&maxResults=${maxResults}&q=${encodeURIComponent(
          q
        )}&key=${CLIENT_YOUTUBE_API_KEY}${pageToken ? `&pageToken=${pageToken}` : ""}`
      );
      if (res.ok) {
        const json = await res.json();
        const shorts = (json.items || [])
          .filter((it) => it.id?.videoId)
          .map((it) => ({
            _id: `yt_${it.id.videoId}`,
            youtubeVideoId: it.id.videoId,
            source: "youtube",
            isShort: true,
            title: it.snippet.title,
            description: it.snippet.description,
            channelTitle: it.snippet.channelTitle,
            channel: {
              _id: `yt_chan_${it.snippet.channelId || "creator"}`,
              fullName: it.snippet.channelTitle,
              avatar:
                it.snippet.thumbnails?.default?.url ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
            },
            thumbnailUrl:
              it.snippet.thumbnails?.high?.url ||
              `https://i.ytimg.com/vi/${it.id.videoId}/hqdefault.jpg`,
            embedUrl: `https://www.youtube-nocookie.com/embed/${it.id.videoId}?autoplay=1&enablejsapi=1`,
            videoUrl: `https://www.youtube.com/watch?v=${it.id.videoId}`,
          }));
        const result = { shorts, nextPageToken: json.nextPageToken || null };
        setCached(cacheKey, result);
        return result;
      }
    } catch (err) {}
  }

  return { shorts: [], nextPageToken: null };
};
