// Fetch helper with promise, timeout, and required Referer for Google Cloud API Key
const httpsGet = (urlStr) => {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(urlStr);
      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: "GET",
        headers: {
          Referer: "https://vidya-tube-app.vercel.app/",
          Origin: "https://vidya-tube-app.vercel.app",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      };

      const req = https.request(options, (res) => {
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
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error("YouTube API request timed out"));
      });
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Get normalized API Key from process.env
 */
const getApiKey = () => {
  return (
    process.env.YOUTUBE_API_KEY ||
    "AIzaSyBDF1RokJqU1NsMhXsgwr1JemhzXoL9fMQ"
  )
    .trim()
    .replace(/^["']|["']$/g, "");
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
 * Curated Top Blockbuster Real YouTube Videos
 */
const CURATED_TOP_VIDEOS = [
  {
    videoId: "1kVK0MZlbI4",
    title: "Pushpa 2: The Rule - Official Theatrical Trailer (Telugu) | Allu Arjun | Sukumar | Rashmika",
    description: "Witness the roaring rage of Pushpa Raj! Starring Icon Star Allu Arjun, Rashmika Mandanna, Fahadh Faasil. Directed by Sukumar, Music by Devi Sri Prasad.",
    channelTitle: "Mythri Movie Makers",
    channelId: "UCwvgP02g8Jp3W957a0YnOZw",
    views: 110500000,
    likeCount: 4200000,
    duration: "03:15",
    category: "Entertainment",
    tags: ["pushpa2", "alluarjun", "telugu", "trailer", "tollywood"],
  },
  {
    videoId: "2v-s8mXvQeQ",
    title: "Kalki 2898 AD - Official Release Trailer | Prabhas | Amitabh Bachchan | Kamal Haasan | Deepika",
    description: "From the visionary world of Nag Ashwin, starring Rebel Star Prabhas, Amitabh Bachchan, Kamal Haasan, Deepika Padukone, and Disha Patani.",
    channelTitle: "Vyjayanthi Network",
    channelId: "UCwvgP02g8Jp3W957a0YnOZw",
    views: 86400000,
    likeCount: 3100000,
    duration: "02:50",
    category: "Entertainment",
    tags: ["kalki2898ad", "prabhas", "kalki", "trailer", "telugu"],
  },
  {
    videoId: "z1rP8iO_w_M",
    title: "Devara Part 1 - Fear Song Official Video | Jr NTR | Janhvi Kapoor | Anirudh Ravichander",
    description: "Feel the electrifying beats of Anirudh! Devara Part 1 starring Man of Masses Jr NTR, Janhvi Kapoor, Saif Ali Khan, directed by Koratala Siva.",
    channelTitle: "T-Series Telugu",
    channelId: "UCwvgP02g8Jp3W957a0YnOZw",
    views: 98000000,
    likeCount: 2900000,
    duration: "03:40",
    category: "Music",
    tags: ["devara", "jrntr", "anirudh", "fearsong", "music", "telugu"],
  },
  {
    videoId: "4GPvYMKtrtI",
    title: "Salaar: Part 1 - CeaseFire Action Trailer | Prabhas | Prithviraj | Prashanth Neel",
    description: "From the director of KGF, Prashanth Neel, comes the violent powerhouse Salaar: Part 1 - CeaseFire starring Rebel Star Prabhas.",
    channelTitle: "Hombale Films",
    channelId: "UCwvgP02g8Jp3W957a0YnOZw",
    views: 145000000,
    likeCount: 5200000,
    duration: "03:50",
    category: "Entertainment",
    tags: ["salaar", "prabhas", "prashanthneel", "trailer", "action", "telugu"],
  },
  {
    videoId: "r-r2w1H4f9M",
    title: "Guntur Kaaram - Kurchi Madathapetti Full Video Song | Mahesh Babu | Sreeleela | Thaman S",
    description: "Superstar Mahesh Babu and Sreeleela set the dance floor on fire with the mass anthem Kurchi Madathapetti, composed by S Thaman.",
    channelTitle: "Aditya Music",
    channelId: "UCwvgP02g8Jp3W957a0YnOZw",
    views: 215000000,
    likeCount: 4800000,
    duration: "04:12",
    category: "Music",
    tags: ["gunturkaaram", "maheshbabu", "kurchimadathapetti", "thamans", "telugu"],
  },
  {
    videoId: "i-wS7N72p_8",
    title: "Game Changer - Jaragandi Song (Telugu) | Ram Charan | Kiara Advani | Shankar | Thaman S",
    description: "Mega Power Star Ram Charan and Kiara Advani groove to the high-energy mass beats of Jaragandi from Director Shankar's Game Changer.",
    channelTitle: "Saregama Telugu",
    channelId: "UCwvgP02g8Jp3W957a0YnOZw",
    views: 74500000,
    likeCount: 2400000,
    duration: "04:30",
    category: "Music",
    tags: ["gamechanger", "ramcharan", "jaragandi", "shankar", "telugu"],
  },
  {
    videoId: "uvQfK_FkZtE",
    title: "Hanu-Man - Official Theatrical Trailer (Telugu) | Teja Sajja | Prasanth Varma",
    description: "The Indian superhero epic! Hanu-Man written and directed by Prasanth Varma, starring Teja Sajja, Amritha Aiyer.",
    channelTitle: "Tips Telugu",
    channelId: "UCwvgP02g8Jp3W957a0YnOZw",
    views: 62000000,
    likeCount: 1900000,
    duration: "03:30",
    category: "Entertainment",
    tags: ["hanuman", "tejasajja", "superhero", "trailer", "telugu"],
  },
  {
    videoId: "5j9QfP7hZzE",
    title: "OG (They Call Him OG) - Hungry Cheetah Teaser | Pawan Kalyan | Sujeeth | Thaman S",
    description: "Power Star Pawan Kalyan in and as OG! Directed by Sujeeth, produced by DVV Danayya. A relentless storm of action and style.",
    channelTitle: "DVV Entertainment",
    channelId: "UCwvgP02g8Jp3W957a0YnOZw",
    views: 58000000,
    likeCount: 2200000,
    duration: "01:42",
    category: "Entertainment",
    tags: ["og", "pawankalyan", "hungrycheetah", "sujeeth", "telugu"],
  },
  {
    videoId: "OsU0HmuqgVM",
    title: "RRR - Naatu Naatu Full Video Song (Telugu) | NTR, Ram Charan | M.M. Keeravaani | SS Rajamouli",
    description: "Oscar-winning historic dance sensation! Naatu Naatu from SS Rajamouli's RRR starring Jr NTR and Ram Charan. Composed by MM Keeravaani.",
    channelTitle: "Lahari Music | T-Series",
    channelId: "UCwvgP02g8Jp3W957a0YnOZw",
    views: 390000000,
    likeCount: 7800000,
    duration: "04:35",
    category: "Music",
    tags: ["rrr", "naatunaatu", "ntr", "ramcharan", "rajamouli", "telugu", "oscar"],
  },
  {
    videoId: "48h57PspQUw",
    title: "MrBeast - $1 vs $1,000,000,000 Yacht! World Record Experience",
    description: "We rented the most expensive yacht on earth! From a $1 rowboat to a billion-dollar super yacht with helicopters and submersibles.",
    channelTitle: "MrBeast",
    channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
    views: 340000000,
    likeCount: 14000000,
    duration: "20:15",
    category: "Entertainment",
    tags: ["mrbeast", "entertainment", "challenge", "yacht", "viral"],
  },
  {
    videoId: "QdBZY2fkU-0",
    title: "Grand Theft Auto VI (GTA 6) - Official First Look Trailer 4K 60FPS",
    description: "Welcome back to Vice City! Rockstar Games presents the official trailer for Grand Theft Auto VI. Next-generation open world gaming.",
    channelTitle: "Rockstar Games",
    channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
    views: 235000000,
    likeCount: 12500000,
    duration: "01:31",
    category: "Gaming",
    tags: ["gta6", "gaming", "rockstargames", "vicecity", "trailer"],
  },
  {
    videoId: "7K_3qUvZ8eU",
    title: "Apple iPhone 16 Pro & Pro Max Review & Camera Benchmark (MKBHD)",
    description: "The complete review of Apple's newest flagship: Camera Control button, Apple Intelligence, A18 Pro silicon, and camera tests.",
    channelTitle: "Marques Brownlee",
    channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
    views: 15200000,
    likeCount: 890000,
    duration: "18:45",
    category: "Technology",
    tags: ["apple", "iphone16", "mkbhd", "tech", "technology"],
  },
  {
    videoId: "a3lcGnMhvsA",
    title: "Interstellar - 10th Anniversary IMAX 4K Docking Scene (Hans Zimmer)",
    description: "One of the greatest cinematic achievements in history. Christopher Nolan's masterpiece Interstellar: Cooper's docking with the spinning Endurance station.",
    channelTitle: "Warner Bros. Pictures",
    channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
    views: 44000000,
    likeCount: 1800000,
    duration: "05:15",
    category: "Science",
    tags: ["interstellar", "science", "hanszimmer", "space", "cinema"],
  },
  {
    videoId: "kXYiU_JCYtU",
    title: "Virat Kohli's Iconic 82* vs Pakistan - Two Unbelievable 6s Highlights",
    description: "Shot of the century! Rewind Virat Kohli's legendary straight six off Haris Rauf at MCG. ICC Men's T20 World Cup.",
    channelTitle: "ICC Official",
    channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
    views: 65000000,
    likeCount: 3400000,
    duration: "04:55",
    category: "Sports",
    tags: ["cricket", "viratkohli", "sports", "t20worldcup"],
  },
  {
    videoId: "8mAITcNt710",
    title: "Harvard CS50 - Full Computer Science Degree Course in 24 Hours",
    description: "An introduction to the intellectual enterprises of computer science and the art of programming from Harvard University.",
    channelTitle: "freeCodeCamp.org",
    channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
    views: 18000000,
    likeCount: 920000,
    duration: "24:15:00",
    category: "Education",
    tags: ["cs50", "harvard", "coding", "education", "programming"],
  },
  {
    videoId: "_uQrJ0TkZlc",
    title: "Python Full Course for Beginners [2026 Tutorial]",
    description: "Complete Python tutorial for beginners! Learn Python programming from scratch with variables, functions, loops, OOP, and real-world projects with Mosh.",
    channelTitle: "Programming with Mosh",
    channelId: "UCWv7vMbMWH4-V0ZXdm8mkNw",
    views: 48800000,
    likeCount: 1750000,
    duration: "06:14:07",
    category: "Education",
    tags: ["python", "python course", "learn python", "coding", "programming", "python tutorial", "software development"],
  },
  {
    videoId: "kqtD5dpn9C8",
    title: "Python for Beginners - Learn Coding with Python in 1 Hour",
    description: "This Python tutorial for beginners will help you learn Python programming quickly. Python step-by-step with practical hands-on examples.",
    channelTitle: "Programming with Mosh",
    channelId: "UCWv7vMbMWH4-V0ZXdm8mkNw",
    views: 25100000,
    likeCount: 890000,
    duration: "01:00:15",
    category: "Education",
    tags: ["python", "learn python", "python 1 hour", "programming", "coding", "tutorial"],
  },
  {
    videoId: "UrsmFxEIp5k",
    title: "Python Tutorial For Beginners in Hindi | Complete Python Course 🔥",
    description: "Master Python programming in Hindi! Complete roadmap from basic syntax to advanced OOP, data structures, and Python interview questions.",
    channelTitle: "CodeWithHarry",
    channelId: "UCeVMnSShP_Iviwkknt83cww",
    views: 23800000,
    likeCount: 1150000,
    duration: "10:53:55",
    category: "Education",
    tags: ["python", "python in hindi", "codewithharry", "programming", "learn python", "python course"],
  },
  {
    videoId: "PkZNo7MFNFg",
    title: "Learn JavaScript - Full Course for Beginners",
    description: "This complete 134-part JavaScript tutorial for beginners will teach you everything you need to know to get started with the JavaScript language.",
    channelTitle: "freeCodeCamp.org",
    channelId: "UC8butISFwT-Wl7EV0hUK0BQ",
    views: 19000000,
    likeCount: 520000,
    duration: "03:26:42",
    category: "Education",
    tags: ["javascript", "js", "web development", "coding", "programming", "frontend"],
  },
];

const formatCuratedVideo = (item) => ({
  _id: `yt_${item.videoId}`,
  youtubeVideoId: item.videoId,
  source: "youtube",
  title: item.title,
  description: item.description,
  channelTitle: item.channelTitle,
  channelId: item.channelId,
  channel: {
    _id: `yt_chan_${item.channelId}`,
    fullName: item.channelTitle,
    handle: `@${item.channelTitle.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(item.channelTitle)}`,
  },
  thumbnailUrl: `https://i.ytimg.com/vi/${item.videoId}/maxresdefault.jpg`,
  embedUrl: `https://www.youtube-nocookie.com/embed/${item.videoId}?autoplay=1&enablejsapi=1`,
  videoUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
  duration: item.duration,
  views: item.views,
  likes: [],
  likeCount: item.likeCount,
  commentCount: 450,
  category: item.category,
  tags: item.tags,
  publishedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  visibility: "public",
});

const getCuratedVideosForQuery = (query = "", category = "") => {
  const q = (query || "").toLowerCase().trim();
  const keywords = q.split(/\s+/).filter(Boolean);

  let matches = CURATED_TOP_VIDEOS;

  if (keywords.length > 0) {
    matches = CURATED_TOP_VIDEOS.filter((v) => {
      const searchTarget = `${v.title} ${v.description} ${v.tags.join(" ")} ${v.channelTitle} ${v.category}`.toLowerCase();
      return keywords.some((kw) => searchTarget.includes(kw));
    });
  }

  if (category && category !== "All") {
    const catMatches = matches.filter((v) => v.category.toLowerCase() === category.toLowerCase());
    if (catMatches.length > 0) matches = catMatches;
  }

  // If specific query was searched but no matches found, do NOT dump all movie trailers!
  if (q && matches.length === 0) {
    return [];
  }

  return matches.map(formatCuratedVideo);
};

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
    const curated = getCuratedVideosForQuery(q, category);
    return {
      videos: curated,
      nextPageToken: null,
      totalResults: curated.length,
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
      const errInfo = response.data?.error || {};
      console.warn("YouTube API search warning:", response.statusCode, errInfo.message || response.raw);
      const curated = getCuratedVideosForQuery(q, category);
      return {
        videos: curated,
        nextPageToken: null,
        totalResults: curated.length,
        error: errInfo.message || `YouTube API returned ${response.statusCode}`,
        errorType: errInfo.errors?.[0]?.reason || `HTTP_${response.statusCode}`,
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
    console.error("searchVideos exception:", err.message);
    const curated = getCuratedVideosForQuery(q, category);
    return {
      videos: curated,
      nextPageToken: null,
      totalResults: curated.length,
      error: err.message,
      errorType: "FETCH_EXCEPTION",
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
    const curated = getCuratedVideosForQuery("", categoryId);
    return {
      videos: curated,
      nextPageToken: null,
      totalResults: curated.length,
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
      const curated = getCuratedVideosForQuery("", categoryId);
      return {
        videos: curated,
        nextPageToken: null,
        totalResults: curated.length,
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
