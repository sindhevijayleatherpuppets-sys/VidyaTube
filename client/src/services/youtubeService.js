import api from "./api";

const CLIENT_YOUTUBE_API_KEY =
  import.meta.env.VITE_YOUTUBE_API_KEY ||
  "AIzaSyBDF1RokJqU1NsMhXsgwr1JemhzXoL9fMQ";

/**
 * Search YouTube and VidyTube videos via backend YouTube service with browser direct fallback
 */
export const searchYouTubeVideos = async ({
  q = "",
  pageToken = "",
  category = "",
  maxResults = 16,
}) => {
  // 1. Try Backend API first
  try {
    const { data } = await api.get("/youtube/search", {
      params: { q, pageToken, category, maxResults },
    });
    if (data && data.videos && data.videos.length > 0) {
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

        return {
          videos,
          channels: [],
          nextPageToken: ytJson.nextPageToken || null,
          totalResults: ytJson.pageInfo?.totalResults || videos.length,
        };
      }
    } catch (directErr) {
      console.warn("Direct YouTube API fetch warning:", directErr);
    }
  }

  return { videos: [], channels: [], nextPageToken: null, totalResults: 0 };
};

/**
 * Get Trending videos from YouTube Data API v3 with browser fallback
 */
export const getYouTubeTrending = async ({
  regionCode = "IN",
  categoryId = "",
  maxResults = 16,
  pageToken = "",
}) => {
  try {
    const { data } = await api.get("/youtube/trending", {
      params: { regionCode, categoryId, maxResults, pageToken },
    });
    if (data && data.videos && data.videos.length > 0) {
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

        return {
          videos,
          nextPageToken: ytJson.nextPageToken || null,
          totalResults: ytJson.pageInfo?.totalResults || videos.length,
        };
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
  try {
    const { data } = await api.get(`/youtube/videos/${videoId}`);
    if (data && data.video) return data;
  } catch (err) {
    console.warn("Backend video details warning:", err);
  }

  // Direct fetch fallback for video details
  const cleanId = (videoId || "").replace(/^yt_/, "").trim();
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
          return {
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
  const { data } = await api.get(`/youtube/channels/${channelId}`);
  return data;
};

/**
 * Get YouTube Shorts feed dynamically
 */
export const getYouTubeShorts = async ({
  q = "shorts trending viral",
  pageToken = "",
  maxResults = 20,
} = {}) => {
  try {
    const { data } = await api.get("/youtube/shorts", {
      params: { q, pageToken, maxResults },
    });
    if (data && data.shorts && data.shorts.length > 0) return data;
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
        return { shorts, nextPageToken: json.nextPageToken || null };
      }
    } catch (err) {}
  }

  return { shorts: [], nextPageToken: null };
};
