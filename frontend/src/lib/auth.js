import { create } from "zustand";
import api from "./api";

const LOCAL_USERS_KEY = "cl_local_users";

function persistLocalUser(user) {
  if (!user?.email) return;

  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
    const email = String(user.email).trim().toLowerCase();
    const name = String(user.name || user.email.split("@")[0] || "User").trim();
    const next = [
      ...stored.filter((entry) => String(entry.email || "").trim().toLowerCase() !== email),
      { name, email, created_at: user.created_at || new Date().toISOString() },
    ];
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors so auth still works if local browser storage is unavailable.
  }
}

export const useAuth = create((set, get) => ({
  user: null,
  loading: true,
  privacyMode: "A",

  async bootstrap() {
    const t = localStorage.getItem("cl_access");
    if (!t) {
      set({ loading: false });
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      persistLocalUser(data);
      set({ user: data, privacyMode: data.privacy_mode || "A", loading: false });
    } catch {
      localStorage.removeItem("cl_access");
      localStorage.removeItem("cl_refresh");
      set({ user: null, loading: false });
    }
  },

  async login(email, password) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const { data } = await api.post("/auth/login", { email: normalizedEmail, password });
    localStorage.setItem("cl_access", data.access_token);
    localStorage.setItem("cl_refresh", data.refresh_token);
    const me = await api.get("/auth/me");
    persistLocalUser(me.data);
    set({ user: me.data, privacyMode: me.data.privacy_mode || "A", loading: false });
    return me.data;
  },

  async register(email, password, name) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedName = String(name || normalizedEmail.split("@")[0] || "User").trim();
    const { data } = await api.post("/auth/register", { email: normalizedEmail, password, name: normalizedName });
    localStorage.setItem("cl_access", data.access_token);
    localStorage.setItem("cl_refresh", data.refresh_token);
    const me = await api.get("/auth/me");
    persistLocalUser(me.data);
    set({ user: me.data, privacyMode: me.data.privacy_mode || "A", loading: false });
    return me.data;
  },

  logout() {
    localStorage.removeItem("cl_access");
    localStorage.removeItem("cl_refresh");
    set({ user: null, loading: false });
  },

  async setPrivacyMode(mode) {
    await api.post(`/users/privacy-mode?mode=${mode}`);
    set({ privacyMode: mode, user: { ...get().user, privacy_mode: mode } });
  },
}));
