import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "task_app_token";

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

// Sets the JWT token in local storage for authentication purposes.
export function setAuthToken(token) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

// Creates an reusable axios instance with a base URL and default headers.
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor:Runs before every API request and automatically attaches the authenticated users's JWT token
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handles errors from API responses, including network errors, unauthorized access (401), forbidden access (403), and server errors (500).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(new Error("Network error: unable to reach the server"));
    }

    const { status, data } = error.response;
    const message = data?.message || "Something went wrong";

    if (status === 401) {
      clearAuthToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(new Error(message || "Your session has expired. Please log in again."));
    }

    if (status === 403) {
      return Promise.reject(new Error(message || "You do not have permission to do that."));
    }

    if (status >= 500) {
      return Promise.reject(new Error("Server error. Please try again later."));
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
