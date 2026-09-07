import api from "./api";

export async function fetchTasks() {
  const { data } = await api.get("/tasks");
  return data.tasks;
}

export async function fetchTaskById(id) {
  const { data } = await api.get(`/tasks/${id}`);
  return data.task;
}

export async function createTask({ title, description, status }) {
  const { data } = await api.post("/tasks", { title, description, status });
  return data.task;
}

export async function updateTask(id, updates) {
  const { data } = await api.put(`/tasks/${id}`, updates);
  return data.task;
}

export async function updateTaskStatus(id, status) {
  const { data } = await api.patch(`/tasks/${id}/status`, { status });
  return data.task;
}

export async function assignTask(id, userId) {
  const { data } = await api.patch(`/tasks/${id}/assign`, userId ? { userId } : {});
  return data.task;
}

export async function deleteTask(id) {
  await api.delete(`/tasks/${id}`);
}
