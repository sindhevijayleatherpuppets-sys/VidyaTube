import api from "./api";

export const registerUser = async ({ fullName, email, password, confirmPassword }) => {
  const { data } = await api.post("/auth/register", {
    fullName,
    email,
    password,
    confirmPassword,
  });
  return data;
};

export const loginUser = async ({ email, password }) => {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
};

export const googleAuthLogin = async (payload) => {
  const { data } = await api.post("/auth/google", payload);
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};
