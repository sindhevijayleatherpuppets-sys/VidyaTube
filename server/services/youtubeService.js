const https = require("https");

// Fetch helper with promise and timeout
const httpsGet = (url) => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("YouTube API request timed out"));
    });
  });
};

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Get normalized API Key from process.env
 */
const getApiKey = () => {
  return (process.env.YOUTUBE_API_KEY || "").trim().replace(/^["']|["']$/g, "");
};

/**
 * Curated high-engagement YouTube Shorts fallback when API quota is exhausted
 */
const CURATED_SHORTS = [
  {
    id: "kJQP7kiw5Fk",
    title: "Luis Fonsi - Despacito Viral Vibes #Shorts",
    channelTitle: "Luis Fonsi Official",
    views: 82000000,
    duration: "00:58",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "Bohemian Rhapsody Live Performance #Shorts",
    channelTitle: "Queen Official",
    views: 45000000,
    duration: "00:50",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200",
  },
  {
    id: "9bZkp7q19f0",
    title: "PSY - Gangnam Style Iconic Moment #Shorts",
    channelTitle: "officialpsy",
    views: 52000000,
    duration: "00:59",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
  },
  {
    id: "3JZ_D3ELwOQ",
    title: "Telugu Cinema Action & Dance Showcase #Shorts",
    channelTitle: "Tollywood Central",
    views: 12500000,
    duration: "00:45",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
  },
  {
    id: "kXYiU_JCYtU",
    title: "Crazy Python Automation in 30 Seconds #Shorts",
    channelTitle: "Tech & Code",
    views: 3400000,
    duration: "00:30",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200",
  },
  {
    id: "JGwWNGJdvx8",
    title: "Ed Sheeran - Shape of You Acoustic #Shorts",
    channelTitle: "Ed Sheeran",
    views: 61000000,
    duration: "00:55",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
  },
];

/**
 * Format YouTube duration (ISO 8601 e.g. PT4M13S -> 04:13)
 */
const formatDuration = (isoDuration) => {
  if (!isoDuration) return "03:45";
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "03:45";
  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Format raw YouTube video object to standardized VidyTube format
 */
const formatYouTubeVideo = (item, extraStats = {}) => {
  const snippet = item.snippet || {};
  const stats = item.statistics || extraStats || {};
  const contentDetails = item.contentDetails || {};
  const videoId = typeof item.id === "string" ? item.id : item.id?.videoId || item.id;

  return {
    _id: `yt_${videoId}`,
    youtubeVideoId: videoId,
    source: "youtube",
    title: snippet.title || "Untitled Video",
    description: snippet.description || "",
    channelTitle: snippet.channelTitle || "Creator",
    channelId: snippet.channelId || "",
    channel: {
      _id: `yt_chan_${snippet.channelId || "creator"}`,
      fullName: snippet.channelTitle || "Creator",
      handle: `@${(snippet.channelTitle || "creator").toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      avatar: snippet.thumbnails?.default?.url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
    },
    thumbnailUrl:
      snippet.thumbnails?.maxres?.url ||
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      snippet.thumbnails?.default?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    duration: formatDuration(contentDetails.duration),
    views: parseInt(stats.viewCount || 0, 10),
    likes: [],
    likeCount: parseInt(stats.likeCount || 0, 10),
    commentCount: parseInt(stats.commentCount || 0, 10),
    category: snippet.categoryId || "General",
    tags: snippet.tags || [],
    publishedAt: snippet.publishedAt || new Date().toISOString(),
    createdAt: snippet.publishedAt || new Date().toISOString(),
    visibility: "public",
  };
};

/**
 * Format raw YouTube channel object to standardized VidyTube format
 */
const formatYouTubeChannel = (item) => {
  const snippet = item.snippet || {};
  const stats = item.statistics || {};
  const channelId = typeof item.id === "string" ? item.id : item.id?.channelId || item.id;

  return {
    _id: `yt_chan_${channelId}`,
    channelId,
    fullName: snippet.title || "Creator",
    handle: snippet.customUrl || `@${(snippet.title || "creator").toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    description: snippet.description || "",
    avatar: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
    subscriberCount: parseInt(stats.subscriberCount || 0, 10),
    videoCount: parseInt(stats.videoCount || 0, 10),
    viewCount: parseInt(stats.viewCount || 0, 10),
  };
};

/**
 * Search YouTube videos dynamically in REAL-TIME via YouTube Data API v3 (search.list + videos.list)
 */
const searchVideos = async ({ q = "", pageToken = "", category = "", maxResults = 20, order = "relevance", type = "video" }) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      videos: [],
      nextPageToken: null,
      totalResults: 0,
      isKeyMissing: true,
      notice: "Add YOUTUBE_API_KEY to server/.env to enable live dynamic YouTube search",
    };
  }

  const queryParams = new URLSearchParams({
    part: "snippet",
    type,
    maxResults: Math.min(parseInt(maxResults, 10) || 20, 30).toString(),
    q: q.trim(),
    order,
    key: apiKey,
    ...(pageToken ? { pageToken } : {}),
    ...(category && category !== "All" ? { videoCategoryId: category } : {}),
  });

  const url = `${YOUTUBE_API_BASE}/search?${queryParams.toString()}`;
  try {
    const response = await httpsGet(url);

    if (response.statusCode !== 200) {
      const errData = response.data?.error || {};
      const reason = errData.errors?.[0]?.reason || "";
      let errorType = "API_ERROR";
      let message = errData.message || "YouTube API error occurred";

      if (reason === "quotaExceeded" || reason === "rateLimitExceeded" || response.statusCode === 403 || response.statusCode === 429) {
        errorType = "QUOTA_EXCEEDED";
        message = "YouTube Data API daily search quota limit reached for this Google Cloud project.";
      } else if (reason === "keyInvalid" || response.statusCode === 400) {
        errorType = "INVALID_KEY";
        message = "The configured YOUTUBE_API_KEY in server/.env is invalid.";
      }

      return {
        videos: [],
        nextPageToken: null,
        error: message,
        errorType,
      };
    }

    const items = response.data.items || [];
    const videoIds = items.map((it) => it.id?.videoId).filter(Boolean);

    // Batch-fetch additional details and statistics via videos.list
    let detailsMap = {};
    if (videoIds.length > 0) {
      try {
        const detailsUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(",")}&key=${apiKey}`;
        const detailsRes = await httpsGet(detailsUrl);
        if (detailsRes.statusCode === 200 && detailsRes.data.items) {
          detailsRes.data.items.forEach((item) => {
            detailsMap[item.id] = item;
          });
        }
      } catch (err) {
        console.warn("Batch video statistics fetch warning:", err.message);
      }
    }

    const videos = items
      .filter((it) => it.id?.videoId || it.id?.kind === "youtube#video")
      .map((item) => {
        const videoId = item.id?.videoId || item.id;
        const fullItem = detailsMap[videoId] || item;
        return formatYouTubeVideo(fullItem);
      });

    return {
      videos,
      nextPageToken: response.data.nextPageToken || null,
      prevPageToken: response.data.prevPageToken || null,
      totalResults: response.data.pageInfo?.totalResults || videos.length,
    };
  } catch (err) {
    return {
      videos: [],
      nextPageToken: null,
      error: err.message,
    };
  }
};

/**
 * Search YouTube Channels via YouTube Data API v3 (search.list + channels.list)
 */
const searchChannels = async ({ q = "", pageToken = "", maxResults = 10 }) => {
  const apiKey = getApiKey();
  if (!apiKey || !q.trim()) return { channels: [], nextPageToken: null };

  const queryParams = new URLSearchParams({
    part: "snippet",
    type: "channel",
    maxResults: Math.min(maxResults, 20).toString(),
    q: q.trim(),
    key: apiKey,
    ...(pageToken ? { pageToken } : {}),
  });

  const url = `${YOUTUBE_API_BASE}/search?${queryParams.toString()}`;
  try {
    const response = await httpsGet(url);

    if (response.statusCode !== 200) {
      return { channels: [], nextPageToken: null };
    }

    const items = response.data.items || [];
    const channelIds = items.map((it) => it.id?.channelId).filter(Boolean);

    let detailsMap = {};
    if (channelIds.length > 0) {
      try {
        const detailsUrl = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${channelIds.join(",")}&key=${apiKey}`;
        const detailsRes = await httpsGet(detailsUrl);
        if (detailsRes.statusCode === 200 && detailsRes.data.items) {
          detailsRes.data.items.forEach((item) => {
            detailsMap[item.id] = item;
          });
        }
      } catch (e) {}
    }

    const channels = items.map((it) => {
      const chanId = it.id?.channelId;
      return formatYouTubeChannel(detailsMap[chanId] || it);
    });

    return {
      channels,
      nextPageToken: response.data.nextPageToken || null,
    };
  } catch (e) {
    return { channels: [], nextPageToken: null };
  }
};

/**
 * Get Channel details by Channel ID (channels.list)
 */
const getChannelDetails = async (channelId) => {
  const apiKey = getApiKey();
  const cleanId = channelId.replace(/^yt_chan_/, "");

  if (!apiKey) {
    return formatYouTubeChannel({
      id: cleanId,
      snippet: { title: "YouTube Creator", description: "Official creator channel." },
    });
  }

  try {
    const url = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${cleanId}&key=${apiKey}`;
    const response = await httpsGet(url);

    if (response.statusCode === 200 && response.data.items?.length > 0) {
      return formatYouTubeChannel(response.data.items[0]);
    }
  } catch (e) {}

  return formatYouTubeChannel({
    id: cleanId,
    snippet: { title: "YouTube Creator", description: "Official creator channel." },
  });
};

/**
 * Get Trending / Most Popular videos via YouTube Data API v3 (videos.list)
 */
const getTrendingVideos = async ({ regionCode = "IN", categoryId = "", maxResults = 20, pageToken = "" }) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      videos: [],
      nextPageToken: null,
      isKeyMissing: true,
      notice: "Add YOUTUBE_API_KEY to server/.env to fetch live YouTube trending feeds",
    };
  }

  const queryParams = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    chart: "mostPopular",
    regionCode: regionCode || "IN",
    maxResults: Math.min(parseInt(maxResults, 10) || 20, 30).toString(),
    key: apiKey,
    ...(pageToken ? { pageToken } : {}),
    ...(categoryId ? { videoCategoryId: categoryId } : {}),
  });

  const url = `${YOUTUBE_API_BASE}/videos?${queryParams.toString()}`;
  try {
    const response = await httpsGet(url);

    if (response.statusCode !== 200) {
      const errData = response.data?.error || {};
      return {
        videos: [],
        nextPageToken: null,
        error: errData.message || "Trending API error",
        errorType: errData.errors?.[0]?.reason || "API_ERROR",
      };
    }

    const items = response.data.items || [];
    const videos = items.map((item) => formatYouTubeVideo(item));

    return {
      videos,
      nextPageToken: response.data.nextPageToken || null,
      totalResults: response.data.pageInfo?.totalResults || videos.length,
    };
  } catch (err) {
    return {
      videos: [],
      nextPageToken: null,
      error: err.message,
    };
  }
};

/**
 * Get single video details by YouTube Video ID (videos.list)
 */
const getVideoDetails = async (videoId) => {
  const cleanId = (videoId || "").replace(/^yt_/, "").trim();
  const apiKey = getApiKey();

  if (!apiKey || !cleanId) {
    return formatYouTubeVideo({
      id: cleanId || "dQw4w9WgXcQ",
      snippet: {
        title: `Creator Video (${cleanId})`,
        description: "Public creator video streaming on VidyTube.",
        channelTitle: "Creator",
      },
    });
  }

  try {
    const url = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${cleanId}&key=${apiKey}`;
    const response = await httpsGet(url);

    if (response.statusCode === 200 && response.data.items?.length > 0) {
      return formatYouTubeVideo(response.data.items[0]);
    }
  } catch (err) {
    console.warn("getVideoDetails warning:", err.message);
  }

  // Graceful fallback containing accurate embed & thumbnail URL so playback always works
  return formatYouTubeVideo({
    id: cleanId,
    snippet: {
      title: `Creator Video (${cleanId})`,
      description: "Public creator video streaming on VidyTube.",
      channelTitle: "Creator",
    },
  });
};

/**
 * Get YouTube Shorts dynamically (videoDuration=short) with curated fallback
 */
const getYouTubeShorts = async ({ q = "#shorts trending viral", pageToken = "", maxResults = 20 } = {}) => {
  const apiKey = getApiKey();

  if (apiKey) {
    try {
      const queryParams = new URLSearchParams({
        part: "snippet",
        type: "video",
        videoDuration: "short",
        maxResults: Math.min(parseInt(maxResults, 10) || 20, 30).toString(),
        q: q.trim() || "#shorts",
        key: apiKey,
        ...(pageToken ? { pageToken } : {}),
      });

      const url = `${YOUTUBE_API_BASE}/search?${queryParams.toString()}`;
      const response = await httpsGet(url);

      if (response.statusCode === 200 && response.data.items?.length > 0) {
        const items = response.data.items;
        const videoIds = items.map((it) => it.id?.videoId).filter(Boolean);

        let detailsMap = {};
        if (videoIds.length > 0) {
          try {
            const detailsUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(",")}&key=${apiKey}`;
            const detailsRes = await httpsGet(detailsUrl);
            if (detailsRes.statusCode === 200 && detailsRes.data.items) {
              detailsRes.data.items.forEach((item) => {
                detailsMap[item.id] = item;
              });
            }
          } catch (err) {}
        }

        const shorts = items
          .filter((it) => it.id?.videoId)
          .map((item) => {
            const videoId = item.id?.videoId;
            const fullItem = detailsMap[videoId] || item;
            const v = formatYouTubeVideo(fullItem);
            return { ...v, isShort: true };
          });

        return {
          shorts,
          nextPageToken: response.data.nextPageToken || null,
        };
      }
    } catch (err) {
      console.warn("Live shorts fetch warning:", err.message);
    }
  }

  // Fallback to high-engagement curated vertical YouTube Shorts so users always enjoy endless Shorts!
  const fallbackShorts = CURATED_SHORTS.map((cs) => ({
    _id: `yt_${cs.id}`,
    youtubeVideoId: cs.id,
    source: "youtube",
    title: cs.title,
    description: "Trending YouTube Short on VidyTube.",
    channelTitle: cs.channelTitle,
    channel: {
      _id: `yt_chan_${cs.id}`,
      fullName: cs.channelTitle,
      avatar: cs.avatar,
      subscriberCount: 1500000,
    },
    thumbnailUrl: `https://i.ytimg.com/vi/${cs.id}/hqdefault.jpg`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${cs.id}?autoplay=1&enablejsapi=1`,
    videoUrl: `https://www.youtube.com/watch?v=${cs.id}`,
    duration: cs.duration,
    views: cs.views,
    likes: [],
    likeCount: Math.floor(cs.views * 0.08),
    commentCount: 2450,
    category: "Shorts",
    isShort: true,
  }));

  return {
    shorts: fallbackShorts,
    nextPageToken: null,
  };
};

/**
 * Get related recommendations for a video
 */
const getRelatedVideos = async (videoId, title = "") => {
  const cleanId = (videoId || "").replace(/^yt_/, "").trim();
  try {
    const cleanTitle = (title || "")
      .replace(/[\u{1F600}-\u{1F6FF}|[\u{2600}-\u{26FF}]/gu, "")
      .trim()
      .slice(0, 40);

    const searchResult = await searchVideos({
      q: cleanTitle || "trending videos",
      maxResults: 12,
    });
    return (searchResult.videos || []).filter((v) => v.youtubeVideoId !== cleanId);
  } catch (e) {
    return [];
  }
};

module.exports = {
  searchVideos,
  searchChannels,
  getChannelDetails,
  getTrendingVideos,
  getVideoDetails,
  getRelatedVideos,
  getYouTubeShorts,
  formatYouTubeVideo,
  formatYouTubeChannel,
};
