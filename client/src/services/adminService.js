import api from "./api";

export const fetchAdminStats = async () => {
  const { data } = await api.get("/admin/stats");
  return data;
};

export const fetchAllUsers = async () => {
  const { data } = await api.get("/admin/users");
  return data.users;
};

export const deleteUser = async (id) => {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data;
};

export const fetchAllVideosAdmin = async () => {
  const { data } = await api.get("/admin/videos");
  return data.videos;
};

export const removeVideoAdmin = async (id) => {
  const { data } = await api.delete(`/admin/videos/${id}`);
  return data;
};

export const fetchAllReports = async () => {
  const { data } = await api.get("/admin/reports");
  return data.reports;
};

export const resolveReport = async (id) => {
  const { data } = await api.put(`/admin/reports/${id}`);
  return data.report;
};
