import api from "./api";

export async function registerUser(name, email, password) {
  const { data } = await api.post("/auth/register", { name, email, password }); 
  return data;
}

// Logs in a user with the provided email and password.
export async function loginUser(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data.user;
}
