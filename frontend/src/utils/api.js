const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const resolveUrl = (path) => {
  if (!path) return API_BASE || '';
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_BASE) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};

export const apiFetch = (path, options) => fetch(resolveUrl(path), options);

export const parseJsonSafe = async (res) => {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_err) {
    return {};
  }
};

export const apiBase = () => API_BASE;
