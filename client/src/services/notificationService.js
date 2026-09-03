import api from "./api";

export const fetchNotifications = async () => {
  const res = await api.get("/notifications");
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await api.put("/notifications/read-all");
  return res.data;
};
