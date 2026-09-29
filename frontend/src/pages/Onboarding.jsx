import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Shield, ArrowRight, Loader2 } from "lucide-react";

export default function Onboarding() {
  const nav = useNavigate();
  const { user, bootstrap } = useAuth();
  const [roles, setRoles] = useState([]);
  const [targetRole, setTargetRole] = useState("frontend");
  const [education, setEducation] = useState("B.S. Computer Science, 2024");
  const [skillsInput, setSkillsInput] = useState("JavaScript, React, Git, HTML, CSS");
  const [privacyMode, setPrivacyMode] = useState("A");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/roles").then((r) => setRoles(r.data)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const skills = skillsInput
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      await api.post("/users/onboarding", {
        education,
        target_role: targetRole,
        skills,
        preferences: {},
        privacy_mode: privacyMode,
      });

      await bootstrap();
      toast.success("Profile created! Welcome to your career feed.");
      nav("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || "Onboarding failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 grid place-items-center px-4 py-12">
      <Card className="w-full max-w-xl p-8 border border-slate-200 bg-white shadow-md rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 grid place-items-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
            CareerLens Setup
          </span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
          Personalize Your Career Assistant
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Tell us your goal so our explainable engine can tailor your ATS scoring, mock interviews, and learning path.
        </p>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <Label>Target Career Role</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
              {roles.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setTargetRole(r.id)}
                  className={`px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                    targetRole === r.id
                      ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold ring-1 ring-indigo-600"
                      : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Education & Graduation Year</Label>
            <Input
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g. B.Tech Computer Science, 2024"
              required
            />
          </div>

          <div>
            <Label>Your Current Core Skills (comma-separated)</Label>
            <Input
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. Python, SQL, Git, Docker"
              required
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <Label>Default Privacy Mode</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
              <div
                onClick={() => setPrivacyMode("A")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  privacyMode === "A"
                    ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-sm text-emerald-800">
                  <Shield className="w-4 h-4" /> Mode A: Local (Recommended)
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  100% on-device Web Worker analysis. Resume text never leaves browser.
                </div>
              </div>

              <div
                onClick={() => setPrivacyMode("B")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  privacyMode === "B"
                    ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-sm text-indigo-800">
                  <Sparkles className="w-4 h-4" /> Mode B: Server AI
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Encrypted server synchronization with Gemini Flash career coaching.
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 mt-2"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                Complete Setup & Go to Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
