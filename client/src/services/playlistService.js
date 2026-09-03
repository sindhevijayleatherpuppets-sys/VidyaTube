import api from "./api";

export const fetchMyPlaylists = async () => {
  const { data } = await api.get("/playlists");
  return data.playlists;
};

export const fetchPlaylistById = async (id) => {
  const { data } = await api.get(`/playlists/${id}`);
  return data.playlist;
};

export const createPlaylist = async (name) => {
  const { data } = await api.post("/playlists", { name });
  return data.playlist;
};

export const addVideoToPlaylist = async (playlistId, videoId) => {
  const { data } = await api.put(`/playlists/${playlistId}`, {
    action: "add",
    videoId,
  });
  return data.playlist;
};

export const removeVideoFromPlaylist = async (playlistId, videoId) => {
  const { data } = await api.put(`/playlists/${playlistId}`, {
    action: "remove",
    videoId,
  });
  return data.playlist;
};

export const deletePlaylist = async (id) => {
  const { data } = await api.delete(`/playlists/${id}`);
  return data;
};
