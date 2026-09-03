import api from "./api";

export const fetchUserProfile = async (id) => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

export const updateUserProfile = async (data) => {
  const res = await api.put("/users/profile/update", data);
  return res.data.user;
};

export const toggleSubscribe = async (channelId) => {
  const res = await api.post(`/users/${channelId}/subscribe`);
  return res.data;
};

export const fetchMySubscriptions = async () => {
  const res = await api.get("/users/subscriptions/mine");
  return res.data.channels;
};
