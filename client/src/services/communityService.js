import api from "./api";

export const fetchChannelPosts = async (channelId) => {
  const res = await api.get(`/community/${channelId}`);
  return res.data.posts;
};

export const createCommunityPost = async (data) => {
  const res = await api.post("/community", data);
  return res.data.post;
};

export const voteCommunityPoll = async (postId, optionIndex) => {
  const res = await api.post(`/community/${postId}/vote`, { optionIndex });
  return res.data.post;
};

export const toggleLikeCommunityPost = async (postId) => {
  const res = await api.post(`/community/${postId}/like`);
  return res.data;
};

export const deleteCommunityPost = async (postId) => {
  const res = await api.delete(`/community/${postId}`);
  return res.data;
};
