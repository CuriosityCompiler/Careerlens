import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "");
export const API = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

const api = axios.create({
  baseURL: API,
  timeout: 15000,
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("cl_access");
  if (t) {
    cfg.headers.Authorization = `Bearer ${t}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original?._retry) {
      const rt = localStorage.getItem("cl_refresh");
      if (rt) {
        try {
          original._retry = true;
          const { data } = await axios.post(`${API}/auth/refresh`, { refresh_token: rt });
          localStorage.setItem("cl_access", data.access_token);
          localStorage.setItem("cl_refresh", data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return axios(original);
        } catch {
          localStorage.removeItem("cl_access");
          localStorage.removeItem("cl_refresh");
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
