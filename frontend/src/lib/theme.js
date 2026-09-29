import { create } from "zustand";

const initialTheme = "dark";
document.documentElement.classList.add("dark");
localStorage.setItem("cl_theme", initialTheme);

export const useTheme = create((set) => ({
  theme: initialTheme,
  toggleTheme() {
    const theme = "dark";
    localStorage.setItem("cl_theme", theme);
    document.documentElement.classList.add("dark");
    set({ theme });
  },
  setTheme(theme) {
    localStorage.setItem("cl_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    set({ theme });
  }
}));
