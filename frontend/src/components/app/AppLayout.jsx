import React from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Bell,
  LogOut,
  Shield,
  LayoutDashboard,
  FileText,
  MessageSquare,
  BookOpen,
  BarChart3,
  User,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import ProcessingBadge from "@/components/app/ProcessingBadge";
import PersonaSwitcher from "@/components/app/PersonaSwitcher";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/resume", label: "Resume", icon: FileText, testid: "nav-resume" },
  { to: "/interview", label: "Mock Interview", icon: MessageSquare, testid: "nav-interview" },
  { to: "/resources", label: "Resources", icon: BookOpen, testid: "nav-resources" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, testid: "nav-analytics" },
  { to: "/profile", label: "Profile", icon: User, testid: "nav-profile" },
  { to: "/privacy", label: "Privacy Center", icon: Shield, testid: "nav-privacy" },
];

export default function AppLayout() {
  const { user, logout, privacyMode } = useAuth();
  const navigate = useNavigate();

  // Logo click: logged-in users go to dashboard, others go to home
  const handleLogoClick = () => {
    navigate(user ? "/dashboard" : "/");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <header
        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-50 shadow-xs"
        data-testid="app-header"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 cursor-pointer group"
              title={user ? "Go to Dashboard" : "CareerLens Home"}
            >
              <img
                src="/logo.png"
                alt="CareerLens Logo"
                className="w-8 h-8 rounded-lg object-contain shadow-xs border border-indigo-500/20 group-hover:scale-105 transition-transform"
              />
              <span
                className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                CareerLens
              </span>
            </div>
            <ProcessingBadge mode={privacyMode} />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <PersonaSwitcher />

            <button
              data-testid="notif-bell"
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Career Feed Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            <div
              onClick={() => navigate("/profile")}
              className="text-xs text-slate-600 dark:text-slate-300 hidden md:flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700"
              data-testid="user-email"
            >
              <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="max-w-[130px] truncate">{user?.name || user?.email}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              data-testid="btn-logout"
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <nav className="space-y-1 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs sticky top-22">
            {navItems.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                data-testid={it.testid}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100 dark:border-indigo-900"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  }`
                }
              >
                <it.icon className="w-4 h-4 shrink-0" />
                <span>{it.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="col-span-12 md:col-span-9 lg:col-span-10 min-h-[75vh]" data-testid="app-main">
          <Outlet />
        </main>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  );
}
