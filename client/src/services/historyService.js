import api from "./api";

export const fetchHistory = async () => {
  const { data } = await api.get("/history");
  return data.history;
};

export const clearHistory = async () => {
  const { data } = await api.delete("/history");
  return data;
};
