import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/AuthPage";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import ResumePage from "@/pages/ResumePage";
import Interview from "@/pages/Interview";
import Resources from "@/pages/Resources";
import Analytics from "@/pages/Analytics";
import PrivacyCenter from "@/pages/PrivacyCenter";
import Profile from "@/pages/Profile";
import AppLayout from "@/components/app/AppLayout";

function Protected({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-500 dark:text-slate-400 font-medium text-sm bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="CareerLens" className="w-10 h-10 rounded-lg animate-pulse" />
          <span>Initializing CareerLens...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.onboarding_done && window.location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

export default function App() {
  const { bootstrap } = useAuth();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />

        {/* Onboarding (requires auth) */}
        <Route
          path="/onboarding"
          element={
            <Protected>
              <Onboarding />
            </Protected>
          }
        />

        {/* Protected app routes nested inside AppLayout */}
        <Route
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/privacy" element={<PrivacyCenter />} />
        </Route>

        {/* Catch-all -> home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
