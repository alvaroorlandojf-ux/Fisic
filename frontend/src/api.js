const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function getToken() {
  return localStorage.getItem("probio_token");
}

export function setToken(token) {
  localStorage.setItem("probio_token", token);
}

export function clearToken() {
  localStorage.removeItem("probio_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro inesperado");
  }

  return data;
}

export const api = {
  register: (payload) => request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  getMe: () => request("/api/me"),
  updateProfile: (payload) => request("/api/profile", { method: "PUT", body: JSON.stringify(payload) }),
  listLinks: () => request("/api/links"),
  createLink: (payload) => request("/api/links", { method: "POST", body: JSON.stringify(payload) }),
  updateLink: (id, payload) => request(`/api/links/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteLink: (id) => request(`/api/links/${id}`, { method: "DELETE" }),
  reorderLinks: (orderedIds) => request("/api/links/reorder", { method: "POST", body: JSON.stringify({ orderedIds }) }),
  listPortfolio: () => request("/api/portfolio"),
  createPortfolio: (payload) => request("/api/portfolio", { method: "POST", body: JSON.stringify(payload) }),
  deletePortfolio: (id) => request(`/api/portfolio/${id}`, { method: "DELETE" }),
  getPublicProfile: (username) => request(`/api/public/${username}`),
};
