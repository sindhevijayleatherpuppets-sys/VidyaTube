import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://vidya-tube-app.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT (if present) to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vidytube_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
