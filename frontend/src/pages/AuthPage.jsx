import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast, Toaster } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function AuthPage({ mode = "login" }) {
  const nav = useNavigate();
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const u = await login(email, password);
        toast.success(`Welcome back, ${u.name || "Student"}!`);
        nav(u.onboarding_done ? "/dashboard" : "/onboarding");
      } else {
        await register(email, password, name || email.split("@")[0]);
        toast.success("Account created! Let's set up your profile.");
        nav("/onboarding");
      }
    } catch (err) {
      const statusText = err.response?.data?.detail;
      const message =
        err.code === "ERR_NETWORK"
          ? "Network error: the backend server is not responding. Start the API on port 8000 and try again."
          : statusText || err.message || "Authentication failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      <div
        className="min-h-screen bg-slate-50 dark:bg-slate-950 grid place-items-center px-4 py-12 transition-colors"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {/* Back to Home link */}
      <div className="absolute top-4 left-4">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
          data-testid="back-to-home"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <Card
        className="w-full max-w-md p-8 border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900"
        data-testid="auth-card"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-6">
          <img
            src="/logo.png"
            alt="CareerLens"
            className="w-8 h-8 rounded-lg object-contain border border-indigo-500/20 shadow-xs"
          />
          <span
            className="font-bold text-xl tracking-tight text-slate-900 dark:text-slate-100"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            CareerLens
          </span>
        </div>

        <h1
          className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Privacy-first career intelligence. Local by default.
        </p>

        <form onSubmit={submit} className="space-y-4" autoComplete="off">
          {mode === "register" && (
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Full Name</Label>
              <Input
                data-testid="auth-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mohit"
                required
                className="mt-1 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              />
            </div>
          )}

          <div>
            <Label className="text-slate-700 dark:text-slate-300">Email Address</Label>
            <Input
              data-testid="auth-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              required
              className="mt-1 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300">Password</Label>
            <Input
              data-testid="auth-password"
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
              minLength={6}
              className="mt-1 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>

          <Button
            data-testid="auth-submit"
            type="submit"
            disabled={busy}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 shadow-xs mt-2"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
              </>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">
          Secured with Argon2 password hashing and stateless JWT.
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 mt-5 text-center border-t border-slate-100 dark:border-slate-800 pt-4">
          {mode === "login" ? (
            <>
              New to CareerLens?{" "}
              <Link
                data-testid="link-register"
                to="/register"
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                data-testid="link-login"
                to="/login"
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Sign in
              </Link>
            </>
          )}
        </p>
      </Card>
      </div>
    </>
  );
}
