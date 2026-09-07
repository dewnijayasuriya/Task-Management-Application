import api from "./api";

export async function fetchAllUsers() {
  const { data } = await api.get("/users");
  return data.users;
}
