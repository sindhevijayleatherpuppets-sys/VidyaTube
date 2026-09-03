const SERVER_ORIGIN = (
  import.meta.env.VITE_API_URL || "https://vidya-tube-app.onrender.com/api"
).replace(/\/api\/?$/, "");

export const DEFAULT_POSTER =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60";

// Video/thumbnail URLs can be relative or absolute external web URLs
export const mediaUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SERVER_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
};

// Converts maxresdefault to reliable hqdefault to prevent YouTube 404 grey placeholders
export const safeThumbnailUrl = (path, ytId = "") => {
  if (!path && ytId) return `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
  if (!path) return DEFAULT_POSTER;
  let url = mediaUrl(path);
  if (url.includes("maxresdefault.jpg")) {
    url = url.replace("maxresdefault.jpg", "hqdefault.jpg");
  }
  return url;
};

// Detects YouTube's 120x90 grey placeholder and swaps it for high-res clean poster
export const handleThumbnailLoad = (e, fallback = DEFAULT_POSTER) => {
  if (e?.target && e.target.naturalWidth <= 120 && e.target.naturalHeight <= 90) {
    e.target.src = fallback;
  }
};

export const formatViews = (views) => {
  if (!views && views !== 0) return "0 views";
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
  return `${views} view${views === 1 ? "" : "s"}`;
};

export const formatSubscribers = (count) => {
  if (!count && count !== 0) return "0 subscribers";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M subscribers`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K subscribers`;
  return `${count} subscriber${count === 1 ? "" : "s"}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const timeAgo = (dateString) => {
  if (!dateString) return "";
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek}w ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear}y ago`;
};

export const CATEGORIES = [
  "All",
  "Technology",
  "Education",
  "Music",
  "Gaming",
  "Entertainment",
  "Science",
  "Comedy",
  "Sports",
  "News",
  "Other",
];

export const REPORT_REASONS = [
  "Spam or misleading",
  "Copyright infringement",
  "Harassment or cyberbullying",
  "Violent or repulsive content",
  "Hate speech or graphic content",
  "Other issues",
];
