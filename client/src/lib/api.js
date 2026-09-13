const API_BASE = import.meta.env.VITE_API_URL || "";
const ISSUES_API = `${API_BASE}/api/issues`;
const USERS_API = `${API_BASE}/api/users`;
const SESSION_KEY = "civicpulse-session";

export function loadSession() {
  try {
    const raw = JSON.parse(localStorage.getItem(SESSION_KEY));
    return raw?.token && raw?.user ? raw : null;
  } catch {
    return null;
  }
}
export function saveSession(session) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
export function clearSession() { localStorage.removeItem(SESSION_KEY); }

function headers(token, isJson = true) {
  const h = {};
  if (token) h.Authorization = `Bearer ${token}`;
  if (isJson) h["Content-Type"] = "application/json";
  return h;
}

async function parse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Request failed");
  return body;
}

export const api = {
  login: (email, password) =>
    fetch(`${USERS_API}/login`, { method: "POST", headers: headers(), body: JSON.stringify({ email, password }) }).then(parse),

  signup: (payload) =>
    fetch(`${USERS_API}/signup`, { method: "POST", headers: headers(), body: JSON.stringify(payload) }).then(parse),

  // /login returns `id`; /me returns Mongoose's `_id`. Normalize here so
  // the rest of the app can always use `.id`.
  me: (token) =>
    fetch(`${USERS_API}/me`, { headers: headers(token) })
      .then(parse)
      .then((u) => ({ ...u, id: u.id || u._id })),

  listIssues: () => fetch(ISSUES_API).then(parse),
  stats: () => fetch(`${ISSUES_API}/stats`).then(parse),

  createIssue: (token, payload) =>
    fetch(ISSUES_API, { method: "POST", headers: headers(token), body: JSON.stringify(payload) }).then(parse),

  updateIssue: (token, id, changes) =>
    fetch(`${ISSUES_API}/${id}`, { method: "PATCH", headers: headers(token), body: JSON.stringify(changes) }).then(parse),

  verifyIssue: (token, id, confirmed) =>
    fetch(`${ISSUES_API}/${id}/verify`, { method: "POST", headers: headers(token), body: JSON.stringify({ confirmed }) }).then(parse),

  uploadImages: (token, files) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    // No Content-Type — the browser must set the multipart boundary itself.
    return fetch(`${ISSUES_API}/upload`, { method: "POST", headers: headers(token, false), body: formData }).then(parse);
  },

  listPending: (token, filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return fetch(`${USERS_API}/pending${params ? `?${params}` : ""}`, { headers: headers(token) }).then(parse);
},

approveUser: (token, id, reportsTo) =>
  fetch(`${USERS_API}/${id}/approve`, { method: "POST", headers: headers(token), body: JSON.stringify({ reportsTo }) }).then(parse),

rejectUser: (token, id, reason) =>
  fetch(`${USERS_API}/${id}/reject`, { method: "POST", headers: headers(token), body: JSON.stringify({ reason }) }).then(parse),
};