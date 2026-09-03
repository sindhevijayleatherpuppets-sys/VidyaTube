import api from "./api";

// Favorites
export const getFavorites = async () => {
  const { data } = await api.get("/users/library/favorites");
  return data.favorites;
};

export const toggleFavorite = async (videoId) => {
  const { data } = await api.post(`/users/library/favorites/${videoId}`);
  return data;
};

// Watch Later
export const getWatchLater = async () => {
  const { data } = await api.get("/users/library/watch-later");
  return data.watchLater;
};

export const toggleWatchLater = async (videoId) => {
  const { data } = await api.post(`/users/library/watch-later/${videoId}`);
  return data;
};

// Liked Videos
export const getLikedVideos = async () => {
  const { data } = await api.get("/users/library/liked");
  return data.videos;
};

// Watch History
export const getWatchHistory = async () => {
  const { data } = await api.get("/history");
  return data.history;
};

export const recordWatchHistory = async (videoId) => {
  const { data } = await api.post("/history", { videoId });
  return data.history;
};

export const removeHistoryItem = async (historyId) => {
  const { data } = await api.delete(`/history/${historyId}`);
  return data;
};

export const clearWatchHistory = async () => {
  const { data } = await api.delete("/history/clear");
  return data;
};

// Playlists
export const getPlaylists = async () => {
  const { data } = await api.get("/playlists");
  return data.playlists;
};

export const getPlaylistById = async (id) => {
  const { data } = await api.get(`/playlists/${id}`);
  return data.playlist;
};

export const createPlaylist = async ({ name, description }) => {
  const { data } = await api.post("/playlists", { name, description });
  return data.playlist;
};

export const updatePlaylist = async (id, payload) => {
  const { data } = await api.put(`/playlists/${id}`, payload);
  return data.playlist;
};

export const deletePlaylist = async (id) => {
  const { data } = await api.delete(`/playlists/${id}`);
  return data;
};
