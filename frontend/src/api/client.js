// Centralized Axios client with:
// - baseURL
// - Authorization header injection
// - Auto-refresh on 401 using refresh token

import axios from "axios";

const client = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  timeout: 15000,
});

// Small helper to read/write tokens from localStorage
export const tokenStore = {
  get() {
    const raw = localStorage.getItem("tokens");
    return raw ? JSON.parse(raw) : null;
  },
  set(tokens) {
    if (tokens) localStorage.setItem("tokens", JSON.stringify(tokens));
    else localStorage.removeItem("tokens");
  },
};

// Request: attach access token if present
client.interceptors.request.use((config) => {
  const tokens = tokenStore.get();
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

// Response: if 401 and we have refresh, try to refresh once
let refreshPromise = null;
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const tokens = tokenStore.get();

    // If unauthorized and we have a refresh, and haven't retried yet
    const shouldTryRefresh =
      error?.response?.status === 401 &&
      tokens?.refresh &&
      !original?._retry;

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    try {
      original._retry = true;
      // hit refresh endpoint
      const { data } = await (refreshPromise ||
        (refreshPromise = client.post("/auth/refresh/", {
          refresh: tokens.refresh,
        })));
      refreshPromise = null;

      const newTokens = { ...tokens, access: data.access };
      tokenStore.set(newTokens);

      // re-attach and retry original
      original.headers.Authorization = `Bearer ${newTokens.access}`;
      return client(original);
    } catch (e) {
      refreshPromise = null;
      tokenStore.set(null); // clear tokens on failure
      return Promise.reject(e);
    }
  }
);

export default client;
